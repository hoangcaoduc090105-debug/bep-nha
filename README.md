# BẾP NHÀ

A private cooking web app for one Vietnamese family. It remembers how *our* family likes each dish and guides the cook step by step, in large text and by voice, so the dish tastes the same every time.

- Local-first, like My Gym Progress: **all data stays on the device** (IndexedDB). No backend, no account, no API key, no cost.
- A static site (GitHub Pages), installed to the phone's Home Screen.
- Backup is a file the user saves with one tap; there is no automatic backup.

## Status (2026-11-21)

**Working now (stages G1–G4, deployed; plus finishing a meal without a rating, built and tested but not yet deployed):**
- Ten sample recipes; recipe list with search (no diacritics needed) and category filter.
- Recipe page with servings scaling; adjust quantities → saved as "Bản nhà mình" with a reason, original kept; version history; switch back to the original.
- Cooking mode: ingredient checklist, one step per screen, timers, read-aloud, screen wake lock, resume after closing.
- Feedback after cooking, or "Xong, không ghi nhận xét" to finish without rating (the meal is still in the journal; an unrated meal cannot approve a dish); journal tied to the exact version cooked; favourites.
- Settings: text size, voice, how the app addresses the cook.
- Backup and restore: one ZIP with all data and photos, checksums, full verification before anything is replaced, undo of the last restore, reminder after 7 days of unsaved changes.
- "Xoá món" moves a dish to "Món đã xoá" (restorable).
- **Recipe editor (G4):** "Thêm món mới" and "Sửa món", in five parts — name and photo, ingredients and seasonings, equipment, steps, source. Amounts are entered with large − / + buttons or typed on the number pad ("1,5", "1/2"); units are chosen from large buttons. In step text an ingredient is inserted with a button and shows as `[nước mắm]`, with a preview of the sentence as it will read when cooking; every step needs "Được khi…" and "Tránh…". Work in progress is saved on every change and survives closing the app.
- **What saving an edit does:** name, photo, categories and source are simply updated. A change to ingredients or steps becomes a new "Bản nhà mình" with a reason, the old version kept — except for a dish the family typed in that has never been cooked, which is corrected in place. An app sample is never overwritten.
- **Dish photos (G4):** take or choose one photo per dish; it is reduced to at most 1600 px (about 200–400 KB) before it is stored, which also drops the location data. Photos are part of the backup.
- **Sources:** "Của nhà mình", "Viết lại theo video YouTube" (link required, shown with the label "Viết lại theo video" and a link to the video — the video is not played inside the app yet), or a book / website.
- **Recipe packs (G4):** "Gửi món này cho máy khác" on a dish, or Cài đặt → "Gửi và nhận món" for several. The file carries dishes, their versions and photos — not the journal. Receiving only adds: dishes already on the phone keep their name, photo, version in use and history, and receiving can be undone.
- A dish typed in or received is labelled "Mới nhập – chưa nấu thử" until the family approves it after a well-rated meal.
- **Installable and offline:** web manifest, app icon, and a service worker that stores the whole app (about 1.6 MB) on the device. An update is offered with one tap.
- **Nothing leaves the device:** the built site carries a content-security policy that makes the browser refuse connections to any other server (a YouTube video she chooses to play is the one exception, for a later stage).
- **Deployed:** https://hoangcaoduc090105-debug.github.io/bep-nha/ — published by `.github/workflows/deploy.yml` on every push to `main`, after the full check passes.

**Not built, by decision (2026-11-21):** the goal is "mother opens the app, picks a dish and cooks", so most of G5 and all of G7 were dropped — a photo after each cooking session, "Nhà đang có gì?", suggestions, equipment filter, taste profile, voice commands, weekly plan, shopping list. Playing the YouTube video inside the app is kept for later, only if her recipes come from videos. See [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md).

### What has actually been checked
- `npm run check`: type check, lint, 97 unit and data-rule tests, static build — all pass.
- `npm run test:e2e`: 6 end-to-end tests against the built site, each run twice — in Google Chrome at Pixel 7 size, and in WebKit (the engine Safari uses) at the size of mother's iPhone 14 Pro Max, 430 pt — 12 runs, all pass. WebKit here is Playwright's desktop build, **not Safari on a real iPhone**: it catches layout and engine differences, not the camera, the share sheet, sound or the screen lock.
  1. first visit, then **network switched off**: reload, search "ca kho", change servings, lower the fish sauce and save the family version, cook all six steps with a timer and a reload mid-cook, rate it, approve it, find it in the journal — with zero requests to any other server;
  2. cook and back up in one browser, then in a second, empty browser ("another phone"): a non-backup file is refused, the real backup shows its summary, restores, and the restore is undone;
  3. delete a dish and bring it back; largest text size without horizontal scroll;
  4. (G4) write a new dish with a 3000 × 2000 photo (stored as a 1600 px JPEG under 600 KB), typed and stepped amounts, a unit change, an inserted ingredient with its preview, a typed amount refused, a reload mid-way with the draft intact, the missing "Tránh…" and the wrong video link both reported; correct it in place while uncooked; cook it; edit it again into a new "Bản nhà mình"; send it as a file; the file is refused as a backup; a second browser refuses a non-pack, receives the dish with photo and both versions and no journal, receives it again with nothing added, and undoes the receipt; the full backup then counts 1 photo — with zero requests to any other server;
  5. (G4) at the largest text size the editor has no horizontal scroll; a sample opened and saved untouched changes nothing; a real change to a sample becomes "Bản nhà mình" and the sample text stays;
  6. a dish is cooked and ended with "Xong, không ghi nhận xét" — it is in the journal, nothing is left "đang nấu dở", and neither approval nor adjustment is asked.
