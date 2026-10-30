# App Store & Play Store Listing — Catch Up Column

Draft metadata and the exact answers to the privacy questionnaires, ready to paste
into App Store Connect and Google Play Console. Anything in `{{curly braces}}` or a
blockquote is an owner decision/input. **☐ owner to confirm** marks a judgment
call; each one carries a recommendation.

**Ready for the App Store 1.0 submission — 2026-10-30.** Group Zero was skipped
(owner, 2026-10-24), so there is no external TestFlight and no Beta App Review:
the app goes to App Store review once the illustration rework lands and the
presubmission checks pass. **§13 is the App Store Connect sheet** (every field,
the review account, the Review Notes). §12, written for TestFlight, is kept for
later. Every claim here was re-checked against `main` on 2026-10-30; §13.4 has
the evidence.

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
| Content rating target | 4+ calculated (iOS), **but Terms §1 sets a minimum age of 18 — §9.1's override row** / Everyone, with user-generated content flag (Android) |
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
data. ☐ **owner to confirm** that it needs no row; recommendation: none,
because the ID identifies an install, not a person, and it is used to deliver
updates.

**Not declared, and why:**

- *Customer Support* — *Report this story* and support mail go through the
  person's own mail app (`lib/report.ts`, a `mailto:`). Nothing leaves through
  the app.
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
| Capabilities | Unrestricted Web Access | No | The only web pages it opens are our own privacy policy and terms, in an in-app browser sheet (`app/(tabs)/profile.tsx`). Post text isn't turned into links |
| Capabilities | User-Generated Content | **Yes** | Members write posts and add photos that the rest of their Group reads. Apple's definition says "broad distribution", and a Group is a handful of invited people, but Yes keeps 4+ and is the Guideline 1.2 position already taken (LAUNCH step 9; PRESUBMISSION Gate 6: "flag user-generated content") |
| Capabilities | Social Media | No | Apple: "a social feed or similar discovery method that visibly spreads content to many users". There is no feed, discovery, likes, comments, shares or view counts; a post never leaves its Group (CLAUDE.md, Non-features) |
| Capabilities | Social Media Disabled for Users Under 13 | No | Only applies to apps with social media |
| Capabilities | Messaging and Chat | ☐ **owner to confirm** — recommend **Yes** | Apple: "Users can directly communicate with one another … May include … direct and/or group messaging". A post is a weekly message to the whole Group, though there is no chat, DM or reply. Yes keeps 4+; Brazil's rating moves from A6 to A12 |
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
| Additional Information | Age Categories and Override | ☐ **owner to confirm** — recommend **Override to Higher Age Rating → 18+** | Terms §1, live at `/terms`: "You must be at least 18 years old to create an account." Apple: "If your app has a EULA with minimum age requirements that exceed the rating that Apple calculated, you must override to a rating that adheres to the requirements." So 4+ can't stand beside Terms §1 as written. The other way out is to lower Terms §1 first and override to match: the privacy policy only says the app is "not directed at children under 13", and family Groups may want teenagers in them. That is a legal-text change, so it is the owner's |
| Additional Information | Made for Kids | No | Not a kids' app |
| Additional Information | Age Suitability URL | Leave blank | Optional |

**Regional ratings**, from the same values page: Brazil self-rates A6 with
User-Generated Content, or A12 if Messaging and Chat is Yes. Australia's 16+
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

### 9.3 Guideline 1.2 — what ships, and what it doesn't cover

