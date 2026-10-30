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

Homepage revision 2026-10-30: owner removed the gallery and Latest activity sections. The collector remains configured, but the homepage now uses social profile links only and makes no Instagram feed request. Retained gallery code can be reused in a future designated section.

Owner confirmed on 2026-10-30 that their real Instagram post appears on the site. Instagram is verified end to end. No content is posted on the owner's behalf.

TikTok is explicitly deferred until the owner changes @goldenalchemy.net to @goldenalchemy.na, expected within seven days. Do not change links early. Official creator-profile embed adapter is prepared but not mounted; there are no TikTok embed requests on page load. Once confirmed, update all profile links and render a click-to-load creator block with a permanent direct-link fallback. No secret or developer app is required for that embed. It is separate from the normalized gallery/activity feed. A combined TikTok feed requires Display API, Login Kit approval, owner OAuth, and secure token refresh; do not represent an embed as that connection.

YouTube and blog/newsletter/RSS URLs have not been supplied; optional sources remain pending. YouTube Data API can retrieve a channel’s uploads playlist if needed. Do not connect unrelated channels or invent RSS sources.

## Phase 2: discovery

- TheMealDB: recipe search and ingredient discovery. Free key 1 is for development/testing; official guide calls for a supporter production key for a publicly shipped application. No paid plan purchased or public production API enabled.
- openFDA: connected to The Oracle. scripts/sync_recalls.py collects six recent food-enforcement records in the existing deployment workflow; no credential or new service required. Browser requests the local /data/recalls.json artifact, not the provider. Display report dates, FDA dataset date, retrieval time, classification, full product/reason/distribution/lot details, and exact FDA record links. It is a limited enforcement preview, not real-time alerts or comprehensive coverage. Provider failure restores the previous public preview with its original timestamp and a delayed label; no usable cache produces an unavailable state. Empty results never claim that there are no recalls. Five boundary tests in tests/test_recalls.py. Local fetched data is ignored and generated production data is artifact-only.
- Weather: owner chose free weather before paid recipe access on 2026-10-30. National Weather Service (free open data for any purpose) connected for New York City, Albany, and Buffalo. scripts/sync_weather.py fetches provider point/forecast endpoints and publishes /data/weather.json as an ignored, deployment-only artifact. Each city has independent ready/stale/unavailable status, original retrieval/provider timestamps, and a direct NWS source link. No location tracking or API key. City selector and F/C conversion run locally; expired forecast periods are hidden. UI labels forecasts, not live observations. Failed calls fall back to the previous public preview with original dates. Arbitrary forecast hosts are rejected. No Open-Meteo commercial plan used or purchased.
- RSS/journal: select owner-approved sources and display attributed headlines/links rather than republishing articles.

## Phase 3: community

Choose and authorize a Golden Alchemy-specific authentication/database/media provider. Build case-insensitive unique chef-prefixed usernames, independent account IDs, profiles, storage, moderation/reporting/blocking, likes/comments, then secure chat. Do not claim persistence until implemented. Account creation, permissions, and any paid services require the owner's participation/approval where applicable.

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
