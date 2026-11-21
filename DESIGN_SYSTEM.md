# BẾP NHÀ — Design system

Status: **design phase done 2026-11-21.** Component specs: [replica/design/components.md](replica/design/components.md). Built components: `components/ui/`, shown on the `/design` page.
Tokens: [replica/design/tokens.json](replica/design/tokens.json) — checked with the skill's contrast tool: 20 colour pairs, 0 failures, body text at AAA.

This is an original identity. Nothing visual is taken from Cookpad (none of its screens were even viewed).

## 1. Principles, in priority order

1. **Readable at arm's length.** The phone is propped by the stove, not held.
2. **One obvious thing to do** on each screen, as a large labelled button.
3. **Nothing hidden.** No swipe-only, long-press, hover or icon-only actions.
4. **Calm.** No decoration that does not help her cook. No animation beyond a short fade.
5. **Honest.** States say what is true: "Đã lưu trên máy", "Chưa có ảnh", "Máy này chưa đọc được tiếng Việt".

## 2. Colour

| role | value | use |
| --- | --- | --- |
| bg | `#FBF6EC` warm ivory | page background |
| surface | `#FFFFFF` | cards |
| surface-warm | `#F3E9D8` | quantity panels, section bands |
| text | `#2B2118` | all body text (14.6:1 on ivory) |
| text-muted | `#5E5145` | secondary text (7.1:1) |
| accent | `#A9471F` terracotta | primary buttons, active tab, links |
| accent-soft | `#F8E3D6` | selected chips, "Bản nhà mình" badge |
| secondary | `#35622F` leaf green | success, "Đã duyệt", done ticks |
| secondary-soft | `#E4EEDD` | completed steps |
| danger | `#B3261E` | destructive, errors |
| warning-bg | `#FFF1C2` | "Tránh" (mistake to avoid) boxes |
| border-input | `#8A7660` | inputs and control outlines (≥ 3:1) |

Colour never carries meaning alone: every state also has words and an icon.

## 3. Type

Font: **Be Vietnam Pro** (open licence, designed for stacked Vietnamese diacritics), self-hosted. Line height is generous so marks like ễ, ặ, ỡ never collide.

| token | size / line | use |
| --- | --- | --- |
| sm | 16 / 24 | the smallest text anywhere (captions, credits) |
| base | 18 / 28 | body |
| lg | 22 / 30 | card titles, ingredient rows |
| xl | 28 / 36 | screen titles |
| cook | 30 / 42 | instructions in cooking mode |
| display | 36 / 44 | step title, greeting |
| timer | 64 / 68 | countdown digits (tabular numerals) |

Cài đặt offers three sizes — Lớn (default) · Rất lớn (+15%) · Cực lớn (+30%) — applied through `rem`, so the whole interface scales and still respects the phone's own text-size setting. No ALL-CAPS body text (harder to read with diacritics). Sentences are short and written the way a Southern family speaks.

## 4. Layout and touch

- Spacing scale 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Page padding 16 on phones, 24 on tablets.
- Touch targets: **56 px minimum**, primary actions 64 px, microphone 88 px. At least 12 px between targets.
- Radius 14 on cards and buttons, 20 on sheets. One soft shadow for cards.
- Phone first (360–430 px). Tablet: recipe detail in two columns (ingredients | steps). Desktop: centred column, max 720 px; the recipe editor uses up to 1100 px.
- Bottom navigation: 5 tabs, icon + label always, 72 px tall, respects the phone's safe area. Tab labels are the one text that follows screen width instead of the text-size setting, so five labels always fit a 360 px phone.
- Primary action sits at the bottom of the screen, full width, within thumb reach.

## 5. Navigation

```
Trang chủ · Công thức · [ Đang nấu ] · Nhật ký · Yêu thích
```
"Đang nấu" is the centre tab and shows a dot with the step number while a session is active. Cài đặt is a labelled gear on Trang chủ; Quản lý công thức and Sao lưu are inside Cài đặt (same account, no separate admin interface). Đăng nhập is a single large form shown only when there is no session. Maximum depth from a tab: two screens. Every inner screen has a labelled "‹ Quay lại".

## 6. Key screens

