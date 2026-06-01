# POPWAM Public Web

Public marketplace, organization profile, landing page, SEO, domain, and tracking shell for POPWAM.

## Local Commands

```bash
pnpm --filter public-web dev
pnpm --filter public-web build
```

## Public Environment Variables

Copy `.env.example` for local development. These values are public browser/runtime values only.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical URL, sitemap, robots, and Open Graph base URL. Defaults to `https://popwam.com`. |
| `NEXT_PUBLIC_API_BASE_URL` | Yes for API mode | Public API base URL. Local default is `http://localhost:3000`. |
| `NEXT_PUBLIC_PUBLIC_WEB_DATA_MODE` | Recommended | `api`, `mock`, or `hybrid`. Defaults to `hybrid` when unset. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Enables the Google Analytics placeholder when set. |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | No | Enables the Google Ads conversion placeholder when set. |
| `NEXT_PUBLIC_META_PIXEL_ID` | No | Enables the Meta Pixel placeholder when set. |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | No | Enables the TikTok Pixel placeholder when set. |

Tracking placeholders are disabled by default. Do not put secrets in `NEXT_PUBLIC_*` variables.

## Data Modes

- `api`: use Stage 2 public APIs only.
- `mock`: use existing mock adapters only.
- `hybrid`: try Stage 2 public APIs first, then fall back to mock data if the API is unavailable.

The public API client lives in `src/lib/public-api.ts`. The adapter in `src/lib/public-data.ts` preserves existing UI shapes while enforcing the current public API contract.

## Form Readiness

Public lead and contact forms submit to `POST /public/leads` in `api` and `hybrid` mode:

- Consent is required in the UI.
- UTM values are included from browser state/local storage.
- In `mock` mode, forms keep local placeholder success behavior.
- The frontend never creates lead claims, reservations, broker assignments, deals, or authenticated requests.

Future lead capture still needs spam controls, idempotency, recipient routing UX, and public lead management screens.

## Domain Readiness

Current behavior resolves public domains through `GET /public/domain/:host` in API/hybrid mode, with mock fallback for local demos. `src/proxy.ts` only adds diagnostic headers and does not rewrite traffic.

Future Cloudflare/DNS integration should:

1. Store requested custom domains in the backend.
2. Generate DNS verification records from `apps/api`.
3. Poll or receive Cloudflare verification status server-side.
4. Mark domains active only after verification.
5. Keep public-web routing read-only against approved domain records.

No Cloudflare API, DNS mutation, or real domain verification is implemented in this app.

## SEO Readiness

The app uses `createSeoMetadata` for metadata, canonical URLs, Open Graph fallbacks, and optional `noindex`. Next.js routes provide `/sitemap.xml` and `/robots.txt` from safe mock public data.
