// Canvas text only renders with a font that is already loaded, so every render path
// (editor, thumbnail, export) awaits the faces it needs first.

// Hebrew + Latin + digits, so both unicode-range subsets of a family are fetched.
const PROBE_TEXT = 'אבג abc 123';

function fontQuery({ family, weight }) {
  return `${weight} 40px "${family}"`;
}

export function fontSpecsOf(doc) {
  const seen = new Map();
  for (const el of doc.elements) {
    if (el.type !== 'text') continue;
    const spec = { family: el.font, weight: el.weight ?? 400 };
    seen.set(fontQuery(spec), spec);
  }
  return [...seen.values()];
}

export function isFontLoaded(spec) {
  return document.fonts.check(fontQuery(spec), PROBE_TEXT);
}

export async function ensureFonts(specs) {
  await Promise.all(specs.map((spec) => document.fonts.load(fontQuery(spec), PROBE_TEXT)));
}
