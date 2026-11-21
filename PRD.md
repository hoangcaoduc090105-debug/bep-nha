# BẾP NHÀ — Product requirements

Status: **approved 2026-11-21, revision 4** — local-first (§15 supersedes the sign-in and cloud parts of §13–§14) · 2026-11-21 · Research: [replica/research.md](replica/research.md), [replica/recon.md](replica/recon.md)

## 1. The product in one sentence

A private family cookbook that remembers exactly how *our* family likes each dish, and walks mother through cooking it the same way every time — by large text and by voice.

Principle that settles arguments: **help mother cook the same delicious dish consistently, without having to remember everything.**

## 2. Users

**One main user, one account** (decided 2026-11-21, §14).

| | mother — the main user | you — the builder |
| --- | --- | --- |
| uses | her own phone, in the kitchen, hands wet or oily | her phone directly, or your own device plus a recipe pack sent to her (§15) |
| goal | cook a dish that tastes right, every time | keep the cookbook correct and growing |
| needs | large text, few choices, voice, opens straight into the app | efficient recipe entry, versions, history, backup |

There is no account and no sign-in (§15): whoever holds the phone has the whole app. No roles, no invitations, no user management. "Quản lý công thức" is simply a section of the same app, placed in Cài đặt so it stays out of the way while cooking.

Language: natural Southern Vietnamese throughout. No English in the interface.

## 3. Goals and how we will know

| goal | measure |
| --- | --- |
| consistent taste | a dish with a family version gets "Rất ngon" or "Vừa miệng" on repeat cooks |
| she can use it alone | she completes find → cook → feedback with no help (acceptance scenarios 1–16, TEST_PLAN) |
| nothing is forgotten | every adjustment and every meal is in the history with its exact version |
| trust | no recipe is shown as family-approved until the family has cooked and approved it |

Not goals: community, growth, monetisation, covering every Vietnamese dish.

## 4. Scope by module

Priority follows the brief. P0 = first usable version.

| module | P0 | P1 | P2 |
| --- | --- | --- | --- |
| A Home | greeting, continue cooking, recently cooked, favourites, search, library shortcut | today's suggestions (rule-based), "Nhà đang có gì?" | smarter suggestions |
| B Library | list, categories, search by name, recipe detail with all 17 fields | search by ingredient, method, equipment | folders, print |
| C Versions & taste | original + family version, adjust, save with reason, compare, restore, history | taste profile, adjustment hints from feedback | several named versions in the UI |
| D Cooking mode | one step per screen, quantities, progress, back/next, timers, pause/resume, screen stays on | step photos | several dishes at once |
| E Voice | read step / ingredients aloud (TTS) | voice commands (STT) with fallback | pre-recorded audio |
| F Equipment | shown on recipe | "Bếp nhà có gì" + filter + sound alternatives | — |
| G Journal | session record, feedback, notes, history per recipe, offer to save family version | finished-dish photo | statistics |
| H Video | source link opens YouTube | embed + step timestamps | — |
| I Planner | — | — | week plan, shopping list |
| J Recipe management | seed data + JSON import | recipe editor, image upload, sources, categories, export backup | AI-assisted structuring |

## 5. Core user flows

