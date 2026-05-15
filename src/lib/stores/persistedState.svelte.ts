export interface PersistedState<T> {
  value: T;
}

export function persistedState<T>(key: string, initial: T): PersistedState<T> {
  let current = $state<T>(load(key, initial));

  $effect.root(() => {
    $effect(() => {
      const snapshot = $state.snapshot(current);
      try {
        localStorage.setItem(key, JSON.stringify(snapshot));
      } catch (err) {
        if (
          err instanceof DOMException &&
          (err.name === 'QuotaExceededError' ||
            err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
        ) {
          console.error(
            `[stario] localStorage quota exceeded while writing "${key}". ` +
              'Consider clearing some saved data.',
            err,
          );
        } else {
          console.error(`[stario] Failed to persist "${key}":`, err);
        }
      }
    });
  });

  return {
    get value(): T {
      return current;
    },
    set value(next: T) {
      current = next;
    },
  };
}

function load<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(
      `[stario] Could not parse persisted value for "${key}"; falling back to defaults.`,
      err,
    );
    return fallback;
  }
}
