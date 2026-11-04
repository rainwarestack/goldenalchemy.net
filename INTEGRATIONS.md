# Golden Alchemy integration roadmap

Updated 2026-10-30. Exclusive to rainwarestack/goldenalchemy.net and www.goldenalchemy.net. Never reuse xbtesports resources.

## Shared organization

- `docs/data/sources.json`: public source inventory and connection status; never credentials.
- `scripts/sync_instagram.py`: authenticated source collector, public allowlist output, verified account identity.
- `.github/workflows/instagram-pages.yml`: scheduled/manual updates and deployment. No additional automation service required.
- `docs/data/instagram.json`: generated deployment artifact only; gallery and activity reuse the same request.
- `scripts/build_site.py`: page/module placement.
- `docs/assets/site.js`: gallery, activity display, and optional social embed adapter.
- `docs/assets/integrations.css`: responsive integration-module styling.

## Phase 1: own content

Instagram @goldenalchemy.na is connected. Existing workflow fetches up to 12 recent posts hourly at minute 17, as well as on relevant pushes and manual runs. Gallery and latest activity read that single public feed. Activity uses actual upload timestamps, not the collection time. No fabricated uploads or events appear. Scheduling can be delayed by GitHub.

Homepage revision 2026-10-30: owner removed the gallery and Latest activity sections. The homepage uses social profile links. The About page now mounts the automated Instagram gallery, with gold post frames and click-to-play videos. The collector follows pagination to include the account’s available media, refreshed by the existing hourly workflow.

Owner confirmed on 2026-10-30 that their real Instagram post appears on the site. Instagram is verified end to end. No content is posted on the owner's behalf.

TikTok is explicitly deferred until the owner changes @goldenalchemy.net to @goldenalchemy.na, expected within seven days. Do not change links early. Official creator-profile embed adapter is prepared but not mounted; there are no TikTok embed requests on page load. Once confirmed, update all profile links and render a click-to-load creator block with a permanent direct-link fallback. No secret or developer app is required for that embed. It is separate from the normalized gallery/activity feed. A combined TikTok feed requires Display API, Login Kit approval, owner OAuth, and secure token refresh; do not represent an embed as that connection.

YouTube and blog/newsletter/RSS URLs have not been supplied; optional sources remain pending. YouTube Data API can retrieve a channel’s uploads playlist if needed. Do not connect unrelated channels or invent RSS sources.

## Phase 2: discovery

- TheMealDB: recipe search and ingredient discovery. Free key 1 is for development/testing; official guide calls for a supporter production key for a publicly shipped application. No paid plan purchased or public production API enabled.
- openFDA: connected to The Oracle. scripts/sync_recalls.py collects six recent food-enforcement records in the existing deployment workflow; no credential or new service required. Browser requests the local /data/recalls.json artifact, not the provider. Display report dates, FDA dataset date, retrieval time, classification, full product/reason/distribution/lot details, and exact FDA record links. It is a limited enforcement preview, not real-time alerts or comprehensive coverage. Provider failure restores the previous public preview with its original timestamp and a delayed label; no usable cache produces an unavailable state. Empty results never claim that there are no recalls. Five boundary tests in tests/test_recalls.py. Local fetched data is ignored and generated production data is artifact-only.
- Weather: owner chose free weather before paid recipe access on 2026-10-30. National Weather Service (free open data for any purpose) connected for New York City, Albany, and Buffalo. scripts/sync_weather.py fetches provider point/forecast endpoints and publishes /data/weather.json as an ignored, deployment-only artifact. Each city has independent ready/stale/unavailable status, original retrieval/provider timestamps, and a direct NWS source link. No location tracking or API key. City selector and F/C conversion run locally; expired forecast periods are hidden. UI labels forecasts, not live observations. Failed calls fall back to the previous public preview with original dates. Arbitrary forecast hosts are rejected. No Open-Meteo commercial plan used or purchased.
- RSS/journal: select owner-approved sources and display attributed headlines/links rather than republishing articles.

## Phase 3: community

Supabase chosen by the owner. Dedicated Golden Alchemy Free project fnjsbsoavsjnftbmmbtr created. Identity/profile schema applied with explicit owner approval; live rollback-only tests verified RLS, private profiles, chef-prefixed case-insensitive unique usernames, immutable account IDs and administration-only membership entitlements. Anonymous REST and membership RPC access is denied. /account/ provides sign-in, email confirmation, password recovery, sign-out, and private profile editing. Membership is not granted on signup. Owner-driven email confirmation/profile verification remains the final end-to-end check.

Resend selected from the owner's existing account for transactional auth email. auth.goldenalchemy.net verified via three approved DNS additions. Owner created/pasted the sending credential privately into Supabase SMTP and confirmed saving; persisted enabled/host/port/sender-name settings verified. No secret is in source. No marketing email or automated test email was sent by the agent. Account confirmations/resets occur only when a user requests them.

Still pending: membership launch and billing, public/member profile discovery, storage/uploads, photo editing, moderation/reporting/blocking, likes/comments, and secure chat. Do not claim those functions are connected merely because Supabase supports them. No paid plans added.

## Phase 4: commerce

Keep Instagram inquiries initially. Confirm actual offerings, pricing, availability, service areas, and booking process. Configure an owner-approved booking service, storefront/payment provider, and future membership/class access. Never simulate successful bookings/orders/payments.

## Official references

- TikTok creator embeds: https://developers.tiktok.com/docs/en/embed-creator-profiles
- TikTok Display API prerequisites: https://developers.tiktok.com/docs/en/display-api-get-started
- YouTube uploads playlist: https://developers.google.com/youtube/data/guides/implementation/videos
- TheMealDB production guidance: https://www.themealdb.com/docs_api_guide.php
- Open-Meteo service terms: https://open-meteo.com/en/terms
- National Weather Service API: https://www.weather.gov/documentation/services-web-api

The integration table is a roadmap, not a claim that every provider is connected. Proceed in stages, using existing infrastructure before adding services.

## Element article galleries

The homepage's Fire, Water, Earth, and Air tiles link to /fire/, /water/, /earth/, and /air/. The article areas are intentionally blank, with noindex metadata until content is ready. Owner-supplied technique keywords are preserved and spelling normalized in content/element-topics.json. Future editorial galleries should focus on attributed guides, tutorials, and history, with pictures and original-source links. No source subscriptions, article scraping, or embedded article feeds have been activated.

## Elemental learning libraries — November 4, 2026
Fire, Water, Earth, and Air now expose the owner’s method directory with curated links and searchable RSS article metadata. The prior blank-page instruction is superseded by the owner’s editorial-phase request. content/library-catalog.json contains methods, original summaries, source configuration, and curated links. content/library-archive.json preserves collected RSS titles/links and first-seen dates. The hourly Pages workflow refreshes public metadata using scripts/sync_library.py and commits only the archive with the repository bot; failed sources keep their old links and original last-success timestamps. No publisher article bodies or images are copied. Initial feeds are Barbecue Bible and King Arthur Baking. Automatic topic tags are broad, publication dates can be unknown, source links can disappear, and not every method has a linked resource yet. Search state is in the URL. No private API credentials, new paid service, or user accounts are required.

Elemental library refinement: method tiles now link directly to their filtered resources, with the method summary above results. Search, method, format, and sorting controls are collapsed into one disclosure bar; the Curated/RSS selector is removed. RSS thumbnail URLs are taken only from publisher-supplied feed fields and allowed publisher/CDN hosts, loaded remotely with lazy loading and no-referrer. Missing or failed images retain a text card. No image files or article bodies are copied into the repository.
