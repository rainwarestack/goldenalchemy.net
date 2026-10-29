# Golden Alchemy integration roadmap

Updated 2026-10-29. Exclusive to rainwarestack/goldenalchemy.net and www.goldenalchemy.net. Never reuse xbtesports resources.

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

Next owner verification: publish an actual photo or Reel on Instagram, run the workflow manually (or await its schedule), and verify the real item in both modules. No content is posted on the owner's behalf.

TikTok is explicitly deferred until the owner changes @goldenalchemy.net to @goldenalchemy.na, expected within seven days. Do not change links early. Official creator-profile embed adapter is prepared but not mounted; there are no TikTok embed requests on page load. Once confirmed, update all profile links and render a click-to-load creator block with a permanent direct-link fallback. No secret or developer app is required for that embed. It is separate from the normalized gallery/activity feed. A combined TikTok feed requires Display API, Login Kit approval, owner OAuth, and secure token refresh; do not represent an embed as that connection.

YouTube and blog/newsletter/RSS URLs have not been supplied; optional sources remain pending. YouTube Data API can retrieve a channel’s uploads playlist if needed. Do not connect unrelated channels or invent RSS sources.

## Phase 2: discovery

- TheMealDB: recipe search and ingredient discovery. Free key 1 is for development/testing; official guide calls for a supporter production key for a publicly shipped application. No paid plan purchased or public production API enabled.
- openFDA: official food-enforcement feed with report dates, classification, reason, distribution, source links, loading/stale/failure states. Do not generate fictional recall entries.
- Weather: select a provider that permits this business website's use. Do not assume Open-Meteo's noncommercial free tier fits Golden Alchemy; pricing/licensing decision remains pending. City selection only; no automatic precise geolocation.
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

The integration table is a roadmap, not a claim that every provider is connected. Proceed in stages, using existing infrastructure before adding services.
