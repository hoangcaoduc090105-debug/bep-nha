# BẾP NHÀ — Component specs

Output of `replica-design`. Tokens: [tokens.json](tokens.json) → [tokens.css](tokens.css). Screens refer to PRD §6 (B01–B18).
Rules for every component: real HTML elements, visible label (icons never alone), focus ring 3 px `accent` with 2 px offset, minimum height `target-min` (56 px), no hover-only or gesture-only behaviour, text in Vietnamese.

Status column: **built** = exists on the `/design` page · **spec** = specified here, built with its screen.

```
Button                                                                    built
  variants  primary (accent), secondary (outline), quiet (text), danger
  sizes     md 56px, lg 64px; full-width option
  states    default, pressed (darker), focus-visible, disabled (55% + not-allowed), loading (spinner + label kept)
  tokens    bg accent / surface, text on-accent / text, radius md, font lg/600
  a11y      <button>; aria-busy when loading; disabled buttons stay readable (contrast kept on label)
  used on   all

TabBar                                                                    built
  items     Trang chủ · Công thức · Đang nấu · Nhật ký · Yêu thích (icon + label always)
  states    default, active (accent + bold + bar), focus-visible, badge on Đang nấu (step number)
  tokens    height 72px + safe area, bg surface, border-top border
  a11y      <nav aria-label="Điều hướng chính">, links with aria-current="page"
  used on   B01, B03, B11, B12, B14 (hidden in cooking mode B08–B10)

RecipeCard                                                                built
  content   PhotoTile 4:3, name (lg/600), time + servings, VersionBadge, favourite heart (labelled)
  states    default, pressed, focus-visible, loading (Skeleton)
  a11y      whole card is one link; heart is a separate button with aria-pressed
  used on   B01, B03, B14

PhotoTile                                                                 built
  variants  photo, no-photo ("Chưa có ảnh" on surface-warm with the dish name), failed (same as no-photo)
  rule      fixed 4:3 box so layout never jumps; never a stock image
  used on   RecipeCard, B04, B13

Chip / FilterChip                                                         built
  states    default, selected (accent-soft + accent border + tick), focus-visible, disabled
  size      min-height 48px inside a 56px row; 12px gap
  a11y      <button aria-pressed>
  used on   B02 (ingredients), B03 (categories, equipment), B05 (reasons)

SearchField                                                               built
  parts     label (visible), input 56px, clear button "Xoá"
  states    empty, filled, focus, no results (EmptyState below)
  a11y      <label>; type="search"; enterkeyhint="search"
  used on   B01, B03

QuantityStepper                                                           built
  parts     − button 56px · value (xl, tabular) + unit · + button 56px · small line "Bản gốc: …"
  rules     practical increments (¼ spoon, 10 g, 50 ml); never below the minimum; shows fractions as ½ ⅓ ¼
  states    default, at-minimum (− disabled), changed (accent-soft background), invalid (danger text + message)
  a11y      buttons labelled "Bớt nước mắm" / "Thêm nước mắm"; value in aria-live="polite"
  used on   B04 (servings), B05 (seasonings)

IngredientRow                                                             built
  content   optional tick box 32px in a 56px row · name (lg) · household quantity (lg/600) · metric in brackets (muted) · prep note
  states    default, ticked (secondary-soft, line kept readable — no strike-through), optional ("nếu có")
  a11y      row is a <label> for its checkbox when tickable
  used on   B04, B08, B09

VersionBadge / VersionSwitch                                              built
  badge     "Bản nhà mình" (accent-soft) · "Bản gốc" (surface-warm) · "Mẫu – chưa kiểm chứng" (warning-bg) · "Gia đình đã duyệt" (secondary-soft)
  switch    two large segments, role="radiogroup"
  used on   B04, B06, B07, RecipeCard

StepCard                                                                  built
  content   "Bước 3 / 8" + progress bar · title (display) · "Cần dùng" panel of IngredientRows · numbered instructions (cook 30px) · DoneWhen · Avoid
  a11y      title is the page <h1>; progress has role="progressbar" with text
  used on   B09

DoneWhen / Avoid bands                                                    built
  DoneWhen  secondary-soft bg, tick icon, starts with "Được khi:"
  Avoid     warning-bg, warning icon, starts with "Tránh:"
  rule      meaning carried by words, not colour
  used on   B09, B04 (step preview)

TimerButton / TimerBar                                                    built (static states)
  button    "Hẹn giờ 2 phút" 56px
  bar       sticky; label, remaining time (timer 64px tabular), Tạm dừng / Tiếp tục, +1 phút, Tắt
  states    idle, running, paused, finished (accent bg, "Hết giờ!", rings)
  a11y      role="timer"; announces at start, 1 minute left, and end
  used on   B09

MicButton                                                                 built (static states)
  size      88px round, label underneath always
  states    idle "Bấm để nói" · listening "Đang nghe…" · processing "Đang xử lý…" · understood "Đã hiểu: …" · not understood "Chưa nghe rõ, mẹ bấm nút bên dưới nhé" · unavailable (replaced by an explanation, never a dead button)
  a11y      aria-pressed while listening; status text in aria-live
  used on   B09, B08

SpeakButton                                                               built
  label     "Đọc" / "Dừng đọc"; unavailable → short note "Máy này chưa đọc được tiếng Việt"
  used on   B04, B08, B09

FeedbackOption                                                            built
  content   five full-width 64px options: Rất ngon · Vừa miệng · Hơi mặn · Hơi ngọt · Chưa ngon như mong muốn
  a11y      role="radiogroup"
  used on   B10

Banner                                                                    built
  variants  info, offline ("Mất mạng — đã lưu trên máy"), backup reminder, error
  used on   any

EmptyState / ErrorState / Skeleton                                        built
  empty     one sentence + one primary action
  error     plain sentence + "Thử lại"
  skeleton  blocks in the final layout's shape; no spinner-only screens
  used on   all lists and detail screens

Field (text input, password)                                              spec
  parts     visible label above, 56px input, help or error text below; "Hiện mật khẩu" toggle
  a11y      autocomplete="username" / "current-password" so the iPhone offers the saved password
  used on   Đăng nhập, B16

Sheet / Dialog (confirm)                                                  spec
  rule      safe choice is the large primary button; destructive choice is secondary and worded exactly ("Xoá món này")
  a11y      focus trapped, Esc and "Đóng" close, returns focus
  used on   B05, B15, B16

Toast                                                                     spec
  rule      words, not just colour; stays 5 s; never the only place an error is shown
```
