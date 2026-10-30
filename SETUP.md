# Golden Alchemy setup status

## Account connection — 2026-10-30

Dedicated Supabase project Golden Alchemy / fnjsbsoavsjnftbmmbtr (Free, us-east-1) created by owner. Pre-existing unrelated paused project untouched. Owner approved the identity migration; applied successfully. Live SQL tests passed and rolled back fixtures: profile isolation/owner editing, immutable UUID, chef-prefix/unique casefold, admin-only membership grants/edits, anonymous denial. Public client and REST/RPC access checks passed. Actual website account/profile UI prepared at /account/ with pinned vendored official SDK 2.118.0, PKCE, persistent browser sessions, email confirmation and recovery, sign-out, private profile editing. No automatic membership entitlement.

Owner approved auth.goldenalchemy.net Resend sending setup. Added only its TXT DKIM + two sending CNAME records in Namecheap; website A/www and mail-forwarding SPF preserved; receiving remains disabled. Resend verified the subdomain. Owner created the sending key and pasted it privately into Supabase SMTP, then reported SMTP saved. Reload confirmed enabled smtp.resend.com:465 and Golden Alchemy sender name. Password never read or written by agent. Site URL + exact redirects set to production /account/ and recovery query. SDK and public config contain only intentional publishable key, never admin/SMTP secrets. Desktop/mobile account UI checked without submitting credentials. Pending owner-driven actual signup/email confirmation/private-profile check after deployment.

## Homepage copy revision — 2026-10-30

Owner supplied detailed homepage edits. Reworked copy professionally while preserving intent: Simple Ingredients / Extraordinary Possibilities hero; Epistemology & Aesthetics philosophy; Chef Rain's Guild, Global News Feed, Chef Rain's Marketplace previews with working links and clear planned-feature labels. Gallery and Latest activity removed from homepage; collector/configuration retained. Social closing/footer revised. Four element tiles now link to intentionally blank article areas; owner technique lists saved in content/element-topics.json for a later editorial gallery phase. Previous FDA/weather deployment 41102389718 confirmed successful.

## Oracle integration — 2026-10-30

Owner chose free U.S. weather before TheMealDB production key setup. NWS collector and module added for NYC/Albany/Buffalo, using existing hourly deployment. No key, subscription, or location tracking. City/F-C controls, true provider/retrieval dates, expiring-period filtering, and per-city failure/stale handling. Three real city forecasts fetched successfully locally; provider-returned URLs constrained to api.weather.gov gridpoint forecasts. Four tests cover allowlist, rejecting untrusted URL, stale fallback date preservation, and invalid temperatures/units.

Owner verified Instagram post is appearing. Added openFDA food-enforcement collector to the existing scheduled/deployment workflow. Six recent records, official source links, dataset/retrieval dates, expanded product/reason/distribution/code information. Provider errors preserve a previous preview with stale status or show unavailable. No new credential, subscription, or external user account. Local fetched preview and generated production feed remain outside Git. Unit tests passed for live allowlist, missing recall number, stale fallback with preserved date, unavailable, and wrong product type. Desktop/mobile and keyboard expansion checked with real API data. Recipes/weather/community/commerce remain pending; TikTok waiting on handle change.

## Current appearance milestone — 2026-10-29

Integration phase begins with Instagram per owner steering. Latest activity added using the existing public Instagram feed; sorting and photo/video filter independence checked with a temporary local fixture that was removed before publication. Mobile checked at 390px. Public source inventory corrected to connected Instagram. TikTok official oEmbed verified the current public @goldenalchemy.net profile, but owner explicitly prioritizes Instagram and plans TikTok handle @goldenalchemy.na within seven days. Optional creator embed adapter prepared but not mounted or loaded. Track future work in INTEGRATIONS.md; no additional services/accounts/credentials purchased or configured.

The Instagram workflow run 40920475616 succeeded after the user saved META_PAGE_ACCESS_TOKEN in the Golden Alchemy repository. Public feed verified at https://www.goldenalchemy.net/data/instagram.json for goldenalchemy.na, initially with no posts. DNS and Enforce HTTPS verified. Credentials are not stored locally.

Built five static pages from the user's supplied design brief using scripts/build_site.py. Shared CSS/JS in docs/assets. The homepage reads the existing deployed Instagram feed; future integrations and social/backend features remain explicitly deferred. Responsive checks passed at 390px and desktop; gallery failure/retry state, navigation, community availability dialog, and recipe preview checked. Editorial imagery is illustrative Unsplash photography, with provider information in the footer dialog. Local Git history initialized from origin/main without overwriting working files; appearance branch codex/appearance. The chronological notes below describe earlier setup stages.

