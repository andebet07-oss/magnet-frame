// New template: name, standard magnet size, orientation and a ready-made layout (with live previews).
import { useEffect, useState } from 'react';
import Button from '@/ui/Button';
import Dialog from '@/ui/Dialog';
import { FieldLabel, Segmented } from '@/ui/fields';
import { createPresetDoc, DEFAULT_PRESET, LAYOUTS, ORIENTATIONS, SIZE_PRESETS } from '@/model/presets';
import { renderFrameToCanvas } from '@/render/renderToCanvas';

const NO_ASSETS = { ensure: async () => {}, get: () => null };
const PREVIEW_PX = 240; // longest side of a preview image

/** Previews of every layout at the chosen size, drawn by the same renderer as the editor. */
function useLayoutPreviews(sizeId, orientation) {
  const [previews, setPreviews] = useState({});
  useEffect(() => {
    let alive = true;
    (async () => {
      const next = {};
      for (const layout of LAYOUTS) {
        const doc = createPresetDoc('', { sizeId, orientation, layoutId: layout.id });
        const pxPerMm = PREVIEW_PX / Math.max(doc.size.widthMm, doc.size.heightMm);
        const canvas = await renderFrameToCanvas(doc, { assets: NO_ASSETS, pxPerMm, photo: 'placeholder' });
        next[layout.id] = canvas.toDataURL('image/png');
      }
      if (alive) setPreviews(next);
    })().catch((err) => console.warn('[new template] previews failed:', err));
    return () => {
      alive = false;
    };
  }, [sizeId, orientation]);
  return previews;
}

function Choice({ selected, onClick, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`rounded-lg border p-2.5 text-start transition-colors ${
        selected ? 'border-accent-500 bg-accent-600/15' : 'border-ink-700 bg-ink-850 hover:border-ink-600'
      }`}
    >
      {children}
    </button>
  );
}

export default function NewTemplateDialog({ onSubmit, onClose }) {
  const [name, setName] = useState('תבנית חדשה');
  const [preset, setPreset] = useState(DEFAULT_PRESET);
  const [busy, setBusy] = useState(false);
  const previews = useLayoutPreviews(preset.sizeId, preset.orientation);
  const square = preset.sizeId === 'square';
  const set = (patch) => setPreset((p) => ({ ...p, ...patch }));

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await onSubmit(name.trim(), preset);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title="תבנית חדשה" onClose={onClose} wide>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <FieldLabel>שם התבנית</FieldLabel>
          <input
            autoFocus
            dir="auto"
            className="h-10 rounded-md bg-ink-850 border border-ink-700 px-3 text-sm focus:outline-none focus:border-accent-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => e.target.select()}
          />
        </label>

        <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="גודל המגנט">
          <FieldLabel>גודל המגנט (ס״מ)</FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            {SIZE_PRESETS.map((s) => (
              <Choice key={s.id} selected={preset.sizeId === s.id} onClick={() => set({ sizeId: s.id })}>
                <span className="block text-sm font-semibold">{s.label}</span>
                <span className="block text-xs text-ink-400">{s.note}</span>
              </Choice>
            ))}
          </div>
        </div>

        {!square && (
          <Segmented
            label="כיוון"
            value={preset.orientation}
            onChange={(orientation) => set({ orientation })}
            options={ORIENTATIONS.map((o) => ({ value: o.id, label: o.label }))}
          />
        )}

        <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="עיצוב">
          <FieldLabel>עיצוב התחלתי</FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            {LAYOUTS.map((l) => (
              <Choice key={l.id} selected={preset.layoutId === l.id} onClick={() => set({ layoutId: l.id })}>
                <span className="mb-2 flex h-28 items-center justify-center rounded bg-ink-950/60 p-2">
                  {previews[l.id] && <img src={previews[l.id]} alt="" className="max-h-full max-w-full shadow-md" />}
                </span>
                <span className="block text-sm font-semibold">{l.label}</span>
                <span className="block text-xs text-ink-400 leading-snug">{l.note}</span>
              </Choice>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>
            ביטול
          </Button>
          <Button variant="primary" type="submit" disabled={!name.trim() || busy}>
            יצירה
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
