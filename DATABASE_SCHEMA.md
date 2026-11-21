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
| `restorePoints` | id | the previous data, kept automatically before a restore or import |

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
