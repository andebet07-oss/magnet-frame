// Font picker: every option is drawn in its own font with a sample line, grouped by style.
import { useEffect, useRef, useState } from 'react';
import Icon from '@/ui/icons';
import { FieldLabel } from '@/ui/fields';
import { CATEGORIES, FONTS, getFont, sampleText } from '@/fonts/registry';

export default function FontPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const font = getFont(value);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1">
      <FieldLabel>גופן</FieldLabel>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="h-9 flex items-center gap-2 rounded-md border border-ink-700 bg-ink-850 px-2 text-start hover:border-ink-600"
      >
        {/* Inline style: the family is data, not a fixed class. */}
        <span className="flex-1 truncate text-base" style={{ fontFamily: `"${value}"` }}>
          {font ? sampleText(font) : value}
        </span>
        <span className="text-xs text-ink-400" dir="ltr">
          {value}
        </span>
        <Icon name="chevronDown" className="size-4 text-ink-400" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 inset-x-0 z-30 max-h-[60vh] overflow-y-auto rounded-lg border border-ink-600 bg-ink-850 shadow-2xl py-1">
          {CATEGORIES.map((cat) => (
            <div key={cat.id}>
              <p className="px-3 pt-2 pb-1 text-xs text-accent-400">{cat.label}</p>
              {FONTS.filter((f) => f.category === cat.id).map((f) => (
                <button
                  key={f.family}
                  type="button"
                  onClick={() => {
                    onChange(f.family);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-start hover:bg-ink-700 ${f.family === value ? 'bg-accent-600/20' : ''}`}
                >
                  <span className="block text-lg leading-snug truncate" style={{ fontFamily: `"${f.family}"` }}>
                    {sampleText(f)}
                  </span>
                  <span className="flex gap-2 text-xs text-ink-400">
                    <span dir="ltr">{f.family}</span>
                    {!f.niqqud && f.category !== 'latin' && <span>· ללא ניקוד</span>}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
