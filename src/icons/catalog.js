// Icon catalogue: what the icon picker offers, grouped by kind of celebration, with Hebrew names.
//
// - 'symbol' icons are single-colour vectors from Google Material Symbols (Rounded). They can take
//   any colour, e.g. a black, red, soft red or dark red heart.
// - 'emoji' icons are colourful illustrations from Google Noto Emoji.
// Both are Apache License 2.0 (public/icons/LICENSE.md). After editing these lists run
// `npm run icons` to fetch the artwork into src/icons/symbolPaths.js and public/icons/noto/.

export const ICON_CATEGORIES = [
  { id: 'hearts', label: 'לבבות' },
  { id: 'love', label: 'חתונה ואהבה' },
  { id: 'party', label: 'חגיגה' },
  { id: 'birthday', label: 'יום הולדת' },
  { id: 'baby', label: 'לידה וברית' },
  { id: 'mitzvah', label: 'בר ובת מצווה' },
  { id: 'nature', label: 'פרחים וטבע' },
  { id: 'fun', label: 'כיף' },
];

/** Quick colours for single-colour icons. */
export const ICON_COLORS = [
  { label: 'שחור', value: '#111111' },
  { label: 'אדום', value: '#E0282E' },
  { label: 'אדום עדין', value: '#F07C82' },
  { label: 'אדום כהה', value: '#8B1A2B' },
  { label: 'ורוד', value: '#F4A6B8' },
  { label: 'זהב', value: '#C9A24A' },
  { label: 'כחול לילה', value: '#1F2A44' },
  { label: 'תכלת', value: '#7FB8E6' },
  { label: 'ירוק זית', value: '#6B7F4E' },
  { label: 'לבן', value: '#FFFFFF' },
];

export const DEFAULT_ICON_COLOR = '#E0282E';

// `file` is the Material Symbols Rounded file: <folder>/<name>.svg in google/material-design-icons.
const symbol = (id, label, file, categories) => ({ kind: 'symbol', id, label, file, categories });

export const SYMBOLS = [
  symbol('heart', 'לב', 'favorite/favorite_fill1_24px', ['hearts', 'love']),
  symbol('heart-line-thin', 'לב בקו דק', 'favorite/favorite_wght100_24px', ['hearts', 'love']),
  symbol('heart-line', 'לב בקו', 'favorite/favorite_24px', ['hearts']),
  symbol('heart-line-bold', 'לב בקו עבה', 'favorite/favorite_wght700_24px', ['hearts']),
  symbol('hand-heart', 'יד עם לב', 'volunteer_activism/volunteer_activism_fill1_24px', ['hearts', 'love']),
  symbol('diamond', 'יהלום', 'diamond/diamond_fill1_24px', ['love']),
  symbol('flower', 'פרח', 'local_florist/local_florist_fill1_24px', ['love', 'nature']),
  symbol('flower-round', 'פרח עגול', 'filter_vintage/filter_vintage_fill1_24px', ['love', 'nature']),
  symbol('wine', 'כוס יין', 'wine_bar/wine_bar_fill1_24px', ['love', 'mitzvah']),
  symbol('cocktail', 'קוקטייל', 'local_bar/local_bar_fill1_24px', ['party']),
  symbol('confetti', 'קונפטי', 'celebration/celebration_fill1_24px', ['party', 'birthday']),
  symbol('sparkles', 'נצנצים', 'auto_awesome/auto_awesome_fill1_24px', ['party', 'mitzvah', 'love']),
  symbol('star', 'כוכב', 'star/star_fill1_24px', ['party']),
  symbol('star-round', 'כוכב מעוגל', 'kid_star/kid_star_fill1_24px', ['party', 'baby']),
  symbol('music', 'תו', 'music_note/music_note_fill1_24px', ['party']),
  symbol('nightlife', 'מסיבה', 'nightlife/nightlife_fill1_24px', ['party']),
  symbol('crown', 'כתר', 'crown/crown_fill1_24px', ['mitzvah', 'party', 'birthday']),
  symbol('gift', 'מתנה', 'redeem/redeem_fill1_24px', ['birthday']),
  symbol('cake', 'עוגה', 'cake/cake_fill1_24px', ['birthday']),
  symbol('icecream', 'גלידה', 'icecream/icecream_fill1_24px', ['birthday', 'fun']),
  symbol('baby', 'תינוק', 'child_care/child_care_fill1_24px', ['baby']),
  symbol('stroller', 'עגלה', 'stroller/stroller_fill1_24px', ['baby']),
  symbol('crib', 'עריסה', 'crib/crib_fill1_24px', ['baby']),
  symbol('toys', 'צעצוע', 'toys/toys_fill1_24px', ['baby']),
  symbol('bird', 'ציפור', 'flutter_dash/flutter_dash_fill1_24px', ['baby', 'nature']),
  symbol('synagogue', 'בית כנסת', 'synagogue/synagogue_fill1_24px', ['mitzvah']),
  symbol('lotus', 'לוטוס', 'spa/spa_fill1_24px', ['nature']),
  symbol('leaf', 'עלה', 'eco/eco_fill1_24px', ['nature']),
  symbol('sun', 'שמש', 'sunny/sunny_fill1_24px', ['nature']),
  symbol('moon', 'ירח', 'bedtime/bedtime_fill1_24px', ['nature']),
  symbol('bee', 'דבורה', 'emoji_nature/emoji_nature_fill1_24px', ['nature', 'fun']),
  symbol('paw', 'כף רגל', 'pets/pets_fill1_24px', ['fun']),
];

