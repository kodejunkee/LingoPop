# LingoPop Monetization, Ad-Unlock & Accounts Architecture Plan (Future Prep)

> **Status:** Planning & Boundary Preparation Only  
> **Important Constraint:** Do **not** install payment, ad, or auth SDKs (RevenueCat, Google Mobile Ads, Supabase/Clerk native modules) during curriculum development while avoiding unnecessary EAS native rebuilds. Pure TypeScript entitlement interfaces (`src/engines/entitlements.ts`) exist solely as a zero-overhead seam so Stage 4+ gating can be enabled later without refactoring curriculum or UI components.

---

## 1. Product Philosophy & User-First Tier Model

LingoPop is built around two core commitments:
1. **Generous Free Onboarding per Language:** Every language track keeps **Stages 0–3 completely free, ad-free, and account-free** (phonetics, tones/script basics, core survival grammar, writing foundations). Users fall in love with the app before ever encountering an unlock gate.
2. **Never Lock Out Free Learners (Fair Hybrid Gate from Stage 4+):**
   - Starting at **Stage 4 onward**, lessons carry `accessTier: 'unlockable'` metadata (still unlocked by default until commercial mode is enabled).
   - When commercial mode launches, learners always have **two friction-light ways** to access Stage 4+ content:
     - **Path A — Rewarded Ad Lesson Pass (Zero Dollars):** Watch **one short rewarded video ad** to unlock **one full lesson** permanently (or for an extended multi-day pass / 100% completion of that lesson), optionally paired with a gentle **Ad-Pass / Heart** token system so learners who watch an ad never get stuck mid-lesson due to typos.
     - **Path B — Affordable Pro Subscription (~$4.99/month or discounted annual):** Undercuts major language apps ($12–$15/mo), removes all gates across **all languages**, removes rewarded ads, and enables **Cloud Sync & Multi-Device Progress**.
     - **Optional Path C — One-Time Stage / Language Pack IAP:** For users who dislike recurring subscriptions (e.g., unlock Chinese Stages 4–6 permanently).

---

## 2. Clean Architecture Seam (Prepared Now, Zero Native Bloat)

To avoid rewriting screens later, all lesson-access checks route through a single TypeScript interface in `src/engines/entitlements.ts`:

```ts
export type AccessTier = 'free' | 'unlockable';

export interface LessonEntitlementStatus {
  accessible: boolean;
  reason: 'free_tier' | 'open_beta_default' | 'pro_subscription' | 'ad_unlocked' | 'locked';
  unlockOptions: ('rewarded_ad_lesson_pass' | 'pro_subscription')[];
}
```

### Current Behavior (`OpenAccessEntitlementProvider`)
- Every lesson returns `accessible: true` (`reason: 'open_beta_default'`).
- Lesson cards and `[id].tsx` already carry metadata cleanly without blocking learners or requiring accounts.

### Future Behavior (`CommercialEntitlementProvider`)
1. Check if `lesson.stage <= 3` (or `lesson.accessTier === 'free'`) -> immediately `accessible: true`.
2. Check cached Pro subscription / Pack entitlement (valid offline with cryptographic receipt grace window).
3. Check local SQLite `lesson_unlocks` table (populated when a rewarded ad finishes verification or a heart/pass is spent).
4. Otherwise return `accessible: false` and show a clean two-button sheet:
   - **"Watch 1 Short Ad -> Unlock Full Lesson"**
   - **"Go Pro (~\$5/mo) -> Unlock All Languages & Remove Ads"**

---

## 3. Data Model Extensions (SQLite + Secure Storage)

When monetization & accounts are enabled in a future milestone, extend SQLite via a versioned migration (`PRAGMA user_version`):

```sql
CREATE TABLE IF NOT EXISTS lesson_unlocks (
  lesson_id TEXT PRIMARY KEY NOT NULL,
  unlock_source TEXT NOT NULL, -- 'rewarded_ad' | 'pro_cache' | 'pack_iap' | 'promo'
  unlocked_at INTEGER NOT NULL,
  expires_at INTEGER,          -- NULL = permanent lesson unlock; timestamp = timed pass
  ssv_receipt_id TEXT          -- Server-Side Verification nonce from AdMob/AppLovin SSV
);

CREATE TABLE IF NOT EXISTS downloaded_lessons (
  lesson_id TEXT PRIMARY KEY NOT NULL,
  course_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  payload_json TEXT NOT NULL,  -- Downloaded LessonDefinition JSON (cached after server auth)
  sha256_hash TEXT NOT NULL,
  downloaded_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS entitlement_tokens (
  token_type TEXT PRIMARY KEY NOT NULL, -- 'lesson_pass_hearts'
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
```

