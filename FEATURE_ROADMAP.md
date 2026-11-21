# BẾP NHÀ — Roadmap

Status: **approved 2026-11-21, revision 4** (local-first; see ARCHITECTURE §8 for the same list with current state).

| stage | content | done when |
| --- | --- | --- |
| Research, architecture, design | recon, PRD, data model, tokens, component specs, base components | **done** |
| **G1 — First working slice** ✔ | local database · sample recipe · recipe list and detail · servings · adjust → family version · cooking mode with timer and read-aloud · feedback · journal | a dish can be cooked end to end and is still there after a reload |
| **G2 — P0 complete + backup** ✔ | Home · search and categories · compare / history / restore original · favourites · settings (text size, voice) · ten sample recipes · backup, restore, "Món đã xoá", reminder · loading, empty and error states | TEST_PLAN Track A passes for P0; export → wipe → restore gives identical data |
| **G3 — Install and deploy** ✔ | PWA manifest, offline app shell, storage-persistence request · GitHub Pages workflow | installed on a phone from the public link and usable in aeroplane mode |
| **G4 — Recipe management** | editor (add, edit, archive, restore) · photos · sources and YouTube links · recipe packs | a real recipe of mother's is entered and sent to her phone |
| **G5 — P1** | "Nhà đang có gì?" · daily suggestions · equipment filter · taste profile · YouTube embed and timestamps · voice commands with fallbacks | Track A passes for P1 |
| **G6 — Real iPhone** | voice, screen stays on, timers and lock, sound with the silent switch, 8 days without opening, backup to Files | Track B recorded; no critical or major bugs |
| **G7 — P2** | weekly plan · shopping list · several dishes at once | |

Possible later, not planned: automatic backup to Google Drive (STORAGE_PROPOSAL §5); optional AI help to structure a recipe.

## Removed from the plan
Supabase (database, auth, storage) · sign-in page and session handling · roles and accounts · Vercel hosting and server functions · cloud synchronisation between devices.

## Not planned
Community, publishing, sharing, ads, subscriptions, automatic import from other sites, App Store distribution.
