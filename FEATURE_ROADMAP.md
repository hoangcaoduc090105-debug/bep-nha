# BẾP NHÀ — Roadmap

Status: **approved 2026-11-21, revision 5** — scope cut to the goal "mother opens the app, picks a dish and cooks; writing, sending and backing up are the son's work".

| stage | content | done when |
| --- | --- | --- |
| Research, architecture, design | recon, PRD, data model, tokens, component specs, base components | **done** |
| **G1 — First working slice** ✔ | local database · sample recipe · recipe list and detail · servings · adjust → family version · cooking mode with timer and read-aloud · feedback · journal | a dish can be cooked end to end and is still there after a reload |
| **G2 — P0 complete + backup** ✔ | Home · search and categories · compare / history / restore original · favourites · settings (text size, voice) · ten sample recipes · backup, restore, "Món đã xoá", reminder · loading, empty and error states | TEST_PLAN Track A passes for P0; export → wipe → restore gives identical data |
| **G3 — Install and deploy** ✔ | PWA manifest, offline app shell, storage-persistence request · GitHub Pages workflow | installed on a phone from the public link and usable in aeroplane mode |
| **G4 — Recipe management** ✔ (built; "done when" still open) | editor (add, edit, archive, restore) · one photo per dish · sources and YouTube links · recipe packs | a real recipe of mother's is entered and sent to her phone — **not done yet**: needs her recipes and her phone |
| **Hoàn thiện cho mẹ** ✔ (built and tested; not deployed, not on her phone yet) | finishing a meal without rating it · end-to-end tests also run in WebKit at iPhone 14 Pro Max size | tests pass in both browsers |
| **Trên máy mẹ** (needs the owner and her phone) | three kitchen checks: alarm with the silent switch on · timer after the screen was locked · screen stays on while cooking. | each recorded as works / does not; what does not work is explained in the app |
| **Món thật** (needs her recipes) | enter her recipes on the son's machine, send the pack, receive it on her phone (receiving through Zalo/AirDrop is untested on iPhone — try it with the first dish) · then decide what to do with the ten unverified samples | she cooks her own dishes from the app |
| Later, only if needed | play the YouTube video inside the app — only if her recipes are written from videos | |

Possible later, not planned: automatic backup to Google Drive (STORAGE_PROPOSAL §5); optional AI help to structure a recipe.

## Removed from the plan
Supabase (database, auth, storage) · sign-in page and session handling · roles and accounts · Vercel hosting and server functions · cloud synchronisation between devices.

## Dropped 2026-11-21 (were G5–G7)
Each would ask more of mother or serves the son, not her cooking: photo after each cooking session · "Nhà đang có gì?" and daily suggestions (she would have to keep an inventory) · equipment filter · taste profile (adjusting each dish already exists) · voice commands (speech recognition is unreliable in an iPhone Home Screen app; the large buttons are enough) · YouTube timestamps per step · weekly plan · shopping list · several dishes at once · automatic backup to Google Drive.

A "Chế độ gọn" switch that hid the dish-management buttons on mother's phone was built and then dropped the same day at the owner's request (not needed).

## Not planned
Community, publishing, sharing, ads, subscriptions, automatic import from other sites, App Store distribution.