The published guideline asks UGC apps for four things
([App Review Guidelines
1.2](https://developer.apple.com/app-store/review/guidelines/#user-generated-content),
checked 2026-10-30):

| 1.2 asks for | What the app has | Gap |
| --- | --- | --- |
| "A method for filtering objectionable material from being posted to the app" | Nothing automatic. Groups are invite-only, and a moderator can remove a member | **No filter.** Needs a code change if App Review insists |
| "A mechanism to report offensive content and timely responses to concerns" | *Report this story* under every story by someone else (`components/report-story-link.tsx`), drafting an email to `support@` with the story's ids (`lib/report.ts`). `support@` receives mail since 2026-10-24 | ☐ **owner to confirm** a response time for the Review Notes. Also: a moderator can't take down one published post, so acting on a report means deleting the row by hand in Supabase |
| "The ability to block abusive users from the service" | *Remove* on the Group page, moderator-only (`app/group/[id].tsx` → `remove_group_member`); any member but the moderator can *Leave this Group* | **No block for an ordinary member,** and **removal isn't a ban:** `join_group_by_invite_code` has no ban check and the app has no way to issue a new invite code, so a removed member who still has the code can rejoin. Needs a code change (a ban on removal, or a way to issue a new invite code) |
| "Published contact information so users can easily reach you" | `support@catchupcolumn.com`, the Support URL, Terms §4 and §11 | — |

PR #14 (2026-08-05) shipped the report and remove halves, and moderator removal
was verified against production 2026-09-22 (`LAUNCH.md` step 9). There is also
no in-app agreement to the Terms at sign-up: they are linked only from Profile.
App Review's 1.2 rejections often ask for one, though the published guideline
text doesn't. These gaps are reported to the owner; this doc doesn't change
code.

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
> Sentry as the only SDK); nothing else was revised.

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
| Review Notes | 4,000 chars (assumed) | §12.5 — 2,141 chars |
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
  `docs/SUPPORT.md` and `docs/PRIVACY.md` already publish, and the address the
  in-app **Report this story** link writes to (`Strings.legal.supportEmail`).
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
- Report: every story by another member ends with "Report this story", which drafts an email to us with the story's identifiers. It is hidden on your own stories.
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
| Content Rights | ☐ **owner to confirm** — recommend **Yes, it contains third-party content, and I have the necessary rights**: members' posts and photos are theirs, licensed to the app by Terms §3; Lora and Jost are SIL Open Font License; the commissioned illustrations need a rights grant in the artist's contract | — | — |
| Age Rating | §9.1. Calculated **4+**; ☐ override (recommend **18+**, to match Terms §1) | — | — |
| Made for Kids | No | — | — |
| Privacy Policy URL | `https://www.catchupcolumn.com/privacy` | — | — |
| License Agreement | Apple's standard EULA | — | — |
| Digital Services Act — trader status | ☐ **owner to confirm** — recommend **Trader**, if the app is sold in the EU. Apple's factors include "commercial practices towards consumers … promoting products or services"; the app is free today, but it is the front of a planned print business (POSITIONING §5). A trader's address (a P.O. box is allowed for an individual), phone and email are shown on EU product pages, and Apple verifies them. The other choice is to leave the EU out of Availability for 1.0 ([DSA trader requirements](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/)) | — | — |
| Regulated medical device | Not asked: not a Health & Fitness or Medical app, and no "frequent" medical content | — | — |

**App Privacy** — §7, plus the same Privacy Policy URL.

**Pricing and Availability**

| Field | Value |
| --- | --- |
| Price | Free (USD 0.00) |
| Availability | ☐ **owner to confirm** — recommend **every country or region except China mainland**, which needs an ICP Filing Number this app doesn't have. Leave out the EU too if the DSA answer above is "not for 1.0" |

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
| App Review — Notes | §13.3 | 4,000 bytes | 3,260 |
| Version Release | ☐ **owner to confirm** — recommend **Manually release this version**, so the release and `appStoreUrl` in `web/config.js` (LAUNCH step 11) go out together | — | — |
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
   invite code, and write a post with a photo. *Report this story* is hidden on
   your own stories (`components/report-story-link.tsx`), and *Remove* only
   appears next to other members, so without a second member the reviewer sees
   neither of Guideline 1.2's in-app affordances.
5. **Publish:** as the review account, open the Group page and tap **Publish
   now**. Edition 1 now exists with both posts. Both aliases get the edition
   email, which also checks that it arrives.
6. **Rehearse the reviewer's path:** sign out, tap *Use a password instead*, and
   sign in with the review password.

All the writing and photos are the owner's own — never a real friend's words or
face. The same Group can supply the screenshots (§5).

**If the reviewer changes things.** *Remove* takes the second member out of the
Group; rejoin as them with the invite code. *Delete my account* on the review
account deletes it, and the demo Group passes to the second member. In either
case, repeat the steps that were undone, then update the sign-in information.

### 13.3 Review Notes

Paste into App Review Information → Notes. Fill the three placeholders first:
`{{DEMO GROUP NAME}}`, `{{SECOND MEMBER NAME}}` (twice), and
`{{RESPONSE TIME …}}` — a promise the owner can keep, or delete the line.
Plain ASCII, so characters and bytes match: 3,260 bytes of 4,000.

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
- Terms: https://www.catchupcolumn.com/terms, section 4 (acceptable use) and section 5 (moderators).
- Report: every story by another member ends with "Report this story". It opens an email to support@catchupcolumn.com with the story's identifiers filled in. It is hidden on your own stories, so open {{SECOND MEMBER NAME}}'s story to see it.
- Remove: on the Group page, the moderator can tap "Remove" next to any other member. That person loses access to the Group, and anything they wrote for the coming edition is deleted.
- Leave: any member who isn't its moderator can leave a Group from its page ("Leave this Group").
- Contact: support@catchupcolumn.com and https://www.catchupcolumn.com/support. {{RESPONSE TIME, e.g. We act on every report within 24 hours.}}
Posts are only ever visible to members of the Group they were written in.

ACCOUNT DELETION (Guideline 5.1.1(v))
Profile tab, then "Delete my account", below "Sign out". It permanently deletes the account, its posts and photos, and its Group memberships.

NOTIFICATIONS
After sign-in the app asks to send notifications. Saying no changes nothing else. The only notification is "Your Group is ready!", sent when a Group the person belongs to publishes an edition; tapping it opens that edition. Nothing is sent for marketing.

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

Checked against `main` at `e627f38`, 2026-10-30.

