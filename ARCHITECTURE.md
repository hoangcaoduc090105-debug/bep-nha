# BẾP NHÀ — Architecture

Status: **approved 2026-11-21, revision 4 — local-first.** Same model as the owner's earlier app My Gym Progress. Background and the options that were compared: [STORAGE_PROPOSAL.md](STORAGE_PROPOSAL.md) (§12 is the approved outcome).

Earlier revisions (Supabase, sign-in, Vercel functions) are withdrawn. Nothing of them was ever implemented.

## 1. In one paragraph

A static web app. All data and photos live in the phone's browser database (IndexedDB). There is no backend, no account, no sign-in, no API key and no outside service at run time. It is installed to the Home Screen as a PWA and works offline. Backups are a ZIP package the user saves with one tap; the app reminds when a backup is due.

## 2. Stack

| layer | choice | why |
| --- | --- | --- |
| app | Next.js 16 (App Router) + React 19 + TypeScript, built as a **static export** | already scaffolded; a static export needs no server |
| styling | Tailwind 4 with design tokens | tokens in one file |
| icons / font | Lucide · Be Vietnam Pro (bundled at build time) | open licences, no network request at run time |
| storage | IndexedDB through **Dexie 4** | same library as My Gym Progress; simple, well tested |
| validation | Zod | one schema for forms, import and backup checks |
| backup | `fflate` (ZIP in the browser) + SHA-256 from Web Crypto | no service involved |
| voice | Web Speech API | built into the browser |
| PWA | web manifest + service worker (offline app shell) | installable; and a Home Screen app is exempt from Safari's 7-day storage clearing |
| tests | Vitest (logic, data rules with `fake-indexeddb`) · Playwright (flows) | |
| hosting | **GitHub Pages** | free, no usage limits to watch, already familiar |

Not used: Supabase, Firebase, Vercel functions, Google APIs, any AI API, analytics.

## 3. Shape

```
┌──────────────── Phone browser / Home Screen app ────────────────┐
│  Screens (app/)  ──▶  components/ui                              │
│        │                                                         │
│  Feature logic (pure TypeScript)                                 │
│     quantities · scaling · step text · versions · suggestions    │
│     voice commands · timers · backup package                     │
│        │                                                         │
│  data/repo.ts  ── the only code that touches the database        │
│        │                                                         │
│  IndexedDB (Dexie): recipes · versions · sessions · images · …   │
└───────────────┬──────────────────────────────────────────────────┘
                │ one tap: "Sao lưu"                ▲ "Khôi phục"
                ▼                                   │
        ZIP package (data.json + images + manifest with checksums)
        saved by the user: Files app / iCloud Drive / anywhere
```

- Screens never talk to Dexie directly; they call `data/repo.ts`. The rules that protect history live there and are unit-tested.
- Recipe content is data (seed JSON loaded into the database on first run), never hard-coded in components.
- Because the site is static, recipe pages use a query parameter (`/cong-thuc/mon?id=…`), not a path segment: recipe ids only exist on the device.

### Folders
```
app/                 screens (Trang chủ, cong-thuc, dang-nau, nhat-ky, yeu-thich, cai-dat, design)
components/ui/       base components
data/                types.ts · db.ts (Dexie) · repo.ts · seed/
features/            pure logic + hooks (recipe-text, cooking, voice, backup…)
lib/                 small helpers
tests/               unit and data-rule tests
```

## 4. Rules enforced in `data/repo.ts`

1. A version is a complete snapshot (its own ingredients and steps) and is **never edited after it has been cooked**; changing a recipe writes a new version with its parent and reason.
2. The original version is never overwritten; "Khôi phục bản gốc" only moves a pointer.
3. A cooking session stores the id of the exact version cooked, and a version that has sessions cannot be deleted.
4. "Xoá món" archives. Permanent deletion is possible only for a dish never cooked.
5. `verification` moves to "gia đình đã duyệt" only by explicit confirmation after a well-rated session.

## 5. Backup and restore

- **Package:** one ZIP — `data.json` (every store except images), `images/<id>.jpg`, and `manifest.json` (format version, created date, record counts, SHA-256 of every file).
- **Create:** validate internal links (every session → an existing version → an existing recipe) → build → checksum → hand to the share sheet or download. The time of the last backup is recorded only after the file was handed over.
- **Restore:** read → verify checksums, counts and links → only then replace the data, in one transaction. The current data is first kept as a restore point on the device, so a restore can be undone.
- **Reminder:** a line on Trang chủ when there are changes not backed up for more than 7 days.
- **Recipe pack:** the same format restricted to chosen recipes; importing only *adds* (a new dish or a new version), never overwrites.
- **Limits, stated plainly:** there is no automatic backup — a web app on iPhone cannot write a file without a tap, and cannot run while closed. Losing the phone loses whatever changed since the last backup.
- **Later, if wanted:** automatic upload of the same package to Google Drive (STORAGE_PROPOSAL §5). Not planned now.

## 6. The parts that bite

- **Safari clears a website's storage after 7 days without interaction** — unless the app is on the Home Screen. Installing it is therefore part of setup, and the app asks for persistent storage and shows a notice when it is running in a plain tab.
- **Storage quota:** photos are resized (long edge 1600 px, JPEG) before saving.
- **Voice:** Vietnamese speech synthesis and recognition depend on the device; detected at run time with visible fallbacks (unchanged from PRD §12).
- **Timers:** screen wake lock while cooking; timers computed from an end time; no alarm from a closed app.
- **Schema changes:** Dexie versioned upgrades; backup packages carry a format version and older packages stay restorable.
- **Two tabs open:** Dexie's live queries keep them consistent.
- **Privacy:** nothing leaves the device. The only outside content is a YouTube embed, loaded when she taps play.

## 7. Environments and deployment

No environment variables and no secrets. `npm run build` produces `out/` and then `scripts/build-sw.mjs` writes `out/sw.js`, which lists every built file with a version derived from their contents. A GitHub Actions workflow runs the full check and publishes `out/` to GitHub Pages; it sets `NEXT_PUBLIC_BASE_PATH` to the repository name.

**Offline and updates.** On the first visit the service worker stores the whole site. Afterwards every request is answered from the device. A new deployment is downloaded in the background and waits; the app shows "Bếp Nhà có bản mới — Cập nhật", or it takes over the next time the app is fully closed and reopened, so one visit never mixes two versions.

**Content-security policy.** The built pages carry a policy that restricts every connection, script, font and image to the app's own origin (plus a YouTube embed frame for later). It is not applied in development.

## 8. Build order

| stage | content | state |
| --- | --- | --- |
| Design | tokens, component specs, base components | done |
| **G1** | local database, sample recipe, recipe list and detail, servings, adjust → family version, cooking mode with timer and read-aloud, feedback, journal | done 2026-11-21 (checked in a desktop browser only) |
| **G2** | rest of P0: Home, search and categories, compare / history / restore original, favourites, settings; backup, restore, "Món đã xoá", reminder | done 2026-11-21 (backup file hand-over not yet tried in a real browser) |
| **G3** | PWA (manifest, offline), GitHub Pages deployment | done 2026-11-21: deployed to GitHub Pages and checked offline in Chrome against the live site; not yet tried on an iPhone |
| **G4** | recipe editor, photos, sources and YouTube, recipe packs | |
| **G5** | P1: "Nhà đang có gì?", suggestions, equipment filter, taste profile, voice commands | |
| **G6** | real-iPhone checks (TEST_PLAN Track B) | |
| **G7** | P2: weekly plan, shopping list | |
