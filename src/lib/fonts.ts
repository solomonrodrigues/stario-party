// Ensures the Mario Party Hudson display font (declared via @font-face in
// app.css) is actually loaded so canvas — the 3D dice faces — can use it.
// Canvas silently falls back if a font isn't loaded yet, so callers should
// redraw once the returned promise resolves.

export const DICE_FONT_FAMILY = 'Mario Party Hudson';

let loadPromise: Promise<void> | null = null;

export function loadDiceFont(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      if (typeof document === 'undefined' || !('fonts' in document)) return;
      await document.fonts.load(`1em "${DICE_FONT_FAMILY}"`);
    })().catch(() => {
      // Leave it unloaded; the dice falls back to its CSS stack.
    });
  }
  return loadPromise;
}
