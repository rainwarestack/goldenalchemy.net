# Golden Alchemy

Cooking and food content for https://www.goldenalchemy.net/.

This repository is separate from xbtesports. Do not share credentials, deployment settings, or content sources between projects.

## Run locally

Requires Python 3.12 or newer; no package installation required.

```powershell
python scripts/build_site.py
python -m http.server 4173 --directory docs
```

Visit http://localhost:4173/home/. Five static route directories support direct links and refreshes on GitHub Pages. The root redirects to `/home/`.

## Customize

- `scripts/build_site.py`: shared header/footer, layouts, copy, metadata, social URLs, and image references. Run the generator after editing; commit generated HTML in `docs/`.
- `docs/assets/site.css`: design tokens and responsive/reduced-motion styles. Palette: #2A1A0E, #D4621A, #F4AE52, #FEF3E2. Bebas Neue headings and Outfit body via Google Fonts.
- `docs/assets/site.js`: mobile menu, availability/privacy dialogs, recipe preview, gallery filters, and media lightbox. Feed content is rendered as text, never injected as markup.
- `scripts/sync_recalls.py` and `docs/assets/oracle.js`: cached official FDA food-enforcement preview with dates, expandable details, exact official links, and loading/empty/stale/unavailable states. Six records are a limited preview, not a real-time alert service. No new secret needed.
- `docs/assets/favicon.svg`: alchemy brand mark.

Editorial Unsplash photography is illustrative and is not Chef Rain portfolio content. Replace with owned photography when available. Image IDs are in the generator’s PHOTOS dictionary. Images use responsive sizes and lazy loading below the hero. External fonts and imagery depend on provider availability; system fonts and background colors remain as fallbacks. No paid services added.

## Hosting and Instagram

Verified repository: https://github.com/rainwarestack/goldenalchemy.net. GitHub Pages source: **GitHub Actions**. Main-branch changes under docs trigger the existing Instagram/deployment workflow, as do manual dispatches and hourly runs at minute 17. GitHub schedules may be delayed.

Required Actions repository secret: `META_PAGE_ACCESS_TOKEN`. Never put credentials in source, browser JavaScript, screenshots, or Git history. The collector verifies Instagram account goldenalchemy.na (ID 17841468852775750). Facebook Graph Page ID: 1483648864826752. Rotate the secret when expired or revoked.

The collector creates `docs/data/instagram.json` only in the deployment artifact; it is not committed. Local preview without it shows an unavailable-feed state. Production receives the authenticated feed. Gallery supports loading, empty, failed with retry, filtered, and stale states. Videos use native controls and link to their originals.

## First milestone

Integration work has begun with Instagram. The homepage gallery and Latest activity module share its feed; the activity timeline uses actual upload dates. See `INTEGRATIONS.md` for connection status and next steps. TikTok remains dormant until the owner changes its handle to @goldenalchemy.na. No YouTube or RSS source has been connected.

- Home: hero, four-elements philosophy, section previews, connected Instagram gallery, and social links.
- Forum: community layout with honest account/chat availability states. No persisted accounts, posts, likes, comments, or chat.
- Oracle: live cached openFDA enforcement-report preview. Recipe search preview sends no requests; weather/journal remain pending. No fake safety alerts or conditions.
- Marketplace: planned services and products. Inquiries go to Instagram; no active bookings, memberships, checkout, payments, or orders.
- About: supplied brand philosophy and contact; no invented biography, qualifications, testimonials, or email.

Deferred: TikTok/YouTube ingestion, RSS, TheMealDB, weather, extra bots/apps. TikTok is currently @goldenalchemy.net; update the generator when the handle changes. YouTube and RSS sources have not been supplied.

Authentication, unique case-insensitive `chef` usernames, media storage, moderation/reporting/blocking, social persistence, chat, memberships, and payments require a separate external backend/database phase. GitHub Pages is static hosting.

## Checks

```powershell
python scripts/build_site.py
python -m py_compile scripts/build_site.py scripts/sync_instagram.py
node --check docs/assets/site.js
node --check docs/assets/oracle.js
python -m unittest discover -s tests
```

Check desktop/mobile layout, navigation, keyboard dialog behavior, and the deployed feed before publishing. No analytics, registration collection, or automatic location requests are added. Site/privacy information is accessible in the footer.