```
U1 Cook a known dish (the main loop)
   Trang chủ → tap dish (or search) → Recipe [Bản nhà mình] → "Bắt đầu nấu"
   → Chuẩn bị (check ingredients) → Bước 1…n (read aloud, timers) → "Nấu xong"
   → "Gia đình mình thấy món ăn hôm nay thế nào?" → saved to Nhật ký
   taps on the happy path before cooking starts: 2

U2 Adjust to the family's taste
   Recipe → "Chỉnh theo khẩu vị nhà mình" → big − / + on each quantity → "Vì sao đổi?" (optional, quick chips)
   → "Lưu bản nhà mình" → the recipe now opens on the family version

U3 Learn from a meal
   Feedback "Hơi mặn" → app shows the salty seasonings in this dish with a suggested smaller amount
   (a suggestion, nothing changes until she taps "Lưu") → new family version, reason pre-filled "Lần trước hơi mặn"
   Feedback "Rất ngon" with on-the-spot changes → "Lưu cách nấu hôm nay làm bản nhà mình?"

U4 Compare / restore
   Recipe → "So sánh với bản gốc" → two columns, differences highlighted → "Dùng lại bản gốc" (family versions are kept)

U5 Resume
   App reopened mid-cook → "Đang nấu dở: Cá kho tộ, bước 4/8 — Nấu tiếp"

U6 What can I cook?
   Trang chủ → "Nhà đang có gì?" → tick ingredients → dishes ranked by how much is already at home, missing items listed

U7 Review history
   Nhật ký → list by date → entry shows dish, version cooked, changes that day, verdict, note, photo

U8 Add a recipe from a video (same account)
   Cài đặt → Quản lý công thức → Món mới → source (YouTube link, channel, "viết lại theo video") → ingredients → steps → save as Bản gốc (status: chưa kiểm chứng)

U9 Backup
   Cài đặt → Sao lưu → "Tải dữ liệu" (recipes, versions, history, settings) and "Tải hình ảnh" (separate file)
```

## 6. Screens

Bottom navigation, five tabs, always visible except inside cooking mode.

| ID | screen | tab | notes |
| --- | --- | --- | --- |
| B01 | Trang chủ | Trang chủ | greeting, "Nấu tiếp" banner, Hôm nay nấu gì, Mới nấu gần đây, Món yêu thích, search, "Nhà đang có gì?" |
| B02 | Nhà đang có gì | (from B01) | ingredient chips → matching dishes |
| B03 | Công thức | Công thức | search, category chips, equipment filter, recipe cards |
| B04 | Chi tiết món | — | photo, version switch (Bản nhà mình / Bản gốc), servings stepper, ingredients, seasonings, equipment, steps preview, notes, taste tips, source/video, **Bắt đầu nấu** fixed at the bottom |
| B05 | Chỉnh khẩu vị | — | quantity steppers, reason, save |
| B06 | So sánh | — | original vs family |
| B07 | Lịch sử phiên bản | — | chain of versions with reasons and dates |
| B08 | Chuẩn bị | Đang nấu | ingredient checklist, equipment, "Đọc nguyên liệu" |
| B09 | Bước nấu | Đang nấu | one step, quantities, done-when, avoid, timer, back / repeat / next, microphone |
| B10 | Nấu xong – đánh giá | Đang nấu | five large answers, note, photo, offer to save version |
| B11 | Đang nấu (empty) | Đang nấu | "Chưa nấu món nào" + pick a dish |
| B12 | Nhật ký | Nhật ký | sessions by date |
| B13 | Chi tiết lần nấu | — | one session |
| B14 | Yêu thích | Yêu thích | favourite dishes |
| B15 | Cài đặt | (gear on B01) | text size, voice on/off and speed, taste profile, bếp nhà có gì, microphone help |
| B16 | Quản lý công thức | (inside B15) | recipes, editor, images, categories, sources, "Món đã xoá", backup and restore |
| B17–B18 | Kế hoạch tuần, Đi chợ | (from B01, P2) | optional |

## 7. Behaviour rules

**Versions**
- A recipe opens on the family version if one exists, otherwise on the original. A clear badge says which.
- Saving an adjustment always creates a new version; the previous one is kept. Nothing is ever overwritten.
- The taste profile and feedback only ever produce *suggestions*. A saved family version always wins over any generic rule.

**Quantities**
- Household measure first, metric in brackets: "1½ muỗng canh nước mắm (khoảng 22 ml)".
- Fractions are shown the way people say them (½, ⅓, ¼, 1½); steppers move in practical increments (¼ spoon, 10 g, 50 ml).
- Changing servings rescales food linearly. Seasonings are rescaled too but flagged "Nêm lại cho vừa". Times do not rescale; a note appears when servings more than double.
- Invalid input (empty, zero, negative, absurdly large) is refused with a plain sentence.

