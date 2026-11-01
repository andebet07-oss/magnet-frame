# Magnet Frame Studio

A personal, local-first tool for designing print-ready magnet frames (10×15 cm) before an event.
No backend, no account, no network calls: templates are plain files in a folder you choose.

## Run it

Requires **Chrome or Edge on a desktop** (only they let a web page read and write a local folder) and Node 20.19+.

```bash
npm install
```

```bash
npm run app
```

`npm run app` builds the app and opens it on `http://localhost:4173`. The first time, choose an empty folder for your templates; the app remembers it. On later visits Chrome may ask you to allow the folder again with one click ("Allow on every visit" skips that).

| Command | What it does |
|---|---|
| `npm run app` | Build and open the app locally |
| `npm run dev` | Development server with hot reload |
| `npm test` | Unit tests (units, names, schema, undo, font registry) |
| `npm run fonts` | Regenerate `src/fonts/fonts.css` after editing `src/fonts/registry.js` |

## Status

Built in four stages; each stops for review.

1. **Editor basics** ✅ library, canvas with cut line and safe area, layers, text / image / shape elements, undo, keyboard, autosave and reopen.
2. Photo area and preview with a sample photo (pan and zoom).
3. Event settings, bound fields, duplicate template, tag filter.
4. Export: PNG and PDF at print size with bleed, clean and guides versions, zip backup.

## Templates on disk

```
<your folder>/
  חתונה קלאסית/            one folder per template (named after it)
    template.json          the design
    thumbnail.png          preview for the library (regenerated automatically)
    assets/                copies of images you added (logo, decorations, background)
```

Folders starting with `.` or `_` are ignored, so the app can add its own (e.g. `_exports/` in stage 4).
Templates can be copied, backed up or edited outside the app; a folder without a valid `template.json` is skipped.

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
  storage/      folder access, template files, assets, autosave
  render/       buildFrame() — the single renderer used by editor, thumbnails and export
  fonts/        font registry, generated fonts.css, font loading
  screens/      library (folder gate, grid) and editor (canvas, toolbar, layers, properties)
  ui/           buttons, fields, dialogs, icons, toasts
```

The editor canvas, the library thumbnails and (stage 4) the exports all draw through `render/buildFrame.js`, so a saved or exported file can't drift from what the editor shows.
