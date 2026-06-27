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
    [r, g, b].map((x) => clamp(x).toString(16).padStart(2, '0')).join('')
  );
}

function mix(hex: string, target: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [tr, tg, tb] = hexToRgb(target);
  return rgbToHex(r + (tr - r) * amt, g + (tg - g) * amt, b + (tb - b) * amt);
}

const lighten = (hex: string, amt: number) => mix(hex, '#ffffff', amt);
const darken = (hex: string, amt: number) => mix(hex, '#000000', amt);

/* ---- iconic Mario / Mario Party emblems ----
   Each emblem is a white-bodied "sticker": a glossy white shape with a thick
   tinted-dark outline, plus knock-out detail (spots, rivets, faces) drawn in
   the same dark tint. Built per-preset so we can use the player colour for the
   outline + the tile. `s` is the outline/detail colour, `key` makes gradient
   ids unique. */

function emblem(key: string, s: string): string {
  // Shared attribute string for the main white body of an emblem.
  const body = `fill="url(#em-${key})" stroke="${s}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;

  switch (key) {
    /* ⭐ Power Star — the Mario Party goal item */
    case 'gold-star':
      return `
        <polygon points="50,8 61,35 90,37 67,56 75,85 50,69 25,85 33,56 10,37 39,35" ${body}/>`;

    /* 🍄 Super Mushroom — cap with spots + stem with eyes */
    case 'red-bolt':
      return `
        <path d="M50,12 C23,12 10,31 10,50 C10,57 15,61 23,61 L30,61 L30,82 C30,88 37,91 50,91 C63,91 70,88 70,82 L70,61 L77,61 C85,61 90,57 90,50 C90,31 77,12 50,12 Z" ${body}/>
        <path d="M31,60 Q50,66 69,60" fill="none" stroke="${s}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="30" cy="40" r="7.5" fill="${s}"/>
        <circle cx="63" cy="31" r="9.5" fill="${s}"/>
        <circle cx="74" cy="47" r="5" fill="${s}"/>
        <circle cx="45" cy="49" r="5.5" fill="${s}"/>
        <ellipse cx="42" cy="74" rx="4.5" ry="7.5" fill="${s}"/>
        <ellipse cx="58" cy="74" rx="4.5" ry="7.5" fill="${s}"/>`;

    /* 🟢 Warp Pipe */
    case 'green-bloom':
      return `
        <rect x="28" y="40" width="44" height="50" rx="4" ${body}/>
        <rect x="20" y="24" width="60" height="22" rx="7" ${body}/>
        <ellipse cx="50" cy="30" rx="22" ry="5" fill="${s}" opacity="0.28"/>`;

    /* 🐢 Koopa Shell — domed shell with scalloped scutes + belly rim */
    case 'blue-diamond':
      return `
        <path d="M13,64 Q13,58 19,58 L81,58 Q87,58 87,64 L87,71 Q87,77 81,77 L19,77 Q13,77 13,71 Z" ${body}/>
        <path d="M17,63 A33,30 0 0 1 83,63 Q76,71 69,63 Q62,71 55,63 Q48,71 41,63 Q34,71 27,63 Q22,67 17,63 Z" ${body}/>
        <polygon points="50,33 63,41 63,55 50,62 37,55 37,41" fill="none" stroke="${s}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M37,41 L26,45 M63,41 L74,45 M50,33 L50,23" fill="none" stroke="${s}" stroke-width="3" stroke-linecap="round"/>`;

    /* 👻 Boo */
    case 'purple-heart':
      return `
        <path d="M50,12 C29,12 15,28 15,49 L15,80 C15,85 21,86 25,80 C29,74 36,74 40,80 C44,86 56,86 60,80 C64,74 71,74 75,80 C79,86 85,85 85,80 L85,49 C85,28 71,12 50,12 Z" ${body}/>
        <ellipse cx="40" cy="45" rx="6" ry="11" fill="${s}"/>
        <ellipse cx="60" cy="45" rx="6" ry="11" fill="${s}"/>
        <ellipse cx="50" cy="65" rx="9" ry="8" fill="${s}"/>`;

    /* 🥚 Yoshi Egg — pointed egg with spots */
    case 'teal-moon':
      return `
        <path d="M50,11 C31,11 19,37 19,57 A31,33 0 0 0 81,57 C81,37 69,11 50,11 Z" ${body}/>
        <path d="M40,30 C48,29 53,35 51,42 C49,50 42,51 36,48 C30,45 29,38 33,34 C35,31 37,30 40,30 Z" fill="${s}"/>
        <path d="M63,50 C71,50 74,57 71,64 C68,71 61,72 56,68 C51,64 51,56 56,52 C58,50 61,50 63,50 Z" fill="${s}"/>
        <path d="M43,64 C52,63 57,70 54,77 C51,84 43,84 38,80 C33,76 34,68 38,65 C40,64 41,64 43,64 Z" fill="${s}"/>`;

    /* ❓ ? Block */
    case 'orange-burst':
      return `
        <rect x="14" y="14" width="72" height="72" rx="13" ${body}/>
        <rect x="22" y="22" width="56" height="56" rx="8" fill="none" stroke="${s}" stroke-width="2.5" opacity="0.45"/>
        <circle cx="27" cy="27" r="3" fill="${s}"/>
        <circle cx="73" cy="27" r="3" fill="${s}"/>
        <circle cx="27" cy="73" r="3" fill="${s}"/>
        <circle cx="73" cy="73" r="3" fill="${s}"/>
        <path d="M38,42 Q38,29 50,29 Q62,29 62,41 Q62,50 51,53 Q50,55 50,60" fill="none" stroke="${s}" stroke-width="7" stroke-linecap="round"/>
        <circle cx="50" cy="71" r="4.5" fill="${s}"/>`;

    /* 👑 Peach Crown — crown with balls on the tips + jewels on the band */
    case 'pink-sparkle':
      return `
        <path d="M16,74 L16,36 L34,50 L50,22 L66,50 L84,36 L84,74 Z" ${body}/>
        <circle cx="16" cy="34" r="6" ${body}/>
        <circle cx="50" cy="20" r="6" ${body}/>
        <circle cx="84" cy="34" r="6" ${body}/>
        <circle cx="34" cy="65" r="4" fill="${s}"/>
        <circle cx="50" cy="65" r="4" fill="${s}"/>
        <circle cx="66" cy="65" r="4" fill="${s}"/>`;

    default:
      return '';
  }
}

/* ---- the glossy Mario-Party button treatment around an emblem ---- */

function preset(key: string, label: string, color: string): AvatarPreset {
  const light = lighten(color, 0.46);
  const edge = darken(color, 0.3);
  const bevel = darken(color, 0.5);
  const pale = lighten(color, 0.78);
  const stroke = darken(color, 0.5);

  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">\
<defs>\
<radialGradient id="bg-${key}" cx="38%" cy="30%" r="82%">\
<stop offset="0%" stop-color="${light}"/>\
<stop offset="55%" stop-color="${color}"/>\
<stop offset="100%" stop-color="${edge}"/>\
</radialGradient>\
<linearGradient id="em-${key}" x1="0" y1="0.04" x2="0" y2="0.98">\
<stop offset="0%" stop-color="#ffffff"/>\
<stop offset="55%" stop-color="#ffffff"/>\
<stop offset="100%" stop-color="${pale}"/>\
</linearGradient>\
</defs>\
<rect width="100" height="100" fill="url(#bg-${key})"/>\
<ellipse cx="50" cy="93" rx="45" ry="22" fill="#000000" opacity="0.16"/>\
<path d="M9,40 A41,41 0 0 1 91,40 C76,54 24,54 9,40 Z" fill="#ffffff" opacity="0.18"/>\
<circle cx="50" cy="50" r="48.5" fill="none" stroke="${bevel}" stroke-width="3" opacity="0.5"/>\
<g transform="translate(50 50) scale(0.84) translate(-50 -50)">${emblem(key, stroke)}</g>\
</svg>`;

  return { key, label, color, svg };
}

export const avatarPresets: AvatarPreset[] = [
  preset('gold-star', 'Power Star', '#f7c948'),
  preset('red-bolt', 'Super Mushroom', '#ef4444'),
  preset('green-bloom', 'Warp Pipe', '#22c55e'),
  preset('blue-diamond', 'Koopa Shell', '#3b82f6'),
  preset('purple-heart', 'Boo', '#a855f7'),
  preset('teal-moon', 'Yoshi Egg', '#14b8a6'),
  preset('orange-burst', '? Block', '#fb923c'),
  preset('pink-sparkle', 'Peach Crown', '#ff5d8f'),
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
