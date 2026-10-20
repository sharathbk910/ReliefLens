# ReliefLens: Complete Setup & Deployment Guide
## Multilingual AI Voice Reporting • Automatic Geolocation • Supabase Authentication & Google OAuth

This comprehensive guide walks you step-by-step through configuring and deploying **ReliefLens**, an emergency response coordination platform. Whether you are setting up local development or deploying to production, follow each part in order.

---

## Table of Contents
1. [Architecture Overview & Credential Separation](#1-architecture-overview--credential-separation)
2. [Part A: Supabase Project Setup](#part-a-supabase-project-setup)
3. [Part B: Google Sign-In via Google OAuth & Supabase Auth](#part-b-google-sign-in-via-google-oauth--supabase-auth)
4. [Part C: Google Gemini API Setup (Audio & Multilingual Extraction)](#part-c-google-gemini-api-setup)
5. [Part D: Browser Geolocation & Map Setup](#part-d-browser-geolocation--map-setup)
6. [Part E: Environment Variables Reference](#part-e-environment-variables-reference)
7. [Part F: Exact Commands to Run, Test, and Build](#part-f-exact-commands-to-run-test-and-build)
8. [Part G: Comprehensive Troubleshooting Guide](#part-g-comprehensive-troubleshooting-guide)
9. [Part H: Final End-to-End Verification Checklist](#part-h-final-end-to-end-verification-checklist)

---

## 1. Architecture Overview & Credential Separation

Before starting, understand that ReliefLens uses **three completely independent external subsystems**:

```
+---------------------------------------------------------------------------------------+
|                                      RELIEFLENS                                       |
+---------------------------------------------------------------------------------------+
        |                                       |                                   |
        v                                       v                                   v
+-------------------------------+   +-------------------------------+   +-----------------------+
| A. Google Sign-In             |   | B. Gemini Speech Extraction   |   | C. Browser Location   |
| (OAuth 2.0 Web Client)        |   | (Google AI Studio Key)        |   | (HTML5 Geolocation)   |
+-------------------------------+   +-------------------------------+   +-----------------------+
| Configured in:                |   | Configured in:                |   | Configured in:        |
| - Google Cloud Console        |   | - Google AI Studio            |   | - Browser permissions |
| - Supabase Auth > Providers   |   | - Supabase Edge Function Sec. |   | - HTTPS / Localhost   |
|                               |   |                               |   |                       |
| Credentials:                  |   | Credentials:                  |   | Credentials:          |
| - Client ID                   |   | - GEMINI_API_KEY              |   | - NO API KEY NEEDED!  |
| - Client Secret               |   | - GEMINI_MODEL                |   | - Zero cost           |
+-------------------------------+   +-------------------------------+   +-----------------------+
```

> [!CAUTION]
> **CRITICAL SECURITY RULE**:
> Never mix these credentials. The Gemini API key must **never** be placed in frontend code, Vite `.env` variables, or Git commits. It belongs strictly inside **Supabase Edge Function secrets**.

---

## Part A: Supabase Project Setup

### 1. Create a Supabase Project
1. Navigate to [https://supabase.com](https://supabase.com) and sign in or create an account.
2. Click **New Project**.
3. Select your organization, enter a name (e.g. `relieflens-production`), and choose a secure database password.
4. Select a region close to your target users (e.g., `ap-south-1` for South Asia or `us-east-1`).
5. Click **Create new project** and wait 1–2 minutes for provisioning to finish.

### 2. Copy Project Credentials
1. In your Supabase dashboard sidebar, click the **Settings (gear icon)** at the bottom left.
2. Click **API**.
3. Copy the following values into your local `.env` file (do NOT commit this file):
   - **Project URL**: `https://<your-project-ref>.supabase.co` -> Set as `VITE_SUPABASE_URL`
   - **Project API Keys > anon / public**: `eyJhbGci...` -> Set as `VITE_SUPABASE_ANON_KEY`

### 3. Apply Database Migrations
ReliefLens includes PostgreSQL schema definitions with Row Level Security (RLS) policies:
1. In your Supabase project dashboard, open the **SQL Editor** from the left navigation.
2. Open `supabase/migrations/20261020000000_init_relieflens.sql` in your code editor.
3. Copy all lines, paste them into the Supabase SQL Editor, and click **Run**.
4. Next, open `supabase/migrations/20261020010000_multilingual_voice_location.sql`.
5. Copy all lines, paste into the SQL Editor, and click **Run**.
6. Verify under **Table Editor** that the following tables exist:
   - `profiles`
   - `incidents`
   - `reports`
   - `report_contacts`
   - `duplicate_candidates`
   - `priority_overrides`
   - `audit_logs`

### 4. Deploy Supabase Edge Functions
If using the Supabase CLI locally:
```bash
# Link to your Supabase project
npx supabase link --project-ref <your-project-ref>

# Deploy all Edge Functions
npx supabase functions deploy analyze-voice-report --no-verify-jwt=false
npx supabase functions deploy ingest-report
npx supabase functions deploy review-duplicate
npx supabase functions deploy override-priority
npx supabase functions deploy update-incident-status
npx supabase functions deploy rescore-incidents
```

### 5. Safe Promotion of the First Administrator
By default, newly registered users receive the least-privileged `reporter` role. To safely promote your agency coordinator or chief:
1. In Supabase Dashboard, go to **Authentication > Users** and copy your User UUID.
2. Open the **SQL Editor** and run:
```sql
UPDATE public.profiles
SET role = 'admin', display_name = 'Chief Response Officer'
WHERE id = '<your-user-uuid>';
```
3. Verify that the updated row has `role = 'admin'`.

---

## Part B: Google Sign-In via Google OAuth & Supabase Auth

Google Sign-In allows emergency coordinators, field analysts, and citizen reporters to log in securely with their Google Workspace or Gmail accounts.

### 1. Set Up Google Cloud Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top and click **New Project**.
3. Name it `ReliefLens Emergency Response` and click **Create**.
4. Make sure your newly created project is selected in the top bar.

### 2. Configure OAuth Consent Screen
1. In the left navigation menu, go to **APIs & Services > OAuth consent screen** (or **Google Auth Platform**).
2. Choose **External** user type (or **Internal** if using Google Workspace agency domain) and click **Create**.
3. Fill in the App Information:
   - **App name**: `ReliefLens`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Click **Save and Continue**.
5. Under **Scopes**, click **Add or Remove Scopes**.
   - Select `.../auth/userinfo.email`
   - Select `.../auth/userinfo.profile`
   - Select `openid`
6. Click **Update** and then **Save and Continue**.
7. If your app is in "Testing" publishing status, add your own email address under **Test users**.

### 3. Create Web Application OAuth 2.0 Client
1. Go to **APIs & Services > Credentials**.
2. Click **+ CREATE CREDENTIALS** at the top and select **OAuth client ID**.
3. In **Application type**, choose **Web application**.
4. Set **Name** to `ReliefLens Web Client`.
5. Under **Authorized JavaScript origins**, click **+ ADD URI**:
   - For local development: `http://localhost:3000`
   - For deployed production: `https://your-domain.vercel.app` (or your actual custom domain)
6. Under **Authorized redirect URIs**, click **+ ADD URI**:
   - Go to your Supabase Dashboard: **Authentication > Providers > Google**.
   - Copy the **Callback URL (for OAuth)** shown in Supabase. It looks like:
     `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Paste this exact URL into Google Cloud Console under Authorized redirect URIs.
7. Click **Create**.
8. A modal will display your **Client ID** and **Client Secret**. Keep this window open.

### 4. Enable Google Provider in Supabase
1. Return to your Supabase Dashboard: **Authentication > Providers**.
2. Click to expand the **Google** provider.
3. Toggle **Google enabled** to ON.
4. Paste the **Client ID** from Google Cloud into **Client ID**.
5. Paste the **Client Secret** from Google Cloud into **Client Secret**.
6. Click **Save**.

### 5. Configure Supabase Redirect URLs
1. In Supabase Dashboard, go to **Authentication > URL Configuration**.
2. Set **Site URL** to:
   - For local development: `http://localhost:3000`
   - For production: `https://your-domain.vercel.app`
3. Under **Redirect URLs**, click **Add URL** and add:
   - `http://localhost:3000/**`
   - `https://your-domain.vercel.app/**`
4. Click **Save**.

---

## Part C: Google Gemini API Setup

ReliefLens uses Google's latest multimodal Gemini model to transcribe audio in any spoken language (e.g., Kannada, Hindi, English, Tamil, Telugu, Malayalam, Bengali) and extract structured incident information into a strictly validated JSON schema.

### 1. Obtain a Gemini API Key from Google AI Studio
1. Navigate to [https://aistudio.google.com/](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **Get API key** in the left menu.
4. Click **Create API key in new project** (or select your existing Google Cloud project).
5. Copy your generated key (starts with `AIzaSy...`).

### 2. Choose Supported Audio Model
ReliefLens defaults to `gemini-2.5-flash`, which offers rapid sub-second audio transcription and high-accuracy structured JSON output. Supported models include:
- `gemini-2.5-flash` (Recommended: fastest audio processing and cost efficiency)
- `gemini-2.5-pro` (High-reasoning model for complex disaster scenarios)

### 3. Store the Secret in Supabase Edge Functions
Set the secret using the Supabase CLI or Dashboard:

#### Via Supabase CLI:
```bash
npx supabase secrets set GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
npx supabase secrets set GEMINI_MODEL="gemini-2.5-flash"
```

#### Via Supabase Dashboard:
1. In Supabase Dashboard, go to **Edge Functions**.
2. Click **Manage Secrets** in the top right.
3. Add secret:
   - Name: `GEMINI_API_KEY`
   - Value: `AIzaSy...`
4. Add secret:
   - Name: `GEMINI_MODEL`
   - Value: `gemini-2.5-flash`
5. Click **Save**.

### 4. How the Secure Voice Pipeline Works
```
+------------------+         +-------------------------------+         +-----------------------+
|  User's Browser  |  Audio  |  Supabase Edge Function       | Private |  Google Gemini API    |
|  (MediaRecorder) | ------> |  (analyze-voice-report)       | ------> |  (REST generateContent|
|                  | (Base64)|  - Checks auth JWT            | (REST)  |   with system prompt) |
+------------------+         |  - Validates size (<=8MB)     |         +-----------------------+
                             |  - Injects GEMINI_API_KEY     |                     |
+------------------+         |  - Validates output with Zod  |                     |
| Editable Draft   | <------ |  - Returns strict JSON schema | <-------------------+
| Preview in UI    | (JSON)  +-------------------------------+ (Structured JSON)
+------------------+
```
*The client never connects directly to Gemini; the API key is completely invisible to browser users.*

---

## Part D: Browser Geolocation & Map Setup

### 1. How Geolocation Works
ReliefLens uses the W3C standard `navigator.geolocation` API native to modern web browsers:
- **Single Capture**: `navigator.geolocation.getCurrentPosition()`
- **Optional Live Tracking**: `navigator.geolocation.watchPosition()`

### 2. Important Principles & Safeguards
1. **Zero External API Keys Needed**: Browser geolocation uses device GPS, cell towers, and Wi-Fi networks. It does NOT require a Google Maps API key or paid subscription.
2. **HTTPS Required**: Modern browsers strictly block geolocation on unencrypted HTTP connections. `localhost` is the only allowed HTTP exception for local development. Production deployments **must** use HTTPS (standard on Vercel, Netlify, Cloudflare Pages).
3. **Explicit User Action Only**: The application will NEVER track users silently or in the background. The user must click **"Use My Current Location"** or **"Share Live Location While Preparing Report"**.
4. **Device Location != Incident Location**: The device GPS represents where the caller is standing, which may differ from where the flood or fire is occurring. ReliefLens requires the user to confirm via checkbox: *"I confirm that this device GPS position represents the actual location of the emergency incident."*
5. **OpenStreetMap Leaflet Tiles**: The Geographic Map view uses OpenStreetMap and CartoDB dark matter tiles. These do not require API keys for normal operational traffic. Attribution is provided automatically.

---

## Part E: Environment Variables Reference

| Variable Name | Description | Where It Is Configured | Visibility | Required |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project HTTPS URL | `.env` (Frontend) | Public | Yes (for live Supabase) |
| `VITE_SUPABASE_ANON_KEY` | Public Anon/Publishable Key | `.env` (Frontend) | Public | Yes (for live Supabase) |
| `GEMINI_API_KEY` | Google AI Studio Key for speech analysis | Supabase Edge Function Secrets | **SECRET** | Yes (for AI voice reporting) |
| `GEMINI_MODEL` | Audio-capable Gemini model (`gemini-2.5-flash`) | Supabase Edge Function Secrets | **SECRET** | Optional (defaults to `gemini-2.5-flash`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key for CLI deployments | Supabase CLI environment | **SECRET** | Local CLI only |

> [!NOTE]
> ReliefLens includes a fully functional sandbox fallback mode. If `VITE_SUPABASE_URL` is omitted, the application runs with an in-memory client database and Quick Demo Personas so coordinators can evaluate scoring and workflows immediately.

---

## Part F: Exact Commands to Run, Test, and Build

All commands must be executed from the project root (`c:\ReliefLens`):

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
# The application will be available at http://localhost:3000
```

### 3. Run Automated Vitest Test Suite
```bash
npm test
# Executes all unit and integration test suites:
# - tests/scoring.test.ts (Ruleset v1.0.0 deterministic priority)
# - tests/duplicate.test.ts (Haversine & text similarity evaluation)
# - tests/evaluation.test.ts (Benchmark dataset evaluation: F1=0.9286, Spearman=0.9567)
# - tests/voiceExtraction.test.ts (Multilingual schema, strict Zod, safety limits)
# - tests/geolocation.test.ts (Coordinate boundaries, precision rules, RBAC)
```

### 4. Build Production Bundle
```bash
npm run build
# Compiles TypeScript with tsc and bundles optimized assets via Vite
```

### 5. Serve Edge Functions Locally (Optional)
```bash
npx supabase functions serve --env-file ./supabase/.env.local
```

---

## Part G: Comprehensive Troubleshooting Guide

### 1. Google OAuth: `redirect_uri_mismatch`
- **Cause**: The redirect URL configured in Google Cloud Console does not exactly match the callback URL generated by Supabase.
- **Fix**:
  1. Open Supabase Dashboard > Authentication > Providers > Google.
  2. Copy the exact **Callback URL**.
  3. Open Google Cloud Console > APIs & Services > Credentials > Your Web Client.
  4. Under **Authorized redirect URIs**, paste that exact URL. Ensure there are no trailing slashes or spaces.
  5. Wait 2 minutes for Google's cache to propagate.

### 2. Google OAuth: `access_denied` / User Cancelled
- **Cause**: User clicked "Cancel" on the Google account selection screen.
- **Fix**: The ReliefLens `AuthCallback` component gracefully catches `?error=access_denied` and displays an informative notification with a "Return to Login" button.

### 3. Gemini: `GEMINI_NOT_CONFIGURED` (HTTP 503)
- **Cause**: `GEMINI_API_KEY` has not been set in Supabase Edge Function secrets.
- **Fix**: Run `npx supabase secrets set GEMINI_API_KEY="AIzaSy..."` or set it in the Supabase Dashboard under Edge Functions > Manage Secrets.

### 4. Gemini: `Audio payload exceeds 8MB maximum upload limit` (HTTP 413)
- **Cause**: Recording was longer than 60 seconds or uncompressed.
- **Fix**: ReliefLens automatically stops recordings at 60 seconds and slices data with Opus compression (`audio/webm;codecs=opus`). Encourage the reporter to record a concise 30-45 second summary.

### 5. Geolocation: `PERMISSION_DENIED`
- **Cause**: Browser location access was blocked by the user or site settings.
- **Fix**:
  1. Click the padlock / settings icon in your browser's address bar.
  2. Locate **Location** and change it from "Block" to "Allow".
  3. Refresh the page or click "Retry".
  4. In the meantime, the user can manually enter the street address and district.

### 6. Geolocation: `Only secure origins are allowed`
- **Cause**: Website is served over plain HTTP on a non-localhost domain.
- **Fix**: Deploy to an HTTPS-enabled host (Vercel, Cloudflare Pages, Netlify) or use `http://localhost:3000` for local development.

---

## Part H: Final End-to-End Verification Checklist

Use this checklist before declaring production readiness:

- [ ] **Authentication**:
  - [ ] Quick Demo personas allow switching between Admin, Coordinator, Viewer, and Reporter.
  - [ ] Email/password login and registration work.
  - [ ] Google Sign-In redirects to Google and returns to `/auth/callback`.
  - [ ] Session persists across browser reloads.
  - [ ] Logout clears the active session and returns to `/login`.
- [ ] **Multilingual Voice Emergency Reporting**:
  - [ ] Microphone permission prompt appears only after clicking "Start Recording".
  - [ ] Recording timer displays elapsed seconds up to 60s limit.
  - [ ] Audio playback works and allows re-recording.
  - [ ] "Analyze with Gemini" invokes the secure Edge Function.
  - [ ] Native script transcript is faithfully displayed (e.g. Kannada, Hindi, etc.).
  - [ ] Normalized English description is editable.
  - [ ] Suggested incident type, district, and risk headcount populate correctly.
  - [ ] Ambiguous immediate danger is flagged for human review.
- [ ] **Geolocation & Safeguards**:
  - [ ] "Use My Current Location" captures latitude, longitude, and accuracy in meters.
  - [ ] Timestamp of capture is displayed.
  - [ ] User must check the box confirming GPS represents the incident location.
  - [ ] Opt-in "Share Live Location" activates animated pulse indicator.
  - [ ] "Stop Sharing" immediately clears the watch tracker.
  - [ ] Unmounting or navigating away stops all background tracking.
- [ ] **Report Persistence & Incident Workflows**:
  - [ ] Report submission saves report and incident.
  - [ ] Urgency score is calculated deterministically with ruleset `v1.0.0`.
  - [ ] Safety floor of 45 points applies if unverified high danger is reported.
  - [ ] Potential duplicate detection finds matching incidents within geographic & time radius.
  - [ ] Audit log entry is recorded with actor ID and timestamp.
- [ ] **Security & Code Quality**:
  - [ ] Zero secrets in `src/` or frontend build.
  - [ ] `npm test` passes 29/29 tests.
  - [ ] `npm run build` succeeds in under 2 seconds with zero TypeScript errors.
