# BẾP NHÀ — Roadmap

Status: **approved 2026-11-21, revision 5** — scope cut to the goal "mother opens the app, picks a dish and cooks; writing, sending and backing up are the son's work".

| stage | content | done when |
| --- | --- | --- |
| Research, architecture, design | recon, PRD, data model, tokens, component specs, base components | **done** |
| **G1 — First working slice** ✔ | local database · sample recipe · recipe list and detail · servings · adjust → family version · cooking mode with timer and read-aloud · feedback · journal | a dish can be cooked end to end and is still there after a reload |
| **G2 — P0 complete + backup** ✔ | Home · search and categories · compare / history / restore original · favourites · settings (text size, voice) · ten sample recipes · backup, restore, "Món đã xoá", reminder · loading, empty and error states | TEST_PLAN Track A passes for P0; export → wipe → restore gives identical data |
| **G3 — Install and deploy** ✔ | PWA manifest, offline app shell, storage-persistence request · GitHub Pages workflow | installed on a phone from the public link and usable in aeroplane mode |
| **G4 — Recipe management** ✔ (built; "done when" still open) | editor (add, edit, archive, restore) · one photo per dish · sources and YouTube links · recipe packs | a real recipe of mother's is entered and sent to her phone — **not done yet**: needs her recipes and her phone |
| **Hoàn thiện cho mẹ** ✔ (deployed) | finishing a meal without rating it · end-to-end tests also run in WebKit at iPhone 14 Pro Max size | tests pass in both browsers |
| **Trên máy mẹ** (needs the owner and her phone) | three kitchen checks: alarm with the silent switch on · timer after the screen was locked · screen stays on while cooking. | each recorded as works / does not; what does not work is explained in the app |
| **Món thật** (in progress, 2026-11-22) | dishes rewritten from the three YouTube channels she watches, shipped inside the app next to the samples (`data/seed/video.ts`), labelled "Mới nhập – chưa nấu thử" — decided 2026-11-22 instead of a recipe pack, so nothing has to be done on her phone. Each step plays its own part of the video, and a dish without a photo shows the video's cover picture (both decided 2026-11-22). Target, decided 2026-11-22: about 30 dishes, in batches of 10, each one traceable to the video. Batch 1 written and tested, 9 dishes: thịt kho tiêu, tôm rim mặn ngọt (Cô Ba Bình Dương) · thịt rang sả ớt, canh chua thịt bằm, thịt kho trứng cút, sườn kho khóm, thịt viên sốt chua ngọt (Sức Khỏe Tâm Sinh) · canh bầu cá lóc, canh cà chua trứng đậu hũ (Tú Lê Miền Tây). Batch 2 written and tested, 8 dishes: gà kho chao riềng, chuối xanh kho tiêu (Cô Ba Bình Dương) · thịt bằm sốt khoai tây, ba chỉ rim mặn ngọt (Sức Khỏe Tâm Sinh) · canh mướp thịt bằm, canh chua cá diêu hồng, canh hẹ đậu hũ non thịt bằm, gà kho sả ớt (Tú Lê Miền Tây). Batch 3 written and tested, 6 dishes: cánh gà chiên nước mắm, thịt kho tàu, cá cơm rim mặn ngọt (Cô Ba Bình Dương) · xíu mại sốt cà chua (Sức Khỏe Tâm Sinh) · cá trê kho tiêu, thịt bò xào măng tây (Tú Lê Miền Tây). Batch 4 written and tested, 6 dishes: cá bông lau kho tộ, gà kho gừng, canh dưa cải nấu cá, bún gạo xào rau củ (Cô Ba Bình Dương) · cà ri bò, xá xíu đùi gà (Tú Lê Miền Tây). 29 dishes in all — the target of about 30 is met; no further batch is planned. Not written, no usable transcript: canh chua cá, canh khổ qua, canh gà gừng (Cô Ba), canh chua cá lóc, bầu kho tiêu (Tâm Sinh). Reviewed 2026-11-23 after the owner found two steps whose video did not match "Cần dùng": every amount now names its source (seconds of the video, or the description), 13 dishes have a part of the video for the ingredients, and `tests/video-seeds.test.ts` keeps the parts and the lists in step. The ten unverified samples were dropped the same day: not loaded on a new phone, moved to "Món đã xoá" on a phone that has them. Next: before any deployment, the owner listens to the amounts flagged in each source note | she cooks her own dishes from the app |
| **Cá nhân hoá** (2026-11-23, built and tested, not deployed) | "Hôm nay nấu gì?" suggests a dish and a soup · dishes grouped by kind and main ingredient · icon and colours after a family photo · the family's own picture on the home page, kept on the phone only · a six-card guide | she finds something to cook without asking |
| Later, only if needed | play the YouTube video inside the app — only if her recipes are written from videos | |

Possible later, not planned: automatic backup to Google Drive (STORAGE_PROPOSAL §5); optional AI help to structure a recipe.

## Removed from the plan
Supabase (database, auth, storage) · sign-in page and session handling · roles and accounts · Vercel hosting and server functions · cloud synchronisation between devices.

## Dropped 2026-11-21 (were G5–G7)
Each would ask more of mother or serves the son, not her cooking: photo after each cooking session · "Nhà đang có gì?" and daily suggestions (she would have to keep an inventory) · equipment filter · taste profile (adjusting each dish already exists) · voice commands (speech recognition is unreliable in an iPhone Home Screen app; the large buttons are enough) · YouTube timestamps per step · weekly plan · shopping list · several dishes at once · automatic backup to Google Drive.

A "Chế độ gọn" switch that hid the dish-management buttons on mother's phone was built and then dropped the same day at the owner's request (not needed).

## Not planned
Community, publishing, sharing, ads, subscriptions, automatic import from other sites, App Store distribution.
