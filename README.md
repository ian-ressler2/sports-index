# Sports Index

Browser-only stats explorers with one shared engine and a landing page to pick a sport.

| Site | Sport | Data |
|---|---|---|
| Diamond Index | MLB | MLB Stats API, Baseball Savant |
| Ice Index | NHL | ESPN public JSON feeds |
| Court Index | NBA | ESPN public JSON feeds |
| Gridiron Index | NFL | ESPN public JSON feeds |

Each site has leaderboards with percentile shading, a stat lab, compare, team pages with standings, player pages (overview, stats, splits, game log), and a sport-specific chart explorer (spray charts, shot maps, shot charts, play tendencies).

## Layout

- `core/` shared engine: router, percentile engine, charts, UI, stats, lab, compare, team and player pages. Driven by a `SPORT` contract object.
- `sports/<sport>/` per-sport columns, data loader and config. `sports/_espn/` is the adapter shared by NHL, NBA and NFL. `sports/sports.json` lists each sport's files and theme.
- `landing/` the sport picker.
- `tools/build.py` concatenates everything into `dist/` (landing, one folder per sport, and single-file `dist/standalone/<sport>.html`).
- `tests/` Playwright smoke tests against mocked feeds.

## Develop

    python3 tools/build.py
    node --expose-internals tools/lint_globals.js dist/assets/core.js dist/nhl/sport.js
    python3 tests/smoke_espn.py nba        # W=390 CS=dark for phone/dark
    python3 tests/smoke_mlb.py && python3 tests/smoke_landing.py

Open `dist/index.html` directly, or serve `dist/` from any static host.

## Notes

- Everything runs in the browser and calls the public feeds directly. Only some ESPN hosts allow CORS; the adapter sticks to those.
- Data is cached in IndexedDB, namespaced per sport.
- Not affiliated with any league or club.