| Claim | Evidence |
| --- | --- |
| Posts hold up to four photos | `lib/post-blocks.ts:12` (`MAX_POST_PHOTOS = 4`); `app/(tabs)/post.tsx:95-96` (multi-select, `selectionLimit`) |
| Delivered in the app, by email, and by notification | `supabase/functions/_shared/edition-dispatch.ts` (Resend send; `pushEdition`, `:451`) |
| The only push is the edition notification, and a tap opens the edition | `_shared/edition-dispatch.ts:470-471` is the only push payload; `app/_layout.tsx:119-124` routes the tap (PR #60) |
| Push permission is asked after sign-in | `hooks/use-auth.ts:65,104` → `lib/notifications.ts:69-72` |
| One-tap unsubscribe | `_shared/edition-dispatch.ts:205-206` (`List-Unsubscribe`, one-click POST); `supabase/functions/unsubscribe/index.ts:5-8` (a GET unsubscribes) |
| Each Group has its own publish day and time | `groups.publish_day`/`publish_time`/`timezone` (CLAUDE.md schema); `lib/groups.ts:83` |
| Invite by code | `join_group_by_invite_code`, `supabase/migrations/20260505000000_critical_security_fixes.sql:64` |
| Posts are only seen by the Group's members | RLS (CLAUDE.md, Supabase Setup Notes); `web/edition/index.html:41` is a deep-link bouncer that shows no content |
| No ads, analytics or tracking SDKs | `package.json` dependencies; no ATT prompt |
| Crash reports carry no identity | `app/_layout.tsx:40-57` (`sendDefaultPii: false`, `tracesSampleRate: 0`, query strings stripped) |
| Expo receives the push token and an install ID | `lib/notifications.ts:88` (`getExpoPushTokenAsync`); `expo-updates/ios/EXUpdates/AppLoader/FileDownloader.swift:448` (`EAS-Client-ID`) |
| Only the photo library permission | `app.json` plugins: `photosPermission`, `cameraPermission: false`, `microphonePermission: false`, `faceIDPermission: false` (PR #58) |
| Library access asked for profile photo and Group cover; posts use the system picker | `app/(tabs)/profile.tsx:119`, `app/group/[id].tsx:292`, `app/group/create.tsx:69`, `app/(auth)/onboarding.tsx:105` request it; `app/(tabs)/post.tsx:93` doesn't |
| "Use a password instead" on "Welcome back" | `app/index.tsx` redirects to `/(auth)/login`; `app/(auth)/login.tsx:91,119`; `components/password-sign-in.tsx:72,108` |
| Report this story, hidden on your own | `components/report-story-link.tsx:27` (`return null` for the author); `lib/report.ts` (mailto to `Strings.legal.supportEmail`) |
| Remove (moderator) and Leave (any other member) | `app/group/[id].tsx:604-608` (Remove, moderator-only, not your own row), `:654-660` (Leave, non-moderators) |
| Removal deletes unpublished posts | `supabase/migrations/20260806003026_member_moderation.sql` (`edition_id is null`) |
| Account deletion in Profile | `app/(tabs)/profile.tsx:230-245,392-402`; `supabase/functions/delete-account/index.ts:69`; posts cascade (`001_initial_schema.sql:48`) |
| No third-party login | `lib/auth.ts:50-154` |
| Groups tab label | `components/custom-tab-bar.tsx:21` |
| No web browsing beyond our own pages | `app/(tabs)/profile.tsx:408,417` are the only in-app browser opens |
| Terms minimum age is 18 | `docs/TERMS.md:10`, `web/terms.html:23` (live) |
| support@ receives mail; DMARC set | `dig +short MX catchupcolumn.com` → Cloudflare `route1-3.mx.cloudflare.net`; `_dmarc` TXT `v=DMARC1; p=none; rua=mailto:support@catchupcolumn.com` (both read 2026-10-30) |
| URLs live | `curl` 2026-10-30: `/`, `/privacy`, `/terms`, `/support`, `/delete-account` → 200; apex → 308 to `www` |
| iPhone only | `app.json` `ios.supportsTablet: false` |
| Export compliance | `app.json` `ITSAppUsesNonExemptEncryption: false` |

### 13.5 Owner items before submitting

Each is marked ☐ where it appears above.

- ☐ **Age rating override** — 18+ to match Terms §1, or change Terms §1 first
  (§9.1).
- ☐ **Messaging and Chat** — recommend Yes (§9.1).
- ☐ **Guideline 1.2 gaps** — no content filter, no member-level block,
  removal isn't a ban; decide whether to fix in code before submitting
  (§9.3).
- ☐ **Report response time** for the Review Notes (§13.3).
- ☐ **Content Rights** — recommend Yes (§13.1).
- ☐ **DSA trader status** and **Availability** (§13.1).
- ☐ **Version Release** — recommend manual (§13.1).
- ☐ **Copyright holder** and the **review contact** (§13.1).
- ☐ **Expo install ID** needs no privacy row (§7).
- ☐ **Screenshot sizes** in Media Manager (§5).
- The review account, demo Group and its second member (§13.2), and the
  screenshots — after the illustration rework.
