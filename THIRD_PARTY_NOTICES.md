# Third-Party Notices

_Draft prepared during the legal & compliance audit (9 Oct 2026). Verify before distribution._

## Runtime dependencies (direct)

| Package | Version | Licence |
|---|---|---|
| next | 16.3.5 | MIT |
| react / react-dom | 19.2.8 | MIT |
| @supabase/supabase-js, @supabase/ssr, @supabase/auth-helpers-nextjs | 2.116.0 / 0.12.7 / 0.15.0 | MIT |
| react-hook-form, @hookform/resolvers | 7.88.0 / 5.9.1 | MIT |
| zod | 4.6.5 | MIT |
| date-fns | 4.4.0 | MIT |
| clsx | 2.1.1 | MIT |

Dev-only tooling (eslint, jest, typescript [Apache-2.0], @types/*) is not shipped to users.

Transitive notes (from `package-lock.json`):
- `@img/sharp-*` optional native image binaries (via Next.js) are LGPL-3.0-or-later (libvips). They are dynamically bundled, unmodified and optional; keep them as separate, replaceable libraries and do not statically modify them.
- `caniuse-lite` is CC-BY-4.0 (browser data, build-time). `axe-core` (MPL-2.0) and `argparse` (Python-2.0) are dev-only.

## Fonts

- **Nunito Sans** — Copyright The Nunito Sans Project Authors. Licensed under the SIL Open Font License 1.1 (https://openfontlicense.org). Self-hosted in `public/fonts/` alongside the official `OFL.txt` license file.

## Images / media

- `public/logo.png`, `public/images/logo.png` — Dr Fit Veda logo. Ownership/licence of the artwork: **[CONFIRM]**.
- Demo/placeholder media in mock data and video gallery: Local SVGs (`/images/gallery-surya-namaskar.svg`, `/images/gallery-squat-form.svg`) and local video (`/videos/demo-movement.mp4`). Hot-linking to external third parties (Unsplash, W3Schools) has been eliminated to protect visitor privacy.
- Emoji icons used in the UI are Unicode characters rendered by the user's OS fonts; no icon library is installed.
- `public/*.svg` (file.svg, globe.svg, next.svg, vercel.svg, window.svg) are `create-next-app` starter assets (MIT-licensed templates; Next.js/Vercel logos are trademarks). They appear unused — remove if so.
