# NBSC SAS Border Templating System

The **NBSC SAS Border Templating System** is a static, browser-based photo border composer. It lets users upload a photo, select an NBSC SAS campaign border/template, adjust how the photo fits behind the border, preview the result, and download the final image as a PNG.

The system is designed for campaign-style profile frames, similar to Twibbon-style photo overlays, but kept simple and lightweight so it can be hosted as a static website.

## What The System Does

- Displays available border templates from `assets/img/imgtemplate`.
- Uses image filenames as readable template names.
- Shows a preview of the selected border template.
- Lets users upload their own photo from their device.
- Places the uploaded photo behind the selected transparent border.
- Provides basic photo positioning controls:
  - Zoom
  - X offset
  - Y offset
  - Fit
  - Fill
  - Center
- Renders the final image on a `1080 x 1080` canvas.
- Downloads the composed result as a PNG.
- Uses `NBSC_logo.png` as the header logo, favicon, and Apple touch icon.
- Includes a responsive mobile-compatible interface.
- Includes a footer with a Facebook link.

## Project Structure

```text
.
├── index.html
├── package.json
├── vercel.json
├── README.md
├── assets
│   ├── css
│   │   └── style.css
│   ├── img
│   │   ├── NBSC_logo.png
│   │   └── imgtemplate
│   │       ├── template1.png
│   │       ├── template2.png
│   │       └── templates.json
│   └── js
│       └── app.js
└── scripts
    └── generate-template-manifest.js
```

## Main Files

### `index.html`

This is the main page of the system. It contains:

- Page title and favicon links
- Header branding
- Upload control
- Border/template dropdown
- Selected template preview
- Photo adjustment controls
- Canvas preview area
- Download button
- Footer with Facebook link

### `assets/css/style.css`

This file controls the full visual design of the system, including:

- Layout
- Colors
- Header and logo styling
- Editor panel styling
- Canvas preview styling
- Template preview styling
- Mobile responsive behavior
- Footer styling

The interface is built as a compact dashboard-style tool, not a marketing landing page.

### `assets/js/app.js`

This file contains the full client-side application logic:

- Loads available templates.
- Converts filenames into template names.
- Updates the selected template preview.
- Handles photo uploads.
- Draws the uploaded photo and selected border onto the canvas.
- Applies zoom and X/Y positioning.
- Handles Fit, Fill, and Center actions.
- Exports the canvas as a PNG download.

### `assets/img/NBSC_logo.png`

This image is used as:

- Header logo
- Browser favicon
- Apple touch icon

### `assets/img/imgtemplate`

This folder contains the border/template images.

Template images should usually be PNG files with transparent areas where the uploaded photo should show through.

Supported image formats:

- `.png`
- `.jpg`
- `.jpeg`
- `.webp`

PNG is recommended because campaign borders usually need transparency.

### `assets/img/imgtemplate/templates.json`

This file lists the templates that the browser should load.

Example:

```json
[
  "template1.png",
  "template2.png"
]
```

Vercel and most static hosts do not expose folder listings, so the website cannot automatically scan the `imgtemplate` folder at runtime. This JSON file solves that problem by giving the browser a known list of template files.

### `scripts/generate-template-manifest.js`

This script scans `assets/img/imgtemplate` and regenerates `templates.json`.

It is used by the build command:

```bash
npm run build
```

## How Template Names Work

The system uses the image filename to create the template name shown in the dropdown.

Examples:

```text
template1.png          -> Template1
foundation-day.png     -> Foundation Day
student_council.webp   -> Student Council
```

Hyphens and underscores are converted into spaces. The first letter of each word is capitalized.

## Adding A New Border Template

1. Create a border image.
2. Save it as a transparent PNG when possible.
3. Place it inside:

```text
assets/img/imgtemplate
```

4. Run:

```bash
npm run build
```

5. Confirm that `templates.json` now includes the new file.

Example:

```json
[
  "template1.png",
  "template2.png",
  "foundation-day.png"
]
```

6. Deploy or refresh the site.

## Recommended Template Image Format

For best results, border templates should be:

- `1080 x 1080` pixels
- PNG format
- Transparent in the center or photo area
- Designed with visible border graphics, text, logos, or campaign elements
- Kept reasonably optimized for web use

The canvas exports at `1080 x 1080`, so matching that size prevents stretching or quality loss.

## User Workflow

1. Open the website.
2. Choose a border from the Border dropdown.
3. Check the selected template preview.
4. Upload a photo.
5. Adjust the photo using:
   - Zoom
   - X
   - Y
   - Fit
   - Fill
   - Center
