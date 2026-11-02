# App Store & Play Store Listing — Catch Up Column

Draft metadata and the exact answers to the privacy questionnaires, ready to paste
into App Store Connect and Google Play Console. Anything in `{{curly braces}}` or a
blockquote is an owner decision/input. **☐ owner to confirm** marks a judgment
call; each one carries a recommendation. The owner settled the first batch on
2026-10-30, and §13.5 lists what is still open.

**Ready for the App Store 1.0 submission — 2026-10-30.** Group Zero was skipped
(owner, 2026-10-24), so there is no external TestFlight and no Beta App Review:
the app goes to App Store review once the illustration rework lands and the
presubmission checks pass. **§13 is the App Store Connect sheet** (every field,
the review account, the Review Notes). §12, written for TestFlight, is kept for
later. Every claim here was re-checked against `main` on 2026-10-30; §13.4 has
the evidence.

**Updated 2026-11-02 for the Guideline 1.2 work** (#64–#70, live in production
that day): §7's Customer Support row, §9.3, and §13.2–§13.5, with the Review
Notes' 1.2 block filled in from what shipped. The new claims' evidence is in
§13.4.

---

## 1. Identity

| Field | Value |
| --- | --- |
| App name | Catch Up Column |
| Bundle ID (iOS) | `com.catchupcolumn.app` |
| Package (Android) | `com.catchupcolumn.app` |
| Version | 1.0.0. The build number is EAS's, not `app.json`'s: `eas.json` sets `appVersionSource: remote` and `autoIncrement` on `production`, so use whatever number the uploaded build carries |
| Primary category | Social Networking (iOS) / Social (Android) |
| Secondary category (iOS) | Lifestyle |
| Content rating target | **18+** (iOS): Apple calculates 4+, overridden to match Terms §1's minimum age of 18 (owner, 2026-10-30; §9.1) / Everyone, with user-generated content flag (Android) |
| Price | Free |

> ✅ The bundle ID was confirmed final by the owner on 2026-09-24 (`LAUNCH.md`
> step 7). It locks when the first build is uploaded, not at submission.

## 2. Short pitch

**Subtitle (iOS, 30 char max):** `A newspaper by your people` — 26 chars

> **Decided 2026-09-16.** Chosen over `The opposite of a feed` (22 chars), which
> is the sharper line but carries no keyword weight and is a little riskier with
> App Review. "The opposite of a feed" is still the right register for the
> *promotional text* field, which updates without a review cycle — that's where
> to A/B it after launch.

**Short description (Android, 80 char max):**
`A private weekly newsletter you write together with your people.`

## 3. Full description (both stores)

One paragraph per line, so it pastes without stray line breaks. "Group" is
capitalized as it is in the app (CLAUDE.md, Key Terminology).

```
No feeds to scroll. No strangers. No ads. Just the people you choose, catching up.

Catch Up Column is a private weekly newspaper you make together — with the friends you never see enough of, or with your family, or both.

Through the week, everyone adds short updates and photos. On your Group's publish day, Catch Up Column gathers it all into one beautifully laid-out edition and delivers it to everyone — in the app, by email, and by a gentle notification.

• Start a Group and invite your people with a simple code
• Write short posts with up to four photos — no pressure, no formatting to fuss over
• Every Group has its own publish day and time
• Read each edition as a warm, newspaper-styled issue
• Get editions by email too, with one-tap unsubscribe
• Big, readable type and large buttons — made to be easy for everyone

Catch Up Column is built to be warm, simple, and private. Your posts are only ever seen by the members of your Group.
```

**Promotional text (iOS, 170 char, updatable without review):**
`The group text scrolls away. This doesn't. Everyone writes a little through the week; on publish day it arrives as one warm edition, for everyone.`

> This field updates without a review cycle, so it is the cheapest place to A/B
> the pitch after launch (POSITIONING §2).

## 4. Keywords (iOS, 100 bytes total, comma-separated)

`family,friends,newsletter,journal,group,private,weekly,memories,photos,together,updates,diary`

Dropped `grandparents` (12 chars) and added `friends` (7) — the audience change,
and it frees 5 chars against the cap. `family` stays: families are still a
first-class audience and it is the higher-volume search term. Apple indexes the
app name on its own, so none of `catch`, `up` or `column` belongs here.

## 5. Screenshots (owner to capture)

**Apple's requirement, checked 2026-10-30**
([Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)):

- **Required:** "iPhone: At least one screenshot for iPhone with Dynamic Island
  (medium display)" — **1206 × 2622** or **1179 × 2556** portrait (the
  iPhone 17 / 17 Pro / 16 / 16 Pro class).
- **Capture the large class too:** iPhone with Dynamic Island (large display) —
  **1320 × 2868**, **1290 × 2796** or **1260 × 2736** portrait (the Pro Max /
  Plus / Air class). It isn't on the required line, but the page marks the next
  size down "Required if app runs on iPhone and screenshots for iPhone with
  Dynamic Island (large display) aren't provided", and it's what the big phones
  show.
- 1–10 per size, `.png` or `.jpg`, no transparency. App Store Connect scales a
  set down to the smaller sizes.
- **No iPad shots:** `ios.supportsTablet` is `false` (`app.json`), so the app
  ships iPhone-only.
- ☐ **owner to confirm** in App Store Connect → the version → *View All Sizes
  in Media Manager* that no required size is empty before submitting. Apple's
  page states the required size in one place and the fallbacks in another, so
  check the form rather than the page.

**The four screens:** Home, an edition front page, the composer with photos set
into a post, a Group page. Best storytelling shot: a compiled edition front page
(the product's payoff). Shoot after the illustration rework lands (`LAUNCH.md`
step 6b) — screenshots freeze the look.

**Sample content.** With Group Zero skipped there is no real Group to shoot.
Use the demo Group (§13.2), with writing and photos the owner made or owns —
never a real friend's words or face without their say-so.

- **Android phone** — same 4 screens. **7" and 10" tablet** shots optional.
  (Android is deferred — `LAUNCH.md`.)

## 6. URLs required at submission

All return 200, re-checked 2026-10-30. Use the `www` host — the apex
308-redirects to it.

| Field | Store | Value |
| --- | --- | --- |
| Privacy Policy URL | Both (required) | `https://www.catchupcolumn.com/privacy` |
| Support URL | iOS (required) | `https://www.catchupcolumn.com/support` |
| Marketing URL | iOS (optional) | `https://www.catchupcolumn.com` |
| Account deletion URL | Google Play (required) | `https://www.catchupcolumn.com/delete-account` |
| Support email | Google Play (required) | `support@catchupcolumn.com` — receives mail since 2026-10-24 (Cloudflare Email Routing; MX read with `dig` 2026-10-30) |

