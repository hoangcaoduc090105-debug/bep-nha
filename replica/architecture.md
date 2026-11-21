# Architecture: BẾP NHÀ (summary in the Replica format)

Full document: [../ARCHITECTURE.md](../ARCHITECTURE.md) · data model: [../DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)

## Stack
| layer | choice | why |
| --- | --- | --- |
| web | Next.js 16 static export + TypeScript + Tailwind | no server needed |
| database | IndexedDB on the device (Dexie) | one phone, one user, no cost, works offline |
| auth | none | nothing is stored online |
| payments / email / jobs | none | |
| hosting | GitHub Pages | free static hosting |

## Schema
8 local stores (recipes, versions, sessions, images, settings, mealPlans, shoppingLists, restorePoints). Rules enforced in `data/repo.ts`.

## API
None. Backup and restore are files handled in the browser.

## The parts that bite
- Safari clears storage after 7 days without use unless the app is on the Home Screen
- no automatic backup is possible on iPhone; one-tap package + reminder
- Vietnamese voice depends on the device
- timers stop when the phone locks

## Build order
G1 slice → G2 P0 + backup → G3 PWA + deploy → G4 recipe management → G5 P1 → G6 real iPhone → G7 P2
