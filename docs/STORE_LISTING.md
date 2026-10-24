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

> Confirm the bundle ID is final before the first TestFlight build — it locks when
> the first build is uploaded, not at submission. See `LAUNCH.md` step 7.

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

```
No feeds to scroll. No strangers. No ads. Just the people you choose, catching up.

Catch Up Column is a private weekly newspaper you make together — with the friends
you never see enough of, or with your family, or both.

Through the week, everyone adds short updates and photos. On your group's publish
day, Catch Up Column gathers it all into one beautifully laid-out edition and
delivers it to everyone — in the app, by email, and by a gentle notification.

• Start a group and invite your people with a simple code
• Write short posts and add a photo — no pressure, no formatting to fuss over
• Every group has its own publish day and time
• Read each edition as a warm, newspaper-styled issue
• Get editions by email too, with one-tap unsubscribe
• Big, readable type and large buttons — made to be easy for everyone

Catch Up Column is built to be warm, simple, and private. Your posts are only ever
seen by the members of your group.
```

**Promotional text (iOS, 170 char, updatable without review):**
`The group text scrolls away. This doesn't. Everyone writes a little through the week; on publish day it arrives as one warm edition, for everyone.`

> This field updates without a review cycle, so it is the cheapest place to A/B
> the pitch after launch (POSITIONING §2).

## 4. Keywords (iOS, 100 char total, comma-separated)

`family,friends,newsletter,journal,group,private,weekly,memories,photos,together,updates,diary`

Dropped `grandparents` (12 chars) and added `friends` (7) — the audience change,
and it frees 5 chars against the cap. `family` stays: families are still a
first-class audience and it is the higher-volume search term.

## 5. Screenshots (owner to capture)

Capture from a device/simulator with real sample content:
- **iPhone 6.9" (required)** — Home, an edition front page, the composer, a group.
- **iPhone 6.5"** (optional but recommended for older devices).
- **iPad** — not required: `ios.supportsTablet` is now `false`, so the app ships
  iPhone-only and no iPad screenshots are needed.
- **Android phone** — same 4 screens. **7" and 10" tablet** shots optional.

