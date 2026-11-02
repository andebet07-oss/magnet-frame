// Ready-made frames by kind of event, designed for this app. Each design is built from ordinary
// layers (photo area, text, icons, shapes), so everything in it can be edited. Positions are worked
// out from the magnet's size, so every design works landscape, portrait and in every size.
import { border, emoji, half, icon, photoArea, rect, textStack } from './layoutKit';

export const STARTER_CATEGORIES = [
  { id: 'wedding', label: 'חתונה' },
  { id: 'henna', label: 'חינה' },
  { id: 'mitzvah', label: 'בר/בת מצווה' },
  { id: 'brit', label: 'ברית/ה' },
  { id: 'birthday', label: 'יום הולדת' },
  { id: 'general', label: 'כללי' },
];

/** 1 on the regular magnet (75 mm short side); decorations and text grow with larger magnets. */
const scaleOf = (size) => Math.min(size.widthMm, size.heightMm) / 75;

/** Photo window on top, a band of `band` × height at the bottom for the text. */
function topWindow(size, { margin, band, radius = 0 }) {
  const { widthMm: W, heightMm: H } = size;
  const s = scaleOf(size);
  const m = half(margin * s);
  const bandMm = half(H * band);
  return { m, bandMm, photo: photoArea({ x: m, y: m, width: W - 2 * m, height: H - m - bandMm, radius: radius * s }) };
}

/** Text lines centred in the bottom band, kept `inset` mm (at least the safe margin) from the edges. */
function bandText(size, bandMm, lines, { maxMm = 11, inset = 0 } = {}) {
  const { widthMm: W, heightMm: H, safeMm } = size;
  const edge = Math.max(safeMm, inset);
  return textStack({ top: H - bandMm + 0.5, bottom: H - edge, x: edge, width: W - 2 * edge, maxMm: maxMm * scaleOf(size), lines });
}

/** Centre of the band, `fromEdge` mm in from the left or right side. */
function bandSide(size, bandMm, fromEdge, side) {
  const { widthMm: W, heightMm: H } = size;
  const x = fromEdge * scaleOf(size);
  return { cx: side === 'left' ? x : W - x, cy: H - bandMm / 2 };
}

// Handwriting fonts reach far below the line, so their names get more room above the date.
const HANDWRITING = new Set(['Gveret Levin']);
const names = (value, font, color, weight = 400) => ({ name: 'שמות', value, font, color, weight, rel: 1, lineHeight: HANDWRITING.has(font) ? 1.4 : 1.15 });
const small = (name, value, font, color, rel = 0.4, weight = 400) => ({ name, value, font, color, weight, rel });

