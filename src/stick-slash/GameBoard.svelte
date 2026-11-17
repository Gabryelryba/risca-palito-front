<script>
  import { onMount, onDestroy } from "svelte";
  import { computeLayout, segmentsIntersect } from "./geometry.js";
  import { playSlash, playFatalCross } from "./sound.js";
  import { t } from "arcade-hub-ui/i18n/index.svelte.js";

  let { rows, sticks, canPlay, winner, onMove } = $props();

  // Landscape board on wide screens; a taller, narrower one on phones so the
  // game fills a portrait viewport instead of sitting as a stubby rectangle.
  const MOBILE_QUERY = "(max-width: 640px)";
  let WIDTH = $state(700);
  let HEIGHT = $state(460);
  const FLASH_MS = 90; // phase 1: the full slash line flashes across the stick
  const CUT_MS = 320; // phase 2 (normal stick): splits in two and falls away
  const MARK_MS = 220; // phase 2 (fatal stick): turns red and a stroke mark grows in
  const ANIM_MS = FLASH_MS + CUT_MS;
  const TRAIL_MS = 220;

  let canvas;
  let ctx;
  let rafId;
  let mediaQuery;
  // Drawn at the screen's pixel density so sticks stay sharp on phones; all
  // drawing code keeps working in board units (WIDTH x HEIGHT).
  let dpr = $state(1);

  // Target per-row height (desktop/mobile), independent of row count, so the
  // board scales cleanly if rows are ever added or removed.
  const ROW_HEIGHT_DESKTOP = 98;
  const ROW_HEIGHT_MOBILE = 112;

  function applyBoardSize(isMobile) {
    WIDTH = isMobile ? 380 : 700;
    HEIGHT = (isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT_DESKTOP) * (rows.length + 1);
  }

  const layout = $derived(computeLayout(rows, WIDTH, HEIGHT));

  const boardLabel = $derived(
    t("stickSlash.boardLabel", { rows: sticks.map((row) => row.filter((crossed) => !crossed).length).join(", ") })
  );

  // Drag state (imperative, read by the render loop rather than the template).
  let dragging = false;
  let dragRow = null;
  let dragIndices = new Set();
  let dragPath = [];
  let hoverRow = null;

  // key `${row}-${index}` -> { start: performance.now() }
  let crossAnims = new Map();
  let prevSticks = null;

  function toCanvasCoords(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left) * (WIDTH / rect.width),
      y: (evt.clientY - rect.top) * (HEIGHT / rect.height),
    };
  }

  function handlePointerDown(evt) {
    if (!canPlay) return;
    canvas.setPointerCapture(evt.pointerId);
    dragging = true;
    dragRow = null;
    dragIndices = new Set();
    const p = toCanvasCoords(evt);
    dragPath = [{ x: p.x, y: p.y, t: performance.now() }];
  }

  function rowAt(p) {
    for (const row of layout) {
      if (row.length === 0) continue;
      if (p.y >= row[0].y1 - 10 && p.y <= row[0].y2 + 10) return row[0].row;
    }
    return null;
  }

  function handlePointerLeave() {
    hoverRow = null;
  }

  function handlePointerMove(evt) {
    const p = toCanvasCoords(evt);
    if (!dragging) {
      hoverRow = rowAt(p);
      return;
    }
    const prev = dragPath[dragPath.length - 1];
    dragPath.push({ x: p.x, y: p.y, t: performance.now() });
    if (dragPath.length > 60) dragPath.shift();
    if (!prev) return;

    // Sticks hit by this pointer segment, taken in the order the pointer reached
    // them so a fast drag across a gap keeps the group it started in.
    const hits = [];
    for (const row of layout) {
      const rowIndex = row[0]?.row;
      if (dragRow !== null && rowIndex !== dragRow) continue;
      for (const stick of row) {
        if (sticks[stick.row][stick.index]) continue;
        if (dragRow === stick.row && dragIndices.has(stick.index)) continue;
        if (segmentsIntersect(prev, p, { x: stick.x1, y: stick.y1 }, { x: stick.x2, y: stick.y2 })) {
          hits.push(stick);
        }
      }
    }
    hits.sort((a, b) => Math.abs(a.x1 - prev.x) - Math.abs(b.x1 - prev.x));

    for (const stick of hits) {
      if (dragRow === null) dragRow = stick.row;
      if (stick.row !== dragRow) continue;
      if (!canExtendSelection(stick.row, stick.index)) continue;
      dragIndices.add(stick.index);
    }
  }

  // A slash only takes a contiguous run: it cannot jump over a gap left by
  // sticks that were already crossed out.
  function canExtendSelection(row, index) {
    if (dragIndices.size === 0) return true;
    const lo = Math.min(index, ...dragIndices);
    const hi = Math.max(index, ...dragIndices);
    for (let k = lo; k <= hi; k++) {
      if (sticks[row][k]) return false;
    }
    return true;
  }

  function handlePointerUp() {
    if (!dragging) return;
    dragging = false;
    if (dragRow !== null && dragIndices.size > 0) {
      onMove(dragRow, [...dragIndices]);
    }
    dragRow = null;
    dragIndices = new Set();
  }

  function syncAnimationsWithState() {
    if (prevSticks) {
      let newlyCrossed = 0;
      const fatal = winner !== null; // this update is the game-ending move
      sticks.forEach((row, r) => {
        row.forEach((crossed, i) => {
          if (crossed && !prevSticks[r][i]) {
            crossAnims.set(`${r}-${i}`, { start: performance.now(), fatal });
            newlyCrossed++;
          }
        });
      });
      if (newlyCrossed > 0) {
        if (fatal) {
          playFatalCross();
        } else {
          playSlash(Math.min(1 + newlyCrossed * 0.15, 1.6));
        }
      }
    }
    prevSticks = sticks.map((row) => [...row]);
  }

  // Board colours come from the CSS tokens in app.css so the canvas follows the palette.
  const C = {};
  function loadPalette() {
    const css = getComputedStyle(canvas);
    for (const [key, token] of Object.entries({
      cream: "--stick-pick",
      gold: "--stick",
      goldDim: "--stick-edge",
      goldLight: "--stick-hover",
      red: "--danger",
      outline: "--stick-shadow",
    })) {
      C[key] = css.getPropertyValue(token).trim();
    }
  }

  function rgba(hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  const STICK_WIDTH = 8;
  const STICK_DEPTH = 3; // flat offset shadow, same language as the buttons

  // `state` tints the stick: "hover" (row under the cursor), "pick" (part of
  // the slash being dragged) or "dim" (a different row than the one dragged).
  function drawStick(stick, state = "idle") {
    const body = state === "pick" ? C.cream : state === "hover" ? C.goldLight : C.gold;
    const edge = C.goldDim;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = STICK_WIDTH;
    if (state === "dim") ctx.globalAlpha = 0.45;

    ctx.strokeStyle = C.outline;
    ctx.beginPath();
    ctx.moveTo(stick.x1, stick.y1 + STICK_DEPTH + 1);
    ctx.lineTo(stick.x2, stick.y2 + STICK_DEPTH + 1);
    ctx.stroke();

    ctx.strokeStyle = edge;
    ctx.beginPath();
    ctx.moveTo(stick.x1, stick.y1 + STICK_DEPTH);
    ctx.lineTo(stick.x2, stick.y2 + STICK_DEPTH);
    ctx.stroke();

    ctx.strokeStyle = body;
    ctx.beginPath();
    ctx.moveTo(stick.x1, stick.y1);
    ctx.lineTo(stick.x2, stick.y2);
    ctx.stroke();
    ctx.restore();
  }

  function stickState(stick) {
    if (dragging && dragRow !== null) {
      if (stick.row !== dragRow) return "dim";
      return dragIndices.has(stick.index) ? "pick" : "idle";
    }
    return canPlay && !dragging && hoverRow === stick.row ? "hover" : "idle";
  }

  // Faint rail under each row, brightened for the row under the cursor, so the
  // rows read as lanes instead of floating strokes.
  function drawRowGuides() {
    layout.forEach((row, r) => {
      if (row.length === 0) return;
      const pad = 34;
      const x = row[0].x1 - pad;
      const w = row[row.length - 1].x1 - row[0].x1 + pad * 2;
      const y = row[0].y1 - 10;
      const h = row[0].y2 - row[0].y1 + 20;
      const active = canPlay && (dragging ? dragRow === r : hoverRow === r);

      ctx.save();
      ctx.fillStyle = active ? rgba(C.cream, 0.06) : rgba(C.cream, 0.025);
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 12);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawFlash(stick, flashT) {
    const alpha = Math.sin(Math.min(flashT, 1) * Math.PI * 0.9 + 0.1);
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = rgba(C.cream, Math.max(alpha, 0.25));
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(stick.x1, stick.y1);
    ctx.lineTo(stick.x2, stick.y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawCut(stick, cutT) {
    const ease = 1 - Math.pow(1 - cutT, 2);
    const midX = (stick.x1 + stick.x2) / 2;
    const midY = (stick.y1 + stick.y2) / 2;
    const alpha = 1 - ease;
    const fall = 16 * ease * ease;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = "round";
    ctx.lineWidth = 6;
    ctx.strokeStyle = C.gold;

    // Top half falls away to the left.
    ctx.beginPath();
    ctx.moveTo(stick.x1 - 14 * ease, stick.y1 + fall);
    ctx.lineTo(midX - 14 * ease, midY + fall);
    ctx.stroke();

    // Bottom half falls away to the right.
    ctx.beginPath();
    ctx.moveTo(midX + 14 * ease, midY + fall);
    ctx.lineTo(stick.x2 + 14 * ease, stick.y2 + fall);
    ctx.stroke();
    ctx.restore();

    if (cutT < 0.4) {
      const sparkAlpha = 1 - cutT / 0.4;
      ctx.save();
      ctx.globalAlpha = sparkAlpha * 0.7;
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(midX, midY, 4 + 4 * (cutT / 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // The stick that ends the game: no cut, it stays whole, on screen, in red,
  // with a small stroke mark through it — never removed from the board.
  function drawFatal(stick, markT) {
    const ease = 1 - Math.pow(1 - markT, 3);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = 6;
    ctx.strokeStyle = C.red;
    ctx.beginPath();
    ctx.moveTo(stick.x1, stick.y1);
    ctx.lineTo(stick.x2, stick.y2);
    ctx.stroke();
    ctx.restore();

    const midX = (stick.x1 + stick.x2) / 2;
    const midY = (stick.y1 + stick.y2) / 2;
    const halfLen = 14 * ease;
    const sx = Math.cos(Math.PI / 4) * halfLen;
    const sy = Math.sin(Math.PI / 4) * halfLen;

    ctx.save();
    ctx.globalAlpha = ease;
    ctx.lineCap = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = C.cream;
    ctx.beginPath();
    ctx.moveTo(midX - sx, midY - sy);
    ctx.lineTo(midX + sx, midY + sy);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    const now = performance.now();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawRowGuides();

    for (const row of layout) {
      for (const stick of row) {
        const key = `${stick.row}-${stick.index}`;
        const isCrossed = sticks[stick.row][stick.index];
        const anim = crossAnims.get(key);
        const elapsed = anim ? now - anim.start : null;

        if (!isCrossed) {
          drawStick(stick, stickState(stick));
        } else if (anim?.fatal) {
          if (elapsed < FLASH_MS) {
            drawStick(stick);
            drawFlash(stick, elapsed / FLASH_MS);
          } else {
            drawFatal(stick, Math.min((elapsed - FLASH_MS) / MARK_MS, 1));
          }
        } else if (elapsed !== null && elapsed < ANIM_MS) {
          if (elapsed < FLASH_MS) {
            drawStick(stick);
            drawFlash(stick, elapsed / FLASH_MS);
          } else {
            drawCut(stick, (elapsed - FLASH_MS) / CUT_MS);
          }
        }
        // else: fully cut and settled — the slot is left empty.
      }
    }

    if (dragPath.length > 1) {
      for (let i = 1; i < dragPath.length; i++) {
        const age = now - dragPath[i].t;
        const alpha = Math.max(0, 1 - age / TRAIL_MS);
        if (alpha <= 0) continue;
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.strokeStyle = rgba(C.cream, alpha * 0.8);
        ctx.moveTo(dragPath[i - 1].x, dragPath[i - 1].y);
        ctx.lineTo(dragPath[i].x, dragPath[i].y);
        ctx.stroke();
        ctx.restore();
      }
    }

    rafId = requestAnimationFrame(draw);
  }

  $effect(() => {
    sticks;
    syncAnimationsWithState();
  });

  onMount(() => {
    mediaQuery = window.matchMedia(MOBILE_QUERY);
    applyBoardSize(mediaQuery.matches);
    const handleChange = (e) => applyBoardSize(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    dpr = Math.min(window.devicePixelRatio || 1, 3);
    ctx = canvas.getContext("2d");
    loadPalette();
    rafId = requestAnimationFrame(draw);

    return () => mediaQuery.removeEventListener("change", handleChange);
  });

  onDestroy(() => {
    if (rafId) cancelAnimationFrame(rafId);
  });
</script>

<canvas
  bind:this={canvas}
  role="img"
  aria-label={boardLabel}
  width={Math.round(WIDTH * dpr)}
  height={Math.round(HEIGHT * dpr)}
  style:--board-width="{WIDTH}px"
  class:disabled={!canPlay}
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerUp}
  onpointerleave={handlePointerLeave}
></canvas>

<style>
  canvas {
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    cursor: crosshair;
    /* The bitmap is WIDTH*dpr wide; show it at board size, never wider than
       the space it is given, keeping its aspect ratio. */
    max-width: min(100%, var(--board-width));
    max-height: 100%;
    height: auto;
    background:
      radial-gradient(80% 60% at 50% 110%, var(--gold-soft), transparent 70%),
      var(--board-bg);
    border-radius: var(--radius-lg);
    border: 1px solid var(--line);
    box-shadow: var(--shadow), inset 0 1px 0 var(--sheen);
    transition: opacity 0.25s var(--ease-out);
  }
  canvas.disabled {
    cursor: not-allowed;
    opacity: 0.8;
  }
</style>
