# OKAP TV

Statická rekonstrukce původního AIO HTML přehrávače.

## Struktura

- `index.html` — veřejný vstup pro GitHub Pages
- `frontend/` — DOM/view vrstva a aplikace
- `functions/` — HLS player, storage, fullscreen a ovládání
- `design/` — kompletní vizuální vrstva
- `data/channels.json` — jediný zdroj dat kanálů
- `imgs/channels/` — lokální loga kanálů

Aplikace je bez buildu a bez npm. Stačí GitHub Pages / libovolný statický hosting.

Poznámka: stream URL jsou převzaty z původní verze. Některé používají HTTP HLS zdroje, které mohou být z HTTPS hostingu blokovány jako mixed content.
