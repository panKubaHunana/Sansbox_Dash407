# Pokyny pro Clauda – Sandbox Dash 407

Uživatel: Kuba (tykat, česky). Sandbox je PWA kopie launcheru Dash 407 (repo panKubaHunana/Dashboard_Peugeot_407, Kotlin/Compose).

## Zpracování změn ze sandboxu (issues v tomto repu)
1. Přečti otevřené issues „Sandbox: …“ – v těle je seznam změn a JSON (`pages` v mřížce `grid.cols × grid.rows`, `appearance`).
2. Uprav Dash 407: výchozí rozložení v `home/Layout.kt` (`defaults()`, Domů je zapsané v mřížce 24 × 21 přes `f()`), případně jednorázovou migraci (jako `migrateHome` s novým příznakem), vzhled v `data/Appearance.kt`, widgety v `home/Widgets*.kt`. Zvyš `versionName` v `app/build.gradle.kts` a doplň `.github/release-notes.md`.
3. Po vydání rádia aktualizuj tady: `radio-state.json` (radioVersion, capturedAt = nové datum → sandbox nabídne převzetí stavu rádia), totéž ve widgetech/JS, `version.json` (zvyš `version`, `radioVersion`, novinky), `APP_VERSION` v `js/core.js` a `CACHE` v `sw.js`.
4. Issue zavři s odkazem na commit.

## Zásady
- Rozměry 1:1 s rádiem: 768 × 1024, lišty 174/170 px, 1 dp = 1 px. Velikosti písma a výpočty kopírují Kotlin kód.
- Repozitář je veřejný: žádná jména a čísla kontaktů, žádné API klíče.
