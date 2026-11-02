# Magnet Frame Studio

A personal tool for designing print-ready magnet frames (10×15 cm) before an event.
Open it from any browser, sign in with your email, and see the same templates everywhere.
Templates are stored in a dedicated Supabase project; there is no other server.

**Live:** https://magnet-frame.vercel.app (Vercel deploys every push to `claude/hopeful-feynman-ohyurh`).

## Using it

1. Open the site and enter your email. A one-time sign-in link arrives by email; open it **in the same browser**.
   The browser then remembers you; a new browser or computer needs one more link.
2. The library lists your templates. Everything you change in the editor is saved to the cloud one second later.
3. **No connection?** Keep working. A banner says the changes aren't saved yet; they are saved as soon as the
   connection returns. Leaving the editor with unsaved changes asks first.
4. **Same template open in two places?** A save never silently overwrites a newer one: the editor asks which
   version to keep.
5. **Icons:** "אייקונים" opens a picker by kind of celebration (hearts, wedding, party, birthday, baby,
   bar/bat mitzvah, nature, fun). Single-colour icons take any colour (black, red, soft red, dark red, gold…);
   colourful emoji are added as images. Artwork: Google Material Symbols and Noto Emoji (Apache 2.0, see
   `public/icons/LICENSE.md`); the list is `src/icons/catalog.js`, and `npm run icons` fetches the artwork.
6. **Backup:** "גיבוי ZIP" downloads all templates as one zip. "שחזור מגיבוי" adds the templates from a zip
   as new copies (nothing is overwritten).

## Development

Node 20.19+.

```bash
npm install
```

```bash
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run app` | Build and open the production build locally |
| `npm test` | Unit tests: model, undo, fonts, sign-in errors, cloud storage, saver, zip backup |
| `npm run fonts` | Regenerate `src/fonts/fonts.css` after editing `src/fonts/registry.js` |
| `npm run icons` | Fetch icon artwork after editing `src/icons/catalog.js` (needs network) |

Database and storage rules live in `supabase/` (see `supabase/README.md`). New files in `supabase/migrations/`
are applied to the database automatically when pushed.

## Status

1. **Editor basics** ✅ library, canvas with cut line and safe area, layers, text / image / shape elements, undo, keyboard.
2. **Cloud storage** ✅ email sign-in, templates and images in Supabase, offline handling, conflict protection, zip backup.
3. **Frames** ✅ standard magnet sizes (7.5×10, 10×15, 10×10), Polaroid and bottom-strip layouts, photo area, sample photo with pan and zoom, icon library.
4. Event settings, bound fields, duplicate template, tag filter.
5. Export: PNG and PDF at print size with bleed, clean and guides versions.

## Where templates live

| What | Where | Who can reach it |
|---|---|---|
| The design (`template.json`) | table `templates`, column `doc` | only its owner (row level security) |
| Images | private bucket `template-files`, `{user}/{template}/assets/<file>` | only its owner |
| Library preview | same bucket, `{user}/{template}/thumbnail.png` | only its owner |

Inside `template.json` an image is referenced as `assets/<file>`. Storage names are ASCII, so an image
called `לוגו.png` is stored as `image.png`.

A zip backup has one folder per template:

```
חתונה קלאסית/
  template.json
  thumbnail.png
  assets/leaf.svg
```

### template.json

```jsonc
{
  "format": "magnet-frame-studio",
  "version": 1,
  "id": "uuid",
  "name": "חתונה קלאסית",
  "tags": [],
  "createdAt": "ISO date", "updatedAt": "ISO date",
  "size": { "widthMm": 100, "heightMm": 150, "bleedMm": 3, "safeMm": 4 },
  "event": { "name": "", "date": "", "primaryColor": "#1F2A44", "secondaryColor": "#C9A96E", "font": "Heebo", "logo": null },
  "elements": [ /* bottom layer first; elements[0] is always the background */ ],
  "preview": null
}
```

Rules:

- **Units.** Positions and sizes are in **mm**, measured from the top-left corner of the cut line, so the bleed area has negative values. `x`/`y` is the top-left of the box before rotation; `rotation` is in degrees around the box centre. Font size is in **pt**.
- **Layer order** is the order of `elements`, bottom first.
- Every element has `id`, `type`, `name`, `visible`, `locked`, `opacity` (0–1).

| `type` | Fields |
|---|---|
| `background` | `fill` (hex or `null`), `image` (path in `assets/` or `null`). Always fills the whole bleed box. |
| `text` | `x`, `y`, `width`, `rotation`, `text`, `font`, `weight`, `sizePt`, `lineHeight`, `color`, `align` (`right`/`center`/`left`). No `height`: it follows the text. Direction (RTL/LTR) comes from the first letter. |
| `image` | `x`, `y`, `width`, `height`, `rotation`, `src` (path in `assets/`). |
| `shape` | `x`, `y`, `width`, `height`, `rotation`, `shape` (`rect`/`ellipse`), `fill`, `stroke` (hex or `null`), `strokeWidthMm`, `cornerRadiusMm`. A line is a thin `rect`. |

Stage 3 lets fields such as `text` or `color` hold a binding, `{ "bind": "eventName" }`, instead of a plain value.

## Fonts

Bundled from Google Fonts through `@fontsource` packages, so the editor and the exports use the same files on every machine (no CDN). The list lives in `src/fonts/registry.js`:

- **Clean:** Heebo, Assistant, Rubik, Alef, Miriam Libre, Varela Round, Fredoka
- **Serif and formal:** Frank Ruhl Libre, David Libre, Bellefair, Bona Nova, Noto Serif Hebrew, Suez One
- **Handwriting:** Gveret Levin, Playpen Sans Hebrew, Amatic SC, Solitreo
- **Display:** Secular One, Karantina, Rubik Bubbles, Rubik Doodle Shadow, Rubik Moonrocks
- **English:** Playfair Display, Montserrat

All Hebrew fonts include niqqud except Playpen Sans Hebrew (the picker marks it). To add a font: `npm install @fontsource/<name>`, add it to `registry.js`, run `npm run fonts`.

## Code map

```
src/
  model/        pure logic: units, schema + migration, element ops, names, text direction
  store/        editor state (zustand) and undo history
  storage/      cloud repo + Supabase gateway, image cache, autosave, zip backup
  auth/         sign-in screen and session
  lib/          the Supabase client
  render/       buildFrame() — the single renderer used by editor, thumbnails and export
  fonts/        font registry, generated fonts.css, font loading
  screens/      library (grid, backup) and editor (canvas, toolbar, layers, properties, sync banner)
  ui/           buttons, fields, dialogs, icons, toasts
```

The editor canvas, the library thumbnails and (stage 4) the exports all draw through `render/buildFrame.js`, so a saved or exported file can't drift from what the editor shows.
