# Sandbox Dash 407

Zkušební kopie launcheru **Dash 407** z autorádia Peugeot 407 SW (Hizpo, 768 × 1024) jako PWA pro iPhone a iPad.
Tady si zkoušíš rozložení a vzhled; změny pošleš Claudovi, ten je udělá v [Dashboard_Peugeot_407](https://github.com/panKubaHunana/Dashboard_Peugeot_407) a rádio i sandbox pak nabídnou aktualizaci.

## Co sandbox kopíruje

| Oblast | V sandboxu |
|---|---|
| Obrazovka | 768 × 1024 px (1 dp = 1 px), horní lišta jednotky 174 px, spodní lišta klimatizace 170 px, plocha 768 × 680 |
| Mřížka | 24 sloupců × řádky podle tvaru plochy (21, i v režimu úprav – od verze 2.12 se nepřepočítává) |
| Plochy | kříž Domů / Mapa / Jízda / Auto / Hudba + Menu, přechod tahem prstu, kříž s názvem plochy |
| Úpravy | přidat, posunout, roztáhnout, zkopírovat, smazat, velikost textu, krok zpět, mřížka, přejmenování, zapnutí ploch |
| Widgety | všech 22 typů (rychlá volba, rychloměr, jízda, stav vozu, přehrávač, počasí, mapa, navigace, kompas, GPS, limit, přetížení, časomíra, napětí, spotřeba, servis, klima, hodiny, dok…) |
| Panely | Vzhled (vše), Nastavení, Tankování, Kniha jízd, Auto a signály, Servisní knížka, Kam jedeme?, Aplikace, OBD, Zvuk/volant/klima |
| Data | GPS telefonu, počasí Open-Meteo; data z auta: *Snímek z rádia* (15. 11.), *Ukázková jízda* nebo *Bez auta* |

Co sandbox **neumí** (jen v rádiu): CAN box / MCU, OBD přes Bluetooth, spouštění aplikací, volání přes rádio, navigace krok za krokem přes Mapy.com, skutečný obal alba.

## Instalace na iPhone

1. V Safari otevři **https://pankubahunana.github.io/Sansbox_Dash407/**
2. Sdílet → **Přidat na plochu** → Přidat.
3. Spusť z plochy (celá obrazovka, funguje i offline).

## Odeslání změn Claudovi

Tlačítko **Odeslat změny** pod obrazovkou ukáže seznam změn proti rádiu. Pak:
- **Vytvořit úkol na GitHubu** – otevře předvyplněný úkol (issue) v tomto repozitáři, stačí *Submit new issue*;
- nebo **Sdílet** / **Kopírovat** a vložit do chatu s Claudem.

## Návrhy ke schválení

Úpravy rádia od Clauda přijdou nejdřív jako **návrh** (složka `navrh/`, v sandboxu zelené tlačítko *Návrh X ke schválení*).
V náhledu je žlutý pruh *NÁHLED NÁVRHU*. Klepnutím na **Schválit a nahrát** se otevře předvyplněný úkol v Dashboard_Peugeot_407 –
po jeho založení se návrh sám sloučí, sestaví se APK a rádio nabídne aktualizaci. **Připomínky** pošlou návrh zpět Claudovi.

## Aktualizace

Stejně jako rádio: při spuštění (a každých 30 min) se sandbox podívá na `version.json`. Když je novější verze, nabídne
**Stáhnout a nainstalovat** a po restartu ukáže *Co je nového*. Zároveň kontroluje vydání Dash 407 na GitHubu – když má rádio
novější verzi, než jakou sandbox kopíruje, upozorní tě a nabídne žádost o srovnání.

## Soubory

| Soubor | Účel |
|---|---|
| `radio-state.json` | skutečný stav rádia (rozložení ploch, vzhled, rozměry) – výchozí stav sandboxu a základ pro seznam změn |
| `version.json` | verze sandboxu, verze rádia, kterou kopíruje, a novinky |
| `js/core.js` | stav, mřížka, rozložení, data z auta, jízda, počasí |
| `js/widgets.js` | widgety |
| `js/ui.js` | lišty jednotky, plochy, Menu, režim úprav, dotyk |
| `js/panels.js` | panely a akce |
| `js/sandbox.js` | měřítko, odeslání změn, aktualizace, start |
| `sw.js` | offline režim |

Písma Roboto a Material Icons (Apache 2.0) jsou přibalená. Mapy © OpenStreetMap © CARTO, počasí Open-Meteo, místa Nominatim.
