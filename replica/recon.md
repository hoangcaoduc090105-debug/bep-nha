# Recon map: Cookpad (Vietnam — web + iOS listing)

Scope: the personal-cookbook slice only — find a recipe, read it, save it, write your own, plan and shop. The social network (feeds, follows, cooksnaps, contests, rankings) is recorded but out of scope.
For: BẾP NHÀ, a private cookbook for one Vietnamese family (one account). Cookpad is a **functional reference**, not a clone target.
Date: 2026-11-21

## How this was gathered, and its limits

- Public pages only, read as text, logged out. No account, no app install, no JavaScript bundles, no network inspection.
- **No screen was seen visually.** Layout, spacing and colour are unknown. App-only screens (planner, shopping list, editor) are known only from the App Store description.
- Google Play listing did not load. The recipe editor is behind login and was not seen.
- Anything marked *inferred* or *not verified* must not be treated as fact.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | App Store VN | https://apps.apple.com/vn/app/cookpad-c%C3%B4ng-th%E1%BB%A9c-n%E1%BA%A5u-%C4%83n-ngon/id585332633?l=vi | description, version notes, 4.8 from ~3.9K ratings, in-app purchases 25,000₫ / 49,000₫ / 69,000₫ |
| 2 | Google Play | https://play.google.com/store/apps/details?id=com.mufumbo.android.recipe.search | **did not load** (title only) |
| 3 | Web home | https://cookpad.com/vn | loaded, logged out |
| 4 | Search results | https://cookpad.com/vn/tim-kiem/cá%20kho%20tộ | loaded, 166 results |
| 5 | Recipe pages | https://cookpad.com/vn/cong-thuc/25701530 , https://cookpad.com/vn/cong-thuc/25408888 | loaded |
| 6 | FAQ | https://cookpad.com/vn/faq | loaded |
| 7 | Premium | https://cookpad.com/vn/premium | loaded, no prices |
| 8 | Terms | https://cookpad.com/vn/dieu-khoan | loaded (effective 1 Nov 2018) |
| 9 | Cooksnap intro | https://cookpad.com/vn/cooksnap_intro | loaded |
| 10 | New recipe | https://cookpad.com/vn/cong-thuc/tao-moi | login wall only |

### Terms check

- §11: Cookpad and its licensors own the design, graphics, text and software; use is personal and non-commercial; materials may not be reused off the site. §12: no reverse engineering. §25: name and logo are trademarks.
- No clause was found about building a competing product or about crawling.
- Consequence for BẾP NHÀ: functional ideas are free to use; **no Cookpad recipe, photo, text, layout or branding is taken**. None is needed.

## Core loop

Search a dish → read one long recipe page → cook from it → save it or post a photo of the result.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Home | /vn | entry, discovery | guest avatar + login link, nav (search, premium, challenges, FAQ), contest banners, trending keywords dated daily, premium ranking teasers | logged out only |
| S02 | Search results | /vn/tim-kiem/… | find a dish | result count, cards (photo, title, ingredient preview, time/servings, author, save, cooksnap count), filter (cooksnaps: all / 1+ / 10+), sort newest / popular (popular is paid), pagination | filled; paywall row |
| S03 | Recipe detail | card click | read and cook | see "Recipe page structure" below | filled; guest prompts |
| S04 | Login overlay | any gated action | sign in | Google, Apple, Facebook, email | shown |
| S05 | Library ("Kho món ngon") | nav | saved + own + cooked recipes, searchable, folders | — | logged-out prompt seen; contents *inferred* from FAQ |
| S06 | Premium page | nav / paywalls | upsell | two rankings, popular-first search | filled |
| S07 | Cooksnap intro | recipe link | explain cooksnaps | explainer | filled |
| S08 | FAQ | nav | help | account, notifications, usage | filled |
| S09 | Recipe editor | "Viết món mới" | write a recipe | — | **not seen** (login) |
| S10 | Meal plan | app | weekly plan | — | *inferred* from App Store only |
| S11 | Shopping list | app | generated from the plan, missing items only | — | *inferred* from App Store only |
| S12 | Import / photo-to-recipe / AI assistant | app | bring recipes in | — | *inferred* from App Store only |