### Offline-First Rules
- Once a user unlocks a lesson by watching a rewarded ad (even on Wi-Fi before a commute), writing `lesson_unlocks` locally ensures **offline study works inside airplanes, subways, and rural areas** without re-prompting for ads.
- Subscription status caches an `entitlement_expires_at` timestamp in encrypted storage / MMKV with a **7-day offline grace period** beyond billing renewal checks.

---

## 4. User Accounts, Auth & Cloud Sync Design

Keeping accounts **optional until sync or Pro purchase**:
- **Anonymous-First Onboarding:** Learners start Stage 0 immediately with zero sign-up wall. Local SQLite stores `lesson_progress`, `srs_cards`, and `lesson_unlocks` under an anonymous device/profile UUID.
- **Account Upgrade Flow (At Pro Checkout or Sync Opt-In):**
  - Recommended stack: **Supabase Auth** (Sign in with Apple, Google Sign-In, Email Magic Link — zero native SDK lock-in beyond `expo-apple-authentication` / `@react-native-google-signin/google-signin` or WebBrowser OAuth via `expo-auth-session`) + Postgres with Row-Level Security (RLS).
  - **Account Merge on First Login:** Upload local `lesson_progress`, `srs_cards`, MMKV XP/streak stats, and `lesson_unlocks` atomically using timestamp/highest-mastery merge rules (never overwrite newer offline FSRS intervals with stale server rows).

---

## 5. Anti-Piracy & Server-Gated Lesson Downloads (Supabase + Cloudflare R2)

Your instinct about modded APKs is **100% spot-on**: if paid lesson data (`Stage 4+`, future languages) ships inside the compiled APK's JavaScript bundle, a modder can decompile the APK, bypass the client-side `if (isPro)` check, and read every paid lesson completely offline without touching a backend.

### How to Defeat APK Cracking Cleanly Without Ruining Offline UX

When commercial mode launches, split curriculum storage into **Bundled Core (Stages 0–3)** vs **Cloud-Delivered Packs (Stage 4+)**:

1. **Keep Paid Payloads Out of the APK:**
   - Only **Stages 0–3** (plus shared dictionary/Hanzi reference engines) live inside the APK binary.
   - **Stage 4–6+** lesson JSON bundles live privately on **Cloudflare R2** (zero egress fees!) or private **Supabase Storage** buckets with **no public read access**.
2. **Server-Verified Download Flow (`Supabase Edge Function` -> `Cloudflare R2`):**
   - App sends authenticated request: `POST /functions/v1/authorize-lesson-download` with the user's **Supabase Auth JWT** and `{ courseId, lessonId }`.
   - The Edge Function queries Postgres (`pro_subscriptions` synced from RevenueCat webhooks **or** a server-verified AdMob **SSV** `lesson_unlocks` row for that `user_id` + `lesson_id`).
   - **If NOT entitled (`!isPro && !hasAdUnlock`):** Server immediately returns **`403 Forbidden` (`NOT_ENTITLED`)** — zero lesson content is returned, so patching client code in a modded APK still cannot download Stage 4+ lessons.
   - **If entitled:** Server mints a **short-lived (e.g. 60-second) presigned Cloudflare R2 URL** (plus `sha256_hash`) for that specific lesson/stage pack.
3. **Cache Locally for Commute / Airplane Offline Study:**
   - Once authorized and downloaded, the client validates the hash and stores the lesson in SQLite `downloaded_lessons`.
   - From that point on, the learner still enjoys **instant offline access** without needing cell signal every time they open an already-unlocked lesson.
4. **Abuse & Rate-Limit Safeguards (Pragmatic Security):**
   - **Rate-limit downloads per user/hour** on the Edge Function and optionally enforce **Play Integrity / App Attest** later to deter automated bulk scraping.
   - *(Honest trade-off: no software can prevent a rooted device from reading data already legitimately downloaded onto a paid account, just like Spotify or Duolingo offline downloads — but keeping unpurchased payloads off the APK stops client-flag APK cracking outright AND shrinks the initial APK install size.)*

---

## 6. Monetization Integrations & Native Rebuild Checklist

