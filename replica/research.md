# BẾP NHÀ — Research findings

Date: 2026-11-21. Companion to [recon.md](recon.md) (Cookpad) and [../PRD.md](../PRD.md).

## 1. Three kinds of feature

### A. What the reference app (Cookpad) does
Search by dish or ingredient, one long recipe page (photo → ingredients → numbered steps with photos), save to a personal library with folders, write private or public recipes, cooksnaps (photo + comment of what you cooked), and in the app: weekly meal plan, shopping list from the plan, AI import. Full list in `features.csv`.

Worth borrowing as patterns: the recipe card (photo, title, time, servings), ingredients-before-steps order, a private library that mixes saved and own recipes, the cooksnap idea turned inward as a private cooking journal, a shopping list that only adds what is missing.

### B. What solves mother's problem (and Cookpad does not do, on public evidence)
| her problem | feature | Cookpad |
| --- | --- | --- |
| taste differs each time | structured quantities + a saved **family version** per dish | free-text ingredients, one version |
| forgets what she changed | version history with a reason for each change | no |
| "was last time's better?" | journal tied to the exact version, with feedback | cooksnap has a comment only |
| hands are wet | one step per screen, voice playback, voice commands, screen stays on | not verified / absent on web |
| loses track of time | timers inside the step | not verified / absent on web |
| vague instructions | every step says what to look for and what to avoid | depends on the author |
| videos are hard to remember | written, measured recipe linked to the video and its timestamps | steps can hold a video |
| small text | large type, large buttons, five tabs | standard app density |

### C. Excluded from the first release
Community features, publishing, premium, social login, AI import and translation, sharing, folders, print. Planner and shopping list are P2 (kept simple, optional).

## 2. The YouTube channels

All three loaded and were verified from YouTube's own channel pages and public RSS feeds on 2026-11-21. No video was watched; narration style is not verified. The feed exposes only the latest 15 uploads, so this reflects September–November 2026.

| | channel 1 | channel 2 | channel 3 |
| --- | --- | --- | --- |
| verified name | **TÚ LÊ MIỀN TÂY** | **Cô Ba Bình Dương** | **SỨC KHỎE TÂM SINH** |
| URL | https://www.youtube.com/channel/UCSIXbWF9wBVYwqPWS6ZL9Lw | https://www.youtube.com/channel/UC-c0PPbJKW-KUliEZPosVvg | https://www.youtube.com/@suckhoetamsinh (ID UCcIfP3ugD4zFIpXub8x8HTQ) |
| size (as displayed) | ~846K subscribers, ~1.1K videos | ~1.96M subscribers, 653 videos | ~2.4M subscribers, 799 videos |
| style | Mekong Delta home cooking, easy family dishes | Southern home cooking (Bình Dương), one host, menu series "Hôm Nay Ăn Gì" and "Tiệc Này Ăn Gì" | Southern home cooking despite the health-sounding name; all 15 latest uploads are recipes; leans to bánh, chè and batch cooking |
| recurring | canh, gỏi, dipping sauces, pickles, coconut sweets, xôi, Tết dishes | kho, chiên, xào, bún nước, steamed bánh, party menus | kho, sốt, chè, bánh hấp/nướng, gỏi cuốn, bánh canh |
| how quantities are given | ~2/3 of descriptions list ingredients in kg / g / ml / spoons; steps not written | long descriptions with tips; whether a full measured list follows was **not verified** | every description lists ingredients in household measures **with gram equivalents**, grouped (vỏ / nhân / sốt); steps mostly not written |
| embeddable | yes (2 videos tested) | yes (2 tested) | yes (2 tested) |

Recent examples (titles as published):
- Tú Lê Miền Tây: Canh Hẹ Huyết Heo — https://www.youtube.com/watch?v=olI_VEsh1ZI · Thịt Bò Xào Măng Tây — https://www.youtube.com/watch?v=eLwLE6IEIC8 · Cà Ri Bò — https://www.youtube.com/watch?v=KHjuDfaFxDw · Gỏi Gà Củ Hủ Dừa — https://www.youtube.com/watch?v=t-VFL_K_Gbk
- Cô Ba Bình Dương: Chuối Xanh Kho Tiêu — https://www.youtube.com/watch?v=fQHeKMOHntw · Hôm Nay Ăn Gì: 5 món mặn hao cơm — https://www.youtube.com/watch?v=EPEX8FQMVkU · Bún Xào chay rau củ — https://www.youtube.com/watch?v=8s6gSCQp7bM
- Sức Khỏe Tâm Sinh: Thịt Kho/Rang Sả Ớt và Canh Chua thịt bằm — https://www.youtube.com/watch?v=cgauooVeeFY · Thịt Viên Sốt Chua Ngọt — https://www.youtube.com/watch?v=fo0UujUP1sQ · Xíu Mại Sốt Cà Chua — https://www.youtube.com/watch?v=qosxytfh-CI · Gỏi Cuốn Tôm Thịt — https://www.youtube.com/watch?v=fqHZ8adtfgQ