**Trang chủ** — "Chào mẹ, hôm nay nấu gì ạ?" · "Nấu tiếp" banner if a session is open · search field · Hôm nay nấu gì (3 cards) · "Nhà đang có gì?" button · Mới nấu gần đây · Món yêu thích.

**Chi tiết món** — photo · name · badge "Bản nhà mình" or "Bản gốc" with a two-option switch · time, servings stepper (− 4 người +), difficulty · Nguyên liệu · Gia vị · Dụng cụ · Các bước (collapsed preview) · Lưu ý · Nêm nếm · Nguồn / video · buttons "Chỉnh theo khẩu vị nhà mình" and "So sánh với bản gốc" · fixed bottom bar **Bắt đầu nấu**.

**Bước nấu** (cooking mode; no bottom tabs, lighter background `#FFFDF8`)
```
┌───────────────────────────────────────┐
│ ‹ Thoát      Bước 3 / 8      ▮▮▮▯▯▯▯▯ │
│                                       │
│ Phi thơm hành và tỏi                  │  display
│                                       │
│ ┌ Cần dùng ─────────────────────────┐ │
│ │ ☐ Dầu ăn      1 muỗng canh (15 ml)│ │  tap to tick
│ │ ☐ Hành tím    2 củ, băm nhỏ       │ │
│ │ ☐ Tỏi         3 tép, băm nhỏ      │ │
│ └───────────────────────────────────┘ │
│ 1. Cho dầu vào chảo, bật lửa vừa.     │  cook 30px
│ 2. Dầu nóng thì cho hành, tỏi vào.    │
│ 3. Đảo đều tay.                       │
│                                       │
│ ✔ Được khi: hành tỏi vàng nhạt, thơm. │  green band
│ ⚠ Tránh: lửa lớn, tỏi cháy sẽ đắng.   │  yellow band
│                                       │
│ [ ⏱ Hẹn giờ 2 phút ]   [ 🔊 Đọc ]     │
│                                       │
│ [ ‹ Quay lại ]  ( 🎤 )  [ Tiếp theo › ]│
└───────────────────────────────────────┘
```
A running timer becomes a sticky bar with large digits, Tạm dừng and +1 phút. The microphone shows its four states in words under the button.

**Nấu xong** — "Gia đình mình thấy món ăn hôm nay thế nào?" · five full-width answer buttons · "Ghi chú thêm" · "Chụp ảnh món ăn" · then, when relevant, "Lưu cách nấu hôm nay làm bản nhà mình?".

**Chỉnh khẩu vị** — each seasoning as a row: name, large quantity, big − and + buttons, the original amount shown small beneath ("Bản gốc: 2 muỗng canh"). Reason chips: Bớt mặn · Bớt ngọt · Thêm đậm đà · Nhà thích vậy · Khác. One button: "Lưu bản nhà mình".

## 7. Components (to be specified in the design phase)

Button (primary, secondary, quiet, danger · 56 / 64) · TabBar · RecipeCard · PhotoTile with "Chưa có ảnh" fallback · Chip / FilterChip · SearchField · QuantityStepper · IngredientRow (with tick) · VersionBadge · VersionSwitch · StepCard · DoneWhen / Avoid bands · TimerButton · TimerBar · MicButton (idle, listening, processing, understood, not understood, unavailable) · SpeakButton · FeedbackOption · Sheet / Dialog · Toast with words · Banner (offline, backup reminder) · EmptyState · ErrorState with "Thử lại" · Skeleton.

Every component gets: default, pressed, focus-visible (3 px ring), disabled, loading, error. Icons from Lucide, always with a text label.

## 8. Imagery

Real photographs of the family's own dishes, natural light, 4:3. Until a dish has one, a flat tile in the category colour with the dish name and "Chưa có ảnh" — never a stock photo passed off as the dish. Step images are optional.

## 9. Accessibility checklist

Contrast AA minimum (AAA for body) · targets ≥ 56 px · focus visible · real buttons and labels · works at 200% text zoom without horizontal scroll · no information by colour alone · no time limits · `lang="vi"` so screen readers and speech use Vietnamese · motion respects "reduce motion" · portrait and landscape.
