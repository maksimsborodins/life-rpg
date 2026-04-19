# Life RPG

Personal life gamification app — 8 spheres, balance wheel, habits, and a long-term day grid. The app works as a small PWA and stores user progress locally in the browser.

## What changed in this update

- Fixed habit purpose storage and display.
- Added stricter input validation for sphere scores.
- Reworked day-opening logic: progress now depends on actual opened days history instead of auto-counting every day.
- Improved streak calculation with explicit date sorting.
- Added import/export of all data as JSON for backup and transfer between phone and PC.
- Made timeline configuration editable through constants in code and aligned the description with the real day count.

## Files

- `index.html` — app structure
- `style.css` — UI styles
- `app.js` — app logic
- `manifest.json` — PWA manifest

## Notes

This version still uses browser storage, but now supports manual backup/restore through JSON export and import, which makes moving data between devices much safer.
