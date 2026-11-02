import { IconButton } from '@/ui/Button';
import Icon from '@/ui/icons';

const dateFormat = new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short' });

function sizeLabel({ widthMm, heightMm }) {
  return `${widthMm / 10}×${heightMm / 10}`;
}

export default function TemplateCard({ item, onOpen, onRename, onDelete }) {
  const { name, updatedAt, size, tags, thumbnailUrl } = item;
  const edited = updatedAt ? dateFormat.format(new Date(updatedAt)) : '';
  return (
    <article className="group flex flex-col rounded-xl border border-ink-700 bg-ink-900 overflow-hidden hover:border-ink-600 transition-colors">
      <button type="button" onClick={onOpen} className="block bg-ink-850 p-4" aria-label={`פתיחת ${name}`}>
        <div className="flex h-48 items-center justify-center">
          <div
            className="max-h-full max-w-full bg-white shadow-md"
            // Inline style: the frame's own proportions (landscape, portrait or square).
            style={{ aspectRatio: `${size.widthMm} / ${size.heightMm}`, [size.widthMm >= size.heightMm ? 'width' : 'height']: '100%' }}
          >
            {thumbnailUrl && <img src={thumbnailUrl} alt="" className="size-full object-contain" />}
          </div>
        </div>
      </button>
      <div className="flex items-start gap-2 p-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{name}</h3>
          <p className="text-xs text-ink-400 mt-0.5">
            {tags?.length > 0 && <span className="text-accent-400">{tags.join(' · ')} · </span>}
            נערך {edited}
          </p>
        </div>
        <span className="shrink-0 rounded bg-ink-800 px-1.5 py-0.5 text-xs text-ink-200 tabular-nums" dir="ltr" title="גודל בס״מ">
          {sizeLabel(size)}
        </span>
      </div>
      <div className="flex items-center gap-1 px-2 pb-2">
        <IconButton label="שינוי שם" onClick={onRename}>
          <Icon name="pencil" />
        </IconButton>
        <IconButton label="מחיקה" onClick={onDelete} className="hover:text-danger-500">
          <Icon name="trash" />
        </IconButton>
      </div>
    </article>
  );
}
