import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FONTS, nearestWeight } from '@/fonts/registry';

const css = readFileSync(new URL('../src/fonts/fonts.css', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

describe('font registry', () => {
  it('has fonts.css in sync with the registry (run `npm run fonts` after editing it)', () => {
    for (const f of FONTS) {
      for (const w of f.weights) for (const s of f.subsets) expect(css).toContain(`@fontsource/${f.pkg}/${s}-${w}.css`);
    }
  });

  it('lists only packages that are installed dependencies', () => {
    for (const f of FONTS) expect(pkg.dependencies).toHaveProperty(`@fontsource/${f.pkg}`);
  });

  it('includes the requested Hebrew families', () => {
    const families = FONTS.map((f) => f.family);
    for (const name of ['Heebo', 'Assistant', 'Rubik', 'Frank Ruhl Libre', 'David Libre', 'Gveret Levin', 'Playpen Sans Hebrew']) {
      expect(families).toContain(name);
    }
  });

  it('picks the closest available weight', () => {
    expect(nearestWeight('Gveret Levin', 700)).toBe(400);
    expect(nearestWeight('David Libre', 600)).toBe(500);
    expect(nearestWeight('Heebo', 700)).toBe(700);
  });
});

describe('symbols inside text', async () => {
  const { insertSymbol, normalizeSymbols, TEXT_SYMBOLS, withSymbols } = await import('@/fonts/textSymbols');
  const css = readFileSync(new URL('../src/fonts/symbols.css', import.meta.url), 'utf8');

  it('has every symbol in the font (run scripts/build-symbol-font.py after editing textSymbols.json)', () => {
    for (const s of TEXT_SYMBOLS) {
      for (const ch of s.chars) expect(css, `${s.label} ${ch}`).toContain(`U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`);
    }
  });

  it('offers hearts, rings and sparkles with Hebrew names', () => {
    const labels = TEXT_SYMBOLS.map((s) => s.label);
    expect(labels).toEqual(expect.arrayContaining(['לב', 'לב בקו', 'שני לבבות', 'טבעות', 'טבעת יהלום']));
  });

  it('puts the symbols font first, so it wins only for its own characters', () => {
    expect(withSymbols('Frank Ruhl Libre')).toBe('Magnet Symbols, Frank Ruhl Libre');
  });

  it('inserts a symbol between names with single spaces', () => {
    expect(insertSymbol('עדןאביב', 3, 3, '♥')).toEqual({ text: 'עדן ♥ אביב', cursor: 6 });
    expect(insertSymbol('עדן ', 4, 4, '♥')).toEqual({ text: 'עדן ♥ ', cursor: 6 });
    expect(insertSymbol('', 0, 0, '♥')).toEqual({ text: '♥', cursor: 1 });
    expect(insertSymbol('עדן X אביב', 4, 5, '♥')).toEqual({ text: 'עדן ♥ אביב', cursor: 5 });
  });

  it('drops the emoji selector after a heart so it stays in the text colour', () => {
    expect(normalizeSymbols('עדן ❤️ אביב')).toBe('עדן ❤ אביב');
    expect(normalizeSymbols('ירוס 🖤 יעקב')).toBe('ירוס 🖤 יעקב');
    expect(normalizeSymbols('☺️')).toBe('☺️'); // other emoji keep their selector
  });
});
