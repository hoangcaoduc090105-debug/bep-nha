# BẾP NHÀ — Data model

Status: **approved 2026-11-21, revision 4 — local database (IndexedDB via Dexie).** Source of truth in code: `data/types.ts` and `data/db.ts`.

The earlier PostgreSQL design ([replica/schema.sql](replica/schema.sql)) is kept only as a reference in case a cloud database is ever wanted; it is not used.

## 1. Stores

IndexedDB is a document store, so a version keeps its ingredients and steps *inside* it. That makes "a version is a frozen snapshot" literal: one record, written once.

| store | key | holds |
| --- | --- | --- |
| `recipes` | id | name, search name (no diacritics), description, image id, category names, source (kind, title, creator, URL, YouTube id, fidelity), difficulty, `originalVersionId`, `familyVersionId` (null = cook the original), `verification`, `isArchived`, `isFavorite`, timestamps |
| `versions` | id | `recipeId`, `kind` (original / family), `versionNo`, label, `parentVersionId`, `changeReason`, `fromSessionId`, servings, prep and cook minutes, notes, taste tips, **ingredients[]**, **steps[]**, **equipment[]**, created date |
| `sessions` | id | `recipeId`, `versionId` (the exact version cooked), servings cooked, status, current step, ticked ingredients, running timers, **adjustments[]** (what was really used), **feedback** (verdict, taste flags, note), photo ids, start and end time |
| `images` | id | photo as a Blob (resized), created date |
| `settings` | key | how to address the cook, text size, voice, default servings, spoon and bowl sizes, taste profile, equipment owned, pantry, last backup time |
| `mealPlans`, `shoppingLists` | id | P2 |
| `restorePoints` | id | the previous data, kept automatically before a restore or before receiving a recipe pack |
| `drafts` | id (`new` or a recipe id) | unfinished work in the recipe editor (the form, the version it started from). Saved on every change; never part of a backup or a pack (db version 3) |

`verification` is one of `sample` (written for the app), `entered` (typed in by the family or received in a pack, not yet cooked in the app), `source_checked`, `family_approved`.

Inside a version:

```
ingredient  slot · name · kind (food | seasoning) · group · quantity · unit ·
            metricQuantity · metricUnit · approx · optional · scales · prepNote · tasteRole
step        no · phase · title · instructions[] (with {slot} tokens) · doneWhen · avoid · ifWrong ·
            timerSeconds · timerLabel · heat · uses[] ({slot, portion}) · videoStart
equipment   name · kind (appliance | utensil) · required · alternative
```

## 2. The two ideas carried over unchanged

**Frozen versions.** One original and any number of family versions per recipe. Adjusting writes a new version (`parentVersionId`, `changeReason`); the recipe's `familyVersionId` points at the preferred one; restoring the original sets it to null. A session records `versionId`, so the journal always shows what was really cooked.

**Quantities that cannot disagree with the text.** Step text holds tokens (`"Cho {nuoc_mam} vào nồi"`) filled from the version's ingredient list and the servings factor, so the list, the instructions and the spoken text always match. `uses[]` says which ingredients go in at each step.

## 3. Rules (enforced in `data/repo.ts`, covered by tests)

| rule | how |
| --- | --- |
| a cooked version is immutable | the repo has no "update version" for a version with sessions; edits create a new version |
| one exception, for typing mistakes | a dish the family typed in (not an app sample) that has **no cooking session at all** is corrected in place by the editor (`saveRecipeForm`, outcome `updated_in_place`). An app sample, and anything cooked even once, always gets a new family version |
| a recipe is complete before it is saved | `validateForm`: name, at least one ingredient with amount and unit, at least one step, every step with "Được khi" and "Tránh", a YouTube link for a recipe written from a video |
| amounts live in the ingredient list, not in the text | an amount typed next to a listed ingredient is refused unless that ingredient is inserted as a `{slot}` token somewhere in the recipe (then the typed amount is a correction such as "nhạt thì thêm nửa muỗng cà phê nước mắm") |
| receiving a pack only adds | `planImport`: a new dish is added whole; for a dish already on the device only missing versions are added, and its name, photo and version in use are untouched; same id with other contents is added as a separate version |
| photos are small and never orphaned | resized to ≤ 1600 px JPEG before storing; `pruneImages` removes photos no dish, session or draft refers to |
| the original is never overwritten | adjustments always produce `kind = family` |
| a session's version always exists | versions with sessions cannot be deleted |
| "Xoá món" is reversible | sets `isArchived`; permanent delete only when the recipe has no sessions |
| pointers stay inside the recipe | `familyVersionId` must belong to the same recipe |
| quantities are sane | Zod: quantity > 0, servings 1–30, minutes 0–1440, timer 5 s–6 h, units from a fixed list |
| "family approved" is explicit | set only by confirmation after a session rated rất ngon / vừa miệng |
| multi-record writes are atomic | Dexie transactions |

## 4. Privacy and safety

Data never leaves the device except inside a backup file the user saves. There are no keys, accounts or access rules to manage. Protection against loss is the backup package (ARCHITECTURE §5) and installing the app to the Home Screen.

## 5. Search

Names are stored a second time without diacritics and in lower case; search matches on that, so "ca kho" finds "Cá kho tộ". With a family-sized cookbook, filtering in memory is instant.
