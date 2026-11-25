# BẾP NHÀ

A private cooking web app for one Vietnamese family. It remembers how *our* family likes each dish and guides the cook step by step, in large text and by voice, so the dish tastes the same every time.

- Local-first, like My Gym Progress: **all data stays on the device** (IndexedDB). No backend, no account, no API key, no cost.
- A static site (GitHub Pages), installed to the phone's Home Screen.
- Backup is a file the user saves with one tap; there is no automatic backup.

## Status (2026-11-23)

**Working now (all deployed; the twenty-nine dishes rewritten from videos, the video of each step and of the ingredients, video cover pictures, and dropping the ten samples went live on 2026-11-23):**
- Forty-nine dishes rewritten from mother's YouTube channels (see "About the dishes from videos") — thirty-nine are live (batch 5 was deployed on 2026-11-23, commit `f13c704`); **ten more were written the same day (batch 6) and are not yet deployed**; recipe list with search (no diacritics needed) and category filter. The ten unverified samples of the first versions are no longer loaded (see "About the sample recipes").
- **"Hôm nay nấu gì?" (2026-11-23, not yet deployed):** one button on the home page suggests a meal — a dish to eat with rice and a soup. The names flick past for about a second and stop; either dish can be changed on its own, or the whole meal. It asks nothing of her: it leaves out what the journal says was cooked in the last five days, brings favourites up twice as often and dishes never cooked a little more. (Suggestions had been dropped on 2026-11-21 because that design needed an inventory of the kitchen; this one does not.)
- **Dishes sorted (2026-11-23):** the list is grouped under Món mặn · Món canh · Món xào · Món chiên, each heading with its number of dishes, and can be narrowed by "Nấu từ": Thịt heo · Thịt gà · Thịt bò · Cá, tôm · Rau củ, đậu hũ. The catch-all "Món ăn gia đình" is gone. A phone that loaded the dishes under the first groups gets the new ones once.
- **Made personal (2026-11-23):** the app icon is a drawing of mother and son after a family photo — her jade áo dài with its gold sheen, his navy shirt and glasses — and the colours follow it: jade for buttons, navy for text and ticks, gold for frames and rules, on the same cream. The home page shows the family's own picture in a round gold frame; it is chosen once in Cài đặt → "Ảnh của nhà mình", stays on that phone and in its backups, and is **not** in the repository or the site (both are public). Until one is chosen the place shows the logo. **Logo replaced later the same day** with the round illustration the owner supplied (mother and son in the kitchen, jade and gold ring; master in `replica/design/logo.webp`): it is the favicon, the Home Screen icons, the picture on the home page, on "Cách dùng" and on the not-found page; colours, corner radius and shadow were re-sampled from it. Opened in a browser on the built site; not yet seen on a real iPhone.
- **Guide (2026-11-23):** "Cách dùng" — six cards from "Chọn món" to "Nấu xong", in the words on the buttons, including what to do when a video opens with an advertisement. Offered once on the home page ("Xem cách dùng" / "Để sau"), and always one tap away there and in Cài đặt.
- **Video in each step:** in cooking mode a step of a dish from a video has the button "Xem đoạn video của bước này (33 giây)". It plays that part of the video only — from the step's start second to its end — inside the page, through YouTube's no-cookie player. Nothing is loaded from YouTube until the button is pressed; with no network the button says so and the written step is still complete.
- **Video of the ingredients:** channels that list every ingredient and amount before they start working (twenty-eight dishes, mostly Tú Lê's) also have "Xem đoạn kênh nói về nguyên liệu (1 phút 36 giây)" on the "Chuẩn bị nguyên liệu" screen. Where a step's part of the video does not say an amount the step uses — the channel gave it earlier, or only in the description — the line "Trong đoạn này kênh không nhắc lại lượng. Lượng ở mục “Cần dùng” phía trên." is shown under the button, so the number she follows is always the one on the screen.
- **Cover picture:** a dish from a video that has no photo of its own shows the video's cover picture, loaded from YouTube's picture server and then kept on the phone, with the line "Ảnh bìa video của kênh …" on its page. A photo the family takes replaces it.
- Recipe page with servings scaling; adjust quantities → saved as "Bản nhà mình" with a reason, original kept; version history; switch back to the original.
- Cooking mode: ingredient checklist, one step per screen, timers, read-aloud, screen wake lock, resume after closing.
- Feedback after cooking, or "Xong, không ghi nhận xét" to finish without rating (the meal is still in the journal; an unrated meal cannot approve a dish); journal tied to the exact version cooked; favourites.
- Settings: text size, voice, how the app addresses the cook.
- Backup and restore: one ZIP with all data and photos, checksums, full verification before anything is replaced, undo of the last restore, reminder after 7 days of unsaved changes.
- "Xoá món" moves a dish to "Món đã xoá" (restorable).
- **Recipe editor (G4):** "Thêm món mới" and "Sửa món", in five parts — name and photo, ingredients and seasonings, equipment, steps, source. Amounts are entered with large − / + buttons or typed on the number pad ("1,5", "1/2"); units are chosen from large buttons. In step text an ingredient is inserted with a button and shows as `[nước mắm]`, with a preview of the sentence as it will read when cooking; every step needs "Được khi…" and "Tránh…". Work in progress is saved on every change and survives closing the app.
- **What saving an edit does:** name, photo, categories and source are simply updated. A change to ingredients or steps becomes a new "Bản nhà mình" with a reason, the old version kept — except for a dish the family typed in that has never been cooked, which is corrected in place. An app sample is never overwritten.
- **Dish photos (G4):** take or choose one photo per dish; it is reduced to at most 1600 px (about 200–400 KB) before it is stored, which also drops the location data. Photos are part of the backup.
- **Sources:** "Của nhà mình", "Viết lại theo video YouTube" (link required, shown with the label "Viết lại theo video" and a link to the video; a dish typed in the editor has no per-step video, only the dishes shipped in `data/seed/video.ts` do), or a book / website.
- **Recipe packs (G4):** "Gửi món này cho máy khác" on a dish, or Cài đặt → "Gửi và nhận món" for several. The file carries dishes, their versions and photos — not the journal. Receiving only adds: dishes already on the phone keep their name, photo, version in use and history, and receiving can be undone.
- A dish typed in or received is labelled "Mới nhập – chưa nấu thử" until the family approves it after a well-rated meal.
- **Installable and offline:** web manifest, app icon, and a service worker that stores the whole app (about 1.6 MB) on the device. An update is offered with one tap.
- **What leaves the device:** nothing of the family's data, ever. The built site carries a content-security policy that makes the browser refuse connections to any other server, with two exceptions, both only for a dish rewritten from a video: the video's cover picture (`i.ytimg.com`, fetched when the dish is shown) and the YouTube player (`www.youtube-nocookie.com`, only when she presses the video button).
- **Deployed:** https://hoangcaoduc090105-debug.github.io/bep-nha/ — published by `.github/workflows/deploy.yml` on every push to `main`, after the full check passes.

**Not built, by decision (2026-11-21):** the goal is "mother opens the app, picks a dish and cooks", so most of G5 and all of G7 were dropped — a photo after each cooking session, "Nhà đang có gì?", suggestions, equipment filter, taste profile, voice commands, weekly plan, shopping list. Playing the YouTube video inside the app, first kept for later, was built on 2026-11-22 once her dishes came from videos. See [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md).

### What has actually been checked
- `npm run check`: type check, lint, 221 unit and data-rule tests, static build — all pass.
- `npm run test:e2e`: 14 end-to-end tests against the built site (the nine below, plus five added 2026-11-23: the meal suggestion · the grouped list and its two filters · the guide offered once, at the largest text size too · "Để sau" · the family picture chosen, shown, kept after a reload and removed, with nothing leaving the phone), each run twice — in Google Chrome at Pixel 7 size, and in WebKit (the engine Safari uses) at the size of mother's iPhone 14 Pro Max, 430 pt — 28 runs: 27 pass, 1 is skipped in WebKit (see 9). WebKit here is Playwright's desktop build, **not Safari on a real iPhone**: it catches layout and engine differences, not the camera, the share sheet, sound or the screen lock. Since 2026-11-23 they cook dishes from videos, not samples.
  1. first visit, then **network switched off**: reload, the list has the 49 dishes and no sample, search "thit kho tieu", change servings, lower the fish sauce and save the family version, cook all eight steps of Thịt kho tiêu with a timer and a reload mid-cook, the adjusted amount in the step text, rate it, approve it, find it in the journal — with zero requests to any other server but the two for videos;
  2. cook Gà kho gừng and back up in one browser, then in a second, empty browser ("another phone"): a non-backup file is refused, the real backup shows its summary, restores, and the restore is undone;
  3. delete a dish and bring it back; largest text size without horizontal scroll;
  4. (G4) write a new dish with a 3000 × 2000 photo (stored as a 1600 px JPEG under 600 KB), typed and stepped amounts, a unit change, an inserted ingredient with its preview, a typed amount refused, a reload mid-way with the draft intact, the missing "Tránh…" and the wrong video link both reported; correct it in place while uncooked; cook it; edit it again into a new "Bản nhà mình"; send it as a file; the file is refused as a backup; a second browser refuses a non-pack, receives the dish with photo and both versions and no journal, receives it again with nothing added, and undoes the receipt; the full backup then counts 1 photo — with zero requests to any other server;
  5. (samples dropped) a backup made before 2026-11-23 — ten samples, one meal — restores; on the next page the list is the 49 dishes again, the meal is still in the journal, and all ten samples wait in "Món đã xoá"; one is brought back and stays after a reload; it is still "Mẫu – chưa kiểm chứng", has no cover picture and no video button; at the largest text size the editor has no horizontal scroll; saved untouched it changes nothing; a real change becomes "Bản nhà mình" and the sample text stays;
  6. a dish is cooked and ended with "Xong, không ghi nhận xét" — it is in the journal, nothing is left "đang nấu dở", and neither approval nor adjustment is asked;
  7. a dish rewritten from a video is found by search with the video's cover picture on its card; its page shows "Mới nhập – chưa nấu thử" (not "Mẫu", not "Gia đình đã duyệt"), the channel, the note on what the channel did not state, and the link; in cooking mode no player exists until she asks; at step 5 the button opens the player at seconds 152–185 of that video with no horizontal scroll, "Đóng video" removes it, the next step starts closed; with the network off the button says a network is needed; the dish is cooked to the end — and the only outside addresses used are the cover picture and the player;
  8. Canh hẹ: the "Chuẩn bị nguyên liệu" screen offers the part of the video that lists the ingredients (seconds 31–127); step 1 opens at second 55, where the channel says "200 g thịt bằm", and has no note; step 3, whose seasonings the channel only measures at the start, shows "Trong đoạn này kênh không nhắc lại lượng…";
  9. (Chrome only) a cover picture shown once is still shown after the network is switched off — WebKit does not let a test answer what the service worker fetches, so there this is skipped.
- **Run of 2026-11-23 with the 49 dishes: 27 pass, 1 skipped** (the two tests that list the beef dishes now expect the two new stir-fries). Earlier that day, with 39 dishes: 27 pass, 1 skipped. The first run that day had four failures — two tests, in both browsers, on horizontal scroll of the home page at the largest text size: the top row (picture, "Cách dùng", "Cài đặt") was 433 px wide on a 412 px screen since the picture there was enlarged to `size-28` in commit `e733a5c`. The picture is now 7rem or less (`min(7rem, 100vw − 16rem)`): unchanged at the ordinary size, about 97 px instead of 146 px at "Cực lớn" on a 430 pt screen.
- In the tests YouTube's two addresses are answered by the test itself, so they do not depend on YouTube. Separately, the built site was opened in a browser with its real content-security policy: the real cover picture loaded (1280 px), and the real player was opened on six parts of five dishes after the review (canh hẹ: ingredients and step 1 · canh mướp step 2 · gà kho sả ớt: ingredients · cá bông lau kho tộ step 2 · gà kho gừng step 4, 22 minutes into a five-dish video). Five showed the scene of that step, and where the channel's own subtitles were on they read the amounts of that step; for canh mướp step 2 only the player's clock (2:07, two seconds after the start at 2:05) was seen. **Nobody has listened to the parts**: the writer cannot hear, and every start and end rests on caption timings (automatic captions are within a fraction of a second; Cô Ba Bình Dương's own captions come in blocks of 3–5 seconds, and two dishes were timed from English subtitles). Where two sentences follow each other within a second, a part may begin or end a syllable early or late.
- The offline test now asks again, still offline, for every request the browser reported as failed: WebKit sometimes reports a look-ahead it dropped as "internal error" (seen on the unchanged code too, about 1 run in 8). A file the phone cannot serve offline still fails the test.
- Two things the WebKit run showed, neither a fault in the app: (a) in a throw-away browser session WebKit behaves like Safari's Private Browsing and refuses to store photos in IndexedDB, so the tests give each WebKit "phone" a profile folder on disk (`e2e/fixtures.ts`) — **in a Private Browsing tab on an iPhone, adding a photo or receiving a dish with a photo will fail**; from the Home Screen it is not private; (b) WebKit reports look-ahead requests it dropped on navigation as "cancelled", which the offline test now ignores.
- Checked by the owner on mother's iPhone 14 Pro Max (iOS 26.5): adding to the Home Screen and cooking step by step work. Read-aloud uses the phone's ordinary Vietnamese voice, accepted for now.
- Live site after the second deployment of 2026-11-23 (`f13c704`, batch 5; `node e2e/live-check.mjs …`, Chrome, network off after the first visit): 39 dishes, no sample, both video buttons on Canh hẹ, only `i.ytimg.com` contacted, no failed request, no console error. After the first deployment that day: 29 dishes, no sample, Canh hẹ offers both video buttons, nothing requested from any server except the cover pictures, no failed request, no console error.
- The new home page, the suggestion and the grouped list were also opened in a browser on the built site. **Not checked on a real iPhone:** choosing the family picture from the photo library (HEIC included), and how the new icon looks on the Home Screen — an icon already added there may keep the old drawing until the app is removed and added again.
- **Not checked:** whether a phone that already has the app receives the dishes from videos — and puts its ten samples away — after "Cập nhật" (covered by unit tests and by the old-backup end-to-end test, not on her phone) · the parts of the videos by ear, and the other 22 dishes in the real player · **the video player inside the app on a real iPhone, especially from the Home Screen** (only Chrome, Playwright's WebKit and a desktop browser) · the cover picture offline in real Safari · finishing without a rating on a real phone · **on mother's iPhone: the timer alarm with the silent switch on, the timer after the screen has been locked, whether the screen stays on while cooking** · the camera and photo library on an iPhone, and HEIC photos · sharing a recipe pack through the share sheet, and opening one received through Zalo or AirDrop (it has to be saved to Files first, then chosen in "Nhận món") · typing Vietnamese with the iPhone keyboard in the editor · real Safari (only Playwright's WebKit) · the iPhone share sheet for the backup file (the tests use the download path) · the alarm sound · read-aloud quality · screen readers.

### About the sample recipes
The first versions shipped ten dishes written for the app in the common Southern home style, labelled "Mẫu – chưa kiểm chứng". Nobody ever cooked or verified them, and once twenty-nine dishes with a named source existed they were dropped (decided 2026-11-23):
- **A new phone** gets only the dishes from videos.
- **A phone that already has the samples** (mother's): the first time the app opens after the update they are moved to "Món đã xoá", once. Nothing is deleted — a meal cooked from one stays in the journal, and each can be brought back in Cài đặt. A sample the family made its own stays in the list: one marked as a favourite, one with a "Bản nhà mình", or one being cooked at that moment. She has nothing to do.
- **A backup made before** still restores (`tests/data/sao-luu-co-mon-mau.zip` is such a backup, restored in both the unit and the end-to-end tests); the samples it brings back are put away the next time the app opens.
- The samples stay in the code (`data/seed/samples.ts`) as test data only; the label "Mẫu – chưa kiểm chứng" and the rule that a sample is never overwritten are unchanged.

### About the dishes from videos
Dishes in `data/seed/video.ts` are rewritten from the three YouTube channels mother watches (see [replica/research.md](replica/research.md) §2). Forty-nine (batch 1: nine, batch 2: eight, batch 3: six, batch 4: six, batch 5: ten — the first batch towards the hundred dishes the owner asked for on 2026-11-23, deployed that day — batch 6: ten, written 2026-11-23, not yet deployed):

| dish | channel | video |
| --- | --- | --- |
| Thịt kho tiêu | Cô Ba Bình Dương | https://www.youtube.com/watch?v=CHhWIhh2_OM |
| Tôm rim mặn ngọt | Cô Ba Bình Dương | https://www.youtube.com/watch?v=lQTEN9TX9TI |
| Thịt rang sả ớt · Canh chua thịt bằm | Sức Khỏe Tâm Sinh | https://www.youtube.com/watch?v=cgauooVeeFY |
| Thịt kho trứng cút | Sức Khỏe Tâm Sinh | https://www.youtube.com/watch?v=Ef2KDf7x1BY |
| Thịt viên sốt chua ngọt | Sức Khỏe Tâm Sinh | https://www.youtube.com/watch?v=fo0UujUP1sQ |
| Sườn kho khóm | Sức Khỏe Tâm Sinh | https://www.youtube.com/watch?v=Bxt85vPG5mw |
| Canh bầu cá lóc | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=CwKccKyri34 |
| Canh cà chua trứng đậu hũ | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=A4YWyWoJKLw |
| Gà kho chao riềng | Cô Ba Bình Dương | https://www.youtube.com/watch?v=1E6CWtJlsrs |
| Chuối xanh kho tiêu | Cô Ba Bình Dương | https://www.youtube.com/watch?v=fQHeKMOHntw |
| Thịt bằm sốt khoai tây | Sức Khỏe Tâm Sinh | https://www.youtube.com/watch?v=luyBHeFtXec |
| Ba chỉ rim mặn ngọt | Sức Khỏe Tâm Sinh | https://www.youtube.com/watch?v=hGJOrPButO0 |
| Canh mướp thịt bằm | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=91Zqgs0rzWs |
| Canh chua cá diêu hồng | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=JX946SQWQeg |
| Canh hẹ đậu hũ non thịt bằm | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=99upl7mvsSU |
| Gà kho sả ớt | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=hT1EgTIvZpI |
| Cánh gà chiên nước mắm | Cô Ba Bình Dương | https://www.youtube.com/watch?v=ozNNdCjKQzM |
| Thịt kho tàu | Cô Ba Bình Dương | https://www.youtube.com/watch?v=cqhtHgZec9A |
| Cá cơm rim mặn ngọt | Cô Ba Bình Dương | https://www.youtube.com/watch?v=ilHQmeTJe7A |
| Xíu mại sốt cà chua | Sức Khỏe Tâm Sinh | https://www.youtube.com/watch?v=qosxytfh-CI |
| Cá trê kho tiêu | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=DLM-X46fWhw |
| Thịt bò xào măng tây | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=eLwLE6IEIC8 |
| Cá bông lau kho tộ · Gà kho gừng | Cô Ba Bình Dương | https://www.youtube.com/watch?v=EPEX8FQMVkU |
| Canh dưa cải nấu cá | Cô Ba Bình Dương | https://www.youtube.com/watch?v=JV8r2s_Zo_Y |
| Bún gạo xào rau củ (chay) | Cô Ba Bình Dương | https://www.youtube.com/watch?v=8s6gSCQp7bM |
| Cà ri bò | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=KHjuDfaFxDw |
| Xá xíu đùi gà | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=bag7RQD39IE |
| Canh bầu nhồi thịt | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=xy9clubfDuk |
| Canh cua mồng tơi mướp | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=Wl7NE--oSw0 |
| Canh khổ qua nhồi thịt | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=c_liiv8ya80 |
| Canh bí đỏ thịt bằm | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=NsmterT93yQ |
| Canh chua cá lóc | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=AQoI-o35EMA |
| Canh cải bẹ xanh cá thác lác | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=gLB6iIpZJQY |
| Cá cơm kho tiêu | Cô Ba Bình Dương | https://www.youtube.com/watch?v=yGdlze7tcIg |
| Gà ram mặn | Cô Ba Bình Dương | https://www.youtube.com/watch?v=VMALVg5hKjw |
| Khổ qua nhồi thịt kho | Cô Ba Bình Dương | https://www.youtube.com/watch?v=Up4UTXu9C6M |
| Cà tím kho tiêu | Sức Khỏe Tâm Sinh | https://www.youtube.com/watch?v=0TTGVhnrAwI |
| Mực xào dưa leo | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=3AjigC3a2hc |
| Giá hẹ xào tôm | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=3MZ45NazfYU |
| Thịt bò xào đậu que | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=GC4hmUwDOKQ |
| Thịt bò xào bông cải | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=srAB7chNNi4 |
| Trứng chiên hành lá | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=ePs4_yOZgwk |
| Cá diêu hồng sốt mắm tỏi ớt | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=Q2fu_ph2GcE |
| Ba rọi chiên muối da giòn | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=WWONdHbeA8U |
| Đậu hũ kho sả ớt | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=ZFeylnQA3wM |
| Đậu hũ nấm rơm kho nước tương | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=zC-53k5naxY |
| Đậu hũ sốt mỡ hành | TÚ LÊ MIỀN TÂY | https://www.youtube.com/watch?v=1m_yDIyJF7U |

How they were written, and what that does and does not guarantee:
- **Read, not watched.** For each video the whole description and the whole transcript (YouTube's transcript panel) were read. The picture was not watched, so nothing that is only visible is in the recipe.
- **How the word timings are read** (for whoever adds a dish): open the video in a browser 1280 wide with the tab in front, expand the description, press "Hiện bản chép lời", then switch the player's subtitles off and on while listening for its request to `/api/timedtext` — the answer lists every caption word with its time in milliseconds. Asking for that address a second time returns nothing, so it has to be caught as the player loads it.
- **Every number has a place in the video**: an amount, a time or a heat level is in the description or in what the channel says. What the channel lists without an amount is "ít" in the app. Grams next to a spoon amount appear only where the channel gives them.
- **Ten dishes rest entirely on what is said in the video, with no ingredient list in the description to check against:** Canh mướp thịt bằm, Canh hẹ đậu hũ non thịt bằm, Gà kho sả ớt, Cá trê kho tiêu, Thịt bò xào măng tây, Xá xíu đùi gà (Tú Lê) and Cánh gà chiên nước mắm (apart from the 800 g of wings), Cá bông lau kho tộ, Gà kho gừng, Canh dưa cải nấu cá (Cô Ba). Every amount in them was read from a transcript or subtitle. The transcript of Cá trê kho tiêu is the poorest of all. Their source notes say so in capitals; they need a listen before the numbers are trusted.
- **Batch 5 adds five more of that kind:** Canh cua mồng tơi mướp, Canh bí đỏ thịt bằm and Canh cải bẹ xanh cá thác lác (Tú Lê — no ingredient list in the description at all), and Gà ram mặn and Khổ qua nhồi thịt kho (Cô Ba — the description lists the seasonings without amounts). In Canh chua cá lóc the description gives the fish, vegetables and tamarind but no seasoning amounts; the transcript has "tám muỗng canh đường" (1:05) for two litres of soup, which is unusually much — it is in the recipe as heard, with a warning in the source note, on the ingredient and in the taste tips to add it gradually. **This one number should be listened to before the dish is cooked.** In Canh bầu nhồi thịt the description says 3 tablespoons of sugar for the soup and the channel says 3 teaspoons; the smaller, spoken amount was used and the note says so. In Cà tím kho tiêu the chilli sauce is 1 tablespoon in the description and "half, then about one more" in speech; the description was used.
- **Automatic transcripts can mishear.** An amount that exists only in an automatic transcript (not in the description) is named in the dish's source note with its minute:second, to be checked by ear. Where the spoken amount and the description differ, the note says so and which one was used.
- **Batch 6 (all ten from Tú Lê, chosen to fill the thin groups: four stir-fries, four fried dishes, two tofu braises):** nine of the ten have no ingredient list in the description, so every amount in them was read from the automatic Vietnamese captions and their source notes say so in capitals; only Cá diêu hồng sốt mắm tỏi ớt has a list. Points the writer could not settle, each named in the dish's source note: Thịt bò xào đậu que — the salt is "nửa muỗng lưng" with no spoon named, so it is "ít"; Cá diêu hồng — the description says half a teaspoon of MSG where the channel says "1/3 teaspoon of salt", the description was used; Đậu hũ kho sả ớt — "hai củ tỏi" may be "tép"; Ba rọi chiên muối — the channel says the shot of brushing vinegar on the skin was lost, and whether the two "2 tiếng" (meat side, skin side) run together is the writer's reading; Trứng chiên hành lá — the number of garlic cloves is unreadable ("ít"), and since the app has no group for eggs the dish is filed under "Rau củ, đậu hũ". Đậu hũ sốt mỡ hành is called vegetarian by the channel but seasoned with fish sauce.
- **"Được khi…" and "Tránh…"** come from what the channel says at that point. Fifty-seven "Tránh" lines out of 274 steps are ordinary kitchen reminders where the channel says nothing; each is marked `// own` in the file and listed in the dish's source note.
- **Each step carries the seconds of the video where it is shown**, which is what the video button plays — so any step can be checked against the video with one tap.
- **Every amount says where it comes from, and the build checks it** (review of all 29 dishes, 2026-11-23). In `data/seed/video.ts` each ingredient with a number is marked `said("0:55", "0:57")` — the seconds in which the channel says it — or `DESC` — written in the video's description only (19 amounts in the first 29 dishes, 7 more in batch 5, 1 in batch 6). The times were read from the caption data the YouTube player itself loads, which has a time for every word (for Cô Ba Bình Dương's own captions: for every line of a few seconds); the first pass had only used the transcript panel, whose lines are 8–10 seconds long, and that is how a step's part could start after the sentence with its amount. `tests/video-seeds.test.ts` now fails the build when: an amount has no source · a spoken amount can be heard neither in the ingredients part nor in a step that uses it · a part starts or ends in the middle of an amount being said · a step's part carries the amount of something the step does not use · an amount is said within 10 seconds of a step that uses it but outside its part. The two faults the owner found by trying dishes (canh hẹ step 1, canh mướp step 2) are kept in that file as tests the rules must catch.
- The review changed no amount: every number already in the file was found again in the description or the captions. What changed is the start and end of the parts, the 13 ingredients parts, one "Cần dùng" list (cá bông lau kho tộ, step 2 now lists the fish, because that is where the channel says its weight) and the end of cà ri bò (below).
- The descriptions and captions that were read are saved outside the repository (they are the channels' words), together with a table per dish of amount → source → part; they are not needed to build or test.
- **Estimated by the writer, and said so in each source note:** the number of servings and the total minutes. No channel states them.
- The wording of the steps is this app's own. Each dish is labelled "Mới nhập – chưa nấu thử" and "Viết lại theo video", with the channel name and a link. **None has been cooked by the family.**
- Not written, because no usable transcript exists: Canh chua cá (zNhazi2P4yI), Canh khổ qua (Na0vBD48m4M) and Canh gà gừng (FiieVNI7v3c) of Cô Ba Bình Dương — their Vietnamese captions are a placeholder ("Caption is updating ...", a pattern in that channel's older videos); Canh chua cá lóc (mJwR3jZRj7U) of Sức Khỏe Tâm Sinh — no captions at all — and its Bầu kho tiêu (gUCO4GbGdOw) — captions stop at 2:18. With no transcript there is no method to write from. Also not written: Ba rọi xào mắm ruốc (Cô Ba, in EPEX8FQMVkU) — the amount of meat is only shown on screen, never said.
- Cà ri bò: one of its ingredients, "gân nở", is a word from the automatic transcript that the writer could not identify. (It is now read to the end; the first pass had stopped at 7:50.)
- Cá cơm kho tiêu and Khổ qua nhồi thịt kho (batch 5) have no Vietnamese captions at all, only the channel's translated subtitles; they were read from the English ones, in blocks of 3–8 seconds, and a few lines of those are garbled (the amount of MSG in Cá cơm kho tiêu could not be read and is "ít"; what happens while the fat is rendered is unclear). Gà ram mặn was first saved with English subtitles only; YouTube also has automatic Vietnamese captions for it, which were fetched (the player's caption track set to `vi`/`asr`) and agree with the English ones on every amount.
- Chuối xanh kho tiêu was read from the channel's own English subtitles, Sườn kho khóm from the channel's on-screen captions; the others from Vietnamese transcripts.
- A new unit, "hộp", was added for "2 hộp đậu hũ non"; it also appears among the editor's unit buttons.
- They arrive on a phone that already has the app the next time it is opened after an update; nothing already on the phone is touched. A dish already loaded on a phone is not changed by a later correction in this file.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000  (no offline mode in development)
npm run check      # typecheck + lint + unit tests + static build (output in out/)
npm run test:e2e   # builds, then runs the end-to-end tests in the installed Google Chrome and in WebKit (once: npx playwright install webkit)
```

`/design` shows every base component. Generated files: design tokens (`node scripts/build-tokens.mjs` after editing `replica/design/tokens.json`), the logo, favicon and app icons (`node scripts/build-icons.mjs` after replacing the master drawing `replica/design/logo.webp`), and `out/sw.js` (written by the build).

## Deployment

Repository: https://github.com/hoangcaoduc090105-debug/bep-nha · Pages source: GitHub Actions.
To publish a change: commit and `git push`. The workflow runs the full check and publishes `out/`; a failing test stops the deployment. Phones that already have the app show "Bếp Nhà có bản mới — Cập nhật".

On a free GitHub account, Pages needs a **public** repository. The repository holds only the app, the former sample recipes (now test data) and the dishes rewritten from public videos; the family's own recipes, history and photos stay on the phone and are never in it.

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
data/           types.ts · db.ts (Dexie) · repo.ts (all rules) · seed/ (video.ts: the 49 dishes · samples.ts: the former samples, test data)
features/       recipe-text (scaling, step text, speech) · cooking (timers, alarm, wake lock) · voice (read-aloud)
                · editor (form, validation, form → version) · photos (resize) · backup (package, restore, recipe packs)
lib/            quantity formatting, labels, helpers
tests/          quantity and step text · data rules · timers · backup and recipe packs · editor · the parts of the videos · an old backup
```