6. Review the final composition in the Preview panel.
7. Click **Download PNG**.

The generated image is processed in the browser. No photo is uploaded to a server.

## Privacy Note

The system is client-side only. User photos are loaded directly in the browser using `URL.createObjectURL`.

The current implementation does not upload, store, or send user photos anywhere.

## Local Development

Because the project is static, it can be opened directly in a browser. However, using a local server is better because browser behavior is more similar to deployment.

Run the build script first:

```bash
npm run build
```

Then serve the folder with any static server.

Example with Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

If `python` is not available, use any static server tool.

## Vercel Deployment

This project includes `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "."
}
```

This tells Vercel to:

- Run the manifest generator during build.
- Deploy the project root as the static output directory.

This is important because the project does not use a `public` folder.

## Why `templates.json` Is Needed On Vercel

Browsers cannot normally read a folder and list its files by themselves.

Some local development servers expose a folder listing at a URL like:

```text
assets/img/imgtemplate/
```

Vercel does not expose directory listings for deployed static assets. That means JavaScript cannot fetch the folder and discover the template images automatically.

To make deployment reliable, the app reads:

```text
assets/img/imgtemplate/templates.json
```

The build script keeps that file updated.

### `assets/db/data.json`

This file stores generated metadata for every detected template image.

Each template record includes:

- `id`
- `slug`
- `title`
- `category`
- `file`
- `path`
- `directory`
- `filename`
- `extension`
- `sizeBytes`
- `width`
- `height`
- `aspectRatio`

This file is generated by:

```bash
npm run build
```

Do not edit it manually unless you are intentionally overriding generated metadata. Add, remove, or rename images in `assets/img/imgtemplate`, then run the build script again.

## Customizing The Facebook Link

The footer link is in `index.html`.

Find:

```html
<a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">Facebook</a>
```

Replace the `href` value with the official NBSC SAS Facebook page URL.

## Customizing The Logo

Replace this file:

```text
assets/img/NBSC_logo.png
```

Use the same filename if you want the header logo and favicon to update without editing code.

Recommended logo format:

- PNG
- Square or near-square
- Clear at small sizes
- Optimized for web

## Customizing Colors

The main colors are defined at the top of `assets/css/style.css`:

```css
:root {
  --bg: #eef2f6;
  --ink: #18212f;
  --muted: #667085;
  --panel: #ffffff;
  --line: #d7dee8;
  --accent: #145c9e;
  --accent-dark: #0e477a;
  --gold: #b48219;
}
```

Edit these variables to adjust the system theme.

## Canvas Output

The preview canvas is defined in `index.html`:

```html
<canvas id="previewCanvas" width="1080" height="1080"></canvas>
```

The downloaded PNG uses this canvas size. If you change the canvas dimensions, the output image size will also change.

For campaign profile frames, `1080 x 1080` is a good default because it works well for square social media images.

## Browser Compatibility

The system uses standard browser features:

- HTML canvas
- File input
- JavaScript image loading
- `fetch`
- `DOMParser`
- `URL.createObjectURL`

It should work in current versions of:

- Google Chrome
- Microsoft Edge
- Firefox
- Safari
- Mobile browsers on Android and iOS

## Mobile Support

The interface is responsive:

- The header stacks on smaller screens.
- The editor and preview panels stack vertically.
- Buttons become easier to tap.
- The canvas scales to the screen width.
- Long filenames and template names are safely truncated.
- X/Y controls stack on narrow screens.

## Current Limitations

- There is no backend or database.
- There are no user accounts.
- The site does not save previous compositions.
- Templates must be included in the repository before deployment.
- The Facebook URL should be replaced with the official page URL.
- The editor supports basic positioning but not rotation or drag-to-move yet.

## Possible Future Improvements

- Drag photo directly on the canvas.
- Pinch-to-zoom support on mobile.
- Rotate uploaded photo.
- Add template categories.
- Add campaign title/description fields.
- Add multiple export sizes.
- Add JPG export option.
- Add automatic image compression.
- Add share buttons after export.

## Build Command

```bash
npm run build
```

This runs:

```bash
node scripts/generate-template-manifest.js
```

The script regenerates:

```text
assets/img/imgtemplate/templates.json
```

## Summary

The NBSC SAS Border Templating System is a lightweight static web app for generating campaign-style bordered photos. It is easy to host, simple to maintain, mobile-friendly, and safe for users because all photo processing happens locally in the browser.