// Hand-drawn here (the emoji versions sit on a purple tile). 100×100 box, centred at 50,50.
function hexagramPoints(radius, angles) {
  return angles.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return `${(50 + radius * Math.sin(rad)).toFixed(2)} ${(50 - radius * Math.cos(rad)).toFixed(2)}`;
  });
}
const triangle = (radius, angles) => `M${hexagramPoints(radius, angles).join(' L')} Z`;
const R = 48;
const LINE = 5.5;
export const CUSTOM_SYMBOLS = [
  {
    kind: 'symbol',
    id: 'star-of-david',
    label: 'מגן דוד',
    categories: ['mitzvah'],
    viewBox: [0, 0, 100, 100],
    path: `${triangle(R, [0, 120, 240])} ${triangle(R, [180, 300, 60])}`,
  },
  {
    kind: 'symbol',
    id: 'star-of-david-line',
    label: 'מגן דוד בקו',
    categories: ['mitzvah'],
    viewBox: [0, 0, 100, 100],
    // Each triangle is a ring: outer clockwise, inner counter-clockwise, so the middle stays open.
    path: [
      triangle(R, [0, 120, 240]),
      triangle(R - 2 * LINE, [0, 240, 120]),
      triangle(R, [180, 300, 60]),
      triangle(R - 2 * LINE, [180, 60, 300]),
    ].join(' '),
  },
];

const emoji = (id, label, categories) => ({ kind: 'emoji', id, label, categories });