**Cooking mode**
- Every step answers: what to do, how much, when, what to look/smell/listen for, what to avoid. A recipe cannot be saved as ready with a cooking step that has no "done when" sign.
- The screen stays on. Progress is saved at every step.
- Timers show remaining time in large digits, ring and vibrate, and stay correct if the phone was locked.

**Voice**
- TTS: "Đọc" button on every step; optional auto-read when a step opens. Speed adjustable, default slightly slow.
- STT commands (P1): bắt đầu nấu · tiếp theo · quay lại · đọc lại (bước này) · đọc nguyên liệu · tạm dừng · tiếp tục · còn bao lâu nữa · tôi đã cho ⟨nguyên liệu⟩ rồi · kết thúc nấu. Matching ignores diacritics and tolerates near-misses.
- Four visible states: Đang nghe · Đang xử lý · Đã hiểu: "…" · Chưa nghe rõ, mẹ bấm nút bên dưới nhé.
- If the browser has no recognition or permission is denied, the microphone is replaced by an explanation and the large buttons; the app never pretends.

**Suggestions (no AI)**
Score = not cooked in the last 7 days + ingredients at home + favourite or well-rated + fits a short cooking time + different category from yesterday's meals. A daily set is fixed for the day so it does not reshuffle on every visit.

**Feedback**
"Rất ngon" · "Vừa miệng" · "Hơi mặn" · "Hơi ngọt" · "Chưa ngon như mong muốn", plus an optional note (typed or dictated) and photo.

## 8. Recipe content

- Every recipe has a source, a fidelity label (đúng theo nguồn / viết lại theo video / tham khảo / của nhà mình) and a status: **Công thức mẫu – chưa kiểm chứng** → **Đã đối chiếu nguồn** → **Gia đình đã duyệt**.
- "Gia đình đã duyệt" is only reachable by cooking the dish and rating it well. It cannot be typed in.
- Demonstration set: 10 everyday Southern dishes from the brief (cá kho tộ, thịt kho trứng, canh chua cá, sườn xào chua ngọt, thịt rang cháy cạnh, gà kho gừng, tôm rim thịt, rau muống xào tỏi, canh bí nấu tôm, đậu hũ sốt cà chua). **How their quantities are sourced is an open decision (§10, Q3).**
- No stock image is presented as a photo of the family's dish. Without a real photo, the card shows a plain "Chưa có ảnh" tile in the category colour.

## 9. Non-functional requirements

| area | requirement |
| --- | --- |
| accessibility | body text ≥ 18 px, cooking text ≥ 28 px, touch targets ≥ 56 px, contrast ≥ 4.5:1 (aim 7:1 for body), no gesture-only actions, no hover-only content |
| performance | usable on a mid-range Android phone on 3G; recipe opens in < 2 s when cached |
| reliability | a finished session is never lost: stored on the phone until the server confirms |
| privacy | private data, one account, no analytics, no ads, sign-up closed |
| independence | cooking, timers, voice and saved recipes work with no AI service |
| maintainability | data access behind one repository interface; no recipe data in components |
| backup | export of data and, separately, of images; reminder when the last backup is old; documented and rehearsed restore (§14.4) |

## 10. Decisions that need your input

| # | question | why it matters | my recommendation |
| --- | --- | --- | --- |
| Q1 | ~~Which phone will mother use?~~ **Answered 2026-11-21: iPhone.** Still needed: model and iOS version. | Decides voice quality and what must be tested first | See §12 for what iPhone changes |
| Q2 | ~~Cloud or phone-only?~~ **Answered: cloud (Supabase) for all data, images and settings.** | — | See §13 |
| Q3 | Where do the 10 sample recipes' quantities come from? | The brief forbids invented quantities presented as verified | (a) I draft standard home-style versions clearly labelled "mẫu – chưa kiểm chứng" and mother corrects them by cooking, **and** (b) you send 2–3 of her real recipes or favourite videos to enter properly |
| Q4 | Recipe photos | No fake photos allowed | Start with the honest "Chưa có ảnh" tile; mother photographs each dish the first time she cooks it |
| Q5 | ~~One account or two?~~ **Answered: one account, full rights, no roles (§14).** | — | — |
| Q6 | How should the app address her? ("mẹ", "má", "cô", her name) | Every greeting and voice line uses it | "mẹ" unless you say otherwise |

