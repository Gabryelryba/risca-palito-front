<script>
  import { onMount, onDestroy, untrack } from "svelte";
  import ArrowLeft from "phosphor-svelte/lib/ArrowLeft";
  import Robot from "phosphor-svelte/lib/Robot";
  import LinkSimple from "phosphor-svelte/lib/LinkSimple";
  import Check from "phosphor-svelte/lib/Check";
  import ArrowCounterClockwise from "phosphor-svelte/lib/ArrowCounterClockwise";
  import { socket } from "arcade-hub-ui/socket.js";
  import { keepScreenAwake, allowScreenSleep } from "arcade-hub-ui/wakeLock.js";
  import { inviteUrl } from "arcade-hub-ui/invite.js";
  import { playGameOver } from "./sound.js";
  import GameBoard from "./GameBoard.svelte";
  import EndgameOverlay from "./EndgameOverlay.svelte";
  import Preview from "./Preview.svelte";
  import Versus from "arcade-hub-ui/Versus.svelte";
  import GameLanding from "arcade-hub-ui/GameLanding.svelte";
  import { t, tList, serverMessage } from "arcade-hub-ui/i18n/index.svelte.js";

  const GAME_ID = "stick-slash";

  // Props come from GameApp (arcade-hub-ui), which mounts the game.
  // inviteCode: a room code from an invite link, joined as soon as we connect.
  // ensureName(): resolves to the player's display name, asking for it the first
  // time; null if they back out. editName(): opens the dialog to change it.
  let {
    inviteCode: invitedTo = null,
    onInviteUsed = () => {},
    ensureName = async () => null,
    editName = null,
    playerName = null,
  } = $props();

  let status = $state("connecting"); // connecting | menu | joining | hosting | playing | ended | opponentLeft
  let playerIndex = $state(null);
  // [{ index, name, computer? }] from the server; empty against an older server.
  let players = $state([]);
  let rows = $state([7, 5, 3, 1]);
  let sticks = $state([]);
  let turn = $state(0);
  let winner = $state(null);
  let errorMessage = $state("");

  let roomCode = $state("");
  let joinError = $state("");
  let vsAI = $state(false);
  let showJoinForm = $state(false);
  let linkCopied = $state(false);
  let reconnecting = $state(false);
  let rematchState = $state("idle"); // idle | requesting | incoming | declined
  let slowServer = $state(false);
  let confirmLeave = $state(false);

  let gameOverSoundPlayed = false;
  let resumeFailures = 0;
  let boardSlot;

  // Read once: the invite is joined on the first connection only, not on later reconnects.
  let inviteCode = untrack(() => invitedTo);

  function handleConnect() {
    slowServer = false;
    if (status === "hosting") {
      // Reconnected while waiting in a room (the phone slept): ask for it back
      // instead of falling through to the menu.
      resumeHosting();
    } else if (inviteCode) {
      const code = inviteCode;
      inviteCode = null;
      onInviteUsed();
      // The menu shows behind the name dialog; backing out of it leaves the player there.
      status = "menu";
      sendJoin(code);
    } else {
      status = "menu";
    }
  }

  async function sendJoin(code) {
    const name = await ensureName();
    if (!name) return;
    joinError = "";
    status = "joining";
    roomCode = code;
    socket.emit("joinRoom", { code, gameId: GAME_ID, name });
  }

  function handleDisconnect() {
    if (status === "hosting") reconnecting = true;
  }

  const MAX_RESUME_FAILURES = 3;

  // No answer means the connection is stale (a woken-up phone can think it is
  // still connected), so open a fresh one; its "connect" tries this again.
  function resumeHosting() {
    socket.timeout(4000).emit("resumeRoom", (err, res) => {
      if (status !== "hosting") return;
      if (err) {
        resumeFailures += 1;
        if (resumeFailures >= MAX_RESUME_FAILURES) {
          giveUpHosting(t("stickSlash.connectionLost"));
        } else {
          socket.disconnect().connect();
        }
        return;
      }
      resumeFailures = 0;
      if (res?.ok) {
        roomCode = res.code;
        reconnecting = false;
      } else {
        giveUpHosting(t("stickSlash.roomExpired"));
      }
    });
  }

  function giveUpHosting(message) {
    reconnecting = false;
    status = "menu";
    joinError = message;
  }

  function handleVisibility() {
    if (document.visibilityState !== "visible" || status !== "hosting") return;
    if (socket.connected) resumeHosting();
    else socket.connect();
  }

  function handleRoomCreated({ code }) {
    roomCode = code;
    status = "hosting";
  }

  // Server refusals come with a code, shown on the landing page with the code
  // form open. A code from another game's room is refused as room-not-found.
  function handleJoinError(refusal) {
    joinError = serverMessage("join", refusal);
    status = "menu";
    showJoinForm = true;
  }

  function handleMatched({ playerIndex: idx, rows: serverRows, roomId, vsAI: isVsAI, players: list }) {
    playerIndex = idx;
    players = Array.isArray(list) ? list : [];
    rows = serverRows;
    roomCode = roomId;
    vsAI = Boolean(isVsAI);
    status = "playing";
    gameOverSoundPlayed = false;
    rematchState = "idle";
    joinError = "";
    showJoinForm = false;
  }

  // Same room, fresh board. The "state" event that follows carries the new sticks.
  function handleRematchStarted() {
    winner = null;
    rematchState = "idle";
    gameOverSoundPlayed = false;
    status = "playing";
  }

  function handleState(state) {
    if (Array.isArray(state.players) && state.players.every((p) => typeof p?.name === "string")) {
      players = state.players;
    }
    sticks = state.sticks;
    turn = state.turn;
    winner = state.winner;
    if (winner !== null) {
      status = "ended";
      confirmLeave = false;
      if (!gameOverSoundPlayed) {
        playGameOver(winner === playerIndex);
        gameOverSoundPlayed = true;
      }
    }
  }

  function handleMoveRejected(refusal) {
    errorMessage = serverMessage("move", refusal);
    setTimeout(() => (errorMessage = ""), 1800);
  }

  function handleOpponentLeft() {
    status = "opponentLeft";
    rematchState = "idle";
    confirmLeave = false;
  }

  function handleRematchPending() {
    rematchState = "requesting";
  }

  function handleRematchRequested() {
    rematchState = "incoming";
  }

  function handleRematchDeclined() {
    rematchState = "declined";
  }

  const listeners = {
    connect: handleConnect,
    disconnect: handleDisconnect,
    roomCreated: handleRoomCreated,
    joinError: handleJoinError,
    matched: handleMatched,
    state: handleState,
    moveRejected: handleMoveRejected,
    opponentLeft: handleOpponentLeft,
    rematchStarted: handleRematchStarted,
    rematchPending: handleRematchPending,
    rematchRequested: handleRematchRequested,
    rematchDeclined: handleRematchDeclined,
  };

  onMount(() => {
    for (const [event, handler] of Object.entries(listeners)) socket.on(event, handler);
    document.addEventListener("visibilitychange", handleVisibility);
    socket.connect();
    // The free host sleeps when idle and takes a while to wake: say so instead of
    // leaving a bare "Connecting…".
    const slowTimer = setTimeout(() => {
      if (status === "connecting") slowServer = true;
    }, 4000);
    return () => clearTimeout(slowTimer);
  });

  onDestroy(() => {
    for (const [event, handler] of Object.entries(listeners)) socket.off(event, handler);
    document.removeEventListener("visibilitychange", handleVisibility);
    socket.disconnect();
  });

  function handleMove(row, indices) {
    if (status !== "playing" || turn !== playerIndex) return;
    socket.emit("move", { row, indices });
  }

  async function createRoom() {
    const name = await ensureName();
    if (!name) return;
    joinError = "";
    socket.emit("createRoom", { gameId: GAME_ID, name });
  }

  async function playVsComputer() {
    const name = await ensureName();
    if (!name) return;
    joinError = "";
    socket.emit("playVsComputer", { gameId: GAME_ID, name });
  }

  // Against the computer this starts a game at once; against a person it asks them first.
  function playAgain() {
    if (status !== "ended") return;
    if (rematchState === "incoming") socket.emit("respondRematch", { accept: true });
    else if (rematchState !== "requesting") socket.emit("requestRematch");
  }

  function declineRematch() {
    socket.emit("respondRematch", { accept: false });
    rematchState = "idle";
  }

  // Leave the room (the server closes it when the socket goes) and come back to
  // the landing page on a fresh connection.
  function leaveRoom() {
    status = "connecting";
    reconnecting = false;
    rematchState = "idle";
    confirmLeave = false;
    sticks = [];
    winner = null;
    roomCode = "";
    socket.disconnect();
    socket.connect();
  }

  // Leave goes back to the landing page. Leaving a live match against a person
  // ends it for them too, so it takes a second tap. Anywhere else it just goes.
  function handleBack() {
    const liveMatch = status === "playing" && !vsAI;
    if (liveMatch && !confirmLeave) {
      confirmLeave = true;
      setTimeout(() => (confirmLeave = false), 3500);
      return;
    }
    leaveRoom();
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl(window.location.href, roomCode));
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — the code itself
      // is still visible on screen for a manual share.
    }
    linkCopied = true;
    setTimeout(() => (linkCopied = false), 1800);
  }

  const canPlay = $derived(status === "playing" && turn === playerIndex && winner === null);
  // Names from the server; an older server sends none, so fall back to labels.
  const me = $derived(players.find((p) => p.index === playerIndex) ?? { name: playerName ?? t("common.you") });
  const them = $derived(
    players.find((p) => p.index !== playerIndex) ?? {
      name: vsAI ? t("stickSlash.computer") : t("stickSlash.opponent"),
      computer: vsAI,
    }
  );
  const opponentName = $derived(them.name);
  const statusText = $derived.by(() => {
    const name = opponentName;
    if (status === "connecting") return t("common.connecting");
    if (status === "joining") return t("common.joiningRoom", { code: roomCode });
    if (status === "hosting") return reconnecting ? t("common.reconnecting") : t("stickSlash.waitingForOpponent");
    if (status === "opponentLeft") return t("stickSlash.opponentLeft", { name });
    if (status === "playing" || status === "ended") {
      if (status === "ended") {
        if (rematchState === "incoming") return t("stickSlash.wantsRematch", { name });
        if (rematchState === "requesting") return t("stickSlash.waitingAccept", { name });
        if (rematchState === "declined") return t("stickSlash.declined", { name });
      }
      if (winner !== null) {
        return winner === playerIndex ? t("stickSlash.theyCrossedLast", { name }) : t("stickSlash.youCrossedLast");
      }
      return turn === playerIndex ? t("stickSlash.yourTurn") : t("stickSlash.theirTurn", { name });
    }
    return "";
  });
  const activeSide = $derived(status === "playing" && winner === null ? (turn === playerIndex ? "me" : "them") : null);
  const winnerSide = $derived(status === "ended" && winner !== null ? (winner === playerIndex ? "me" : "them") : null);
  const didLose = $derived(status === "ended" && winner !== null && winner !== playerIndex);
  const inGame = $derived(status === "playing" || status === "ended" || status === "opponentLeft");
  const highlight = $derived(canPlay || (status === "ended" && rematchState === "incoming"));

  // A locked phone suspends the page and drops the connection, so keep the screen on while waiting.
  $effect(() => {
    if (status !== "hosting") return;
    keepScreenAwake();
    return allowScreenSleep;
  });

  // When a game starts, bring the whole board into view.
  $effect(() => {
    if (status !== "playing") return;
    const frame = requestAnimationFrame(() => {
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      boardSlot?.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  });
</script>

<main class="screen" class:shake={didLose} class:in-game={inGame}>
  {#if inGame || status === "hosting" || status === "joining"}
    <header class="topbar">
      <button
        class="btn btn-ghost back"
        class:btn-danger={confirmLeave}
        onclick={handleBack}
        aria-label={confirmLeave ? t("stickSlash.leaveGameAria") : t("stickSlash.leaveAria")}
      >
        <ArrowLeft size={18} weight="light" aria-hidden="true" />
        <span>{confirmLeave ? t("stickSlash.leaveGame") : t("stickSlash.leave")}</span>
      </button>
      <span class="game-name" translate="no">{t("stickSlash.name")}</span>
    </header>
  {/if}

  {#if status === "menu" || status === "connecting"}
    <GameLanding
      gameId={GAME_ID}
      eyebrow={t("stickSlash.eyebrow")}
      title={t("stickSlash.name")}
      lede={t("stickSlash.lede")}
      steps={tList("stickSlash.steps")}
      connecting={status === "connecting"}
      {slowServer}
      bind:joinError
      bind:showJoinForm
      onCreate={createRoom}
      onJoin={sendJoin}
      {playerName}
      onEditName={editName}
    >
      {#snippet art()}<Preview />{/snippet}
      {#snippet actions()}
        <button class="btn btn-ghost" onclick={playVsComputer} disabled={status === "connecting"}>
          <Robot size={18} weight="light" aria-hidden="true" />
          {t("stickSlash.playVsComputer")}
        </button>
      {/snippet}
    </GameLanding>
  {:else if status === "joining"}
    <section class="center-state" aria-busy="true">
      <p class="status-line" role="status" aria-live="polite">
        <span class="pulse" aria-hidden="true"></span>{statusText}
      </p>
      <span class="skeleton"></span>
    </section>
  {:else if status === "hosting"}
    <section class="hosting">
      <p class="eyebrow">{t("stickSlash.yourRoom")}</p>
      <p class="room-code" translate="no" aria-label={t("common.roomCodeAria", { code: roomCode.split("").join(" ") })}>
        {roomCode}
      </p>
      <p class="status-line" role="status" aria-live="polite">
        <span class="pulse" class:warn={reconnecting} aria-hidden="true"></span>{statusText}
      </p>
      <div class="actions">
        <button class="btn btn-primary" onclick={copyInviteLink}>
          {#if linkCopied}
            <Check size={18} weight="light" aria-hidden="true" /> {t("common.linkCopied")}
          {:else}
            <LinkSimple size={18} weight="light" aria-hidden="true" /> {t("common.copyInvite")}
          {/if}
        </button>
        <button class="btn btn-ghost" onclick={leaveRoom}>{t("stickSlash.cancelRoom")}</button>
      </div>
      <p class="help">{t("stickSlash.hostingHelp")}</p>
    </section>
  {:else}
    <section class="match">
      <Versus {me} {them} active={activeSide} winner={winnerSide} />
      <p class="status-line match-status" class:highlight role="status" aria-live="polite">{statusText}</p>
      {#if errorMessage}
        <p class="error toast" role="alert">{errorMessage}</p>
      {/if}

      {#if rows.length && sticks.length}
        <div class="board-slot" bind:this={boardSlot}>
          <GameBoard {rows} {sticks} {canPlay} {winner} onMove={handleMove} />
        </div>
      {/if}

      <!-- Always rendered so the board never moves when a game ends; hidden while it is still on. -->
      <div class="endgame-actions" class:invisible={status === "playing"}>
        <button
          class="btn btn-primary"
          class:invisible={status === "opponentLeft"}
          class:incoming={rematchState === "incoming"}
          disabled={status !== "ended" || rematchState === "requesting"}
          tabindex={status === "ended" ? 0 : -1}
          onclick={playAgain}
        >
          {#if rematchState === "incoming"}
            <Check size={18} weight="light" aria-hidden="true" /> {t("stickSlash.accept")}
          {:else if rematchState === "requesting"}
            {t("stickSlash.waiting")}
          {:else}
            <ArrowCounterClockwise size={18} weight="light" aria-hidden="true" /> {t("common.playAgain")}
          {/if}
        </button>
        <button
          class="btn btn-secondary"
          tabindex={status === "playing" ? -1 : 0}
          onclick={rematchState === "incoming" ? declineRematch : leaveRoom}
        >
          {rematchState === "incoming" ? t("stickSlash.decline") : t("stickSlash.mainMenu")}
        </button>
      </div>
    </section>
  {/if}
</main>

{#if status === "ended"}
  <EndgameOverlay won={winner === playerIndex} />
{/if}

<style>
  .screen {
    position: relative;
    z-index: 1;
    flex: 1;
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
    padding: max(1.25rem, env(safe-area-inset-top)) var(--edge-gutter) max(2rem, env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
  }

  .screen.shake {
    animation: shake 0.5s ease-in-out;
  }

  @keyframes shake {
    10%,
    90% {
      transform: translateX(-2px);
    }
    20%,
    80% {
      transform: translateX(4px);
    }
    30%,
    50%,
    70% {
      transform: translateX(-5px);
    }
    40%,
    60% {
      transform: translateX(5px);
    }
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-height: 2.75rem;
    margin-left: -0.6rem;
  }

  .back {
    min-height: 2.75rem;
    padding: 0 0.75rem;
  }

  .game-name {
    font-weight: 600;
    color: var(--ink-muted);
    letter-spacing: -0.01em;
  }

  .eyebrow {
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent-text);
  }

  .help {
    color: var(--ink-faint);
    font-size: 0.9rem;
  }

  .error {
    color: var(--danger);
    font-size: 0.92rem;
    font-weight: 500;
  }

  .pulse {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    animation: breathe 1.8s ease-in-out infinite;
  }

  .pulse.warn {
    background: var(--danger);
  }

  @keyframes breathe {
    50% {
      opacity: 0.25;
      transform: scale(0.75);
    }
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 0.75rem;
  }

  /* ---- Joining / hosting ---- */
  .center-state,
  .hosting {
    flex: 1;
    display: grid;
    align-content: center;
    justify-items: start;
    gap: 1rem;
    max-width: 34rem;
    padding-bottom: 4rem;
  }

  .status-line {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: var(--ink-muted);
    font-weight: 500;
  }

  .skeleton {
    width: 100%;
    height: 14rem;
    border-radius: var(--radius-lg);
    background: linear-gradient(90deg, var(--surface) 0%, var(--surface-raised) 50%, var(--surface) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.4s linear infinite;
  }

  @keyframes shimmer {
    to {
      background-position: -200% 0;
    }
  }

  .room-code {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: clamp(3rem, 15vw, 5.5rem);
    line-height: 1;
    letter-spacing: 0.12em;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }

  /* ---- Match ---- */
  .match {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
    padding-top: 0.75rem;
  }

  .match-status {
    justify-content: center;
    text-align: center;
    min-height: 1.6em;
    margin: 0.85rem 0 1rem;
    font-weight: 600;
    transition: color 0.2s var(--ease-out);
  }

  .match-status.highlight {
    color: var(--accent-text);
  }

  .toast {
    margin: -0.5rem 0 0.75rem;
  }

  .board-slot {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .endgame-actions {
    display: flex;
    justify-content: center;
    gap: 0.6rem;
    margin-top: 1.5rem;
  }

  .invisible {
    visibility: hidden;
  }

  /* A request from the other player: make the answer hard to miss. */
  .btn.incoming {
    animation: nudge 1.4s ease-in-out infinite;
  }

  @keyframes nudge {
    50% {
      transform: translateY(-3px);
    }
  }

  /* Phones, portrait or landscape. iOS reads a swipe that starts within ~20px of
     the screen edge as "back", so the side gutter keeps slashes out of that zone.
     While a game is on, the page is exactly one viewport tall and the board
     takes whatever height is left, so it is always fully visible without scrolling. */
  @media (max-width: 640px), (max-height: 560px) {
    .screen.in-game {
      height: 100vh;
      height: 100dvh;
      min-height: 0;
      padding-top: max(0.75rem, env(safe-area-inset-top));
      padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
    }

    .in-game .match {
      min-height: 0;
    }

    /* Two lines reserved so a longer message never resizes the board. */
    .in-game .match-status {
      min-height: 2.9em;
      margin: 0.4rem 0 0.5rem;
    }

    .in-game .board-slot {
      flex: 1 1 0;
      min-height: 0;
      align-items: center;
    }

    .in-game .endgame-actions {
      flex: none;
      width: 100%;
      margin-top: 0.75rem;
    }

    /* Two buttons share the row on a narrow screen. */
    .in-game .endgame-actions .btn {
      flex: 1 1 0;
      min-width: 0;
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }

    .actions .btn {
      flex: 1 1 100%;
    }
  }

  /* A phone held sideways has no height to spare: the back button moves onto
     the players' row (icon only) and the status line keeps a single line. */
  @media (max-height: 560px) and (min-width: 641px) {
    .in-game .topbar {
      position: absolute;
      top: max(0.6rem, env(safe-area-inset-top));
      left: var(--edge-gutter);
      z-index: 2;
      min-height: 2.25rem;
      margin-left: -0.6rem;
    }

    .in-game .topbar .back span,
    .in-game .game-name {
      display: none;
    }

    .in-game .match {
      padding-top: 0;
    }

    .in-game .match-status {
      min-height: 1.5em;
      margin: 0.2rem 0 0.4rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .btn.incoming,
    .pulse {
      animation: none;
    }
  }
</style>
