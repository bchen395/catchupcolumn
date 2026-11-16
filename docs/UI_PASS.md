# The UI pass — decisions to build

**Working document, decided by the owner 2026-11-08 (grilled screen by screen in
the simulator), written up 2026-11-15. Delete each section when it ships.**

The owner's notes on every screen, settled one question at a time. Nothing here
is built yet. Build order and how it interleaves with
[LOOP_SPEC.md](./LOOP_SPEC.md) are in [HANDOFF.md](./HANDOFF.md) → Next steps.

Rules that hold for every item:
- Read `frontend-design` before any of it. Where an item changes a rule in
  `design/BRAND.md` (the composer's finishing action, the masthead line, the
  ghost button), update BRAND **in the same PR**.
- Everything here is JS or copy, so it rides an OTA, except where marked
  **server** (a migration or a function deploy, which asks first).
- Leave the drawings alone. The redrawn set replaces them; judge only the space
  around them.

Already filed from the same pass: [#80](https://github.com/bchen395/catchupcolumn/issues/80)
(Use a password instead keeps the typed email),
[#81](https://github.com/bchen395/catchupcolumn/issues/81) (remove "Photo by …"
from the reader, Home and the email; **server**: redeploy `compile-editions` and
`publish-edition-now`),
[#82](https://github.com/bchen395/catchupcolumn/issues/82) (first text block
looser than the text after a photo; measure first, and if the drop cap is the
cause, come back to the owner before changing it),
[#83](https://github.com/bchen395/catchupcolumn/issues/83) (Sentry test event,
build 10's runtime only; rides the next OTA, removed before the final build).

---

## 1. Everywhere: text buttons that look tappable

The 19 ghost buttons are bare ink text, so in "Already have an account? Sign
in" nothing shows which part to tap.

- **The lead-in** ("Already have an account?") goes soft grey, regular weight.
- **The action** stays ink, medium weight, with a **thin underline offset a
  little below the letters**. No colour needed, which is what accessibility
  guidance asks for.
- Done once in the shared button component, so all 19 change together. Build
  this **first**: it touches every screen.

## 2. Sign-up, sign-in and the code screen

Copy as decided (owner: "use these as written"):

**Create your account**
> We'll email you a 6-digit code — no password needed.
> *[Email address]*
> By tapping Agree, you accept our Terms and Privacy Policy.
> *Terms* · *Privacy Policy* — two separate ≥48 pt link buttons
> **[Agree and email me a code]** — unchanged word for word (the Review Notes quote it)
> Already have an account? *Sign in*

The long zero-tolerance explanation goes; Terms §4–5 carry it and the Review
Notes point there. **Privacy Policy is a new link.** The invite banner ("You're
joining …") still sits above everything when arriving from an invite.

**Check your email**
> We sent a 6-digit code to **name@example.com**. It expires in 10 minutes. Not there? Check spam.
> **[Create my account]**
> *Send a new code* · *Use a different email*

Only "Not there? Check spam." is new; the address is bold.

**Welcome back**: the same subtitle as sign-up, "We'll email you a 6-digit code
— no password needed." Plus #80.

## 3. Home

- **Remove the rotating motto line** (all five). The masthead is the date, then
  the greeting.
- **The kicker:** "Hot off the press" while the hero edition is unread, "Latest
  edition" once read. NEW stays beside it.
- **Remove the "Write for this week" block** and its rotating lines (they had
  drifted into writing prompts, which CLAUDE.md rules out). In its place, a
  quiet **"Write yours"** link in the this-week strip, shown **only until you've
  written this week**. With LOOP_SPEC §2, "written" means filed (a Done).
  Update CLAUDE.md's `deckLines` mention when this lands.
- **Several new editions at once:** the hero shows the newest; under it, one
  line per other unread edition, "Also new: {Group} →", gone once read.
- **The paperboy stays static** (owner: "for now"). Riding in is a post-launch
  maybe.

## 4. Editions tab

- Each Group shows its **latest 3 editions, then "All N editions →"**, which
  opens that Group's full list. No collapsing.
- Rows get the same **NEW** marker as Home until read.
- Drop "writers" from the row's line ("6 STORIES").
- **One hidden dog stays**, at the very end. A dog per Group is post-launch.

## 5. An edition (front page)

- **Drop "· N writers"** from the masthead line everywhere. It always equals
  the story count (one story per person per week). LOOP_SPEC §3a drops the whole
  line for one-story editions; do both in one change.
- **Front-page cards: headline, photo and byline only.** No preview text, no
  greeked bars.
- **An untitled story uses its opening words as the headline** (about 8 words,
  with "…") in place of "From Henry".
- **No subtitle field.**

## 6. Compose

- **No "File my story" and no Save button.** A small **Done** at the top right,
  like Notes. Done saves at once, closes the keyboard, and the status shows.
  **Autosave stays.**
- **The FILED stamp** lands on the **first Done of each week** only; later
  Dones are silent. With LOOP_SPEC §2, Done is what sets `posts.filed_at`
  (the spec says "File my story"; read it as Done).
- **The bottom bar is tools only:** the photo icon, then the calendar icon on
  the left; the status on the right, soft grey, no box: "Saving…" → "Saved".
  No "· in Sunday's edition": the masthead already says "Your story will run in
  Sunday's edition."
- **Photo button: icon only**, ≥48 pt, VoiceOver "Add a photo". Once there's a
  photo, a count beside it: "1/4"… (VoiceOver "2 of 4 used"). At 4/4 it dims,
  and a tap says "Up to 4 photos in a story".
- **Today's date button:** an icon-only calendar, VoiceOver "Insert today's
  date". Inserts the date in the phone's own format and language
  (`Wednesday, Nov 11`; a UK phone gets `Wednesday 11 Nov`) **on its own line**,
  starting a new line if mid-paragraph, with the cursor on the line below.

## 7. Groups tab

Each Group row gains:
- **The members' faces:** up to 5 small overlapping avatars, then "+3", in
  place of "6 MEMBERS".
- **When the next edition comes out:** "Next edition Sunday, 9 am".

Never anything like "3 of 6 have written".

## 8. A Group (the Group's page)

- Leave pop-up: **Cancel / Leave** (not Stay).
- **"Leave this Group" in error red** (`#B3261E` via its token, not vermilion),
  as red text; a red outline only if the ghost style can show one cleanly. The
  pop-up's Leave is red too (iOS's destructive style).
- Under "Invite your people": only **"Anyone with this code can join."**
- **Edit settings:** a full-width **Save changes**, with **Discard changes** as
  a quiet text button under it. Discard just closes, with no confirmation.
- The invite ticket is replaced by the **press pass** in the redrawn set.
- Share an invitation and the QR code: a test, in phone check batch 3.

## 9. The invite page (signed out)

- **Signed-out visitors see first names and faces** of who's already there
  ("Henry and Maya are already here", with their photos). Last names stay for
  signed-in people. **Server:** widen `get_invite_preview` on purpose (the
  migration that narrowed it says widening must be deliberate), and update the
  privacy policy and `docs/PRIVACY.md`, which say the preview shows no members.
- **Open question for the owner, from LOOP_SPEC §1:** the new web join page
  calls the same anon RPC, so it would show the faces on the open web to anyone
  with the link. Decide before building §1 whether the web page shows them too.

## 10. Profile

- **"From the desk of" stays.**
- Fix: the initial isn't centered in the avatar circle.
- The mug: wait for the redraw, then decide (remove if it still feels off).

## 11. Screens not yet walked

Onboarding (name and photo), join by code, the welcome screen after joining,
Set a password, and the story reader (beyond #81/#82). The 11-08 walk stopped
at the invite page. Walk them **after LOOP_SPEC §1 lands**, since it changes
the join path.

## Post-launch (also in todo.md)

- **Sign in with Apple**, the first update after launch. Apple only; Google
  once there's Android. Needs Hide My Email relay set up for Resend,
  revoke-on-delete in `delete-account`, and a duplicate-account design.
- **Dark mode.** Needs dark versions of the drawings first. Ruled out for 1.0
  on 2026-11-08 (BRAND §2 already planned it as a token pass).
- **A dog for each Group**: an idea for the artist after the current set.
- **The paperboy riding in** on Home, once the new art's wheels are separate.