// `id` is the Noto Emoji name in the Iconify "noto" set.
export const EMOJI = [
  emoji('red-heart', 'לב אדום', ['hearts', 'love']),
  emoji('black-heart', 'לב שחור', ['hearts']),
  emoji('white-heart', 'לב לבן', ['hearts', 'love']),
  emoji('pink-heart', 'לב ורוד', ['hearts', 'baby']),
  emoji('light-blue-heart', 'לב תכלת', ['hearts', 'baby']),
  emoji('two-hearts', 'שני לבבות', ['hearts', 'love']),
  emoji('sparkling-heart', 'לב נוצץ', ['hearts', 'love']),
  emoji('growing-heart', 'לב גדל', ['hearts']),
  emoji('beating-heart', 'לב פועם', ['hearts']),
  emoji('revolving-hearts', 'לבבות', ['hearts', 'love']),
  emoji('heart-with-arrow', 'לב עם חץ', ['hearts', 'love']),
  emoji('heart-with-ribbon', 'לב עם סרט', ['hearts', 'love']),
  emoji('heart-exclamation', 'לב קריאה', ['hearts']),
  emoji('heart-on-fire', 'לב בוער', ['hearts', 'fun']),
  emoji('love-letter', 'מכתב אהבה', ['hearts', 'love']),
  emoji('kiss-mark', 'נשיקה', ['hearts', 'love', 'fun']),
  emoji('ring', 'טבעת', ['love']),
  emoji('bouquet', 'זר פרחים', ['love', 'nature']),
  emoji('clinking-glasses', 'לחיים', ['love', 'party']),
  emoji('bottle-with-popping-cork', 'שמפניה', ['love', 'party']),
  emoji('dove', 'יונה', ['love']),
  emoji('rose', 'ורד', ['love', 'nature']),
  emoji('wedding', 'חתונה', ['love']),
  emoji('gem-stone', 'יהלום', ['love']),
  emoji('wine-glass', 'כוס יין', ['love', 'mitzvah']),
  emoji('party-popper', 'קונפטי', ['party', 'birthday']),
  emoji('confetti-ball', 'כדור קונפטי', ['party']),
  emoji('sparkles', 'נצנצים', ['party', 'mitzvah', 'love']),
  emoji('glowing-star', 'כוכב זוהר', ['party', 'mitzvah']),
  emoji('star', 'כוכב', ['party']),
  emoji('dizzy', 'כוכב מסתחרר', ['party']),
  emoji('mirror-ball', 'כדור דיסקו', ['party', 'fun']),
  emoji('musical-notes', 'תווים', ['party']),
  emoji('balloon', 'בלון', ['party', 'birthday']),
  emoji('cocktail-glass', 'קוקטייל', ['party']),
  emoji('tropical-drink', 'משקה', ['party', 'fun']),
  emoji('birthday-cake', 'עוגת יום הולדת', ['birthday']),
  emoji('cupcake', 'קאפקייק', ['birthday']),
  emoji('shortcake', 'פרוסת עוגה', ['birthday']),
  emoji('candle', 'נר', ['birthday', 'mitzvah']),
  emoji('wrapped-gift', 'מתנה', ['birthday', 'party']),
  emoji('partying-face', 'פרצוף חוגג', ['birthday', 'fun']),
  emoji('lollipop', 'סוכרייה', ['birthday', 'baby']),
  emoji('candy', 'ממתק', ['birthday']),
  emoji('baby', 'תינוק', ['baby']),
  emoji('baby-bottle', 'בקבוק', ['baby']),
  emoji('teddy-bear', 'דובי', ['baby']),
  emoji('ribbon', 'פפיון', ['baby', 'birthday']),
  emoji('hatching-chick', 'אפרוח', ['baby']),
  emoji('crown', 'כתר', ['mitzvah', 'party']),
  emoji('hamsa', 'חמסה', ['mitzvah', 'baby']),
  emoji('scroll', 'מגילה', ['mitzvah']),
  emoji('cherry-blossom', 'פריחה', ['nature', 'love']),
  emoji('tulip', 'צבעוני', ['nature']),
  emoji('blossom', 'פרח', ['nature']),
  emoji('sunflower', 'חמנייה', ['nature']),
  emoji('hibiscus', 'היביסקוס', ['nature']),
  emoji('herb', 'עלים', ['nature']),
  emoji('leaf-fluttering-in-wind', 'עלה ברוח', ['nature']),
  emoji('four-leaf-clover', 'תלתן', ['nature', 'mitzvah']),
  emoji('butterfly', 'פרפר', ['nature', 'baby']),
  emoji('rainbow', 'קשת', ['nature', 'fun']),
  emoji('sun', 'שמש', ['nature']),
  emoji('crescent-moon', 'ירח', ['nature']),
  emoji('smiling-face-with-heart-eyes', 'עיני לב', ['fun', 'hearts']),
  emoji('smiling-face-with-hearts', 'מאוהבים', ['fun', 'love']),
  emoji('face-blowing-a-kiss', 'נשיקה באוויר', ['fun', 'love']),
  emoji('smiling-face-with-sunglasses', 'משקפי שמש', ['fun']),
  emoji('fire', 'אש', ['fun']),
  emoji('camera-with-flash', 'מצלמה', ['fun']),
];

export function iconsIn(categoryId) {
  const inCategory = (i) => i.categories.includes(categoryId);
  return { symbols: [...SYMBOLS, ...CUSTOM_SYMBOLS].filter(inCategory), emoji: EMOJI.filter(inCategory) };
}

export const emojiUrl = (id) => `/icons/noto/${id}.svg`;