Dishes that recur across channels: gỏi cuốn with tương đen, thịt kho variants (kho tiêu, rang sả ớt), family soups (canh chua thịt bằm, canh hẹ), gỏi gà / gỏi đu đủ, xá xíu, cánh gà chiên nước mắm, khoai mì nước cốt dừa, chè and coconut sweets.

### What this means for the product
1. **All three are Southern home cooking** — the same taste the brief describes. No regional conversion is needed.
2. **The channels give ingredients but not written steps.** That is the gap mother feels: she has to remember the method from the video. BẾP NHÀ's written, step-by-step version *is* the value added.
3. **Household measure + grams is already how channel 3 writes** ("1 muỗng canh … (20g)"). Mother is used to that format; the app should use it.
4. **Sweets and bánh are a large share of what she watches**, so "Món tráng miệng / Bánh – chè" deserves real support (ingredient sub-groups like vỏ / nhân / sốt — supported by `group_name`).
5. **Videos are embeddable**, so P1 video integration is feasible with the standard YouTube embed plus a link to the original.

### Copyright position
- Ingredient lists and methods are facts and ideas; the creators' wording, video and photos are theirs.
- A recipe written from a video is stored with `fidelity = inspired` or `transcribed`, the channel name, and the video link, and is shown as "Viết lại theo video của …", never as the creator's exact recipe.
- No video or thumbnail is downloaded. Videos play through YouTube's embed or open in YouTube.
- The app is private to one family, behind one account.

## 3. Missing requirements found

| gap | why it matters | proposal |
| --- | --- | --- |
| Which phone mother uses | decides how well voice works (section 4) | **needs your answer** |
| Who signs in, and how | she should not be asked to sign in again and again | one account for the whole app, signed in once per device; session kept by server-set cookies |
| Where sample recipes' quantities come from | the brief forbids invented measurements presented as verified | **needs your answer** — see PRD §8 |
| Where recipe photos come from | the brief forbids placeholders posing as real photos | **needs your answer**; default = honest "Chưa có ảnh" tile until the family photographs the dish |
| Scaling seasonings | doubling a dish does not exactly double the fish sauce | scale linearly, show "Nêm lại cho vừa" on seasonings when servings change |
| Step text vs. adjusted quantities | list and instructions can drift apart | quantity tokens in step text (DATABASE_SCHEMA §2) |
| Several timers at once | rice and braise overlap | allow multiple named timers, shown as a bar in cooking mode |
| Interrupted cooking | phone call, app closed | session state saved on every step; "Tiếp tục nấu" on Home and in the Đang nấu tab |
| Two dishes at once | common for a family meal | P0: one active session; P2: several |
| Weak kitchen Wi-Fi | a save must not be lost at the end of cooking | session kept on the phone until the server confirms |
| Spoon and bowl sizes differ | "1 muỗng canh" is not universal | calibration in Cài đặt, defaults 5 / 15 / 250 ml, always shown as "khoảng" |
| Text size preference | eyesight varies | three sizes in Cài đặt, default large |

## 4. Technical risks

| risk | severity | detail | mitigation |
| --- | --- | --- | --- |
| Vietnamese text-to-speech voice missing | high | Speech synthesis uses voices installed on the device. iPhones ship a Vietnamese voice; Android depends on Google's speech services being installed with Vietnamese; many desktop browsers have none. | Detect `vi-VN` voices at start. If none: say so plainly and show how to install; cooking mode works fully by touch. Later option: pre-recorded audio per step. **Must be tested on her actual phone before build decisions are final.** |
| Vietnamese speech recognition patchy | high | Chrome on Android supports it (needs internet; audio goes to Google). Safari on iPhone supports it partly and is unreliable in an installed home-screen app. Firefox: none. Continuous listening is not dependable on phones. | Treat as P1 enhancement. Press-to-talk microphone button as the base; hands-free listening only where it proves stable. Large buttons always visible. Never claim it works where it does not. |
| App hears its own voice | medium | TTS output triggers the recogniser | stop listening while speaking |
| Kitchen noise | medium | hood fan, frying | small fixed command list with fuzzy matching; show what was heard; buttons remain |
| Timers stop when the phone locks | high | browsers pause background pages | Screen Wake Lock in cooking mode; timers computed from an end time, so they are correct on return; alarm sound + vibration; note that an alarm cannot ring from a fully closed app |
| Wake Lock unsupported on old phones | medium | older iOS | fallback notice "Giữ màn hình sáng" + instructions |
| Recipe accuracy | high | wrong quantities defeat the purpose | verification status on every recipe; family approval through real cooking |
| Data loss | high | family history is irreplaceable; Supabase's free plan has no automatic backups (to be confirmed on the pricing page) | one-tap JSON + images export, and a scheduled export if wanted |
| Free database pauses | medium | Supabase pauses free projects after about a week with no activity (to be confirmed) | a small daily scheduled request from Vercel, or the paid plan |
| iOS home-screen app limits | medium | storage eviction, microphone quirks | cloud is the source of truth; local storage is only a cache |
| Scope | medium | ten modules | strict P0 → P1 → P2 order |
