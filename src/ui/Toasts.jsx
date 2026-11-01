import { useToasts } from './toast';

export default function Toasts() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto max-w-md rounded-lg px-4 py-2.5 text-sm shadow-lg border ${
            t.tone === 'error' ? 'bg-ink-800 border-danger-500/60 text-ink-50' : 'bg-ink-800 border-ink-600 text-ink-50'
          }`}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
