// Background properties, and the template summary shown when nothing is selected.
import { useRef } from 'react';
import Button from '@/ui/Button';
import { ColorField } from '@/ui/fields';
import { notify } from '@/ui/toast';
import { formatNumber } from '@/model/units';
import { useEditor } from '@/store/editorStore';
import { useEditorContext } from '../EditorContext';
import { IMAGE_ACCEPT, imageUploadMessage, importImage } from '../imageImport';
import { Section } from './ElementProps';

export function BackgroundProps({ el }) {
  const ctx = useEditorContext();
  const fileRef = useRef(null);
  const update = (patch, field) => useEditor.getState().updateElement(el.id, patch, `${el.id}:${field}`);

  async function onPicked(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { path } = await importImage(ctx, file);
      update({ image: path }, 'image');
    } catch (err) {
      console.error('[background] image import failed:', err);
      notify(imageUploadMessage(err));
    }
  }

  return (
    <Section title="רקע">
      <p className="text-xs text-ink-400 leading-relaxed">הרקע ממלא את כל המסגרת, כולל שוליי החיתוך.</p>
      <ColorField label="צבע" value={el.fill} allowNone onChange={(fill) => update({ fill }, 'fill')} />
      <div className="flex flex-col gap-2">
        <Button onClick={() => fileRef.current.click()}>{el.image ? 'החלפת תמונת רקע' : 'תמונת רקע'}</Button>
        {el.image && (
          <Button variant="ghost" onClick={() => update({ image: null }, 'image')}>
            הסרת תמונת הרקע
          </Button>
        )}
        <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={onPicked} />
      </div>
    </Section>
  );
}

const SHORTCUTS = [
  ['חצים', 'הזזה ב-0.1 מ״מ'],
  ['Shift + חצים', 'הזזה ב-1 מ״מ'],
  ['Delete', 'מחיקת האלמנט'],
  ['Ctrl/⌘ + Z', 'ביטול'],
  ['Ctrl/⌘ + Shift + Z', 'חזרה'],
  ['Ctrl/⌘ + S', 'שמירה מיידית'],
  ['Esc', 'ביטול הבחירה'],
];

export function TemplateInfo({ doc }) {
  const { widthMm, heightMm, bleedMm, safeMm } = doc.size;
  const mm = (n) => `${formatNumber(n)} מ״מ`;
  return (
    <>
      <Section title="תבנית">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-ink-400">גודל</dt>
          <dd className="tabular-nums">
            {formatNumber(widthMm)} × {formatNumber(heightMm)} מ״מ
          </dd>
          <dt className="text-ink-400">שולי חיתוך</dt>
          <dd className="tabular-nums">{mm(bleedMm)}</dd>
          <dt className="text-ink-400">אזור בטוח</dt>
          <dd className="tabular-nums">{mm(safeMm)} מקו החיתוך</dd>
        </dl>
        <p className="text-xs text-ink-400 leading-relaxed">
          <span className="text-guide-cut">קו אדום</span>: קו החיתוך. <span className="text-guide-safe">קו כחול</span>: אזור בטוח לטקסט. הקווים לא
          מופיעים בקובץ הסופי.
        </p>
      </Section>
      <Section title="קיצורי מקלדת">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
          {SHORTCUTS.map(([key, action]) => (
            <div key={key} className="contents">
              <dt className="text-ink-200" dir="ltr">
                {key}
              </dt>
              <dd className="text-ink-400">{action}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <p className="px-4 py-4 text-xs text-ink-400">בחר אלמנט בקנבס או ברשימת השכבות כדי לערוך אותו.</p>
    </>
  );
}