Adding real ads, billing, and remote downloads requires native SDKs and **one planned EAS Development / Production build**. Do **not** add these until ready to ship monetization:

| Capability | Recommended SDK / Service | Why | Native Rebuild Required? |
| :--- | :--- | :--- | :--- |
| **Subscriptions & IAP** | `react-native-purchases` (**RevenueCat**) | Handles Play Billing + StoreKit 2 receipt validation, cross-platform Pro status, intro offers, and webhooks to Supabase | **Yes** (Native Android/iOS) |
| **Rewarded Video Ads** | `react-native-google-mobile-ads` (AdMob) | Mature rewarded video callbacks + **Server-Side Verification (SSV)** webhooks so users cannot spoof ad completion locally | **Yes** (Native Android/iOS + `app.json` App ID) |
| **Rewarded Ad Fraud Protection** | AdMob SSV Webhook -> Supabase Edge Function | Prevents modded APKs from minting free unlocks without affecting offline use after unlock | Backend only |
| **Gated Lesson Storage** | **Cloudflare R2** (via Supabase Edge Function presigned URLs) | Zero-egress private CDN storing Stage 4+ lesson JSONs; only served after verifying Supabase Pro or SSV unlock row (`403` otherwise) | Backend only (`fetch` + `expo-sqlite`) |
| **Auth & Cloud Sync** | Supabase (`@supabase/supabase-js` + `expo-secure-store` or MMKV encrypted store) | Pure JS client + Postgres RLS; optional native Google/Apple buttons | Only if adding native Apple/Google sheets |
| **Analytics (Funnel Tuning)** | PostHog or lightweight anonymized telemetry | Measure ad-unlock completion rate vs Stage 4 Pro conversion | Pure JS possible |

---

## 7. Rewarded-Ad UX Guardrails (Anti-Frustration Rules)

To honor the user's goal of making ad-unlocking effortless and respectful:
1. **1 Ad = 1 Whole Lesson Unlock:** Watching one rewarded ad permanently unlocks that lesson (not per-question interruptions and never interrupting mid-sentence during an active speaking or stroke drill).
2. **Graceful Offline Fallback:** If the device is offline and cannot load an ad (or download a newly unlocked Stage 4+ pack), display a calm message explaining an internet connection is needed only once to unlock/download the lesson pack (while already-downloaded lessons, the Dictionary, Hanzi Dojo, and due FSRS reviews remain 100% usable offline).
3. **Zero Surprise Interruptions:** No interstitial pop-ups between screens or before completing a lesson. Rewarded ads are strictly opt-in from a Stage 4+ unlock prompt or optional bonus Heart/Pass refill.
4. **Cross-Language Scalability:** Because gating inspects `lesson.stage` and `lesson.courseId` (future multi-language support: `'zh'`, `'ja'`, `'es'`, etc.), every new language automatically inherits the exact **First 3 Stages Free -> Stage 4+ Server-Gated Download via Ad-Unlock or \$5/mo Pro** policy.

---

## 8. Implementation Sequence When Ready to Monetize

1. Provision backend project (**Supabase Auth + Postgres**) + **Cloudflare R2** private bucket + **RevenueCat** + **AdMob** App/Rewarded Ad Unit IDs.
2. Upload Stage 4+ lesson JSON packs (`zh-CN`, and future languages) to private Cloudflare R2 and remove Stage 4+ JSON payloads from the client JS bundle (`getLessonById` reads bundled Stages 0–3 or SQLite `downloaded_lessons`).
3. Deploy Supabase Edge Functions:
   - RevenueCat webhook -> updates `pro_subscriptions` table in Postgres.
   - AdMob SSV webhook -> inserts verified `lesson_unlocks` row in Postgres.
   - `authorize-lesson-download` -> verifies JWT + entitlement (`403` if neither Pro nor SSV-unlocked) -> returns 60s signed R2 URL.
4. Add `expo-secure-store`, `react-native-purchases`, and `react-native-google-mobile-ads` using `npx expo install`, configure `app.json`, and run **one** `eas build`.
5. Implement `CommercialEntitlementProvider` conforming to `src/engines/entitlements.ts` and register it at app startup (`src/app/_layout.tsx`).
6. Add SQLite migration bumping `SCHEMA_VERSION` to add `lesson_unlocks`, `downloaded_lessons`, and optional `user_id` sync queue.
7. Build Account / Pro Paywall / Rewarded Unlock & Download modal sheets without touching core lesson exercise renderers.
