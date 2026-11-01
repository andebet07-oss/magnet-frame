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
