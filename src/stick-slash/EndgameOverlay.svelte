<script>
  import { t } from "arcade-hub-ui/i18n/index.svelte.js";

  let { won } = $props();

  // Falling chips in the accent colour for a win; generated once per game end.
  const chips = won
    ? Array.from({ length: 28 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.1 + Math.random() * 1.3,
        width: 4 + Math.random() * 4,
        height: 14 + Math.random() * 14,
        rot: Math.random() * 360,
        drift: (Math.random() - 0.5) * 70,
      }))
    : [];
</script>

{#if won}
  <div class="chip-layer" aria-hidden="true">
    {#each chips as c, i (i)}
      <span
        class="chip"
        style="
          left:{c.left}%;
          width:{c.width}px;
          height:{c.height}px;
          animation-delay:{c.delay}s;
          animation-duration:{c.duration}s;
          --rot:{c.rot}deg;
          --drift:{c.drift}px;
        "
      ></span>
    {/each}
  </div>
{:else}
  <div class="lose-flash" aria-hidden="true"></div>
{/if}

<div class="banner-layer">
  <p class="banner" class:lost={!won} role="status">
    <span class="kicker">{won ? t("stickSlash.wellPlayed") : t("stickSlash.gameOver")}</span>
    {won ? t("stickSlash.youWin") : t("stickSlash.youLose")}
  </p>
</div>

<style>
  .banner-layer {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 51;
    padding: 1rem;
  }

  .banner {
    display: grid;
    justify-items: center;
    gap: 0.4rem;
    margin: 0;
    padding: 1.1rem 2rem 1.4rem;
    border-radius: var(--radius-lg);
    background: var(--scrim);
    border: 1px solid var(--line-strong);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: var(--shadow), inset 0 1px 0 var(--sheen-strong);
    font-weight: 800;
    font-size: clamp(2.8rem, 12vw, 5.2rem);
    line-height: 1;
    letter-spacing: -0.045em;
    color: var(--gold);
    animation:
      pop 0.6s var(--ease-out) both,
      settle 0.5s var(--ease-out) 2.4s forwards;
  }

  .banner.lost {
    color: var(--danger);
  }

  .kicker {
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.92);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  /* After the moment has landed, step back so the board and buttons are readable. */
  @keyframes settle {
    to {
      opacity: 0;
      transform: translateY(-8px) scale(0.97);
    }
  }

  .chip-layer {
    position: fixed;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 50;
  }

  .chip {
    position: absolute;
    top: -6%;
    border-radius: 999px;
    background: var(--gold);
    transform: rotate(var(--rot));
    animation-name: fall;
    animation-timing-function: cubic-bezier(0.4, 0, 0.7, 1);
    animation-fill-mode: forwards;
  }

  @keyframes fall {
    to {
      transform: translate(var(--drift), 118vh) rotate(calc(var(--rot) + 380deg));
    }
  }

  .lose-flash {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 50;
    background: radial-gradient(ellipse at center, var(--danger-soft), transparent 68%);
    animation: flash 1.1s ease-out forwards;
  }

  @keyframes flash {
    0% {
      opacity: 0;
    }
    18% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
</style>