export const STARTERS = [
  // ── Wedding ──
  {
    id: 'wedding-classic',
    label: 'קלאסי',
    category: 'wedding',
    background: '#FFFFFF',
    build(size) {
      const { photo, bandMm } = topWindow(size, { margin: 4, band: 0.22 });
      return [
        photo,
        ...bandText(size, bandMm, [
          names('נועה ♥ איתי', 'Frank Ruhl Libre', '#111111', 500),
          small('תאריך', '24.12.2026', 'Frank Ruhl Libre', '#6B6B6B', 0.42),
        ], { maxMm: 9 }),
      ];
    },
  },
  {
    id: 'wedding-rings',
    label: 'טבעות זהב',
    category: 'wedding',
    background: '#FFFFFF',
    build(size) {
      const s = scaleOf(size);
      const { photo, bandMm } = topWindow(size, { margin: 6, band: 0.22, radius: 1.5 });
      return [
        border(size, { inset: 2.5 * s, color: '#C9A24A', widthMm: 0.3, dashMm: 1.2, radius: 2.5 * s }),
        photo,
        ...bandText(size, bandMm, [
          names('עדן ⚭ אביב', 'Gveret Levin', '#1F2A44'),
          small('תאריך', '12.06.2026', 'Bellefair', '#9A7B2F', 0.42),
        ], { inset: 4.5 * s, maxMm: 9 }),
      ];
    },
  },
  {
    id: 'wedding-navy',
    label: 'ערב כחול',
    category: 'wedding',
    background: '#1F2A44',
    build(size) {
      const s = scaleOf(size);
      const { photo, bandMm } = topWindow(size, { margin: 4.5, band: 0.22 });
      return [
        border(size, { inset: 2 * s, color: '#C9A24A', widthMm: 0.3 }),
        photo,
        ...bandText(size, bandMm, [
          names('נועה ✦ איתי', 'Bellefair', '#FFFFFF'),
          small('תאריך', '24.12.2026', 'Heebo', '#C9A24A', 0.4, 300),
        ], { inset: 3.5 * s, maxMm: 9 }),
      ];
    },
  },
  {
    id: 'wedding-blush',
    label: 'ורוד עדין',
    category: 'wedding',
    background: '#F6E1E1',
    build(size) {
      const s = scaleOf(size);
      const { photo, bandMm } = topWindow(size, { margin: 4, band: 0.23, radius: 3 });
      return [
        photo,
        ...bandText(size, bandMm, [
          names('מיה ♥ דניאל', 'Gveret Levin', '#8B1A2B'),
          small('תאריך', '03.09.2026', 'Assistant', '#8B1A2B', 0.4),
        ], { maxMm: 9 }),
        icon('heart-line', { ...bandSide(size, bandMm, 11, 'left'), side: 6 * s, color: '#C9566A', rotation: -14 }),
        icon('heart-line', { ...bandSide(size, bandMm, 11, 'right'), side: 6 * s, color: '#C9566A', rotation: 14 }),
      ];
    },
  },

  // ── Henna ──
  {
    id: 'henna-bordeaux',
    label: 'בורדו וזהב',
    category: 'henna',
    background: '#6E1423',
    build(size) {
      const s = scaleOf(size);
      const { photo, bandMm } = topWindow(size, { margin: 5, band: 0.27 });
      return [
        border(size, { inset: 2.2 * s, color: '#D4AF37', widthMm: 0.35, dashMm: 1 }),
        photo,
        ...bandText(size, bandMm, [
          small('כותרת', 'החינה של', 'Heebo', '#E9CF8F', 0.4, 300),
          names('חן ♥ עומר', 'Suez One', '#E9CF8F'),
          small('תאריך', '15.08.2026', 'Heebo', '#E9CF8F', 0.35, 300),
        ], { inset: 4 * s, maxMm: 8.5 }),
        icon('star-four', { ...bandSide(size, bandMm, 12, 'left'), side: 4.5 * s, color: '#D4AF37' }),
        icon('star-four', { ...bandSide(size, bandMm, 12, 'right'), side: 4.5 * s, color: '#D4AF37' }),
      ];
    },
  },
  {
    id: 'henna-terracotta',
    label: 'טרקוטה',
    category: 'henna',
    background: '#B5532F',
    build(size) {
      const s = scaleOf(size);
      const { photo, bandMm } = topWindow(size, { margin: 4.5, band: 0.24, radius: 6 });
      return [
        photo,
        ...bandText(size, bandMm, [
          names('שירן ✧ אלון', 'Karantina', '#FFF1E0', 700),
          small('תאריך', 'חינה · 10.07.2026', 'Heebo', '#FFF1E0', 0.36),
        ], { maxMm: 10 }),
        icon('lotus', { ...bandSide(size, bandMm, 11, 'left'), side: 7 * s, color: '#FFF1E0' }),
        icon('lotus', { ...bandSide(size, bandMm, 11, 'right'), side: 7 * s, color: '#FFF1E0' }),
      ];
    },
  },

  // ── Bar / bat mitzvah ──
  {
    id: 'mitzvah-bar',
    label: 'בר מצווה',
    category: 'mitzvah',
    background: '#14213D',
    build(size) {
      const s = scaleOf(size);
      const { photo, bandMm } = topWindow(size, { margin: 4.5, band: 0.28 });
      return [
        photo,
        ...bandText(size, bandMm, [
          small('כותרת', 'בר המצווה של', 'Heebo', '#FFFFFF', 0.4, 300),
          names('יונתן', 'Suez One', '#E0B95B'),
          small('תאריך', '20.03.2026', 'Heebo', '#FFFFFF', 0.34, 300),
        ], { maxMm: 9 }),
        icon('star-of-david', { ...bandSide(size, bandMm, 13, 'left'), side: 7 * s, color: '#E0B95B' }),
        icon('star-of-david', { ...bandSide(size, bandMm, 13, 'right'), side: 7 * s, color: '#E0B95B' }),
      ];
    },
  },
  {
    id: 'mitzvah-bat',
    label: 'בת מצווה נוצצת',
    category: 'mitzvah',
    background: '#F4ECFF',
    build(size) {
      const s = scaleOf(size);
      const { photo, bandMm } = topWindow(size, { margin: 4.5, band: 0.28, radius: 3 });
      return [
        photo,
        ...bandText(size, bandMm, [
          small('כותרת', 'בת המצווה של', 'Assistant', '#6B21A8', 0.4),
          names('מאיה', 'Playpen Sans Hebrew', '#7E22CE', 700),
          small('תאריך', '07.05.2026', 'Assistant', '#6B21A8', 0.34),
        ], { maxMm: 9 }),
        emoji('sparkles', { ...bandSide(size, bandMm, 13, 'left'), side: 8 * s }),
        emoji('sparkles', { ...bandSide(size, bandMm, 13, 'right'), side: 8 * s }),
      ];
    },
  },

  // ── Brit / brita ──
  {
    id: 'brit-blue',
    label: 'ברית תכלת',
    category: 'brit',
    background: '#DCEBF8',
    build(size) {
      const s = scaleOf(size);
      const { photo, bandMm } = topWindow(size, { margin: 4.5, band: 0.27, radius: 3 });
      return [
        photo,
        ...bandText(size, bandMm, [
          small('כותרת', 'ברוך הבא', 'Fredoka', '#2B5D8C', 0.42, 500),
          names('אריאל', 'Fredoka', '#2B5D8C', 700),
          small('תאריך', '01.02.2026', 'Fredoka', '#2B5D8C', 0.34),
        ], { maxMm: 9 }),
        emoji('teddy-bear', { ...bandSide(size, bandMm, 12, 'left'), side: 10 * s }),
        icon('star-four', { ...bandSide(size, bandMm, 10, 'right'), side: 4 * s, color: '#7FB8E6' }),
        icon('star-four', { cx: size.widthMm - 16 * s, cy: size.heightMm - bandMm / 2 - 3 * s, side: 2.6 * s, color: '#7FB8E6' }),
      ];
    },
  },
  {
    id: 'brit-pink',
    label: 'בריתה ורודה',
    category: 'brit',
    background: '#FCE4EC',
    build(size) {
      const s = scaleOf(size);
      const { photo, bandMm } = topWindow(size, { margin: 4.5, band: 0.27, radius: 3 });
      return [
        photo,
        ...bandText(size, bandMm, [
          small('כותרת', 'ברוכה הבאה', 'Fredoka', '#C2185B', 0.42, 500),
          names('נעמה', 'Fredoka', '#C2185B', 700),
          small('תאריך', '14.04.2026', 'Fredoka', '#C2185B', 0.34),
        ], { maxMm: 9 }),
        emoji('ribbon', { ...bandSide(size, bandMm, 12, 'left'), side: 9 * s }),
        icon('butterfly', { ...bandSide(size, bandMm, 12, 'right'), side: 7 * s, color: '#E07AA0', rotation: 12 }),
      ];
    },
  },

  // ── Birthday ──
  {
    id: 'birthday-balloons',
    label: 'בלונים',
    category: 'birthday',
    background: '#FFFFFF',
    build(size) {
      const s = scaleOf(size);
      const { photo, bandMm } = topWindow(size, { margin: 4, band: 0.26 });
      return [
        photo,
        ...bandText(size, bandMm, [
          small('כותרת', 'מזל טוב', 'Rubik', '#E0282E', 0.42, 500),
          names('דניאל · 30', 'Rubik', '#111111', 700),
          small('תאריך', '05.05.2026', 'Rubik', '#6B6B6B', 0.32),
        ], { maxMm: 8 }),
        emoji('balloon', { ...bandSide(size, bandMm, 8, 'left'), side: 10 * s, rotation: -10 }),
        emoji('party-popper', { ...bandSide(size, bandMm, 8, 'right'), side: 8 * s }),
      ];
    },
  },
  {
    id: 'birthday-gold',
    label: 'שחור זהב',
    category: 'birthday',
    background: '#111111',
    build(size) {
      const s = scaleOf(size);
      const { photo, bandMm } = topWindow(size, { margin: 4.5, band: 0.26 });
      return [
        border(size, { inset: 2 * s, color: '#D4AF37', widthMm: 0.3, dashMm: 0.8 }),
        photo,
        ...bandText(size, bandMm, [
          small('כותרת', 'יום הולדת שמח', 'Bellefair', '#D4AF37', 0.45),
          names('שירה', 'Bona Nova', '#D4AF37', 700),
          small('תאריך', '18.11.2026', 'Heebo', '#BBBBBB', 0.32, 300),
        ], { inset: 3.5 * s, maxMm: 9 }),
        icon('sparkle-fill', { ...bandSide(size, bandMm, 12, 'left'), side: 5 * s, color: '#D4AF37' }),
        icon('sparkle-fill', { ...bandSide(size, bandMm, 12, 'right'), side: 5 * s, color: '#D4AF37' }),
      ];
    },
  },

  // ── General ──
  {
    id: 'general-minimal',
    label: 'נקי',
    category: 'general',
    background: '#FFFFFF',
    build(size) {
      const { photo, bandMm } = topWindow(size, { margin: 3, band: 0.13 });
      return [photo, ...bandText(size, bandMm, [names('נועה ♥ איתי · 24.12.26', 'Heebo', '#222222')], { maxMm: 5 })];
    },
  },
  {
    id: 'general-olive',
    label: 'ירוק זית',
    category: 'general',
    background: '#6B7F4E',
    build(size) {
      const s = scaleOf(size);
      const { photo, bandMm } = topWindow(size, { margin: 5.5, band: 0.22 });
      const gap = 1.3 * s;
      return [
        rect({ name: 'קו סביב התמונה', x: photo.x - gap, y: photo.y - gap, width: photo.width + 2 * gap, height: photo.height + 2 * gap, stroke: '#FFFFFF', strokeWidthMm: 0.35 }),
        photo,
        ...bandText(size, bandMm, [
          names('נועה ♥ איתי', 'Gveret Levin', '#FFFFFF'),
          small('תאריך', '24.12.2026', 'Heebo', '#E7ECDD', 0.4, 300),
        ], { maxMm: 9 }),
      ];
    },
  },
  {
    id: 'general-side',
    label: 'שמות בצד',
    category: 'general',
    background: '#FFFFFF',
    build(size) {
      const { widthMm: W, heightMm: H, safeMm } = size;
      const s = scaleOf(size);
      const lines = (heart) => [
        names('נועה', 'Gveret Levin', '#1F2A44'),
        small('לב', heart, 'Gveret Levin', '#1F2A44', 0.6),
        { ...names('איתי', 'Gveret Levin', '#1F2A44'), name: 'שמות 2' },
        small('תאריך', '24.12.26', 'Gveret Levin', '#5B6475', 0.42),
      ];
      if (W <= H) {
        // Portrait: names under the photo instead.
        const { photo, bandMm } = topWindow(size, { margin: 4, band: 0.22 });
        return [
          photo,
          ...bandText(size, bandMm, [names('נועה ♥ איתי', 'Gveret Levin', '#1F2A44'), small('תאריך', '24.12.26', 'Gveret Levin', '#5B6475', 0.42)], { maxMm: 10 }),
        ];
      }
      const m = half(4 * s);
      const photoWidth = half(W * 0.66) - m;
      const panelX = m + photoWidth + 2 * s;
      return [
        photoArea({ x: m, y: m, width: photoWidth, height: H - 2 * m }),
        ...textStack({ top: m, bottom: H - m, x: panelX, width: W - safeMm - panelX, maxMm: 10 * s, lines: lines('♥') }),
      ];
    },
  },
];
