<script lang="ts">
  // Static SVG stage curtains — a draped red-velvet pair pulled to the sides
  // with a scalloped valance across the top. Pure vector: no WebGL, scales
  // cleanly to any viewport, zero runtime cost. The dice stay the only thing
  // in motion. The valance sits behind the curtains (lower z-index) so the
  // curtain fronts cover its ends at the sides — no poke-through.

  const FOLDS = 5;
  const GATHER_TOP = 0.6; // inner-edge width fraction at top; flares to 1 at the bottom

  const innerAt = (y: number) => 100 * (GATHER_TOP + (1 - GATHER_TOP) * (y / 100));

  // The draped silhouette of one curtain (outer edge straight at x=0, inner
  // edge flares from GATHER_TOP at the top to full width at the bottom).
  const silhouette = `M0,0 L${innerAt(0)},0 L${innerAt(100)},100 L0,100 Z`;

  // Vertical fold strips spanning the silhouette — each filled with the same
  // sheen gradient so dark creases meet between lit ridges.
  const folds: string[] = [];
  {
    const topInner = innerAt(0);
    const botInner = innerAt(100);
    for (let k = 0; k < FOLDS; k++) {
      const x0t = (k / FOLDS) * topInner;
      const x1t = ((k + 1) / FOLDS) * topInner;
      const x0b = (k / FOLDS) * botInner;
      const x1b = ((k + 1) / FOLDS) * botInner;
      folds.push(`M${x0t},0 L${x1t},0 L${x1b},100 L${x0b},100 Z`);
    }
  }

  // Scalloped valance: solid across the top, a row of downward arcs along the
  // hem.
  const valancePath = (() => {
    const body = 40;
    const S = 22;
    const w = 100 / S;
    let d = `M0,0 H100 V${body}`;
    for (let i = 0; i < S; i++) d += ` q ${-w / 2} 58 ${-w} 0`;
    d += ' V0 Z';
    return d;
  })();
</script>

<!-- Shared gradient defs (referenced document-wide via url(#id)). -->
<svg class="defs" aria-hidden="true" width="0" height="0">
  <defs>
    <linearGradient id="curtainFold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#3a050c" />
      <stop offset="0.16" stop-color="#7c1020" />
      <stop offset="0.5" stop-color="#c22a3c" />
      <stop offset="0.84" stop-color="#7c1020" />
      <stop offset="1" stop-color="#3a050c" />
    </linearGradient>
    <linearGradient id="curtainShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.5" />
      <stop offset="0.13" stop-color="#000" stop-opacity="0" />
      <stop offset="0.85" stop-color="#000" stop-opacity="0" />
      <stop offset="1" stop-color="#000" stop-opacity="0.4" />
    </linearGradient>
    <linearGradient id="valanceVelvet" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b8283a" />
      <stop offset="0.55" stop-color="#8c1322" />
      <stop offset="1" stop-color="#4a0810" />
    </linearGradient>
  </defs>
</svg>

<div class="valance" aria-hidden="true">
  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
    <path d={valancePath} fill="url(#valanceVelvet)" />
  </svg>
</div>

<div class="curtain left" aria-hidden="true">
  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
    {#each folds as d}
      <path {d} fill="url(#curtainFold)" />
    {/each}
    <path d={silhouette} fill="url(#curtainShade)" />
  </svg>
</div>

<div class="curtain right" aria-hidden="true">
  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
    {#each folds as d}
      <path {d} fill="url(#curtainFold)" />
    {/each}
    <path d={silhouette} fill="url(#curtainShade)" />
  </svg>
</div>

<style>
  .defs {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }
  .curtain,
  .valance {
    position: fixed;
    pointer-events: none;
  }
  .curtain svg,
  .valance svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .curtain {
    top: 0;
    bottom: 0;
    width: var(--curtain-w, 11vw);
    z-index: 41;
  }
  .curtain.left {
    left: 0;
    filter: drop-shadow(10px 0 18px rgba(0, 0, 0, 0.5));
  }
  .curtain.right {
    right: 0;
    transform: scaleX(-1);
    filter: drop-shadow(10px 0 18px rgba(0, 0, 0, 0.5));
  }
  .valance {
    top: 0;
    left: 0;
    right: 0;
    height: 6vh;
    z-index: 40;
  }
</style>