## 11. Assumptions (I proceed on these unless corrected)

1. One family, 2–6 people, default 4 servings (adjustable in Cài đặt).
2. Online is required (cloud is the source of truth); kitchen Wi-Fi may be weak. Offline reading is P2, but a finished session is held on the phone until the cloud confirms it.
3. One dish cooked at a time in P0.
4. Spoons: muỗng cà phê ≈ 5 ml, muỗng canh ≈ 15 ml, chén ≈ 250 ml — adjustable.
5. Vietnamese only.
6. Free tiers of Supabase and Vercel are enough.
7. You usually enter recipes, signed in to the same account; mother mostly cooks, adjusts and rates, but nothing stops her from editing.

## 12. Target device: iPhone (decided 2026-11-21)

Every browser on an iPhone uses Apple's WebKit engine, so Safari's behaviour is the behaviour; installing Chrome changes nothing. The points below are expectations from platform documentation and known behaviour, **not yet measured on her phone** — milestone M0 measures them.

| capability | expectation on iPhone | consequence |
| --- | --- | --- |
| Read aloud in Vietnamese | Good. iOS ships a Vietnamese voice. Speech must be started by a tap the first time. | TTS stays P0. Auto-read of the next step works after her first tap on "Đọc" or "Bắt đầu nấu". |
| Silent switch / volume | To be measured: speech and the timer alarm may be silenced by the ring/silent switch. | Cooking mode shows a one-line sound check at the start ("Mẹ có nghe tiếng không?"). |
| Voice commands | Uncertain. Safari offers recognition only when Siri & Dictation are on, with Vietnamese dictation; it has been unreliable, especially inside an app added to the Home Screen. Hands-free continuous listening should not be expected. | Voice commands stay P1 and are built press-to-talk first. If M0 shows they do not work acceptably, they are shown as unavailable with large buttons — and we say so. |
| Screen stays on | Supported in Safari from iOS 16.4; inside Home Screen apps it only became dependable in iOS 18.4. | Needs her iOS version. Fallback: instructions to set Auto-Lock to "Never" while cooking. |
| Timers | Stop running when the phone locks or the app is in the background; no alarm can ring from a closed web app. | Keep the screen on; timers recalculate from the end time on return. |
| Stored data | Safari may clear a website's local data after about a week without visits; Home Screen apps are exempt. | Confirms cloud storage (Q2) as the source of truth; local storage is only a cache. |
| Camera for dish photos | Works through the standard photo picker. | No change. |

**Superseded by §13:** the app is used as an ordinary web page in Safari; adding it to the Home Screen is optional. Model and iOS version are not needed to start development; device checks happen in a later stage.

## 13. Delivery direction: web app first (decided 2026-11-21; sign-in and cloud parts superseded by §15)

Same experience as the owner's earlier personal app (one fixed link, open on the phone, use it), with two differences that the earlier app did not need: **sign-in** and **cloud storage**. That app is a static site that keeps data only on the device; BẾP NHÀ keeps everything in the cloud.

### 13.1 Requirements added
| # | requirement |
| --- | --- |
| W1 | Deployed online at one fixed link (Vercel). |
| W2 | Open the link on a phone, sign in, use it. No App Store. |
| W3 | Every basic function works in an ordinary browser tab. Adding to the Home Screen is optional and never required. |
| W4 | Sign-in persists; she is not asked again on each visit. |
| W5 | Recipes, versions, cooking history, images and settings are stored in the cloud (Supabase). |
| W6 | ~~Two roles~~ — replaced by a single account with full rights (§14). |

No functional requirement from §4 is removed. Changes in priority: "installable PWA" goes from P1 to optional; cloud storage and sign-in move into the first milestone.