Repository verified: https://github.com/rainwarestack/goldenalchemy.net (public, owner rainwarestack).

On 2026-10-29, added docs/index.html through GitHub's browser editor and enabled GitHub Pages from main /docs. Registered www.goldenalchemy.net in Pages settings. DNS validation and HTTPS remain pending Namecheap configuration.

Local origin points to this repository. Local files have not yet been committed or synchronized with remote history. The README, .gitignore, .nojekyll, sources.json and this setup note are prepared locally only. The remote holding page and CNAME were created through GitHub UI.

The GitHub connector can read the repository, but create_file returned 403 Resource not accessible by integration. Fix repository-specific integration access before relying on connector writes. Never use xbtesports credentials or settings.

## Namecheap records to configure

Keep Namecheap BasicDNS. In Advanced DNS, point www with a CNAME to rainwarestack.github.io (no repository path). For the apex, use four A records at @: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153. Replace conflicting parking/redirect entries for these exact hosts; preserve unrelated records, especially email records.

Reference: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

On 2026-10-29, saved the www CNAME and all four apex A records in Namecheap through the browser. Replaced the parking CNAME and converted the apex redirect to the first A record. Preserved email settings and SPF. Public DNS lookup confirmed www -> rainwarestack.github.io and four apex A responses. GitHub reported the holding page deployed, with DNS check in progress and Enforce HTTPS still disabled. HTTPS activation and public HTTP/HTTPS verification remain pending.

After DNS validation, enable Enforce HTTPS in repository Pages settings when available and verify the public site.

## Content backend

2026-10-29 implementation: scripts/sync_instagram.py committed at bae3ad397abe178da938fa4b7eeb03fd369487e4, workflow .github/workflows/instagram-pages.yml committed at eeec3919b07b79e1d493955dd7adec1aef00d7ab. Hourly at minute 17, manual dispatch, and relevant pushes. Workflow checks META_PAGE_ACCESS_TOKEN secret presence and skips deployment if missing. Collector validates verified Instagram identity, writes allowlisted public data to docs/data/instagram.json in runner only, and deploys docs via Pages artifact. No feed data is committed. Browser confirmed Pages source GitHub Actions, DNS check successful, and Enforce HTTPS checked. Initial custom workflow run 40917335214 completed successfully in credential-wait mode. Secret not configured; no live data deployment or gallery UI yet. Token lifetime must be verified before storage.

SUCCESS after user regenerated token with business_management: me/accounts returned Golden Alchemy, API Page ID 1483648864826752, linked Instagram ID 17841468852775750, username goldenalchemy.na. The user-supplied public profile URL ID 61595639807754 differs from the API Page ID; use the verified API ID for integration. Instagram /media returned data: []; profile query confirmed media_count: 0. Authorization is verified, but no scheduled ingestion or live homepage gallery exists yet. Token remains in Meta Explorer only; expiry and production credential storage have not been configured.

User explicitly approved adding business_management for Golden Alchemy. Added to app and verified Ready for testing; added to Graph API Explorer request alongside instagram_basic, pages_show_list and pages_read_engagement. Existing token is not sufficient for the new scope. Awaiting user completion of Generate Access Token authorization with Golden Alchemy assets selected. Do not assume new scope granted until tested.

Facebook Page ID supplied by user: 61595639807754. User screenshot shows Golden Alchemy Page in Herb Your Enthusiasm business portfolio, with Gen Items (You) assigned full access. Instagram @goldenalchemy.na is also listed in that portfolio, alongside an unrelated Page (Cardinal Reserves); do not touch unrelated assets. Graph Explorer me/accounts returned an empty list twice despite three granted scopes. Direct Page lookup with fields id,name,instagram_business_account{id,username} returned code 100 / subcode 33. Business portfolio permission business_management is the next diagnostic candidate; no conclusion that the Page itself is invalid.

Meta app Golden Alchemy created by the user: 1663600348484630. The app UI offers Instagram API with Facebook login. User reports linking Instagram @goldenalchemy.na to Facebook Page Golden Alchemy; not yet verified through API. Added instagram_basic, pages_show_list, and pages_read_engagement to the app; each showed Ready for testing. Prepared these same scopes in Graph API Explorer for Golden Alchemy. Awaiting user authorization through Get Token > Get User Access Token. No tokens generated or stored by the agent. No publishing or messaging scopes added.

Not configured yet. Public social links are present on the holding page. Source configuration is local only. Automatic Instagram/TikTok ingestion needs a supported integration and account authorization. No credentials have been collected. Appearance awaits the user's design instructions.
