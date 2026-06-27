<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import * as THREE from 'three';
  import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
  import { play } from '../sound/sfx';

  type Phase = 'idle' | 'spinning' | 'done';

  interface Props {
    onRoll?: (value: number) => void;
    disabled?: boolean;
    initial?: number | null;
    size?: number;
    hint?: string;
  }

  let {
    onRoll,
    disabled = false,
    initial = null,
    size = 180,
    hint = 'Tap to roll',
  }: Props = $props();

  const CYCLE_MS = 70;

  let displayValue = $state<number | null>(untrack(() => initial));
  let phase = $state<Phase>(
    untrack(() => (initial !== null ? 'done' : 'idle')),
  );
  let cycler: ReturnType<typeof setInterval> | null = null;
  let bounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Resync to prop changes from the parent (e.g. order-roll resets tied
  // players' rolls back to null so they can roll again).
  let lastInitial = untrack(() => initial);
  $effect(() => {
    if (initial === lastInitial) return;
    lastInitial = initial;
    clearTimers();
    if (initial === null) {
      phase = 'idle';
      displayValue = null;
      if (cube) {
        assignDistinctValues();
        cube.rotation.copy(restRotation);
        cube.position.y = 0;
      }
    } else {
      phase = 'done';
      displayValue = initial;
      if (cube) {
        // Put the locked value on the front face and snap home so it shows.
        assignDistinctValues(initial);
        cube.rotation.copy(restRotation);
        cube.position.y = 0;
      }
    }
  });

  function clearTimers() {
    if (cycler) clearInterval(cycler);
    if (bounceTimer) clearTimeout(bounceTimer);
    cycler = null;
    bounceTimer = null;
  }

  function spinStart() {
    play('roll');
    phase = 'spinning';
    play('dice-tick');
    cycler = setInterval(() => {
      // Re-roll a hidden face each tick — never one the player can see.
      changeHiddenFace();
      play('dice-tick');
    }, CYCLE_MS);
  }

  function spinStop() {
    if (cycler) clearInterval(cycler);
    cycler = null;
    play('dice-land');
    phase = 'done';
    // The die settles home (identity), so the +Z face ends up toward the
    // camera. Its value was last set while it was hidden, so it never changed
    // in view — that's the roll.
    const result = cube
      ? faceValues[FRONT_FACE]
      : (displayValue ?? Math.floor(Math.random() * 10) + 1);
    displayValue = result;
    triggerBounce();
    onRoll?.(result);
  }

  function handleClick() {
    if (disabled) return;
    if (phase === 'idle') {
      spinStart();
    } else if (phase === 'spinning') {
      spinStop();
    }
  }

  const ariaLabel = $derived(
    phase === 'idle'
      ? 'Tap to start dice'
      : phase === 'spinning'
        ? 'Tap to stop dice'
        : 'Rolled',
  );

  const computedHint = $derived(
    phase === 'idle'
      ? hint
      : phase === 'spinning'
        ? 'Tap to stop!'
        : '',
  );

  // ---------------------------------------------------------------------------
  // Three.js render layer
  // ---------------------------------------------------------------------------
  let mount: HTMLDivElement;
  let webglFailed = $state(false);

  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let cube: THREE.Mesh | null = null;
  let geometry: RoundedBoxGeometry | null = null;
  let rafId = 0;

  // One texture/material per cube face. Order matches BoxGeometry's material
  // groups: +X, -X, +Y, -Y, +Z, -Z.
  const FACE_COUNT = 6;
  const FRONT_FACE = 4; // +Z — toward the camera at the home (rest) orientation
  const LOCAL_NORMALS = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ];
  const _n = new THREE.Vector3();

  let faceCanvases: HTMLCanvasElement[] = [];
  let faceTextures: THREE.CanvasTexture[] = [];
  let faceMaterials: THREE.MeshPhysicalMaterial[] = [];
  const faceValues: number[] = [1, 2, 3, 4, 5, 6];

  // Panel geometry shared across faces.
  const PANEL_MARGIN = 0.12; // fraction of face size from the edge
  const PANEL_CUT = 0.17; // corner chamfer length

  // Bounce on land — a damped scale pop driven inside the render loop.
  let bounceStart = 0;
  let bouncing = false;
  const BOUNCE_MS = 320;

  // Home orientation the die settles to once a roll locks in.
  const restRotation = new THREE.Euler(0, 0, 0);

  function triggerBounce() {
    bounceStart = performance.now();
    bouncing = true;
  }

  // Assign six distinct numbers (1–10) to the faces. If frontValue is given it
  // is placed on the front (+Z) face so a locked roll shows it.
  function assignDistinctValues(frontValue?: number | null) {
    const vals: number[] = [];
    while (vals.length < FACE_COUNT) {
      const v = Math.floor(Math.random() * 10) + 1;
      if (!vals.includes(v)) vals.push(v);
    }
    if (frontValue != null) {
      if (!vals.includes(frontValue)) vals[0] = frontValue;
      const idx = vals.indexOf(frontValue);
      [vals[FRONT_FACE], vals[idx]] = [vals[idx], vals[FRONT_FACE]];
    }
    for (let i = 0; i < FACE_COUNT; i++) faceValues[i] = vals[i];
    drawAllFaces();
  }

  // World-space Z of a face normal; > 0 means it's pointing toward the camera.
  function faceWorldZ(i: number): number {
    if (!cube) return 0;
    return _n.copy(LOCAL_NORMALS[i]).applyQuaternion(cube.quaternion).z;
  }

  // Re-roll a single clearly back-facing face to a value distinct from the
  // others, so the change is never visible and all faces stay unique.
  function changeHiddenFace() {
    if (!cube) {
      displayValue = Math.floor(Math.random() * 10) + 1;
      return;
    }
    const hidden: number[] = [];
    for (let i = 0; i < FACE_COUNT; i++) {
      if (faceWorldZ(i) < -0.2) hidden.push(i);
    }
    if (hidden.length === 0) return;
    const i = hidden[Math.floor(Math.random() * hidden.length)];
    let v: number;
    do {
      v = Math.floor(Math.random() * 10) + 1;
    } while (faceValues.some((fv, j) => j !== i && fv === v));
    faceValues[i] = v;
    drawFace(i);
  }

  function drawAllFaces() {
    for (let i = 0; i < FACE_COUNT; i++) drawFace(i);
  }

  // Octagon (cut-corner square) panel path.
  function tracePanel(ctx: CanvasRenderingContext2D, S: number) {
    const m = S * PANEL_MARGIN;
    const c = S * PANEL_CUT;
    ctx.beginPath();
    ctx.moveTo(m + c, m);
    ctx.lineTo(S - m - c, m);
    ctx.lineTo(S - m, m + c);
    ctx.lineTo(S - m, S - m - c);
    ctx.lineTo(S - m - c, S - m);
    ctx.lineTo(m + c, S - m);
    ctx.lineTo(m, S - m - c);
    ctx.lineTo(m, m + c);
    ctx.closePath();
  }

  function drawFace(i: number) {
    const cv = faceCanvases[i];
    const tex = faceTextures[i];
    if (!cv || !tex) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const S = cv.width;
    const m = S * PANEL_MARGIN;
    ctx.clearRect(0, 0, S, S);

    // Blue body fill — the frame around the inset panel. (The mesh material is
    // white, so the texture's colours render true.) Flat so adjacent faces meet
    // at the rounded edges with no light/dark seam.
    ctx.fillStyle = '#2f8ff6';
    ctx.fillRect(0, 0, S, S);

    // Light cut-corner panel, raised off the body with a drop shadow.
    tracePanel(ctx, S);
    ctx.save();
    ctx.shadowColor = 'rgba(6, 12, 45, 0.5)';
    ctx.shadowBlur = S * 0.05;
    ctx.shadowOffsetY = S * 0.04;
    ctx.fillStyle = '#e2f7fe';
    ctx.fill();
    ctx.restore();

    // Subtle halftone dots rising from the bottom of the panel, fully faded out
    // by the vertical midpoint of the face (#88c7ea).
    ctx.save();
    tracePanel(ctx, S);
    ctx.clip();
    const panelBottom = S - m;
    const fadeTop = S / 2;
    const spacing = S * 0.05;
    const radius = S * 0.013;
    let row = 0;
    for (let y = panelBottom; y > fadeTop; y -= spacing, row++) {
      const a = ((y - fadeTop) / (panelBottom - fadeTop)) * 0.55;
      if (a <= 0) continue;
      const xOffset = row % 2 ? spacing / 2 : 0;
      for (let x = m + xOffset; x < S - m; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(136, 199, 234, ${a})`;
        ctx.fill();
      }
    }
    ctx.restore();

    // Crisp rim around the panel for extra separation from the body.
    ctx.save();
    tracePanel(ctx, S);
    ctx.lineWidth = S * 0.012;
    ctx.strokeStyle = 'rgba(18, 44, 104, 0.45)';
    ctx.stroke();
    ctx.restore();

    // Number: vertical gradient (#defbac top → #2cf4a8 bottom) with a chunky
    // border. Stroke first, then fill so the border sits behind the gradient.
    const label = String(faceValues[i]);
    ctx.font = `800 ${Math.round(S * 0.5)}px "Baloo 2", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    const cx = S / 2;
    const cy = S * 0.54;
    const grad = ctx.createLinearGradient(0, cy - S * 0.28, 0, cy + S * 0.28);
    grad.addColorStop(0, '#defbac');
    grad.addColorStop(1, '#2cf4a8');

    ctx.lineWidth = S * 0.075;
    ctx.strokeStyle = '#3265a5';
    ctx.strokeText(label, cx, cy);

    ctx.fillStyle = grad;
    ctx.fillText(label, cx, cy);

    tex.needsUpdate = true;
  }

  function initThree() {
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      webglFailed = true;
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 4.1);

    geometry = new RoundedBoxGeometry(1.5, 1.5, 1.5, 6, 0.32);

    // A texture + material per face so each can show a different number.
    const aniso = renderer.capabilities.getMaxAnisotropy();
    for (let i = 0; i < FACE_COUNT; i++) {
      const cv = document.createElement('canvas');
      cv.width = 256;
      cv.height = 256;
      faceCanvases[i] = cv;
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = aniso;
      faceTextures[i] = tex;
      faceMaterials[i] = new THREE.MeshPhysicalMaterial({
        // White base so the baked-in face texture renders its true colours.
        color: 0xffffff,
        map: tex,
        transparent: true,
        opacity: 0.97,
        roughness: 0.4,
        metalness: 0,
        clearcoat: 0.6,
        clearcoatRoughness: 0.4,
        transmission: 0.12,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.08,
      });
    }
    assignDistinctValues(initial);

    cube = new THREE.Mesh(geometry, faceMaterials);
    cube.rotation.copy(restRotation);
    scene.add(cube);

    // Lighting — ambient fill, a key directional, and a point light that
    // rakes a glossy highlight across the block.
    scene.add(new THREE.AmbientLight(0xbcd8ff, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(2.5, 3.5, 4);
    scene.add(key);
    const fill = new THREE.PointLight(0x7dd3fc, 1.4, 18);
    fill.position.set(-2.5, -1.5, 3);
    scene.add(fill);

    let last = performance.now();

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      if (!renderer || !scene || !camera || !cube) return;
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      if (phase === 'spinning') {
        // Fast multi-axis tumble in place + a quick bob.
        cube.rotation.x += dt * 7.5;
        cube.rotation.y += dt * 9.5;
        cube.rotation.z += dt * 3.0;
        cube.position.y = Math.sin(t * 9) * 0.12;
      } else if (phase === 'done') {
        // Ease the spin home so the front (+Z) face presents to the camera.
        cube.rotation.x = THREE.MathUtils.damp(
          cube.rotation.x,
          restRotation.x,
          6,
          dt,
        );
        cube.rotation.y = THREE.MathUtils.damp(
          cube.rotation.y,
          restRotation.y,
          6,
          dt,
        );
        cube.rotation.z = THREE.MathUtils.damp(
          cube.rotation.z,
          restRotation.z,
          6,
          dt,
        );
        cube.position.y = THREE.MathUtils.damp(cube.position.y, 0, 6, dt);
      } else {
        // Idle: slow, alive tumble + gentle float.
        cube.rotation.x += dt * 0.5;
        cube.rotation.y += dt * 0.8;
        cube.position.y = Math.sin(t * 1.6) * 0.06;
      }

      // Scale-pop bounce on land.
      let s = 1;
      if (bouncing) {
        const k = (now - bounceStart) / BOUNCE_MS;
        if (k >= 1) {
          bouncing = false;
        } else {
          s = 1 + Math.sin(k * Math.PI) * 0.32 * (1 - k * 0.35);
        }
      }
      cube.scale.setScalar(s);

      renderer.render(scene, camera);
    };
    loop();
  }

  function disposeThree() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    geometry?.dispose();
    for (const t of faceTextures) t.dispose();
    for (const mat of faceMaterials) mat.dispose();
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
    renderer = null;
    scene = null;
    camera = null;
    cube = null;
    geometry = null;
    faceCanvases = [];
    faceTextures = [];
    faceMaterials = [];
  }

  onMount(() => {
    initThree();
  });

  onDestroy(() => {
    clearTimers();
    disposeThree();
  });
</script>

<button
  class="dice"
  class:spinning={phase === 'spinning'}
  class:done={phase === 'done'}
  disabled={disabled && phase !== 'spinning'}
  aria-label={ariaLabel}
  style:--size="{size}px"
  style:--face-size="{Math.round(size * 0.55)}px"
  style:--hint-size="{Math.max(10, Math.round(size * 0.078))}px"
  onclick={handleClick}
>
  <span class="aura" aria-hidden="true"></span>
  <div class="stage" bind:this={mount} aria-hidden="true"></div>
  {#if webglFailed}
    <span class="face-fallback">{displayValue ?? '?'}</span>
  {/if}
  {#if computedHint}
    <span class="hint" class:active={phase === 'spinning'}>
      {computedHint}
    </span>
  {/if}
</button>

<style>
  .dice {
    --size: 180px;
    --hint-size: 13px;
    position: relative;
    width: var(--size);
    height: var(--size);
    border: none;
    background: none;
    padding: 0;
    color: #fff;
    font-family: var(--display);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition:
      transform 0.12s ease,
      filter 0.12s ease;
    will-change: transform;
  }
  .dice:not(:disabled):hover {
    transform: translateY(-3px);
    filter: brightness(1.06) saturate(1.05);
  }
  .dice:not(:disabled):active {
    transform: translateY(3px);
    filter: brightness(0.94);
  }
  .dice:disabled {
    cursor: default;
  }

  .stage {
    position: absolute;
    inset: 0;
    display: block;
    pointer-events: none;
    filter: drop-shadow(0 calc(var(--size) * 0.07) calc(var(--size) * 0.12)
        rgba(0, 0, 0, 0.45));
  }

  .face-fallback {
    position: relative;
    z-index: 1;
    font-size: var(--face-size, calc(var(--size) * 0.55));
    font-weight: 700;
    color: #fff;
    -webkit-text-stroke: calc(var(--size) * 0.022) #1e3a8a;
    paint-order: stroke fill;
    text-shadow: 0 calc(var(--size) * 0.02) 0 #1e3a8a;
  }

  .aura {
    position: absolute;
    inset: -12%;
    border-radius: 50%;
    pointer-events: none;
    background: radial-gradient(
      circle at center,
      rgba(125, 211, 252, 0.3) 0%,
      rgba(125, 211, 252, 0) 62%
    );
    opacity: 0.45;
    transition: opacity 0.2s ease;
  }
  .spinning .aura {
    opacity: 1;
    animation: aura-pulse 0.7s ease-in-out infinite;
  }
  @keyframes aura-pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.6;
    }
    50% {
      transform: scale(1.18);
      opacity: 1;
    }
  }

  .hint {
    position: absolute;
    bottom: calc(var(--size) * 0.02);
    z-index: 2;
    font-size: var(--hint-size);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.85);
    text-shadow: 0 1px 0 #1e3a8a;
    opacity: 0.85;
    pointer-events: none;
  }
  .hint.active {
    animation: hint-blink 0.55s ease-in-out infinite;
  }
  @keyframes hint-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }
</style>
