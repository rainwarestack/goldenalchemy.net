# Golden Alchemy backend foundation

This directory belongs only to Golden Alchemy. Never run its migrations in an xbtesports or unidentified project.

## First connection

1. Verify the project name is Golden Alchemy and record its project reference before applying anything.
2. Keep the project on the Free plan unless the owner approves an upgrade. Keep automatic table exposure off and automatic RLS on.
3. Review and apply `migrations/202610300001_guild_identity.sql` in this project's SQL Editor. It adds two ga-prefixed tables, explicit grants, row policies, update timestamps, and a membership check. It does not delete stored records or modify unrelated tables.
4. Verify RLS is enabled, anonymous access is denied, users can only read/write their own profile, and users cannot change memberships. Verify duplicate case-insensitive usernames and invalid prefixes fail in PostgreSQL.
5. Auth Site URL is `https://www.goldenalchemy.net/account/`. Exact allowed redirects: `https://www.goldenalchemy.net/account/` and `https://www.goldenalchemy.net/account/?mode=recovery`. Keep email confirmation enabled. No wildcard or localhost callbacks are configured in production.
6. Only the project URL and publishable key may be used by the browser. Never ship a secret/service-role key or database password. Use service-role privileges only in a trusted backend.

## Data model

- ga_profiles: account UUID is independent from the mutable public username. Usernames must start with chef (case-insensitive), followed by 1–20 ASCII letters/digits/underscores. A unique lower(username) index prevents case-only duplicates. Profiles contain no email/password or billing details and are currently private to their owner.
- ga_memberships: pending/active/suspended/expired status, tier, optional expiry. Only trusted administration can grant/modify memberships. Signing up or editing a profile cannot unlock Guild content.
- ga_is_guild_member(): authenticated users can check only their own entitlement. No anonymous execution and no arbitrary target-user parameter.

No membership is active by default. This migration does not implement public profiles, uploads, social actions, chat, payment webhooks, or paid tiers. Those features need their own reviewed policies and implementation. No database change has occurred merely because the migration exists in Git.

## Email and launch requirements

Configure and test an owner-approved transactional email/SMTP provider before opening public email signups or password recovery. Supabase's default email service is for limited testing; consult current official restrictions and rate limits. Do not disable email confirmation as a workaround. No provider account, domain DNS change, email sending, or paid plan is authorized by this document alone.

## Verified project and mail setup — 2026-10-30

Verified Supabase project: Golden Alchemy, reference `fnjsbsoavsjnftbmmbtr`, project URL `https://fnjsbsoavsjnftbmmbtr.supabase.co`, Free organization rainwarestack, North Virginia. This is a new dedicated project; the pre-existing paused project was not modified. The owner created the database credential privately and explicitly approved the migration.

The identity migration was executed successfully. `tests/identity_access.sql` passed against the actual database: own-profile isolation and editing, denied edits to another profile, immutable account ID, case-insensitive unique chef usernames, admin-only membership grants/edits, and anonymous denial. All fixture users and rows were rolled back. `python scripts/check_backend.py` additionally verified the public client connection and anonymous REST/RPC denial without creating users or sending mail.

Resend domain `auth.goldenalchemy.net` was verified. The owner approved adding its sending-verification DNS records: TXT `resend._domainkey.auth` and CNAMEs `rsend.auth` -> `rsend.forge.rmta.net` and `send.auth` -> `send.forge.rmta.net`. Existing website A/CNAME and email-forwarding SPF records were preserved. Receiving is disabled. No root DMARC record was changed.

SMTP: sender `accounts@auth.goldenalchemy.net` / Golden Alchemy, host smtp.resend.com, port 465, username resend. Owner created the domain-restricted sending key, entered it directly in Supabase, and saved it. Enabled status, host, port and sender name persisted after reload. No SMTP/API secret was read, stored locally, or committed. Actual confirmation and recovery delivery still need an owner-driven end-to-end check.

The website uses the intentionally public publishable key from `docs/data/backend.json`. This is not a service-role key. Browser access remains limited by the verified grants and RLS policies. Auth uses the pinned official Supabase SDK 2.118.0, vendored from npm with registry integrity verification; a persistent browser session and PKCE are enabled. The account page includes sign-in, signup/email confirmation, recovery, sign-out and own-profile editing. Public Guild content, paid memberships, uploads and chat remain closed.

`authEnabled` and `signupEnabled` in the public config are rollout flags for the UI, not security boundaries. Database grants/RLS enforce access. Turning off a UI flag does not disable the Supabase Auth API; use provider settings for server-side signup suspension when required.

References:
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/auth-smtp