> These URLs are also wired into the app's Profile screen (Privacy / Terms links)
> via `Strings.legal` in `constants/strings.ts`. The pages are served from `web/`
> (`privacy.html`, `terms.html`, `support.html`, `delete-account.html`) — the
> `docs/*.md` files are the source copy those were built from.

---

## 7. Apple Privacy "Nutrition Label" answers

Enter under App Store Connect → App Privacy. Every item is used only for **App
Functionality** — Apple's purpose for "authenticate the user, enable features …
minimize app crashes" ([App privacy
details](https://developer.apple.com/app-store/app-privacy-details/)). Nothing
is used for tracking, advertising or analytics, so answer **"No"** to "used for
tracking" on every row.

| Data type | Collected? | Purpose | Linked to identity |
| --- | --- | --- | --- |
| Email Address | Yes | App Functionality | Yes |
| Name (display name) | Yes | App Functionality | Yes |
| Photos or Videos (profile photo; up to four photos per post; Group covers) | Yes | App Functionality | Yes |
| Other User Content (post headlines and text, bios, Group names and descriptions) | Yes | App Functionality | Yes |
| User ID | Yes | App Functionality | Yes |
| Device ID (push token) | Yes | App Functionality | Yes |
| Crash Data (Diagnostics) | Yes | App Functionality | **No** — not linked |
| Performance Data (Diagnostics) | Yes — added 2026-10-30 | App Functionality | **No** — not linked |
| Other Diagnostic Data | Yes | App Functionality | **No** — not linked |
| Customer Support (the note in a story report) | Yes — added 2026-11-02 (owner) | App Functionality | Yes |

"Account management" used to sit beside Email Address. That is a Google Play
purpose; Apple's list has no such entry, and sign-in counts as App
Functionality.

**Diagnostics are Sentry's**, wired into `app/_layout.tsx` on 2026-09-14
(docs/POSITIONING.md §11). They are the only data **not** linked to identity:
the SDK runs with `sendDefaultPii: false`, no user identification, no
performance tracing and no session replay. A report carries a stack trace,
device model, OS and app version, plus breadcrumbs: recent screens, the names of
tapped components, and request URLs with their query strings cut off
(`beforeBreadcrumb`). Nothing in it ties back to a person. The breadcrumbs only
travel inside an error report, to explain it, so they're declared as
diagnostics, not as Product Interaction. See docs/PRIVACY.md.

**Performance Data was added 2026-10-30** because Sentry's own privacy manifest
declares it, next to Crash Data and Other Diagnostic Data, all not linked and
for App Functionality
([sentry-cocoa `PrivacyInfo.xcprivacy`](https://github.com/getsentry/sentry-cocoa/blob/main/Sources/Resources/PrivacyInfo.xcprivacy)).
Xcode's privacy report for the build will list it. Tracing is off, so the
label may be wider than what the app actually sends, and a label that's a
little wider than the app is safer than one that is narrower.

**Expo also receives data**, as a service provider. The push token goes to
Expo's push service (`getExpoPushTokenAsync`; the Device ID row covers it). Each
update check sends `expo-updates` a random per-install ID
(`EAS-Client-ID`) that is tied to nothing else. Expo's privacy manifest for that
module (`expo-eas-client/ios/PrivacyInfo.xcprivacy`) declares no collected
data. **No row for it** (owner, 2026-10-30): the ID identifies an install, not
a person, and it is used to deliver updates. The privacy policy discloses both
from 2026-10-30 (Service providers → Expo).

**Not declared, and why:**

- ~~*Customer Support* — *Report this story* and support mail go through the
  person's own mail app (`lib/report.ts`, a `mailto:`). Nothing leaves through
  the app.~~ **No longer true from 2026-10-31 (#64):** *Report this story* sends
  from inside the app. The `report-story` function emails `support@` the
  reporter's note, email address and user id with the story's ids, and the
  support inbox keeps it. That is data the app collects, so the table above now
  declares Customer Support: linked to the user, not used for tracking
  (owner, 2026-11-02). Mail someone writes
  to `support@` from their own mail app, including the report sheet's "Email
  us instead" fallback, still doesn't go through the app.
- *Product Interaction, Usage Data, Analytics* — there is no analytics SDK.
- Location, contacts, browsing or search history, purchases, financial info,
  health, audio (there is no microphone permission), advertising data.

**No App Tracking Transparency prompt is needed** — nothing here is used for
tracking.

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
| App info and performance | Crash logs | Yes | App functionality (diagnostics; not linked to the user) |
| App activity | Other user-generated content | Yes | App functionality |
| Device or other IDs | Device or other IDs (push token) | Yes | App functionality (notifications) |

## 9. Age rating questionnaires

### 9.1 App Store — the 2025 questionnaire, answered

Apple's system now has 4+, 9+, 13+, 16+ and 18+ tiers. Checked 2026-10-30
against:

- [Age ratings values and definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/)
  — every item's definition, and which tier each answer lands in.
- [Set an app age rating](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/)
  — the procedure and the override rules.
- [`AgeRatingDeclaration.Attributes`](https://developer.apple.com/documentation/appstoreconnectapi/ageratingdeclaration/attributes-data.dictionary)
  in the App Store Connect API — one field per question, so nothing is missed.

**Where:** App Information → Age Ratings → *Set Up Age Ratings*. The in-app
controls and capabilities come first, then each content section, then
*Additional Information* with the calculated rating. Content items take None /
Infrequent / Frequent; the rest are Yes or No.

| Section | Question | Answer | Why — how the app works |
| --- | --- | --- | --- |
| In-App Controls | Parental Controls | No | No settings that restrict content or features for a child |
| In-App Controls | Age Assurance | No | No age check of any kind, and no call to the Declared Age Range API |
| Capabilities | Unrestricted Web Access | No | The only web pages it opens are our own support, privacy and terms pages, in an in-app browser sheet (`app/(tabs)/profile.tsx`; the Terms link at sign-up, `components/terms-agreement.tsx`, since 2026-11-01). Post text isn't turned into links |
| Capabilities | User-Generated Content | **Yes** | Members write posts and add photos that the rest of their Group reads. Apple's definition says "broad distribution", and a Group is a handful of invited people, but Yes keeps 4+ and is the Guideline 1.2 position already taken (LAUNCH step 9; PRESUBMISSION Gate 6: "flag user-generated content") |
| Capabilities | Social Media | No | Apple: "a social feed or similar discovery method that visibly spreads content to many users". There is no feed, discovery, likes, comments, shares or view counts; a post never leaves its Group (CLAUDE.md, Non-features) |
| Capabilities | Social Media Disabled for Users Under 13 | No | Only applies to apps with social media |
| Capabilities | Messaging and Chat | **Yes** (owner, 2026-10-30) | Apple: "Users can directly communicate with one another … May include … direct and/or group messaging". A post is a weekly message to the whole Group, though there is no chat, DM or reply. Yes keeps 4+; Brazil's rating moves from A6 to A12 |
| Capabilities | Advertising | No | No ads in the app. The planned house ad for the printed volume (POSITIONING §5) would run in the edition email, and isn't built |
| Mature Themes | Profanity or Crude Humor | None | Answers are about the app's own content. What members write is the User-Generated Content answer |
| Mature Themes | Horror/Fear Themes | None | — |
| Mature Themes | Alcohol, Tobacco, or Drug Use or References | None | — |
| Medical or Wellness | Medical or Treatment Information | None | — |
| Medical or Wellness | Health or Wellness Topics | No | — |
| Sexuality or Nudity | Mature or Suggestive Themes | None | — |
| Sexuality or Nudity | Sexual Content or Nudity | None | — |
| Sexuality or Nudity | Graphic Sexual Content and Nudity | None | — |
| Violence | Cartoon or Fantasy Violence | None | The drawings are a paperboy, his dog, a press and a mug |
| Violence | Realistic Violence | None | — |
| Violence | Prolonged Graphic or Sadistic Realistic Violence | None | — |
| Violence | Guns or Other Weapons | None | — |
| Chance-Based Activities | Gambling | No | — |
| Chance-Based Activities | Simulated Gambling | None | — |
| Chance-Based Activities | Contests | None | No rankings, streaks or competitions (BRAND §8, no gamification) |
| Chance-Based Activities | Loot Boxes | No | — |
| Additional Information | Calculated rating | **4+** | Every Yes above is in Apple's 4+ list: "Capabilities: User-generated content; Messaging and chat; Advertising" |
| Additional Information | Age Categories and Override | **Override to Higher Age Rating → 18+** (owner, 2026-10-30) | Terms §1, live at `/terms`: "You must be at least 18 years old to create an account." Apple: "If your app has a EULA with minimum age requirements that exceed the rating that Apple calculated, you must override to a rating that adheres to the requirements." So 4+ can't stand beside Terms §1 as written. The alternative was to lower Terms §1 and override to match; the owner kept the Terms at 18 |
| Additional Information | Made for Kids | No | Not a kids' app |
| Additional Information | Age Suitability URL | Leave blank | Optional |

**Regional ratings**, from the same values page: with Messaging and Chat
answered Yes, Brazil's self-rating is A12 (User-Generated Content alone would
be A6). Australia's 16+
comes only from Social Media or Loot Boxes, and Korea's extra rating only from
the Games and Entertainment categories, so neither applies. An override "will
apply in all regions", and the product page still lists the questionnaire's
content descriptions.

### 9.2 Google Play

- The app has **user-generated content** shared within private invited Groups
  (no public feed, no discovery). Answer the UGC questions accordingly.
- No violence, sexual content, profanity, gambling, or drugs in the app itself.
- Expected outcome: **Everyone (Google)**, with the UGC disclosure. Android is
  deferred (`LAUNCH.md`).

### 9.3 Guideline 1.2 — what ships

The published guideline asks UGC apps for four things
([App Review Guidelines
1.2](https://developer.apple.com/app-store/review/guidelines/#user-generated-content),
checked 2026-10-30).

**Closed in code, 2026-10-31 to 2026-11-02 (#64–#70)**, as the owner decided on
2026-10-30. The server half is live: every migration is pushed, and
`report-story` v1, `compile-editions` v21 and `publish-edition-now` v10 are
deployed (2026-11-02). `unsubscribe`'s new last line waits for release day
(`LAUNCH.md` → Deploying edge functions). The app half reaches phones with the
final build, the one made after the illustration rework. The Review Notes (§13.3) describe it, and
`docs/MODERATION.md` is how we act on a report. Until 2026-11-02 this table
listed the gaps; the 2026-10-30 version of this file has them.

| 1.2 asks for | What the app has | Note |
| --- | --- | --- |
| "A method for filtering objectionable material from being posted to the app" | No public posting: only people a Group's moderator invited can post, a removed member can't rejoin (#66), and a post reaches only its Group's few members. People do the filtering: the moderator takes a story down (#69), any member blocks its author (#70), and we act on reports within 24 hours | **No word filter, by decision** (owner, 2026-10-30). The Review Notes make the structural case on their "Filtering:" line, and the Terms don't claim a filter |
| "A mechanism to report offensive content and timely responses to concerns" | *Report this story* at the foot of every story by someone else opens a sheet with an optional note and sends the report from inside the app (#64): the `report-story` edge function emails `support@` the note and the story's ids, with Reply-To set to the reporter. A drafted email is only the fallback if sending fails. A moderator can take down any one story, published or not, with its photos (#69) | Response: **within 24 hours, every day** (owner, 2026-10-30), stated in the Terms, the Support page, the app's thank-you line and the Review Notes |
| "The ability to block abusive users from the service" | **Block** at the foot of anyone else's story (#70): one-way, it hides all their stories from you, in the app and in your edition emails, and they aren't told; **Unblock** is on the Group page. A moderator's **Remove** is a ban: the invite code won't let them back in until **Let back in** (#66). We can also ban an account in Auth (`docs/MODERATION.md` step 5) | — |
| "Published contact information so users can easily reach you" | `support@catchupcolumn.com`, the Support URL, Profile → **Help & support** (#67), Terms §4 and §11 | — |

**Also shipped: agreement to the Terms at sign-up** (#67). App Review's 1.2
rejections often ask for it, though the published guideline text doesn't. The
sign-up screen's button is "Agree and email me a code", and the new account's
metadata records `terms_accepted_at` and `terms_version` (`TERMS_VERSION` in
`lib/auth.ts`, `2026-11-02` since the Terms of that date). Accounts made before
that build aren't asked to agree again (owner, 2026-10-30).

PR #14 (2026-08-05) shipped the first report link (a drafted email) and
moderator removal, which was verified against production 2026-09-22
(`LAUNCH.md` step 9).

## 10. Export compliance

`ITSAppUsesNonExemptEncryption: false` is set in `app.json` — the app uses only
standard HTTPS/TLS. No extra export documentation is required.

## 11. Pre-submission checklist (technical)

➡️ **The checklist lives in [PRESUBMISSION_CHECKLIST.md](./PRESUBMISSION_CHECKLIST.md)**
— gates 1–9, with the verified-as-of statuses and the exact verification commands.

Keep it there rather than duplicating it here: this doc owns *metadata and
questionnaire answers*, the checklist owns *what to run and in what order*.

---

## 12. TestFlight Test Information — external testing (Group Zero)

> **Not used for v1 — kept for later.** Group Zero was skipped (owner,
> 2026-10-24): no external TestFlight and no Beta App Review, so nothing in this
> section is entered for 1.0. The App Store versions of the review account and
> the Review Notes are §13.2–§13.3. If an external beta ever runs, re-check the
> dated facts below first. Updated 2026-10-30 for multi-photo posts, the
> `support@` fix, and two stale claims in §12.5 (the photo permission, and
> Sentry as the only SDK); nothing else was revised. **Updated 2026-11-02** only
> where it described reporting as a drafted email (§12.3, and §12.5's Report
> line): reports send from inside the app since #64. §12.5 doesn't describe the
> rest of the Guideline 1.2 work (block, take down, removal bans, Terms at
> sign-up). If an external beta runs, take that from §13.3's 1.2 block.

**Drafted 2026-10-03** for the first external build (`LAUNCH.md` step 8;
`HANDOFF.md` §2 item 5). Group Zero's testers are the owner's real friend
groups, installing through the TestFlight public link and joining their Group by
invite code.

**Where each field goes:**

- **App-level, entered once:** App Store Connect → the app → **TestFlight** →
  sidebar, under *Additional* → **Test Information**. Beta App Description,
  Feedback Email, the URLs, and Beta App Review Information all live here and
  carry over to later builds.
- **Per build:** *What to Test* — the build's **Test Details**, also offered when
  the build is added to the external group. Each later build gets its own; a
  line on what changed is enough.

Apple requires the Beta App Description and the Beta App Review Information
before a build can go to external testers ([Provide test
information](https://developer.apple.com/help/app-store-connect/test-a-beta-version/provide-test-information/)).

**Field limits.** Apple's help pages name these fields but publish no character
limits (checked 2026-10-03). The limits below are **assumed**: 4,000 characters
for each long text field, the cap App Store Connect uses for its other long
text fields. The longest draft here is about half that, so the exact number
can't bite. If the form shows a different limit, the form wins.

| Field | Limit | Value |
| --- | --- | --- |
| Beta App Description | 4,000 chars (assumed) | §12.1 — 738 chars |
| What to Test (build 1) | 4,000 chars (assumed) | §12.2 — 1,301 chars |
| Feedback Email | one address | `support@catchupcolumn.com` — receives mail since 2026-10-24 (§12.3) |
| Marketing URL (optional) | one URL | `https://www.catchupcolumn.com` |
| Privacy Policy URL | one URL | `https://www.catchupcolumn.com/privacy` |
| Beta App Review contact: first name, last name, phone, email | one value each | `{{owner's name, phone, and an address that receives mail}}` |
| Sign-in required | checkbox | **Ticked** |
| User name / Password | one value each | `{{review account address}}` / `{{review account password}}` — §12.4 |
| Review Notes | 4,000 chars (assumed) | §12.5 — 2,137 chars |
| License Agreement | — | Leave Apple's standard EULA |

The character counts are for the text as written. Filling in the
`{{placeholders}}` changes them slightly.

### 12.1 Beta App Description

Testers see this in the TestFlight app. Uses the store voice (§3) and "your
people" (CLAUDE.md, Audience vocabulary).

```
Catch Up Column is a private weekly newspaper you make with your people — the friends you never see enough of, your family, or both.

Through the week, everyone in your Group writes a short post, with up to four photos if they like. On your Group's publish day it all comes together as one edition, delivered to everyone in the app and by email. No feed to scroll, no strangers, no ads — just the people you chose, catching up.

To join: whoever invited you will send an invite code. Install the app, tap "Create one", and sign up with your email — we send you a 6-digit code, so there's no password to make up. Then go to Groups → Join and enter the code.

Your posts are only ever seen by the members of your Group. iPhone only for now.
```

### 12.2 What to Test — build 1

Covers the five things this build exists to prove with real people: code
sign-up, invite-code join, writing a post, the edition arriving, and the email.

```
Thanks for trying Catch Up Column this early. You're in one of the first Groups ever to use it, so everything you notice helps, especially the small stuff.

What we'd love you to try:

1. Sign up. On the first screen tap "Create one", enter your email, and type in the 6-digit code we send you. Did the code arrive quickly? Did it land in spam?

2. Join your Group. Go to Groups → Join and enter the invite code you were sent.

3. Write a post for this week. Tap the + in the middle of the bottom bar. A few sentences is a real post; add up to four photos if you like. You can change it until the edition goes out.

4. Read the edition when it arrives. On your Group's publish day it shows up in the app (the Editions tab) and in your email. Does the email look right? Did it reach your inbox, or spam or Promotions?

5. Say yes to notifications when the app asks. That's how it tells you the edition is out, and it's the only notification it sends.

Something confusing, broken or slow? Take a screenshot in the app, tap the preview, and choose Share Beta Feedback. Or just tell whoever invited you. "I didn't know what to do here" is the most useful feedback there is.

iPhone only for now. If someone in your Group is on Android, tell whoever invited you. They can still get every edition by email.
```

The text deliberately sends feedback through TestFlight's screenshot feedback
and the organizer, not by email. Screenshot feedback reaches App Store Connect
with the device details attached (POSITIONING §6), and it doesn't depend on
§12.3's open item.

### 12.3 Feedback Email and URLs

- **Feedback Email:** `support@catchupcolumn.com`. This is the address
  `docs/SUPPORT.md` and `docs/PRIVACY.md` already publish, and the address
  in-app reports reach: **Report this story** sends through the `report-story`
  function since #64 (2026-10-31), and its "Email us instead" fallback drafts
  to `Strings.legal.supportEmail`.
  Apple shows it to testers in TestFlight and uses it as the reply-to on
  emailed invitations.

  > ✅ **Fixed 2026-10-24:** `support@` receives mail through Cloudflare Email
  > Routing (MX records on the apex), and a DMARC record (`p=none`) was added
  > the same day. The warning below is kept as it was written.
  >
  > ~~**{{TODO owner}}: this address can't receive mail yet.** As of 2026-10-03,
  > `catchupcolumn.com` has **no MX record**: `dig +short MX catchupcolumn.com`
  > returns nothing, and so do 1.1.1.1 and 8.8.8.8. Only `send.` has an MX, and
  > that one is Resend's bounce handling. Mail sent to `support@` has nowhere to
  > land, so this goes beyond TestFlight. The same address is on Guideline 1.2's
  > report path (§9), the privacy policy's deletion-by-email route, and the
  > DMARC `rua` in `LAUNCH.md` step 4. The DNS is on Cloudflare, so the smallest
  > fix is probably Cloudflare Email Routing, forwarding `support@` to your own
  > inbox. That is a DNS change, so it's yours to make. Then send a test from
  > another account. Until it's fixed, use an address you read here instead,
  > and switch to `support@` once mail arrives.~~
- **Marketing URL:** `https://www.catchupcolumn.com`. Optional.
- **Privacy Policy URL:** `https://www.catchupcolumn.com/privacy`. It is live
  and reads "Last updated September 28, 2026". Use `www`, as everywhere: the
  apex 308-redirects (§6).

### 12.4 Beta App Review Information — contact and demo account

**Contact information.** Enter `{{first name}}`, `{{last name}}`, `{{phone}}` and
`{{email}}` — the owner's. Apple uses these if the review stalls. Use an
address that receives mail (`support@` has since 2026-10-24).

**Sign-in information.** Tick **Sign-in required**. Then enter:

- **User name:** `{{review account address}}`
- **Password:** `{{review account password}}`

A reviewer can't receive our emailed code, which is why the review account
needs a password (`LAUNCH.md` step 8, Guideline 2.1(a)). The account must
not expire.

**Making the review account** (owner, on the production build, before
submitting for review — `HANDOFF.md` §1 and §2 item 5). Each step is a
production write.

1. **Address:** a `+alias` of the owner's own address, such as
   `{{you}}+appreview@{{your domain}}`, so the sign-in code reaches the owner.
   Never use a friend's account. Before relying on it, check that your mail
   provider delivers `+` addresses to you.
2. **Sign up** on the build with a code. For the display name use something
   plain, such as "App Review". Then go to Profile → **Set a password**: 8+
   characters, not a common one. Keep it in your password manager. If it's
   lost, *Forgot your password?* sends a code to the alias, so you can recover
   it, but the reviewer can't.
3. **Demo Group:** create `{{demo Group name}}`. Write one post with a photo.
   All content is the owner's own invention — never a real friend's writing.
4. **A second member — this step matters.** Make a second `+alias` account
   (e.g. `+appreview2`), join the demo Group by invite code, and write a post.
   *Report this story* is hidden on your own stories
   (`components/report-story-link.tsx`), and *Remove* only appears next to
   other members. Without a second member, the reviewer can't see either of
   Guideline 1.2's in-app affordances.
5. **Publish:** as the review account, open the Group page and tap **Publish
   now**. Edition 1 now exists. Both aliases get the edition email, which
   doubles as a check that it arrives.
6. **Rehearse the reviewer's path:** sign out, tap *Use a password instead*,
   and sign in with the review password.

If Apple reports the account is gone (for example, a reviewer tried *Delete my
account*), repeat steps 2–5 and update the sign-in information.

### 12.5 Review Notes

Replace `{{demo Group name}}` before pasting.

```
Catch Up Column is a private weekly newsletter for a small group of friends or a family. During the week, members write short posts (text, with up to four photos). On the Group's publish day, the app gathers them into one edition that everyone reads in the app and receives by email. Groups are invite-only. There is no public content, feed, search or discovery.

SIGNING IN
Accounts normally sign up and sign in with a 6-digit code we email to them. There is no password at sign-up. So that you don't need to receive our email, the demo account also has a password:
1. On the "Welcome back" screen, tap "Use a password instead".
2. Enter the email and password from Sign-in Information, then tap "Sign in".

THE DEMO ACCOUNT
It moderates a demo Group, "{{demo Group name}}", which has one published edition with posts from two members.
- Editions tab: open the edition, then tap a story to read it.
- The + button in the middle of the tab bar: write a post for this week's edition.
- Groups tab → the demo Group: its invite code, its members, and "Publish now", which turns this week's posts into an edition right away.

USER-GENERATED CONTENT (Guideline 1.2)
- Acceptable-use terms: https://www.catchupcolumn.com/terms, section 4.
- Report: every story by another member ends with "Report this story", which sends a report to our team from inside the app. It is hidden on your own stories.
- Remove: on the Group page, a moderator can tap "Remove" next to a member. Their unpublished posts are deleted with them.
Posts are only ever visible to members of the Group they were written in.

ACCOUNT DELETION
Profile → Delete my account. This permanently deletes the account.

PERMISSIONS
The app asks for notification permission, to say when an edition arrives, and photo library access, when you choose a profile photo or a Group cover. Photos for a post are chosen in the system photo picker. Both permissions are optional.

NOT IN THIS APP
No in-app purchases, subscriptions, ads, analytics or tracking, so there is no App Tracking Transparency prompt. Sentry crash reporting is on, and carries no name, email or content.

iPhone only.
```

Every claim above was checked against the code and `docs/PRIVACY.md` on
2026-10-03, and re-checked 2026-10-30 (§13.4):

- **No in-app purchases, ads or analytics:** none in `package.json` or the app.
- **Sentry carries no identity:** PRIVACY.md, "Crash reports"; §7. *(Until
  2026-10-30 this line also said Sentry was the only third-party SDK. Expo's
  SDKs talk to Expo too, for push tokens and updates — §7.)*
- **Photos is the only permission besides notifications:** the
  `expo-image-picker` plugin in `app.json` declares `photosPermission` only,
  with camera and microphone set to `false` (PR #58).
- **Push is only ever the edition notification:** the only push send is in
  `_shared/edition-dispatch.ts`.

If any of these changes before submission, update both this section and §7.

---

## 13. App Store 1.0 submission — the App Store Connect sheet

**Written 2026-10-30** for the first App Store submission. Group Zero was
skipped (owner, 2026-10-24), so this goes straight to App Store review once the
illustration rework lands and PRESUBMISSION's gates pass. Multi-photo posts ship
in 1.0 (owner, 2026-10-24).

### 13.1 Final field values

Every field the owner types in, once each. Limits are Apple's, checked
2026-10-30 against [App
information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information)
and [Platform version
information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information).
Counts were measured with a script on the text as written here; filling in a
`{{placeholder}}` changes them.

**New App dialog** (Apps → + → New App)

| Field | Value | Limit | Count |
| --- | --- | --- | --- |
| Platform | iOS | — | — |
| Name | `Catch Up Column` | 2–30 chars | 15 |
| Primary Language | English (U.S.) | — | — |
| Bundle ID | `com.catchupcolumn.app` | can't change after the first build upload | — |
| SKU | `catchupcolumn-ios` | letters, numbers, `-` `.` `_`; can't change | 17 |
| User Access | Full Access | — | — |

**App Information** (app level — shared by every version)

| Field | Value | Limit | Count |
| --- | --- | --- | --- |
| Name | `Catch Up Column` | 30 chars | 15 |
| Subtitle | `A newspaper by your people` (§2) | 30 chars | 26 |
| Category | Primary **Social Networking**, secondary **Lifestyle** | — | — |
| Content Rights | **Yes, it contains third-party content, and I have the necessary rights** (owner, 2026-10-30): members' posts and photos are theirs, licensed to the app by Terms §3; Lora and Jost are SIL Open Font License; **the artist's contract must grant the rights to the commissioned illustrations** | — | — |
| Age Rating | §9.1. Calculated **4+**, overridden to **18+** to match Terms §1 (owner, 2026-10-30) | — | — |
| Made for Kids | No | — | — |
| Privacy Policy URL | `https://www.catchupcolumn.com/privacy` | — | — |
| License Agreement | Apple's standard EULA | — | — |
| Digital Services Act — trader status | **Trader** (owner, 2026-10-30). Set at the account level (Business → Agreements → Compliance → Digital Services Act), then per app (App Information → App Store Regulations and Permits). Apple shows a trader's address (a P.O. box is allowed for an individual), phone and email on EU product pages: ☐ `{{trader address or P.O. box}}`, `{{trader phone}}`, `{{trader email}}`. It verifies the phone and email by code, asks for a current document showing the name and address (and, for a P.O. box, one linking you to it), and wants payment account details if they aren't already in App Store Connect ([DSA trader requirements](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/)) | — | — |
| Regulated medical device | Not asked: not a Health & Fitness or Medical app, and no "frequent" medical content | — | — |

**App Privacy** — §7, plus the same Privacy Policy URL.

**Pricing and Availability**

| Field | Value |
| --- | --- |
| Price | Free (USD 0.00) |
| Availability | **Every country or region except China mainland** (owner, 2026-10-30), which needs an ICP Filing Number this app doesn't have. The EU stays in, with the trader status above |

**Version 1.0 — iOS App Version page**

| Field | Value | Limit | Count |
| --- | --- | --- | --- |
| Screenshots | §5 — required: iPhone with Dynamic Island (medium display); also the large display | 1–10 per size | — |
| Promotional Text | §3 | 170 chars | 146 |
| Description | §3, the code block | 4,000 chars | 948 |
| Keywords | §4 | 100 bytes | 93 |
| Support URL | `https://www.catchupcolumn.com/support` | — | — |
| Marketing URL | `https://www.catchupcolumn.com` | — | — |
| Version | `1.0.0` — matches `expo.version` in `app.json` | — | — |
| Copyright | `2026 {{owner's legal name, or the business name}}` — Apple adds the © | — | — |
| What's New | Not shown for a first version | 4,000 chars | — |
| Build | The production build that passed PRESUBMISSION Gates 5 and 7 | — | — |
| App Review — Sign-in required | **Ticked** | — | — |
| App Review — User name / Password | `{{review account address}}` / `{{review account password}}` (§13.2) | — | — |
| App Review — Contact | `{{first name}}`, `{{last name}}`, `{{phone, international format, e.g. +1 …}}`, `{{an email the owner reads}}` | phone needs `+` and country code | — |
| App Review — Notes | §13.3 | 4,000 bytes | 3,717 before the two names are filled in (2026-11-02) |
| Version Release | **Manually release this version** (owner, 2026-10-30), so the release and `appStoreUrl` in `web/config.js` (LAUNCH step 11) go out together | — | — |
| Accessibility Nutrition Labels | Leave blank for 1.0. Voluntary for now ([overview](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels/)); declare a feature only once it is verified on a device | — | — |
| In-App Purchases, Game Center, App Clip | None | — | — |
| Export compliance | Answered by the build: `ITSAppUsesNonExemptEncryption: false` (§10) | — | — |

### 13.2 App Review Information — the review account and demo Group

Adapted from §12.4. **Owner, on the production build, before submitting.** Each
step is a production write.

1. **Address:** a `+alias` of the owner's own address, such as
   `{{you}}+appreview@{{your domain}}`, so the sign-in code reaches the owner.
   Never use a friend's account. Check first that your mail provider delivers
   `+` addresses to you.
2. **Sign up** on the build with a code. Use a plain display name, such as
   "App Review". Then Profile → **Set a password**: 8+ characters, not a common
   one. Keep it in your password manager. If it's lost, *Forgot your password?*
   sends a code to the alias, so you can recover it; the reviewer can't. The
   account must not expire (Guideline 2.1(a)).
3. **Demo Group:** create `{{DEMO GROUP NAME}}` as the review account, so it is
   the moderator. Write one post with two or three photos, to show multi-photo.
4. **A second member — this step matters.** Make a second `+alias` account
   (e.g. `+appreview2`) named `{{SECOND MEMBER NAME}}`, join the demo Group by
   invite code, and write a post with a photo. *Report this story* and *Block*
   show only at the foot of someone else's story
   (`components/story-foot-actions.tsx`), and *Remove* only appears next to
   other members, so without a second member the reviewer sees none of them.
   (*Take down this story* shows on every story for the moderator, the review
   account's own included.)
5. **Publish:** as the review account, open the Group page and tap **Publish
   now**. Edition 1 now exists with both posts. Both aliases get the edition
   email, which also checks that it arrives.
6. **Rehearse the reviewer's path:** sign out, tap *Use a password instead*, and
   sign in with the review password.

All the writing and photos are the owner's own — never a real friend's words or
face. The same Group can supply the screenshots (§5).

**If the reviewer changes things.** Each of these is a production write, as
above:

- **Remove** takes the second member out of the Group and bans them. As the
  review account, tap **Let back in** on them under "Removed" on the Group page,
  then rejoin as them with the invite code. Rejoining alone is refused until
  then.
- **Block** is undone with **Unblock**, on the second member's row of the Group
  page, as the review account.
- **Take down** can't be undone. Write the story again as its author, then tap
  **Publish now** as the review account; it lands in a new edition.
- **Delete my account** on the review account deletes it, and the demo Group
  passes to the second member, who becomes its moderator (#65). Start again from
  step 1 with a new review account and demo Group.

Then update the sign-in information if the account changed.

### 13.3 Review Notes

Paste into App Review Information → Notes. **Before pasting,** fill
`{{DEMO GROUP NAME}}` and `{{SECOND MEMBER NAME}}` (twice).

**The Guideline 1.2 block was filled in 2026-11-02** from what shipped
(#64–#70; §9.3), in the owner's approved wording: the version without a word
filter, whose "Filtering:" line makes the structural case and whose Report line
says it "sends to our team from inside the app". The response time, within 24
hours, is the owner's (2026-10-30). As written, placeholders included, it is
3,717 bytes of 4,000, measured with a script on the text between the fences,
and all ASCII. Re-measure after filling in the names.

```
Catch Up Column is a private weekly newspaper for a small group of friends or a family. During the week, members of a Group write short posts: text, with up to four photos. On the Group's publish day the app gathers them into one edition, which every member reads in the app and receives by email. Groups are invite-only. There is no public content, feed, search or discovery, no likes or comments, and no way to reach anyone outside your own Groups.

SIGNING IN
People normally sign up and sign in with a 6-digit code we email them, so there is no password at sign-up. So that you don't need to receive our email, the demo account also has a password:
1. On the first screen, "Welcome back", tap "Use a password instead".
2. Enter the email and password from Sign-in Information, then tap "Sign in".

THE DEMO ACCOUNT
It is the moderator of a demo Group, "{{DEMO GROUP NAME}}". The Group has a second member, {{SECOND MEMBER NAME}}, and one published edition with posts from both.
- Editions tab: open the edition, then tap a story to read it.
- The + button in the middle of the tab bar: write a post for this week's edition. "Add a photo" puts up to four photos into it.
- Groups tab, then the demo Group: its invite code, its members, and "Publish now", which turns this week's posts into an edition right away.

USER-GENERATED CONTENT (Guideline 1.2)
- Terms: sign-up ("Create one" on the first screen) asks people to tap "Agree and email me a code". Our Terms (https://www.catchupcolumn.com/terms, sections 4-5) have zero tolerance for objectionable content and abusive users.
- Filtering: there is no public posting. Only people a Group's moderator invited can post, a removed member can't rejoin, and each post reaches only that Group's few members, so objectionable material is filtered by people: the moderator can take any story down, any member can block its author, and we act on reports within 24 hours.
- Report, Block, Take down: under {{SECOND MEMBER NAME}}'s story. Report sends to our team from inside the app. Block hides all their stories from you, in the app and in emails; Unblock is on the Group page. Take down (moderators) deletes a story and its photos, even after publishing.
- Remove: on the Group page. They lose access, their unpublished posts are deleted, and the invite code no longer lets them back in ("Let back in" undoes it).
- Leave: on the Group page, for members who aren't the moderator.
- Contact: support@catchupcolumn.com, https://www.catchupcolumn.com/support, and Profile > Help & support. We act on every report within 24 hours.

ACCOUNT DELETION (Guideline 5.1.1(v))
Profile tab, then "Delete my account", below "Sign out". It permanently deletes the account, its posts and photos, and its Group memberships.

NOTIFICATIONS
After sign-in the app asks to send notifications. Saying no changes nothing else. The only notification is "Your Group is ready!", sent when a Group the person belongs to publishes an edition; tapping it opens that edition. Nothing is sent for marketing. Each Group's page has switches for that Group's edition email and notification.

PERMISSIONS
Photo library access is requested when choosing a profile photo or a Group cover. Photos for a post are chosen in the system photo picker. The app has no camera, microphone, location or contacts access.

SIGN IN WITH APPLE (Guideline 4.8)
Not applicable: the app has no third-party or social login. Accounts are the app's own email accounts (an emailed code, or an optional password).

NOT IN THIS APP
No in-app purchases, subscriptions, ads, analytics or tracking, so there is no App Tracking Transparency prompt. Crash reports go to Sentry and carry no name, email or post content.

iPhone only.
```

**Sign in with Apple, checked 2026-10-30.** Guideline 4.8 applies only to
"Apps that use a third-party or social login service … to set up or
authenticate the user's primary account". This app has none: `lib/auth.ts`
uses Supabase's email code (`signInWithOtp`/`verifyOtp`) and email password
(`signInWithPassword`) only, with no OAuth or ID-token sign-in anywhere. It also
fits the first exemption: "Your app exclusively uses your company's own account
setup and sign-in systems."

### 13.4 What the listing claims, and the evidence

Checked against `main` at `e627f38`, 2026-10-30. The Guideline 1.2 rows (and
the rows they replaced) were checked against `main` at `afff6b8`, 2026-11-02,
when the `edition-dispatch.ts` line numbers, moved by #70, were re-pointed too.

| Claim | Evidence |
| --- | --- |
| Posts hold up to four photos | `lib/post-blocks.ts:12` (`MAX_POST_PHOTOS = 4`); `app/(tabs)/post.tsx:95-96` (multi-select, `selectionLimit`) |
| Delivered in the app, by email, and by notification | `supabase/functions/_shared/edition-dispatch.ts` (Resend send; `pushEdition`, `:479`) |
| The only push is the edition notification, and a tap opens the edition | `_shared/edition-dispatch.ts:498-499` is the only push payload; `app/_layout.tsx:119-124` routes the tap (PR #60) |
| Push permission is asked after sign-in | `hooks/use-auth.ts:65,104` → `lib/notifications.ts:69-72` |
| One-tap unsubscribe | `_shared/edition-dispatch.ts:210-211` (`List-Unsubscribe`, one-click POST); `supabase/functions/unsubscribe/index.ts:5-8` (a GET unsubscribes) |
| Each Group has its own publish day and time | `groups.publish_day`/`publish_time`/`timezone` (CLAUDE.md schema); `lib/groups.ts:83` |
| Invite by code | `join_group_by_invite_code`, `supabase/migrations/20260505000000_critical_security_fixes.sql:64` |
| Posts are only seen by the Group's members | RLS (CLAUDE.md, Supabase Setup Notes); `web/edition/index.html:41` is a deep-link bouncer that shows no content |
| No ads, analytics or tracking SDKs | `package.json` dependencies; no ATT prompt |
| Crash reports carry no identity | `app/_layout.tsx:40-57` (`sendDefaultPii: false`, `tracesSampleRate: 0`, query strings stripped) |
| Expo receives the push token and an install ID | `lib/notifications.ts:88` (`getExpoPushTokenAsync`); `expo-updates/ios/EXUpdates/AppLoader/FileDownloader.swift:448` (`EAS-Client-ID`) |
| Only the photo library permission | `app.json` plugins: `photosPermission`, `cameraPermission: false`, `microphonePermission: false`, `faceIDPermission: false` (PR #58) |
| Library access asked for profile photo and Group cover; posts use the system picker | `app/(tabs)/profile.tsx:119`, `app/group/[id].tsx:292`, `app/group/create.tsx:69`, `app/(auth)/onboarding.tsx:105` request it; `app/(tabs)/post.tsx:93` doesn't |
| "Use a password instead" on "Welcome back" | `app/index.tsx` redirects to `/(auth)/login`; `app/(auth)/login.tsx:91,119`; `components/password-sign-in.tsx:72,108` |
| Terms at sign-up: "Agree and email me a code" | `app/(auth)/signup.tsx:83-86` (`TermsAgreement`, then `Strings.terms.agreeCta`); `lib/auth.ts:103-104` (`terms_accepted_at`, `terms_version`, sent only on the sign-up call that creates the account) |
| Terms §4–5: zero tolerance, report, block, remove, take down | `docs/TERMS.md`, `web/terms.html` (effective 2026-11-02) |
| Report, Block (anyone else's story), Take down (moderators, every story) at a story's foot | `components/story-foot-actions.tsx:24-31` |
| Report sends from inside the app | `lib/report.ts:51-52` (`sendStoryReport` → `functions.invoke('report-story')`); `supabase/functions/report-story/index.ts` (one Resend email to `support@`, Reply-To the reporter); the drafted email is only the failure fallback (`components/report-story-sheet.tsx:64-65`) |
| Block hides their stories in the app and in emails; Unblock on the Group page | `supabase/migrations/20261101204252_user_blocks.sql:127-132` (the posts SELECT policy adds `not is_blocked_by_caller(author_id)`); `_shared/edition-dispatch.ts:275` (each recipient's `hidden_author_ids`); `components/group-members.tsx:63-80` (Blocked chip, Unblock) |
| Take down deletes a story and its photos, even after publishing | `supabase/migrations/20261101195755_take_down_post.sql:48,115` (`operator_take_down_post`, `take_down_post`); `components/take-down-story-link.tsx` |
| Remove (moderator) and Leave (any other member) | `components/group-members.tsx:90` (Remove, moderator-only, not your own row); `app/group/[id].tsx:561-566` (Leave, non-moderators) |
| Removal deletes unpublished posts, and the code no longer lets them back in | `supabase/migrations/20261030172102_removal_bans.sql:96-116` (`operator_remove_group_member`, `edition_id is null`), `:267` (the join raises `removed_from_group`), `:202` (`unban_group_member`, "Let back in" in `components/removed-members.tsx:32-36`) |
| Each Group's page has an email switch and a notification switch | `components/delivery-settings.tsx:44,51`; `supabase/migrations/20261101195502_delivery_settings.sql:29` (`set_delivery_preferences`) |
| Profile → Help & support | `app/(tabs)/profile.tsx:408-412` |
| Reports acted on within 24 hours | Owner, 2026-10-30; the app's thank-you line (`constants/strings.ts:45`); `docs/MODERATION.md` |
| Account deletion in Profile | `app/(tabs)/profile.tsx:230-245,392-402`; `supabase/functions/delete-account/index.ts:69`; posts cascade (`001_initial_schema.sql:48`); a Group passes to another member, or is deleted if no one else is in it (`20261030172045_creator_account_deletion.sql`, `hand_over_groups` and the `on_user_deletion` trigger) |
| No third-party login | `lib/auth.ts:50-154` |
| Groups tab label | `components/custom-tab-bar.tsx:21` |
| No web browsing beyond our own pages | `app/(tabs)/profile.tsx:408,417,426` and `components/terms-agreement.tsx:14` are the only in-app browser opens (support, privacy, terms) |
| Terms minimum age is 18 | `docs/TERMS.md:10`, `web/terms.html:23` (live) |
| support@ receives mail; DMARC set | `dig +short MX catchupcolumn.com` → Cloudflare `route1-3.mx.cloudflare.net`; `_dmarc` TXT `v=DMARC1; p=none; rua=mailto:support@catchupcolumn.com` (both read 2026-10-30) |
| URLs live | `curl` 2026-10-30: `/`, `/privacy`, `/terms`, `/support`, `/delete-account` → 200; apex → 308 to `www` |
| iPhone only | `app.json` `ios.supportsTablet: false` |
| Export compliance | `app.json` `ITSAppUsesNonExemptEncryption: false` |

### 13.5 Owner items before submitting

**Decided by the owner, 2026-10-30:** the 18+ age-rating override, with Terms
§1 staying at 18; Messaging and Chat, Yes; Content Rights, Yes; EU trader
status; every region except China mainland; manual release; reports answered
within 24 hours; no privacy row for Expo's install ID; and the Guideline 1.2
gaps closed in code before the final build. **Then, for that work:** one-way
block, "Let back in", no word filter, reports sent from inside the app, email
and push switches for each Group, existing accounts not asked to re-agree to the
Terms (2026-10-30); take-downs are silent, so the author isn't told
(2026-11-01); Customer Support declared on the privacy label, and the support
inbox disclosed in the privacy policy and on the delete-account page
(2026-11-02).

**Done 2026-11-02:** ~~☐ **The Guideline 1.2 work** — being scoped in a
separate session. When it lands, update §9.3 and fill or delete the markers in
§13.3.~~ It shipped as #64–#70; §9.3 and §13.3 are updated.

**Still open** — each is marked ☐ where it appears above:

- ☐ **Copyright holder** and the **App Review contact** (§13.1).
- ☐ **Trader contact details** for the DSA form (§13.1).
- ☐ **Screenshot sizes** in Media Manager (§5).
- The review account, demo Group and its second member (§13.2), and the
  screenshots — after the illustration rework.