### 13.2 Sign-in and session
- One account, created by hand in Supabase; public sign-up is closed. The same account may be signed in on several devices at once.
- Mother's phone is signed in once (by you, or by her with the iPhone's saved password). After that the app opens straight to Trang chủ.
- The session is kept in long-lived cookies set by the server and renewed on every visit, not only in browser storage — on iPhone, Safari can clear a site's script-written storage after about a week without visits, which would otherwise sign her out.
- A session cannot be guaranteed forever (clearing Safari data, Private Browsing, or about 13 months without opening the app end it). When that happens she sees one large, plain sign-in screen that works with the iPhone's password autofill (Face ID), and returns to where she was.
- Safari and a Home Screen copy keep separate sessions; each is signed in once.
- No sign-out button on the main screens (it lives in Cài đặt, with a confirmation).

### 13.3 What works where
| function | any browser tab | needs Home Screen install | limited on iPhone — checked on the real device later |
| --- | --- | --- | --- |
| Sign in and stay signed in | yes | no | — |
| View recipes, search, filter | yes | no | — |
| Servings scaling, adjust, family versions, compare, restore | yes | no | — |
| Cooking mode, step by step | yes | no | — |
| Journal, feedback, favourites | yes | no | — |
| Recipe management, image upload | yes | no | — |
| Dish photo from camera or library | yes | no | — |
| Read aloud in Vietnamese | yes, after a first tap | no | voice quality, silent switch |
| Timers while the screen is on | yes | no | alarm sound with silent switch |
| Voice commands | where the browser supports it | no | **yes** — availability and accuracy unknown until tested |
| Keep the screen on | where supported | no | **yes** — depends on iOS version |
| Timer alarm with the phone locked | no (no web app can) | no | **yes** — confirm behaviour, document the workaround |
| Full screen without Safari's bars, Home Screen icon | — | yes (optional) | — |
| Offline reading (P2) | — | recommended | — |

Functions in the last column are built with a detected fallback from the start, so the app is complete without them: large buttons instead of voice commands, an "Auto-Lock" instruction instead of wake lock, on-screen countdown instead of a lock-screen alarm.

## 14. Single-account model (decided 2026-11-21; superseded by §15 — there is no account at all now)

Guiding principle: a personal cooking app that is easy to use, stable and maintainable for years — not a multi-user system built before anyone needs it.

### 14.1 What the decision is
- One sign-in. Full rights to use and manage everything.
- No admin/user roles, no invitations, no member sign-up, no user-management screen, no per-account edit rights.
- The same account can be used on several devices (her phone, your phone, a computer).
- Simple sign-in that persists (§13.2).
- One account does not mean less security: data is private to the signed-in account, sign-up is closed, and no privileged key is ever in the app (DATABASE_SCHEMA §5).

### 14.2 What is unchanged
Every module in §4 (Home and suggestions, library and search, original and family versions, version history, cooking mode, read-aloud, voice commands where supported, timers, ingredients and quantities, equipment and utensils, journal and feedback, dish photos, YouTube links and sources, weekly plan and shopping list in P2, add / edit / delete recipes) and the four rules:
1. The original recipe is never silently overwritten.
2. Version history is never lost.
3. Every cooking session points at the exact version cooked.
4. A reference recipe never becomes "family approved" on its own.

### 14.3 Consequences for the experience
- **Protection now comes from design, not from roles.** Because mother's account can also edit and delete:
  - management lives in Cài đặt, never on the cooking path;
  - "Xoá món" moves the dish to "Món đã xoá" (restorable); permanent deletion exists only for a dish never cooked;
  - every destructive action asks once, in plain words, with the safe choice as the large button;
  - adjusting a recipe can never damage it — it always creates a new version.
- On a computer, the recipe editor uses the wider screen; everything else is the phone layout centred.
- Settings (text size, voice, spoon sizes, how the app addresses her) are stored with the account, so they follow it across devices. Text size can be overridden per device.

