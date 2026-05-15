export interface AvatarPreset {
  key: string;
  label: string;
  color: string;
  svg: string;
}

const star5 =
  '50,5 61.76,33.82 92.80,36.10 69.02,56.18 76.46,86.41 50,70 23.54,86.41 30.98,56.18 7.20,36.10 38.24,33.82';

const sparkle4 =
  'M50,5 L58,42 L95,50 L58,58 L50,95 L42,58 L5,50 L42,42 Z';

const diamond =
  '50,8 88,50 50,92 12,50';

const heart =
  'M50,86 C20,66 8,46 8,30 C8,16 18,8 30,8 C40,8 46,14 50,22 C54,14 60,8 70,8 C82,8 92,16 92,30 C92,46 80,66 50,86 Z';

const flower =
  'M50,12 C58,12 62,20 60,28 C68,22 78,26 78,36 C78,44 70,48 62,46 C68,52 66,62 58,64 C50,66 44,60 44,52 C40,60 30,60 26,52 C22,44 28,36 36,36 C28,32 28,22 36,20 C42,18 48,22 50,28 Z';

const moonStar = `<path d="M50,10 a40,40 0 1,0 30,68 a30,30 0 1,1 -30,-58 z"/><polygon points="${star5}" transform="scale(0.32) translate(110, 80)"/>`;

const pentaStar = `<polygon points="${star5}"/>`;

const burst = `
  <polygon points="50,4 56,38 90,32 64,52 84,80 50,70 16,80 36,52 10,32 44,38"/>
`;

const ringStar = `
  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="6"/>
  <polygon points="${star5}" transform="scale(0.55) translate(40, 40)"/>
`;

function preset(
  key: string,
  label: string,
  color: string,
  bg: string,
  shape: string,
): AvatarPreset {
  return {
    key,
    label,
    color,
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="100" height="100" rx="20" fill="${bg}"/><g fill="#ffffff" stroke="none">${shape}</g></svg>`,
  };
}

export const avatarPresets: AvatarPreset[] = [
  preset('gold-star', 'Gold star', '#f7c948', '#f7c948', pentaStar),
  preset('pink-sparkle', 'Pink sparkle', '#ff5d8f', '#ff5d8f', sparkle4),
  preset('blue-diamond', 'Blue diamond', '#3b82f6', '#3b82f6', `<polygon points="${diamond}"/>`),
  preset('purple-heart', 'Purple heart', '#a855f7', '#a855f7', `<path d="${heart}"/>`),
  preset('green-bloom', 'Green bloom', '#22c55e', '#22c55e', `<path d="${flower}"/>`),
  preset('teal-moon', 'Teal moon', '#14b8a6', '#14b8a6', moonStar),
  preset('orange-burst', 'Orange burst', '#fb923c', '#fb923c', burst),
  preset('red-ring', 'Red ring', '#ef4444', '#ef4444', ringStar),
];

export function findPreset(key: string): AvatarPreset | undefined {
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
