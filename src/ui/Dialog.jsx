// Modal dialogs on the native <dialog> element (focus trap, Escape and backdrop for free).
import { useEffect, useRef, useState } from 'react';
import Button from './Button';

export default function Dialog({ title, onClose, wide = false, children }) {
  const ref = useRef(null);
  // Unmounting removes the dialog from the top layer, so no explicit close() is needed.
  useEffect(() => {
    if (!ref.current.open) ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className={`m-auto ${wide ? 'w-[min(94vw,640px)]' : 'w-[min(92vw,420px)]'} max-h-[92vh] overflow-y-auto rounded-xl border border-ink-700 bg-ink-900 p-5 text-ink-50 shadow-2xl backdrop:bg-black/60`}
    >
      <h2 className="text-base font-semibold mb-4">{title}</h2>
      {children}
    </dialog>
  );
}

/** Asks for a name (new template, rename). */
export function NameDialog({ title, initial = '', confirmLabel, onSubmit, onClose }) {
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const trimmed = name.trim();

  async function submit(e) {
    e.preventDefault();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title={title} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input
          autoFocus
          dir="auto"
          className="h-10 rounded-md bg-ink-850 border border-ink-700 px-3 text-sm focus:outline-none focus:border-accent-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>
            ביטול
          </Button>
          <Button variant="primary" type="submit" disabled={!trimmed || busy}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title={title} onClose={onClose}>
      <p className="text-sm text-ink-200 mb-5">{message}</p>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>
          ביטול
        </Button>
        <Button variant="danger" onClick={confirm} disabled={busy} autoFocus>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