- Two things the WebKit run showed, neither a fault in the app: (a) in a throw-away browser session WebKit behaves like Safari's Private Browsing and refuses to store photos in IndexedDB, so the tests give each WebKit "phone" a profile folder on disk (`e2e/fixtures.ts`) — **in a Private Browsing tab on an iPhone, adding a photo or receiving a dish with a photo will fail**; from the Home Screen it is not private; (b) WebKit reports look-ahead requests it dropped on navigation as "cancelled", which the offline test now ignores.
- Checked by the owner on mother's iPhone 14 Pro Max (iOS 26.5): adding to the Home Screen and cooking step by step work. Read-aloud uses the phone's ordinary Vietnamese voice, accepted for now.
- **Not checked:** finishing without a rating on the live site (not deployed yet) and on a real phone · **on mother's iPhone: the timer alarm with the silent switch on, the timer after the screen has been locked, whether the screen stays on while cooking** · the camera and photo library on an iPhone, and HEIC photos · sharing a recipe pack through the share sheet, and opening one received through Zalo or AirDrop (it has to be saved to Files first, then chosen in "Nhận món") · typing Vietnamese with the iPhone keyboard in the editor · real Safari (only Playwright's WebKit) · the iPhone share sheet for the backup file (the tests use the download path) · the alarm sound · read-aloud quality · screen readers.

### About the sample recipes
The ten dishes are samples written for this app in the common Southern home style. **None has been cooked or verified by the family**, and each is labelled "Mẫu – chưa kiểm chứng" everywhere. A dish becomes "Gia đình đã duyệt" only when confirmed after a well-rated meal. Treat the quantities as a starting point to correct.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000  (no offline mode in development)
npm run check      # typecheck + lint + unit tests + static build (output in out/)
npm run test:e2e   # builds, then runs the end-to-end tests in the installed Google Chrome and in WebKit (once: npx playwright install webkit)
```

`/design` shows every base component. Generated files: design tokens (`node scripts/build-tokens.mjs` after editing `replica/design/tokens.json`), icons (`node scripts/build-icons.mjs` after editing `public/icon.svg`), and `out/sw.js` (written by the build).

## Deployment

Repository: https://github.com/hoangcaoduc090105-debug/bep-nha · Pages source: GitHub Actions.
To publish a change: commit and `git push`. The workflow runs the full check and publishes `out/`; a failing test stops the deployment. Phones that already have the app show "Bếp Nhà có bản mới — Cập nhật".

On a free GitHub account, Pages needs a **public** repository. The repository holds only the app and the sample recipes; the family's own recipes, history and photos stay on the phone and are never in it.

## Put it on mother's iPhone

1. Open https://hoangcaoduc090105-debug.github.io/bep-nha/ in Safari.
2. Share button → "Thêm vào Màn hình chính". Open Bếp Nhà from the new icon from then on — the Home Screen copy has its own storage, and Safari does not clear it after a week.
3. Cài đặt in the app shows whether it is running from the Home Screen.
4. After adding or adjusting recipes: Cài đặt → Sao lưu ngay, and keep the file in iCloud Drive.

## Documents

| file | what |
| --- | --- |
| [PRD.md](PRD.md) | requirements, flows, screens; §15 is the current local-first model |
| [ARCHITECTURE.md](ARCHITECTURE.md) | stack, structure, backup design, build stages |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | local data model and the rules that protect history |
| [STORAGE_PROPOSAL.md](STORAGE_PROPOSAL.md) | why local-first; options compared; Google Drive kept as a later option (Vietnamese) |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | visual direction and components |
| [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) | stages G1–G7 |
| [TEST_PLAN.md](TEST_PLAN.md) | acceptance scenarios; Track A (independent) and Track B (real iPhone) |
| [replica/](replica/) | Cookpad recon, feature matrix, channel research, design tokens |

## Code map

```
app/            screens: / · cong-thuc · cong-thuc/mon · cong-thuc/chinh · cong-thuc/soan (editor) · dang-nau · nhat-ky · yeu-thich · cai-dat · cai-dat/mon (packs) · design
components/ui/  base components · components/editor/ the editor's cards and fields
data/           types.ts · db.ts (Dexie) · repo.ts (all rules) · seed/
features/       recipe-text (scaling, step text, speech) · cooking (timers, alarm, wake lock) · voice (read-aloud)
                · editor (form, validation, form → version) · photos (resize) · backup (package, restore, recipe packs)
lib/            quantity formatting, labels, helpers
tests/          quantity and step text · data rules · timers · backup and recipe packs · editor
```
