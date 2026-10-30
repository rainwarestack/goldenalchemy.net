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

The site also includes `/account/` and the four intentionally empty element routes. Account configuration is in `docs/data/backend.json`; only the publishable client key is public. Do not add a database password, SMTP credential, Resend key, or Supabase secret/service-role key. Production confirmation/recovery callbacks return to the live domain; local preview is for layout checks, not sending account emails.

## Customize

The October 30 homepage wording is in `scripts/home_page.py`. Edit that module, then run `python scripts/build_site.py`. The homepage no longer includes the Instagram gallery or Latest activity, at the owner's request; social profile links remain. Instagram collection remains configured for future use. Four element tiles lead to intentionally empty article areas (with shared navigation) under /fire/, /water/, /earth/, and /air/. Future technique topics are stored in `content/element-topics.json`; no article feeds are enabled yet. Home-specific responsive adjustments are in `docs/assets/home.css`.

- `scripts/build_site.py`: shared header/footer, layouts, copy, metadata, social URLs, and image references. Run the generator after editing; commit generated HTML in `docs/`.
- `docs/assets/site.css`: design tokens and responsive/reduced-motion styles. Palette: #2A1A0E, #D4621A, #F4AE52, #FEF3E2. Bebas Neue headings and Outfit body via Google Fonts.
- `docs/assets/site.js`: mobile menu, availability/privacy dialogs, recipe preview, gallery filters, and media lightbox. Feed content is rendered as text, never injected as markup.
- `scripts/sync_recalls.py` and `docs/assets/oracle.js`: cached official FDA food-enforcement preview with dates, expandable details, exact official links, and loading/empty/stale/unavailable states. Six records are a limited preview, not a real-time alert service. No new secret needed.
- `scripts/sync_weather.py` and `docs/assets/weather.js`: free NWS city forecasts (New York City, Albany, Buffalo), city selection and F/C toggle, provider/retrieval dates, and independent stale/unavailable handling per city. No location tracking or API key; forecast values are not live observations.
- `docs/assets/favicon.svg`: alchemy brand mark.
- `scripts/account_page.py`, `docs/assets/account.js`, and `docs/assets/account.css`: real Supabase account/profile interface. `supabase/` contains the reviewed identity migration, rollback-only access tests, and configuration record. The pinned official SDK is vendored under `docs/assets/vendor/` with its license and integrity manifest; `python scripts/vendor_supabase.py` reproducibly downloads that version without executing package scripts.

Editorial Unsplash photography is illustrative and is not Chef Rain portfolio content. Replace with owned photography when available. Image IDs are in the generator’s PHOTOS dictionary. Images use responsive sizes and lazy loading below the hero. External fonts and imagery depend on provider availability; system fonts and background colors remain as fallbacks. No paid services added.

## Hosting and Instagram

Verified repository: https://github.com/rainwarestack/goldenalchemy.net. GitHub Pages source: **GitHub Actions**. Main-branch changes under docs trigger the existing Instagram/deployment workflow, as do manual dispatches and hourly runs at minute 17. GitHub schedules may be delayed.

Required Actions repository secret: `META_PAGE_ACCESS_TOKEN`. Never put credentials in source, browser JavaScript, screenshots, or Git history. The collector verifies Instagram account goldenalchemy.na (ID 17841468852775750). Facebook Graph Page ID: 1483648864826752. Rotate the secret when expired or revoked.

The collector creates `docs/data/instagram.json` only in the deployment artifact; it is not committed. Local preview without it shows an unavailable-feed state. Production receives the authenticated feed. Gallery supports loading, empty, failed with retry, filtered, and stale states. Videos use native controls and link to their originals.

## First milestone

Integration work has begun with Instagram. The homepage gallery and Latest activity module share its feed; the activity timeline uses actual upload dates. See `INTEGRATIONS.md` for connection status and next steps. TikTok remains dormant until the owner changes its handle to @goldenalchemy.na. No YouTube or RSS source has been connected.

- Home: hero, four-elements philosophy, section previews, connected Instagram gallery, and social links.
- Forum: community preview and link to `/account/`. Supabase accounts and private chef profiles are configured; membership entitlement remains administration-only. No public posts, uploads, paid membership access, likes/comments or chat yet.
- Oracle: cached openFDA enforcement reports and NWS city forecasts. Recipe search preview sends no requests; recipes/journal remain pending. No fake safety alerts or conditions.
- Marketplace: planned services and products. Inquiries go to Instagram; no active bookings, memberships, checkout, payments, or orders.
- About: supplied brand philosophy and contact; no invented biography, qualifications, testimonials, or email.

Deferred: TikTok/YouTube ingestion, RSS, TheMealDB, extra bots/apps. TikTok is currently @goldenalchemy.net; update the generator when the handle changes. YouTube and RSS sources have not been supplied.

Authentication and private unique chef profiles now use the dedicated Supabase project. Resend is configured for confirmation/recovery emails. Owner signup/confirmation/profile verification is the final end-to-end check. Media storage, moderation/reporting/blocking, social persistence, chat, paid memberships, and payments remain future phases. GitHub Pages still serves the frontend; Supabase enforces the database policies.

## Checks

```powershell
python scripts/build_site.py
python -m py_compile scripts/build_site.py scripts/sync_instagram.py
node --check docs/assets/site.js
node --check docs/assets/oracle.js
node --check docs/assets/account.js
python -m unittest discover -s tests
```

Check desktop/mobile layout, navigation, keyboard dialog behavior, and deployed feeds before publishing. Run `python scripts/check_backend.py` for a networked public-client/anonymous-access check, and use `supabase/tests/identity_access.sql` for rollback-only live database security tests. Account registration stores email/auth information in Supabase; Resend handles confirmation/recovery email. No analytics or automatic location requests are added. Site/privacy information is accessible in the footer.