Best storytelling shot: a compiled edition front page (the product's payoff).

## 6. URLs required at submission

All live and returning 200 as of 2026-09-24. Use the `www` host — the apex
308-redirects to it.

| Field | Store | Value |
| --- | --- | --- |
| Privacy Policy URL | Both (required) | `https://www.catchupcolumn.com/privacy` |
| Support URL | iOS (required) | `https://www.catchupcolumn.com/support` |
| Marketing URL | iOS (optional) | `https://www.catchupcolumn.com` |
| Account deletion URL | Google Play (required) | `https://www.catchupcolumn.com/delete-account` |
| Support email | Google Play (required) | `support@catchupcolumn.com` |

> These URLs are also wired into the app's Profile screen (Privacy / Terms links)
> via `Strings.legal` in `constants/strings.ts`. The pages are served from `web/`
> (`privacy.html`, `terms.html`, `support.html`, `delete-account.html`) — the
> `docs/*.md` files are the source copy those were built from.

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
| Crash Data (Diagnostics) | Yes | App Functionality | **No** — not linked |
| Other Diagnostic Data | Yes | App Functionality | **No** — not linked |

Crash Data was added 2026-09-14 when Sentry was wired in (docs/POSITIONING.md
§11). It is the only category here **not** linked to identity: the SDK runs with
`sendDefaultPii: false`, no user identification, no performance tracing and no
session replay, so reports carry a stack trace, device model, OS and app version
and nothing that ties back to a person. See docs/PRIVACY.md.

Not collected: location, contacts, browsing/search history, purchases, financial
info, health, advertising data, usage/analytics.
**No App Tracking Transparency prompt is needed** — nothing here is used for
tracking. Sentry is the only third-party SDK that receives data, and only the
diagnostic payload described above.

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

- The app has **user-generated content** shared within private invited groups (no
  public feed, no discovery). Answer the UGC questions accordingly; there is no
  moderation of public content because content is not public.
- **Apple Guideline 1.2 — covered.** Acceptable-use terms (`docs/TERMS.md` §4), a
  **Report this story** path on every story, and moderator removal of a member
  (`remove_group_member`) — all shipped in PR #14 (2026-08-05); removal verified
  against production 2026-09-22. See `docs/LAUNCH.md` step 9.
- No violence, sexual content, profanity, gambling, or drugs in the app itself.
- Expected outcome: **4+ (Apple)** / **Everyone (Google)**, with the UGC disclosure.

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
| Beta App Description | 4,000 chars (assumed) | §12.1 — 728 chars |
| What to Test (build 1) | 4,000 chars (assumed) | §12.2 — 1,291 chars |
| Feedback Email | one address | `support@catchupcolumn.com` — **read the warning in §12.3** |
| Marketing URL (optional) | one URL | `https://www.catchupcolumn.com` |
| Privacy Policy URL | one URL | `https://www.catchupcolumn.com/privacy` |
| Beta App Review contact: first name, last name, phone, email | one value each | `{{owner's name, phone, and an address that receives mail}}` |
| Sign-in required | checkbox | **Ticked** |
| User name / Password | one value each | `{{review account address}}` / `{{review account password}}` — §12.4 |
| Review Notes | 4,000 chars (assumed) | §12.5 — 2,084 chars |
| License Agreement | — | Leave Apple's standard EULA |

The character counts are for the text as written. Filling in the
`{{placeholders}}` changes them slightly.

### 12.1 Beta App Description

Testers see this in the TestFlight app. Uses the store voice (§3) and "your
people" (CLAUDE.md, Audience vocabulary).

```
Catch Up Column is a private weekly newspaper you make with your people — the friends you never see enough of, your family, or both.

Through the week, everyone in your Group writes a short post, with a photo if they like. On your Group's publish day it all comes together as one edition, delivered to everyone in the app and by email. No feed to scroll, no strangers, no ads — just the people you chose, catching up.

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

3. Write a post for this week. Tap the + in the middle of the bottom bar. A few sentences is a real post; add a photo if you like. You can change it until the edition goes out.

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

  > **{{TODO owner}}: this address can't receive mail yet.** As of 2026-10-03,
  > `catchupcolumn.com` has **no MX record**: `dig +short MX catchupcolumn.com`
  > returns nothing, and so do 1.1.1.1 and 8.8.8.8. Only `send.` has an MX, and
  > that one is Resend's bounce handling. Mail sent to `support@` has nowhere to
  > land, so this goes beyond TestFlight. The same address is on Guideline 1.2's
  > report path (§9), the privacy policy's deletion-by-email route, and the
  > DMARC `rua` in `LAUNCH.md` step 4. The DNS is on Cloudflare, so the smallest
  > fix is probably Cloudflare Email Routing, forwarding `support@` to your own
  > inbox. That is a DNS change, so it's yours to make. Then send a test from
  > another account. Until it's fixed, use an address you read here instead,
  > and switch to `support@` once mail arrives.
- **Marketing URL:** `https://www.catchupcolumn.com`. Optional.
- **Privacy Policy URL:** `https://www.catchupcolumn.com/privacy`. It is live
  and reads "Last updated September 28, 2026". Use `www`, as everywhere: the
  apex 308-redirects (§6).

### 12.4 Beta App Review Information — contact and demo account

**Contact information.** Enter `{{first name}}`, `{{last name}}`, `{{phone}}` and
`{{email}}` — the owner's. Apple uses these if the review stalls. Use an
address that receives mail, which rules out `support@` until §12.3 is fixed.

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
Catch Up Column is a private weekly newsletter for a small group of friends or a family. During the week, members write short posts (text and an optional photo). On the Group's publish day, the app gathers them into one edition that everyone reads in the app and receives by email. Groups are invite-only. There is no public content, feed, search or discovery.

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
The app asks for notification permission, to say when an edition arrives, and photo library access, to attach a photo to a post or profile. Both are optional.

NOT IN THIS APP
No in-app purchases, subscriptions, ads, analytics or tracking, so there is no App Tracking Transparency prompt. The only third-party SDK is Sentry crash reporting, which carries no name, email or content.

iPhone only.
```

Every claim above is checked against the code and `docs/PRIVACY.md` as of
2026-10-03:

- **No in-app purchases, ads or analytics:** none in `package.json` or the app.
- **Sentry is the only third-party SDK and carries no identity:** PRIVACY.md,
  "Crash reports"; §7.
- **Photos is the only permission besides notifications:** the
  `expo-image-picker` plugin in `app.json` declares `photosPermission` only.
- **Push is only ever the edition notification:** the only push send is in
  `_shared/edition-dispatch.ts`.

If any of these changes before submission, update both this section and §7.
