export interface AvatarPreset {
  key: string;
  label: string;
  color: string;
  svg: string;
}

/* ---- colour helpers: keep the hue, shift the value ---- */

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => clamp(x).toString(16).padStart(2, '0'))
      .join('')
  );
}

function mix(hex: string, target: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [tr, tg, tb] = hexToRgb(target);
  return rgbToHex(r + (tr - r) * amt, g + (tg - g) * amt, b + (tb - b) * amt);
}

const lighten = (hex: string, amt: number) => mix(hex, '#ffffff', amt);
const darken = (hex: string, amt: number) => mix(hex, '#000000', amt);

/* ---- emblem geometry: single fillable shapes, centred in a 0..100 box ---- */

type Shape =
  | { el: 'polygon'; geom: string }
  | { el: 'path'; geom: string };

const star5: Shape = {
  el: 'polygon',
  geom:
    'points="50,5 61.76,33.82 92.80,36.10 69.02,56.18 76.46,86.41 50,70 23.54,86.41 30.98,56.18 7.20,36.10 38.24,33.82"',
};

const sparkle4: Shape = {
  el: 'path',
  geom: 'd="M50,5 L58,42 L95,50 L58,58 L50,95 L42,58 L5,50 L42,42 Z"',
};

const diamond: Shape = {
  el: 'polygon',
  geom: 'points="50,8 88,50 50,92 12,50"',
};

const heart: Shape = {
  el: 'path',
  geom:
    'd="M50,90 C22,72 11,52 11,36 C11,22 20,15 31,15 C40,15 46,20 50,28 C54,20 60,15 69,15 C80,15 89,22 89,36 C89,52 78,72 50,90 Z"',
};

const mushroom: Shape = {
  el: 'path',
  geom:
    'd="M50,10 C22,10 9,30 9,50 C9,57 14,61 22,61 L28,61 L28,82 C28,88 35,91 50,91 C65,91 72,88 72,82 L72,61 L78,61 C86,61 91,57 91,50 C91,30 78,10 50,10 Z"',
};

const droplet: Shape = {
  el: 'path',
  geom: 'd="M50,10 C62,30 80,48 80,64 A30,30 0 1 1 20,64 C20,48 38,30 50,10 Z"',
};

const crown: Shape = {
  el: 'path',
  geom:
    'd="M16,76 L16,34 L34,49 L50,20 L66,49 L84,34 L84,76 Z"',
};

const bolt: Shape = {
  el: 'path',
  geom: 'd="M58,8 L28,53 L46,53 L40,92 L74,43 L54,43 Z"',
};

/* ---- the Mario-Party candy treatment ---- */

function preset(
  key: string,
  label: string,
  color: string,
  shape: Shape,
): AvatarPreset {
  const light = lighten(color, 0.42);
  const edge = darken(color, 0.28);
  const pale = lighten(color, 0.8);
  const stroke = darken(color, 0.52);

  const main = `<${shape.el} ${shape.geom} fill="url(#em-${key})" stroke="${stroke}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;
  const shadow = `<${shape.el} ${shape.geom} fill="#000000" opacity="0.16" transform="translate(0 3.4)"/>`;

  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">\
<defs>\
<radialGradient id="bg-${key}" cx="38%" cy="30%" r="80%">\
<stop offset="0%" stop-color="${light}"/>\
<stop offset="58%" stop-color="${color}"/>\
<stop offset="100%" stop-color="${edge}"/>\
</radialGradient>\
<linearGradient id="em-${key}" x1="0" y1="0.05" x2="0" y2="0.98">\
<stop offset="0%" stop-color="#ffffff"/>\
<stop offset="100%" stop-color="${pale}"/>\
</linearGradient>\
</defs>\
<rect width="100" height="100" fill="url(#bg-${key})"/>\
<ellipse cx="50" cy="27" rx="44" ry="26" fill="#ffffff" opacity="0.16"/>\
<g transform="translate(50 50) scale(0.82) translate(-50 -50)">${shadow}${main}</g>\
</svg>`;

  return { key, label, color, svg };
}

export const avatarPresets: AvatarPreset[] = [
  preset('gold-star', 'Gold star', '#f7c948', star5),
  preset('pink-sparkle', 'Pink sparkle', '#ff5d8f', sparkle4),
  preset('blue-diamond', 'Blue diamond', '#3b82f6', diamond),
  preset('purple-heart', 'Purple heart', '#a855f7', heart),
  preset('green-bloom', 'Green mushroom', '#22c55e', mushroom),
  preset('teal-moon', 'Aqua drop', '#14b8a6', droplet),
  preset('orange-burst', 'Orange crown', '#fb923c', crown),
  preset('red-bolt', 'Red bolt', '#ef4444', bolt),
];

export function findPreset(key: string): AvatarPreset | undefined {
  // 'red-ring' was the old key for the red emblem; keep saved avatars working.
  if (key === 'red-ring') key = 'red-bolt';
  return avatarPresets.find((p) => p.key === key);
}

export const playerColorPalette: string[] = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#a855f7',
  '#f59e0b',
  '#14b8a6',
  '#ff5d8f',
  '#facc15',
];
