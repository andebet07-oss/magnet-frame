// Filter the library by kind of event (the tag a ready-made frame gives its template).
export default function TagFilter({ items, value, onChange }) {
  const tags = [...new Set(items.flatMap((i) => i.tags))];
  if (!tags.length) return null;
  const chip = (label, tag) => (
    <button
      key={label}
      type="button"
      aria-pressed={value === tag}
      onClick={() => onChange(tag)}
      className={`rounded-full px-3 h-8 text-sm ${value === tag ? 'bg-accent-600 text-white' : 'bg-ink-800 text-ink-200 hover:bg-ink-700'}`}
    >
      {label}
    </button>
  );
  return (
    <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="סינון לפי סוג אירוע">
      {chip('הכול', null)}
      {tags.map((t) => chip(t, t))}
    </div>
  );
}
