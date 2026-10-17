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

/* ---- iconic Mario / Mario Party items, in their real colours ----
   Each item is a die-cut sticker: `sil` is the bare silhouette (no paint), which
   gets a fat white border behind it; `art` is the item itself, flat-coloured with
   one shared ink outline. `key` keeps clip-path ids unique. */

const INK = '#2b1d16';
const WHITE = '#ffffff';

interface Emblem {
  sil: string;
  art: string;
}

function emblem(key: string): Emblem {
  const ink = `stroke="${INK}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;

  switch (key) {
    /* Power Star — yellow, with its little eyes */
    case 'gold-star': {
      const star = `<polygon points="50,9 61.5,36 90,38.5 68,57.5 75,86 50,70.5 25,86 32,57.5 10,38.5 38.5,36"/>`;
      return {
        sil: star,
        art: `
        <g fill="#ffd21f" ${ink}>${star}</g>
        <path d="M50,20 L57,37 L73,39" fill="none" stroke="#fff6b8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <ellipse cx="44" cy="50" rx="3.4" ry="7" fill="${INK}"/>
        <ellipse cx="56" cy="50" rx="3.4" ry="7" fill="${INK}"/>`,
      };
    }

    /* Super Mushroom — red cap, white spots, cream stem with eyes */
    case 'red-bolt': {
      const cap = `<path d="M12,55 C12,30 29,13 50,13 C71,13 88,30 88,55 C88,61 84,63 78,62 C69,60 60,59 50,59 C40,59 31,60 22,62 C16,63 12,61 12,55 Z"/>`;
      const stem = `<path d="M33,58 L67,58 C70,68 70,80 66,86 C62,90 38,90 34,86 C30,80 30,68 33,58 Z"/>`;
      return {
        sil: stem + cap,
        art: `
        <defs><clipPath id="cap-${key}">${cap}</clipPath></defs>
        <g fill="#f8e2b8" ${ink}>${stem}</g>
        <ellipse cx="44" cy="72" rx="3" ry="5.5" fill="${INK}"/>
        <ellipse cx="56" cy="72" rx="3" ry="5.5" fill="${INK}"/>
        <g fill="#e52521">${cap}</g>
        <g clip-path="url(#cap-${key})" fill="${WHITE}">
          <circle cx="50" cy="30" r="11.5"/>
          <circle cx="16" cy="45" r="10"/>
          <circle cx="84" cy="45" r="10"/>
        </g>
        <g fill="none" ${ink}>${cap}</g>`,
      };
    }

    /* Warp Pipe — green, lit from the left */
    case 'green-bloom': {
      const rim = `<rect x="17" y="17" width="66" height="23" rx="4"/>`;
      const body = `<rect x="24" y="38" width="52" height="52" rx="2"/>`;
      return {
        sil: body + rim,
        art: `
        <g fill="#1fa83f" ${ink}>${body}</g>
        <rect x="31" y="40" width="7" height="48" fill="#7be08d"/>
        <rect x="63" y="40" width="7" height="48" fill="#137a2c"/>
        <rect x="26" y="40" width="48" height="4" fill="#137a2c" opacity="0.6"/>
        <g fill="#1fa83f" ${ink}>${rim}</g>
        <rect x="24" y="20" width="7" height="17" fill="#7be08d"/>
        <rect x="70" y="20" width="7" height="17" fill="#137a2c"/>`,
      };
    }

    /* Koopa Shell — green dome with scutes, cream rim */
    case 'blue-diamond': {
      const rim = `<path d="M13,64 Q13,58 19,58 L81,58 Q87,58 87,64 L87,71 Q87,77 81,77 L19,77 Q13,77 13,71 Z"/>`;
      const dome = `<path d="M17,63 C17,40 32,24 50,24 C68,24 83,40 83,63 Z"/>`;
      return {
        sil: rim + dome,
        art: `
        <g fill="#2fb344" ${ink}>${dome}</g>
        <polygon points="50,34 62,41 62,54 50,61 38,54 38,41" fill="#7be08d" ${ink}/>
        <path d="M38,41 L27,45 M62,41 L73,45 M38,54 L28,62 M62,54 L72,62 M50,34 L50,25" fill="none" ${ink}/>
        <g fill="#fff3d6" ${ink}>${rim}</g>`,
      };
    }

    /* Boo — white, stubby arms, tongue out, a little blush */
    case 'purple-heart': {
      const body = `<ellipse cx="14" cy="60" rx="9" ry="6.5" transform="rotate(-30 14 60)"/><ellipse cx="86" cy="60" rx="9" ry="6.5" transform="rotate(30 86 60)"/><circle cx="50" cy="51" r="36"/>`;
      return {
        sil: body,
        art: `
        <g fill="${WHITE}" ${ink}>${body}</g>
        <ellipse cx="27" cy="58" rx="5" ry="3" fill="#ff8fab" opacity="0.7"/>
        <ellipse cx="73" cy="58" rx="5" ry="3" fill="#ff8fab" opacity="0.7"/>
        <ellipse cx="39" cy="44" rx="3.8" ry="7" fill="${INK}"/>
        <ellipse cx="61" cy="44" rx="3.8" ry="7" fill="${INK}"/>
        <path d="M33,57 Q50,53 67,57 Q64,79 50,79 Q36,79 33,57 Z" fill="#4a1020" ${ink}/>
        <path d="M41,70 Q50,63 59,70 Q57,78 50,78 Q43,78 41,70 Z" fill="#ff6f8e"/>
        <path d="M38,57.5 L41,64 L44,56.5 Z M56,56.5 L59,64 L62,57.5 Z" fill="${WHITE}"/>`,
      };
    }

    /* Yoshi Egg — white with green spots */
    case 'teal-moon': {
      const egg = `<path d="M50,11 C31,11 19,37 19,57 A31,33 0 0 0 81,57 C81,37 69,11 50,11 Z"/>`;
      return {
        sil: egg,
        art: `
        <g fill="${WHITE}" ${ink}>${egg}</g>
        <g fill="#2fb344">
          <path d="M40,27 C48,26 53,32 51,40 C49,48 42,49 36,46 C30,43 29,35 33,31 C35,28 37,27 40,27 Z"/>
          <path d="M64,47 C72,47 75,54 72,61 C69,68 62,69 57,65 C52,61 52,53 57,49 C59,47 62,47 64,47 Z"/>
          <path d="M41,63 C50,62 55,69 52,76 C49,83 41,83 36,79 C31,75 32,67 36,64 C38,63 39,63 41,63 Z"/>
        </g>`,
      };
    }

    /* ? Block — yellow, corner rivets, white ? with a drop */
    case 'orange-burst': {
      const block = `<rect x="14" y="14" width="72" height="72" rx="9"/>`;
      const q = `<path d="M38,40 Q38,27 50,27 Q62,27 62,39 Q62,48 51,51 Q50,53 50,58" fill="none" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
      return {
        sil: block,
        art: `
        <g fill="#fbb917" ${ink}>${block}</g>
        <path d="M17,78 L83,78" stroke="#c9780a" stroke-width="5" opacity="0.5"/>
        <circle cx="24" cy="24" r="3" fill="${INK}"/>
        <circle cx="76" cy="24" r="3" fill="${INK}"/>
        <circle cx="24" cy="76" r="3" fill="${INK}"/>
        <circle cx="76" cy="76" r="3" fill="${INK}"/>
        <g transform="translate(3 3)" stroke="#a85d00" fill="#a85d00">${q}<circle cx="50" cy="70" r="5" stroke="none"/></g>
        <g stroke="${WHITE}" fill="${WHITE}">${q}<circle cx="50" cy="70" r="5" stroke="none"/></g>`,
      };
    }

    /* Peach's Crown — gold, ruby centre, sapphires either side */
    case 'pink-sparkle': {
      const crown = `<path d="M16,76 L16,36 L34,50 L50,22 L66,50 L84,36 L84,76 Z"/><circle cx="16" cy="33" r="6"/><circle cx="50" cy="19" r="6"/><circle cx="84" cy="33" r="6"/>`;
      return {
        sil: crown,
        art: `
        <g fill="#ffc928" ${ink}>${crown}</g>
        <path d="M16,60 L84,60" stroke="${INK}" stroke-width="3"/>
        <path d="M20,38 L20,57" stroke="#fff1a8" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="50" cy="44" rx="6" ry="7.5" fill="#e52521" ${ink}/>
        <circle cx="30" cy="68" r="5" fill="#2f7cf6" ${ink}/>
        <circle cx="50" cy="68" r="5" fill="#e52521" ${ink}/>
        <circle cx="70" cy="68" r="5" fill="#2f7cf6" ${ink}/>`,
      };
    }

    default:
      return { sil: '', art: '' };
  }
}

/* ---- the player-colour tile behind the sticker ---- */

function preset(key: string, label: string, color: string): AvatarPreset {
  const { sil, art } = emblem(key);

  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">\
<defs>\
<radialGradient id="bg-${key}" cx="38%" cy="30%" r="80%">\
<stop offset="0%" stop-color="${lighten(color, 0.3)}"/>\
<stop offset="100%" stop-color="${darken(color, 0.28)}"/>\
</radialGradient>\
<filter id="lift-${key}" x="-20%" y="-20%" width="140%" height="140%">\
<feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-color="#000" flood-opacity="0.3"/>\
</filter>\
</defs>\
<rect width="100" height="100" fill="url(#bg-${key})"/>\
<g transform="translate(50 51) scale(0.84) translate(-50 -50)">\
<g filter="url(#lift-${key})" fill="${WHITE}" stroke="${WHITE}" stroke-width="12" stroke-linejoin="round">${sil}</g>\
${art}\
</g>\
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
