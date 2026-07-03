# App Store & Play Store Listing — Catch Up Column

Draft metadata and the exact answers to the privacy questionnaires, ready to paste
into App Store Connect and Google Play Console. Anything in `{{curly braces}}` or a
blockquote is an owner decision/input.

---

## 1. Identity

| Field | Value |
| --- | --- |
| App name | Catch Up Column |
| Bundle ID (iOS) | `com.catchupcolumn.app` |
| Package (Android) | `com.catchupcolumn.app` |
| Version | 1.0.0 (build 1 / versionCode 1) |
| Primary category | Social Networking (iOS) / Social (Android) |
| Secondary category (iOS) | Lifestyle |
| Content rating target | 4+ (iOS) / Everyone, with user-generated content flag |
| Price | Free |

> Confirm the bundle ID is final before first submission — it is immutable afterward.

## 2. Short pitch

**Subtitle (iOS, 30 char max):** `A newspaper by your family`
**Short description (Android, 80 char max):**
`A private weekly newsletter you write together with family and friends.`

## 3. Full description (both stores)

```
Catch Up Column is a private weekly newsletter you make together with the people
you love — like a little Sunday newspaper written by your own family or friends.

Through the week, everyone adds short updates and photos. On your group's publish
day, Catch Up Column gathers it all into one beautifully laid-out edition and
delivers it to everyone — in the app, by email, and by a gentle notification.

No feeds to scroll. No strangers. No ads. Just the people you choose, catching up.

• Start a group and invite family or friends with a simple code
• Write short posts and add a photo — no pressure, no formatting to fuss over
• Every group has its own publish day and time
• Read each edition as a warm, newspaper-styled issue
• Get editions by email too, with one-tap unsubscribe
• Big, readable type and large buttons — made to be easy for everyone

Catch Up Column is built to be warm, simple, and private. Your posts are only ever
seen by the members of your group.
```

**Promotional text (iOS, 170 char, updatable without review):**
`Your family's weekly newspaper, written by all of you. Add updates through the week; on publish day it becomes one warm edition, delivered to everyone.`

## 4. Keywords (iOS, 100 char total, comma-separated)

`family,newsletter,journal,group,private,weekly,memories,photos,grandparents,together,updates,diary`

## 5. Screenshots (owner to capture)

Capture from a device/simulator with real sample content:
- **iPhone 6.9" (required)** — Home, an edition front page, the composer, a group.
- **iPhone 6.5"** (optional but recommended for older devices).
- **iPad** — not required: `ios.supportsTablet` is now `false`, so the app ships
  iPhone-only and no iPad screenshots are needed.
- **Android phone** — same 4 screens. **7" and 10" tablet** shots optional.

Best storytelling shot: a compiled edition front page (the product's payoff).

## 6. URLs required at submission

| Field | Store | Value |
| --- | --- | --- |
| Privacy Policy URL | Both (required) | `https://catchupcolumn.com/privacy` — host `docs/PRIVACY.md` |
| Support URL | iOS (required) | `https://catchupcolumn.com/support` — host `docs/SUPPORT.md` |
| Marketing URL | iOS (optional) | `https://catchupcolumn.com` |
| Account deletion URL | Google Play (required) | `https://catchupcolumn.com/delete-account` — host `docs/DATA_DELETION.md` |
| Support email | Google Play (required) | `support@catchupcolumn.com` |

> These URLs are also wired into the app's Profile screen (Privacy / Terms links)
> via `Strings.legal` in `constants/strings.ts`. Host the docs at these paths.

---

## 7. Apple Privacy "Nutrition Label" answers

Enter under App Store Connect → App Privacy. All items below are **linked to the
user's identity** and used only for **App Functionality** (not tracking, not ads).
Answer **"No"** to "used for tracking."

| Data type | Collected? | Purpose | Linked to identity |
| --- | --- | --- | --- |
| Email address | Yes | App Functionality, Account management | Yes |
| Name (display name) | Yes | App Functionality | Yes |
| Photos (avatar, post images) | Yes | App Functionality | Yes |
| Other user content (post text, group names/descriptions) | Yes | App Functionality | Yes |
| Device ID / Push token | Yes | App Functionality (notifications) | Yes |
| User ID | Yes | App Functionality | Yes |

Not collected: location, contacts, browsing/search history, purchases, financial
info, health, advertising data, usage/analytics, diagnostics.
No third-party SDKs collect data. **No App Tracking Transparency prompt is needed.**

## 8. Google Play Data Safety answers

Play Console → App content → Data safety.

- **Does your app collect or share user data?** Yes (collect). **Share:** you send
  edition recipients' email + content to Resend (a processor) and push tokens to
  Expo — Play treats "processing on your behalf" as **not** "sharing," so answer
  **No** to sharing if these are strictly service providers under your control.
- **Is all data encrypted in transit?** Yes.
- **Can users request data deletion?** Yes — in-app and via the web deletion URL.

Data types to declare (Collected, processed for app functionality, not for ads/tracking):

| Category | Type | Collected | Purpose |
| --- | --- | --- | --- |
| Personal info | Email address | Yes | Account management, App functionality |
| Personal info | Name | Yes | App functionality |
| Photos and videos | Photos | Yes | App functionality |
| Messages | Other in-app messages (posts) | Yes | App functionality |
| App activity | Other user-generated content | Yes | App functionality |
| Device or other IDs | Device or other IDs (push token) | Yes | App functionality (notifications) |

## 9. Age rating questionnaires

- The app has **user-generated content** shared within private invited groups (no
  public feed, no discovery). Answer the UGC questions accordingly; there is no
  moderation of public content because content is not public.
- No violence, sexual content, profanity, gambling, or drugs in the app itself.
- Expected outcome: **4+ (Apple)** / **Everyone (Google)**, with the UGC disclosure.

## 10. Export compliance

`ITSAppUsesNonExemptEncryption: false` is set in `app.json` — the app uses only
standard HTTPS/TLS. No extra export documentation is required.

## 11. Pre-submission checklist (technical)

- [ ] `eas init` run → `owner` + `extra.eas.projectId` written to app.json (this is
      also what makes production push notifications register — without it push
      silently fails in release builds).
- [ ] `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` set as EAS
      environment variables (the app throws at launch if they're missing in the build).
- [ ] APNs key (iOS) and FCM credentials (Android) uploaded via `eas credentials`.
- [x] Security migration applied to production DB (`supabase db push`) — done 2026-07-03.
- [x] All 4 edge functions deployed and verified byte-identical to the repo.
- [ ] `EMAIL_FROM` points at a verified Resend domain (not the sandbox sender).
- [ ] Reset-password redirect URL allowlisted in Supabase Auth settings.
- [ ] Privacy / Support / Data-deletion docs hosted and their URLs entered above.
- [ ] Screenshots captured for required device sizes.
