# Google Maps / Geocoding setup (LeadRadar)

LeadRadar uses **two** Google API keys. Mixing them up or using browser restrictions on the server key causes:

> Géocodage refusé par Google. Vérifiez la clé API Geocoding.

## Keys

| Variable | Where | Used for |
|----------|-------|----------|
| `GOOGLE_PLACES_API_KEY` | Vercel + `.env.local` (server only) | Search tab, `/api/search`, `/api/geocode`, Places API |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Vercel + `.env.local` (public) | Map tab, Maps JavaScript in the browser |

## 1. Enable APIs (Google Cloud Console)

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. **Billing** → link a billing account (required even for free tier)
4. **APIs & Services → Library** → enable:
   - **Geocoding API**
   - **Places API** (legacy) or **Places API (New)** — enable what your project uses for nearby search
   - **Maps JavaScript API** (for the Map tab)

## 2. Create two API keys

**APIs & Services → Credentials → Create credentials → API key**

### Key A — Server (`GOOGLE_PLACES_API_KEY`)

- **Application restrictions**: None  
  (Do **not** use “HTTP referrers” — Vercel server calls have no browser referrer.)
- **API restrictions**: Restrict key → select at minimum:
  - Geocoding API
  - Places API

Copy into Vercel → **Settings → Environment Variables** → `GOOGLE_PLACES_API_KEY` (Production + Preview).

### Key B — Browser (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)

- **Application restrictions**: HTTP referrers → add:
  - `https://www.leadradar.us/*`
  - `https://leadradar.us/*`
  - `http://localhost:3000/*`
- **API restrictions**: Maps JavaScript API (+ Geocoding API if Map tab geocodes client-side)

Copy into Vercel → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

## 3. Redeploy Vercel

After changing env vars: **Deployments → … → Redeploy** (or push to `main`).

Env vars are baked in at build time for `NEXT_PUBLIC_*`.

## 4. Verify locally

```bash
cd leadsite
node scripts/verify-google-geocoding.mjs Perth
```

Expected: `Google status: OK` and a formatted address.

Or manually:

```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Perth&key=YOUR_SERVER_KEY"
```

## 5. Verify production

1. Open https://www.leadradar.us/search
2. Search city **Perth**, type **Restaurant**
3. Should return prospects (no geocoding error)

## Common mistakes

| Mistake | Symptom |
|---------|---------|
| Same key with HTTP referrer restriction used for `GOOGLE_PLACES_API_KEY` | `REQUEST_DENIED` — *API keys with referer restrictions cannot be used with this API* |
| Geocoding API not enabled | `REQUEST_DENIED` |
| Only `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` set on Vercel | Search fails (server key missing) |
| Forgot redeploy after env change | Old behavior until new deployment |
