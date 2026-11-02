// Buttons that put a heart, rings or a sparkle into the text at the cursor: "עדן ♥ אביב".
import { FieldLabel } from '@/ui/fields';
import { insertSymbol, SYMBOL_FONT, TEXT_SYMBOLS } from '@/fonts/textSymbols';

export default function SymbolBar({ textRef, value, onInsert }) {
  function add(symbol) {
    const area = textRef.current;
    const start = area?.selectionStart ?? value.length;
    const end = area?.selectionEnd ?? value.length;
    const { text, cursor } = insertSymbol(value, start, end, symbol);
    onInsert(text);
    // Put the cursor back after the symbol once React has written the new text.
    requestAnimationFrame(() => {
      area?.focus();
      area?.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <FieldLabel>סמלים בתוך הטקסט</FieldLabel>
      <div className="flex flex-wrap gap-1">
        {TEXT_SYMBOLS.map((s) => (
          <button
            key={s.insert}
            type="button"
            title={s.label}
            aria-label={s.label}
            // Keep the textarea's cursor where it was.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => add(s.insert)}
            // Inline style: draw the button with the same symbols font the canvas uses.
            style={{ fontFamily: `"${SYMBOL_FONT}"` }}
            className="size-8 rounded-md border border-ink-700 bg-ink-850 text-lg leading-none text-ink-50 hover:border-accent-500"
          >
            {s.insert}
          </button>
        ))}
      </div>
    </div>
  );
}
