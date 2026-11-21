# BẾP NHÀ — Test plan

Status: **revision 4 (local-first).** What has actually been run is listed in README; everything else here is a plan.

Tests are split into two tracks. **Track A** needs no particular device and gates every milestone. **Track B** needs mother's iPhone and runs in a later stage (roadmap M5); nothing in Track B blocks development.

## 1. Levels

| level | tool | covers |
| --- | --- | --- |
| unit | Vitest | quantity maths, fractions, unit conversion, servings scaling, version diff, suggestion scoring, voice command matching, timer arithmetic |
| data rules | Vitest + fake-indexeddb | `data/repo.ts`: frozen versions, pointers, archive vs delete, session ↔ version link |
| backup | Vitest | package → restore round trip is identical; corrupted, truncated or incomplete packages are refused and current data is untouched |
| end to end | Playwright (`e2e/`, `npm run test:e2e`), phone-sized Chrome, against the built static site | offline cooking flow, backup → restore on another device, delete/restore, text size — covers acceptance scenarios 1–9 and 11–16 except real speech output |
| manual, real device | mother's phone | voice, timers with the screen locked, wet-hand use, sunlight readability |
| usability | mother herself | can she cook one dish unaided? |

## 2. Acceptance scenarios

| # | scenario | pass when |
| --- | --- | --- |
| 1 | Open on a smartphone | home renders, no horizontal scroll, text ≥ 18 px |
| 2 | Find a recipe by name | "ca kho" (no diacritics) finds Cá kho tộ |
| 3 | Open a recipe, read ingredients | food and seasonings separate, household + metric shown |
| 4 | Change servings | quantities rescale, fractions readable, seasoning note appears |
| 5 | Adjust quantities | steppers work, original amount still visible |
| 6 | Save a family version | new version exists, original untouched, reason stored |
| 7 | Start cooking | cooking mode opens on the preferred version, screen stays on |
| 8 | Move between steps | next, back, repeat; progress bar correct |
| 9 | Listen in Vietnamese | step is read with a vi-VN voice; adjusted quantities are the ones spoken |
| 10 | Voice commands (where supported) | Track A: command matching unit-tested, and tested in a desktop browser with recognition. Track B: on the iPhone |
| 11 | Timer | Track A: starts, pauses, resumes, rings, correct after the tab was in the background. Track B: behaviour with the phone locked |
| 12 | Finish the session | session saved as completed with the right version |
| 13 | Submit feedback | verdict and note stored; "save as family version" offered when appropriate |
| 14 | Review history | entry shows date, dish, version, changes, verdict |
| 15 | Reopen the saved family recipe | opens on the family version; compare and restore work |
| 16 | Refresh | everything above is still there |

## 3. Edge cases

| area | case | expected |
| --- | --- | --- |
| text | all three text sizes, 200% browser zoom | no clipping, no overlap, no horizontal scroll |
| touch | every control | ≥ 56 px, ≥ 12 px apart (automated check) |
| Vietnamese | ễ ặ ỡ ữ in titles, buttons, speech | no clipped marks; search works with and without marks |
| network | slow 3G | skeletons, then content; no blank screens |
| network | offline for the whole session | everything works; nothing to sync |
| images | missing or failed | "Chưa có ảnh" tile, layout unchanged |
| microphone | permission denied | explanation + buttons; no repeated prompts |
| voice | no recognition in this browser | microphone replaced by guidance |
| voice | no Vietnamese voice installed | "Đọc" replaced by explanation |
| voice | unknown phrase, noisy room | "Chưa nghe rõ", nothing happens |
| voice | app speaking while listening | it does not react to its own voice |
| data | empty library, empty journal, no favourites | friendly empty state with one next action |
| input | quantity empty, 0, negative, 9999, letters | refused with a plain message; save disabled |
| versions | edit after the version was cooked | a new version is created; the journal entry is unchanged |
| versions | restore original | family versions still listed in history |
| session | close the app mid-cook | "Nấu tiếp" returns to the same step with timers corrected |
| session | double tap "Nấu xong" | one session |
| scaling | 1 → 12 servings, 4 → 1 | sensible rounding, no "0 muỗng" |
| privacy | network panel during a full session | no request leaves the device except loading the app and a YouTube embed she starts |
| backup | export then import into an empty project | identical recipes, versions and history |

## 4. Bug handling

Severity: **critical** (data loss, cannot cook) · **major** (a P0 flow fails or misleads) · **minor** · **cosmetic**. The MVP is not called ready with any critical or major bug open. Each report: steps, expected, actual, device/browser, screenshot.

## 5. Devices and browsers

Primary: mother's iPhone (model and iOS version to be confirmed), tested both as a Safari tab and as a Home Screen app — see PRD §12. Also: Chrome on Android, Chrome and Safari on desktop, one tablet. Voice support is recorded per browser in a table in the README once measured — measured, not assumed.

## 6. Track A — independent tests (every stage)

| area | tests |
| --- | --- |
| persistence | everything survives reload, closing the browser, and an app update (database upgrade) |
| viewing and search | scenarios 1–4; search with and without diacritics; by ingredient, category, equipment |
| versions | scenarios 5, 6, 15; original never overwritten; history complete after ten adjustments; a cooked version cannot be changed |
| cooking and history | scenarios 7, 8, 11–14, 16; each journal entry opens the exact version cooked; closing mid-cook resumes at the same step |
| read aloud | scenario 9 in a desktop browser with a Vietnamese voice; no-voice fallback; adjusted quantities are the ones spoken |
| recipe management | create, edit; "Xoá món" archives and "Món đã xoá" restores; permanent delete only for a never-cooked dish; a sample stays "chưa kiểm chứng" until confirmed |
| backup and restore | export → wipe → restore, records and photos identical; refusal of damaged packages; restore point allows undo; reminder after 7 days of unsaved changes; recipe pack import never overwrites |
| offline | the installed app opens and works with no network |
| privacy | no outgoing requests (automated scan of the build, as in My Gym Progress) |

## 7. Track B — real iPhone, later stage

| # | check | record |
| --- | --- | --- |
| B1 | Vietnamese voice quality and speed; first-tap rule | works / needs setting |
| B2 | Speech and alarm with the silent switch on | audible or not |
| B3 | Voice commands in a Safari tab and from the Home Screen | per command: recognised or not |
| B4 | Screen stays on in a Safari tab and from the Home Screen | yes / no, iOS version |
| B5 | Timer after locking the phone for 1 and 10 minutes | corrected time on return; whether any alarm sounded |
| B6 | Data still present after 8+ days without opening — in a Safari tab and from the Home Screen | present / cleared |
| B10 | "Sao lưu" saves the ZIP to Files / iCloud Drive; "Khôi phục" reads it back | works / fallback needed |
| B7 | Camera photo of the finished dish | upload works |
| B8 | Mother cooks one dish unaided | where she hesitated |
| B9 | Readability by the stove: text size, glare, wet-finger taps | notes |

A Track B failure changes what the app shows (feature marked unavailable, workaround explained); it does not block the features in Track A.
