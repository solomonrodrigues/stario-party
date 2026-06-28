export interface ConfirmOptions {
  // Short heading; defaults to "Are you sure?" when omitted.
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // 'danger' tints the confirm button red for destructive actions.
  tone?: 'default' | 'danger';
}

interface ActiveConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

// A promise-based replacement for the native `confirm()` dialog. Call
// `confirmDialog.ask(...)` from anywhere; a single <ConfirmDialog /> mounted
// in App renders the styled prompt and resolves the promise on the host's
// choice. Drop-in for `if (!confirm(...)) return;` → `if (!(await ...)) return;`.
class ConfirmStore {
  active = $state<ActiveConfirm | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    // Only one prompt at a time; supersede any in-flight request as cancelled.
    if (this.active) this.active.resolve(false);
    return new Promise<boolean>((resolve) => {
      this.active = { ...options, resolve };
    });
  }

  confirm(): void {
    const current = this.active;
    if (!current) return;
    this.active = null;
    current.resolve(true);
  }

  cancel(): void {
    const current = this.active;
    if (!current) return;
    this.active = null;
    current.resolve(false);
  }
}

export const confirmDialog = new ConfirmStore();
