<script>
  // A small looping picture of the game for the hub card: the board, and every
  // few seconds a slash that crosses the second row. CSS only, no JS timers.
  const ROWS = [7, 5, 3, 1];
</script>

<div class="preview" aria-hidden="true">
  {#each ROWS as count, r (r)}
    <div class="row" class:target={r === 1}>
      {#each Array(count) as _, i (i)}
        <span class="stick" style="--i:{i}"></span>
      {/each}
      {#if r === 1}
        <span class="slash"></span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .preview {
    --cycle: 5.2s;
    display: grid;
    gap: clamp(0.5rem, 2.2vw, 0.85rem);
    justify-items: center;
    padding: 1.4rem 1rem;
  }

  .row {
    position: relative;
    display: flex;
    gap: clamp(0.55rem, 2.4vw, 0.95rem);
  }

  .stick {
    width: 5px;
    height: clamp(1.8rem, 6vw, 2.5rem);
    border-radius: 999px;
    background: var(--stick);
    box-shadow: 0 2px 0 var(--stick-edge);
  }

  /* The crossed row: each stick dims a beat after the slash passes over it. */
  .target .stick {
    animation: crossed var(--cycle) var(--ease-out) infinite;
    animation-delay: calc(var(--i) * 45ms);
  }

  @keyframes crossed {
    0%,
    34% {
      opacity: 1;
      transform: none;
    }
    44%,
    86% {
      opacity: 0.18;
      transform: translateY(5px) rotate(8deg);
    }
    100% {
      opacity: 1;
      transform: none;
    }
  }

  .slash {
    position: absolute;
    left: -14%;
    right: -14%;
    top: 50%;
    height: 3px;
    border-radius: 999px;
    background: var(--ink);
    transform-origin: left center;
    rotate: -10deg;
    opacity: 0;
    animation: slash var(--cycle) var(--ease-out) infinite;
  }

  @keyframes slash {
    0%,
    28% {
      opacity: 0;
      scale: 0 1;
    }
    32% {
      opacity: 1;
      scale: 0.2 1;
    }
    40% {
      opacity: 1;
      scale: 1 1;
    }
    52%,
    100% {
      opacity: 0;
      scale: 1 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .target .stick,
    .slash {
      animation: none;
    }
  }
</style>
