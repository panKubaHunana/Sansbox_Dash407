# Pokyny pro Clauda – Sandbox Dash 407

Uživatel: Kuba (tykat, česky). Sandbox je PWA kopie launcheru Dash 407 (repo panKubaHunana/Dashboard_Peugeot_407, Kotlin/Compose).

## Zpracování změn ze sandboxu (issues v tomto repu)
1. Přečti otevřené issues „Sandbox: …“ – v těle je seznam změn a JSON (`pages` v mřížce `grid.cols × grid.rows`, `appearance`).
2. Uprav Dash 407: výchozí rozložení v `home/Layout.kt` (`defaults()`, Domů je zapsané v mřížce 24 × 21 přes `f()`), případně jednorázovou migraci (jako `migrateHome` s novým příznakem), vzhled v `data/Appearance.kt`, widgety v `home/Widgets*.kt`. Zvyš `versionName` v `app/build.gradle.kts` a doplň `.github/release-notes.md`.
3. Po vydání rádia aktualizuj tady: `radio-state.json` (radioVersion, capturedAt = nové datum → sandbox nabídne převzetí stavu rádia), totéž ve widgetech/JS, `version.json` (`version` = vždy stejná verze jako Dash 407 – Kuba si nepřeje jiné číslo; `build` = skryté číslo sestavení, při změně jen v sandboxu zvyš `build` i `APP_BUILD` v `js/core.js`, verzi neměň; při nové verzi rádia `build` = 1), `APP_VERSION` v `js/core.js` a `CACHE` v `sw.js` (např. sbx407-2.12-b2).
4. Issue zavři s odkazem na commit.

## Úpravy rádia – vždy nejdřív návrh ke schválení (Kubovo přání)
Kuba přes týden nemůže zkoušet v rádiu, proto **nikdy nenahrávej změny rádia rovnou do main**.
1. V Dashboard_Peugeot_407 vytvoř větev `navrh-<verze>` (např. navrh-2.13), zvyš `versionName` a doplň `.github/release-notes.md`. Push jen té větve (main se nesestavuje). Neměň `.github/workflows` ve větvi návrhu. Push spustí `check.yml` (jen kompilace, nic nevydá); u starší větve bez check.yml: `gh api -X POST repos/panKubaHunana/Dashboard_Peugeot_407/actions/workflows/check.yml/dispatches -f ref=main -f inputs[branch]=navrh-<verze>`. Návrh hlas Kubovi až po zelené kontrole. Kontrola vyrobí i snímky widgetů ze skutečného Kotlin kódu (Paparazzi, test v `.github/snapshots/` na main rádia, do APK se nedostane) a uloží je do větve `snimky` (složka = větev návrhu): `git clone --depth 1 -b snimky https://github.com/panKubaHunana/Dashboard_Peugeot_407.git` → prohlédni a porovnej se sandboxem. Pro nové widgety doplň scénáře do WidgetSnapshots.kt (jen ukázková data, žádné kontakty). Artefakty Actions stáhnout nejdou (blob.core.windows.net blokované).
2. Tady spusť `tools/novy-navrh.sh <verze> "<krátký název>"` → vznikne `navrh/` (kopie sandboxu). Stejné úpravy udělej v `navrh/js/…`, doplň `notes` v `navrh/proposal.json` a `navrh/version.json`. Kořen sandboxu (= stav rádia) neměň. Push do main.
3. Sandbox Kubovi ohlásí „Návrh X ke schválení“. V náhledu klepne na **Schválit a nahrát** → úkol „Schválit návrh X“ v Dashboard_Peugeot_407 → workflow `approve.yml` sloučí větev do main a spustí build.yml → rádio nabídne aktualizaci. Workflow `promote.yml` tady pak (do 30 min) přesune `navrh/` do kořene.
4. Připomínky přijdou jako úkol „Připomínky k návrhu X“ v tomto repu → uprav větev i `navrh/` a pošli znovu (aktualizuj `created` v proposal.json).
5. Commity do main rádia mimo schválení (jen workflow) označ `[skip ci]`, aby nevznikla nová verze.

## Changelog (Kubovo přání)
- Stručně, jen podstatné změny, jedna krátká věta na řádek ve tvaru „Oblast: co je nového“ (např. „Navigace: nové tlačítko kompas – sever nahoře / mapa ve směru jízdy“).
- Drobnosti (velikosti, barvy ikon, zarovnání) neuvádět. Platí pro `.github/release-notes.md` rádia i `notes` v sandboxu.

## Zásady
- Rozměry 1:1 s rádiem: 768 × 1024, lišty 174/170 px, 1 dp = 1 px. Velikosti písma a výpočty kopírují Kotlin kód.
- Repozitář je veřejný: žádná jména a čísla kontaktů, žádné API klíče.