### Recipe page structure (S03, in order)

1. Action menu: save, add to collection, print, copy as text, share, report.
2. Main photo, large title.
3. Author (avatar, name, location, date), short story with "read more".
4. Action bar (save, collection, cooksnap, share, print), repeated down the page.
5. Ingredients: time and servings in the header (servings optional); one flat list, quantity then name; **free-text units** ("600 gam", "5 tbsp"); some names link to search. No sub-groups seen.
6. Steps: numbered, 0–3 photos each, a step may hold a video.
7. Cooksnap section, recipe ID, author card, comments, tags, similar recipes, emoji reactions.

## Flows

```
F01 Find a dish and cook it
    S01 -> S02 -> S03 (scroll: ingredients, then steps)
    happy path clicks: 3 (search field, submit, card)
    edge: no results; popular sort is paid; no cooking view — the phone screen is the whole recipe

F02 Save a recipe
    S03 -> (S04 if logged out) -> S05, optionally into a folder
    happy path clicks: 1 when logged in

F03 Write a recipe
    S05 -> S09 -> keep private or publish          (S09 not seen)

F04 Cooksnap
    S03 -> upload photo + comment -> listed under the recipe and in S05 by date

F05 Plan the week and shop (app, inferred)
    S10 -> pick recipes per day -> S11 auto list of missing items
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Recipe card | list row with thumbnail | default, paywalled | S02, S05 |
| Search field | with trending keywords | empty, filled | S01, S02 |
| Filter panel | cooksnap count, sort | free, paid-locked | S02 |
| Action bar | save, collect, share, print | guest (opens login), member | S03 |
| Ingredient list | flat | — | S03 |
| Step list | numbered, with photos/video | — | S03 |
| Login overlay | 4 providers | — | S04 |

Visual specs are not available (nothing was seen rendered). BẾP NHÀ's design system is original and is defined in `DESIGN_SYSTEM.md`.

## Inferred data model

```
Recipe      id, title, photo, story, servings (optional, free text "3-4 người"),
            cook_time (free text), author_id, status (private | published), created_at
            evidence: S03, FAQ          confidence: high
Ingredient  recipe_id, position, text ("600 gam cá…")  — one free-text line, no structured quantity
            evidence: S03               confidence: medium
Step        recipe_id, position, text, photos[0..3], video?
            evidence: S03               confidence: high
Folder      id, user_id, name; Recipe n-m Folder
            evidence: FAQ, App Store    confidence: medium
Cooksnap    id, recipe_id, user_id, photo, comment, created_at
            evidence: S07               confidence: high
MealPlan / ShoppingItem                 evidence: App Store text only   confidence: guess
```

Relationships: User 1-n Recipe, Recipe 1-n Ingredient, Recipe 1-n Step, User 1-n Folder, Folder n-m Recipe, Recipe 1-n Cooksnap.

**The useful finding is what is missing.** Cookpad stores ingredients as free text and has one recipe per page. On public evidence it has no structured quantities, no serving scaler, no cooking mode, no timers, no voice and no recipe versions (the App Store text claims you can edit quantities and add notes; the mechanism is not verified). Those gaps are exactly BẾP NHÀ's reason to exist, and they are why its data model is built differently (see `DATABASE_SCHEMA.md`).

## Feature matrix

See `features.csv`. `original` = does Cookpad have it; `priority` = priority **for BẾP NHÀ**.
Must: 25, should: 12, could: 6, skip: 12.

## Out of scope (cannot or should not be taken)

- Cookpad's recipes, photos, text, layout, name and logo (their terms §11, §25).
- The community: other people's recipes, cooksnaps, follows, comments, contests, rankings, trending keywords.
- Premium paywalls and subscriptions — BẾP NHÀ has nothing to sell.
- AI import, photo-to-recipe, auto-translation — the brief excludes AI dependencies from the first release.

## Size

Reference slice: 12 screens, 5 flows, 6 entities.
BẾP NHÀ itself: about 16 screens, 9 flows, 8 local data stores. Hard parts: Vietnamese voice across browsers, version history that stays truthful, timers that survive a locked phone, trustworthy recipe content. Size: **M** (a few weeks of focused build for P0 + P1).