### 14.4 Backup and restore
The free Supabase plan is not treated as safe storage: a project may be paused when unused and there may be no automatic backups (to be confirmed on Supabase's pricing page before launch).

| | database backup | image backup |
| --- | --- | --- |
| contains | recipes, versions, ingredients, steps, sources, journal, feedback, settings — one JSON file | every recipe and dish photo — one ZIP, folder names matching the paths stored in the data |
| made by | Cài đặt → Sao lưu → "Tải dữ liệu" | Cài đặt → Sao lưu → "Tải hình ảnh" |
| size | small (well under 1 MB for years) | grows with photos; hence separate |
| restore | "Khôi phục dữ liệu" into an empty project | "Khôi phục hình ảnh" re-uploads by path |

- The app records the date of the last backup and shows a gentle reminder on Trang chủ after 30 days.
- A restore is rehearsed once for real: moving from the test project to the production project is done *by* backup and restore, which proves the procedure before it is ever needed.
- A paused project is resumed from the Supabase dashboard; a small daily scheduled request reduces the chance of pausing but is not a guarantee.

### 14.5 Decisions held for now
| item | decision |
| --- | --- |
| Hosting | Vercel Free |
| Link | `<name>.vercel.app` |
| Users | one account |
| Auth | Supabase Auth |
| Data | Supabase (PostgreSQL) |
| Images | Supabase Storage, private buckets |
| Environments | one test project first; the production project later |
| Supabase plan | start on Free |
| Backup | export and restore procedure, data and images separately |
| Interface | responsive web app |
| PWA | optional, later |

## 15. Local-first model (decided 2026-11-21) — current

Same model as the owner's earlier app My Gym Progress. Reasoning and the alternatives compared: [STORAGE_PROPOSAL.md](STORAGE_PROPOSAL.md).

### 15.1 What it is
- All data and photos are stored on the phone, in the browser's database. Nothing is sent anywhere.
- No backend, no account, no sign-in, no monthly cost, no dashboard to visit.
- A static site on GitHub Pages at one fixed link. Installed to the Home Screen; works offline.
- One main phone. No synchronisation between devices.

### 15.2 What replaces what
| earlier requirement | now |
| --- | --- |
| W2 "sign in and use" · W4 persistent sign-in · §13.2 · §14 | open the link (or the Home Screen icon) and use it; nothing to sign in to |
| W5 cloud storage | storage on the phone + backup package |
| W3 "Home Screen optional" | **part of setup**: without it Safari may clear the data after 7 days without use |
| §14.4 backup of database and images separately | one ZIP package containing both |
| use the same data on a computer | each device has its own data; recipes move as a recipe pack |

Every functional module in §4 and the four rules in §14.2 stay exactly as they were.

### 15.3 Backup
- Cài đặt → Sao lưu: **"Sao lưu"** makes one ZIP with everything (recipes, ingredients and quantities, steps, original and family versions, cooking history, feedback and adjustments, favourites, sources and links, settings, photos; meal plans and shopping lists when they exist) and hands it to the iPhone's share sheet / Files.
- Shows when the last backup was made. Trang chủ shows a reminder when there are changes older than 7 days that are not backed up.
- **"Khôi phục"** checks the package (checksums, counts, internal links) before replacing anything, and first keeps the current data as a restore point.
- "Xoá món" moves a dish to "Món đã xoá"; it can be brought back.
- Not possible, and not promised: backup without a tap, or while the app is closed.
- If the phone is lost or its browser data is cleared, everything since the last backup is lost. Recommended habit: back up after adding or adjusting recipes, and keep the file in iCloud Drive.

### 15.4 Adding recipes
On her phone in Cài đặt → Quản lý công thức; or on your own device, then "Xuất gói công thức" → send the file → "Nhập gói công thức" on her phone. Importing only adds dishes or versions; it never overwrites hers.

### 15.5 Decisions
| item | decision |
| --- | --- |
| Storage | IndexedDB on the device (Dexie) |
| Backend, accounts, sign-in | none |
| Hosting | GitHub Pages |
| Backup | ZIP package by one tap + reminder after 7 days of unsaved changes |
| Automatic Google Drive backup | later, only if wanted |
| Cost | none |
