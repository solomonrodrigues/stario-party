import type { MiniGame, MiniGameCategory, MiniGameExport } from '../types';

const VALID_CATEGORIES: ReadonlyArray<MiniGameCategory> = [
  'physical',
  'mental',
  'silly',
  'creative',
  'other',
];

export function exportMiniGames(list: MiniGame[]): void {
  const payload: MiniGameExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    minigames: list,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stario-minigames-${todayIso()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revoke to next tick so Safari doesn't drop the click before
  // the download starts.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function isMiniGameExport(value: unknown): value is MiniGameExport {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (v.version !== 1) return false;
  if (typeof v.exportedAt !== 'string') return false;
  if (!Array.isArray(v.minigames)) return false;
  return v.minigames.every(isMiniGame);
}

function isMiniGame(value: unknown): value is MiniGame {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  if (typeof m.id !== 'string') return false;
  if (typeof m.name !== 'string') return false;
  if (typeof m.instructions !== 'string') return false;
  if (typeof m.active !== 'boolean') return false;
  if (
    m.category !== undefined &&
    !(typeof m.category === 'string' &&
      VALID_CATEGORIES.includes(m.category as MiniGameCategory))
  ) {
    return false;
  }
  if (
    m.durationMinutes !== undefined &&
    !(typeof m.durationMinutes === 'number' && isFinite(m.durationMinutes))
  ) {
    return false;
  }
  return true;
}

export async function importMiniGamesFromFile(
  file: File,
): Promise<MiniGame[]> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      "This doesn't look like a Stario Party mini-game file (bad JSON).",
    );
  }
  if (!isMiniGameExport(parsed)) {
    throw new Error(
      "This doesn't look like a Stario Party mini-game file.",
    );
  }
  return parsed.minigames.map((m) => ({
    id: crypto.randomUUID(),
    name: m.name,
    instructions: m.instructions,
    category: m.category,
    durationMinutes: m.durationMinutes,
    active: m.active,
  }));
}

function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
