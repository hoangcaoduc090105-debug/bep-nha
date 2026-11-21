# BẾP NHÀ

A private cooking web app for one Vietnamese family. It remembers how *our* family likes each dish and guides the cook step by step, in large text and by voice, so the dish tastes the same every time.

- Local-first, like My Gym Progress: **all data stays on the device** (IndexedDB). No backend, no account, no API key, no cost.
- A static site (GitHub Pages), installed to the phone's Home Screen.
- Backup is a file the user saves with one tap; there is no automatic backup.

## Status (2026-11-21)

**Working now (stages G1–G3):**
- Ten sample recipes; recipe list with search (no diacritics needed) and category filter.
- Recipe page with servings scaling; adjust quantities → saved as "Bản nhà mình" with a reason, original kept; version history; switch back to the original.
- Cooking mode: ingredient checklist, one step per screen, timers, read-aloud, screen wake lock, resume after closing.
- Feedback after cooking; journal tied to the exact version cooked; favourites.
- Settings: text size, voice, how the app addresses the cook.
- Backup and restore: one ZIP with all data and photos, checksums, full verification before anything is replaced, undo of the last restore, reminder after 7 days of unsaved changes.
- "Xoá món" moves a dish to "Món đã xoá" (restorable).
- **Installable and offline:** web manifest, app icon, and a service worker that stores the whole app (about 1.6 MB) on the device. An update is offered with one tap.
- **Nothing leaves the device:** the built site carries a content-security policy that makes the browser refuse connections to any other server (a YouTube video she chooses to play is the one exception, for a later stage).
- A GitHub Pages workflow is written (`.github/workflows/deploy.yml`). **The app is not deployed yet** — there is no Git repository.

**Not built yet:** recipe editor and photos · recipe packs · "Nhà đang có gì?", suggestions, equipment filter, taste profile, voice commands · weekly plan and shopping list. See [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md).

### What has actually been checked
- `npm run check`: type check, lint, 54 unit and data-rule tests, static build — all pass.
- `npm run test:e2e`: 3 end-to-end tests in Google Chrome at phone size, against the built site — all pass:
  1. first visit, then **network switched off**: reload, search "ca kho", change servings, lower the fish sauce and save the family version, cook all six steps with a timer and a reload mid-cook, rate it, approve it, find it in the journal — with zero requests to any other server;
  2. cook and back up in one browser, then in a second, empty browser ("another phone"): a non-backup file is refused, the real backup shows its summary, restores, and the restore is undone;
  3. delete a dish and bring it back; largest text size without horizontal scroll.
- A build with a GitHub Pages style prefix (`/bep-nha`) was inspected: links, manifest and service worker all carry the prefix.
- **Not checked:** an actual deployment on GitHub Pages · any real phone · Safari · adding to the iPhone Home Screen · the iPhone share sheet for the backup file (the tests use the download path) · the alarm sound · read-aloud quality · screen readers.

### About the sample recipes
The ten dishes are samples written for this app in the common Southern home style. **None has been cooked or verified by the family**, and each is labelled "Mẫu – chưa kiểm chứng" everywhere. A dish becomes "Gia đình đã duyệt" only when confirmed after a well-rated meal. Treat the quantities as a starting point to correct.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000  (no offline mode in development)
npm run check      # typecheck + lint + unit tests + static build (output in out/)
npm run test:e2e   # builds, then runs the end-to-end tests in the installed Google Chrome
```

`/design` shows every base component. Generated files: design tokens (`node scripts/build-tokens.mjs` after editing `replica/design/tokens.json`), icons (`node scripts/build-icons.mjs` after editing `public/icon.svg`), and `out/sw.js` (written by the build).

## Deploy to GitHub Pages (not done yet)

1. Create a repository on GitHub and push this folder to its `main` branch.
2. In the repository: Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. The workflow runs the full check and publishes `out/`. The link is `https://<user>.github.io/<repository>/`.

On a free GitHub account, Pages needs a **public** repository. The repository holds only the app and the sample recipes; the family's own recipes, history and photos stay on the phone and are never in it.

## Put it on mother's iPhone

1. Open the link in Safari.
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
app/            screens: / · cong-thuc · cong-thuc/mon · cong-thuc/chinh · dang-nau · nhat-ky · yeu-thich · design
components/ui/  base components
data/           types.ts · db.ts (Dexie) · repo.ts (all rules) · seed/
features/       recipe-text (scaling, step text, speech) · cooking (timers, alarm, wake lock) · voice (read-aloud)
lib/            quantity formatting, labels, helpers
tests/          quantity and step text · data rules · timers
```
