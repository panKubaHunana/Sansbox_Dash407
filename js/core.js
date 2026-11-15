'use strict';
/* Sandbox Dash 407 – jádro: stav, vzhled, mřížka, rozložení ploch a data (kopie logiky z launcheru v rádiu). */

const APP_VERSION = '2.12'; // vždy stejná jako verze Dash 407 v rádiu
const APP_BUILD = 3; // skryté číslo sestavení sandboxu – opravy jen v sandboxu, verze se nemění
const SANDBOX_REPO = 'panKubaHunana/Sansbox_Dash407';
const RADIO_REPO = 'panKubaHunana/Dashboard_Peugeot_407';
const SCREEN_W = 768, SCREEN_H = 1024, TOP_BAR = 174, BOTTOM_BAR = 170;
const DASH = '–';
const HK_LAT = 50.2092, HK_LON = 15.8328;
const STORE_KEY = 'sbx407_v1';

/* ---------------- Formátování (česky) ---------------- */
const pad2 = n => String(n).padStart(2, '0');
function decimal(v, d = 1) { return Number(v).toFixed(d).replace('.', ','); }
function timeText(t, sec) { return t.getHours() + ':' + pad2(t.getMinutes()) + (sec ? ':' + pad2(t.getSeconds()) : ''); }
const DAYS = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
const DAYS_SHORT = ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'];
const MONTHS = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function dateText(t) { return cap(DAYS[t.getDay()]) + ' ' + t.getDate() + '. ' + MONTHS[t.getMonth()]; }
function formatDuration(ms) { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h > 0 ? h + ' h ' + m + ' min' : m + ' min ' + (s % 60) + ' s'; }
function formatKm(m) { const km = m / 1000; return km < 100 ? decimal(km) : Math.round(km).toString(); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function hm(ms) { const d = new Date(ms); return d.getHours() + ':' + pad2(d.getMinutes()); }

/* ---------------- Barvy a vzhled (Theme.kt) ---------------- */
function argb(n) { n = Number(n); const a = ((n / 0x1000000) & 0xff) / 255, r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff; return { r, g, b, a: a || 1 }; }
function rgba(c, alpha) { return `rgba(${c.r},${c.g},${c.b},${alpha == null ? c.a : alpha})`; }
function hex(h) { return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16), a: 1 }; }
function lerpC(a, b, t) { return { r: Math.round(a.r + (b.r - a.r) * t), g: Math.round(a.g + (b.g - a.g) * t), b: Math.round(a.b + (b.b - a.b) * t), a: 1 }; }

const DEFAULT_APPEARANCE = { accent: 0xFF4FC3F7, background: 0, cardAlpha: 0.72, corner: 22, gap: 8, border: true, textScale: 1, animations: true, titles: true, darkMap: true, mapStyle: 'carto_voyager', seconds: false, cardTint: false, theme: 'dark', font: 'default', intro: true, introStyle: 'photo', introSeconds: 4 };
const ACCENTS = [0xFF4FC3F7, 0xFF3D8BFF, 0xFF7C4DFF, 0xFFE040FB, 0xFFFF4081, 0xFFFF5252, 0xFFFF9100, 0xFFFFD600, 0xFF69F0AE, 0xFF1DE9B6, 0xFF00E5FF, 0xFFECEFF1];
const BACKGROUND_NAMES = ['Noc', 'Polární záře', 'Grafit', 'Černá', 'Půlnoční modrá', 'Západ slunce', 'Les'];
const FONTS = [['default', 'Výchozí (Roboto)'], ['condensed', 'Úzké'], ['light', 'Tenké'], ['medium', 'Střední'], ['serif', 'Patkové'], ['mono', 'Neproporcionální'], ['casual', 'Hravé']];
const MAP_SOURCES = [
  ['basic', 'Základní', 'Mapy.com', true], ['outdoor', 'Turistická', 'Mapy.com', true], ['winter', 'Zimní', 'Mapy.com', true], ['aerial', 'Letecká', 'Mapy.com', true],
  ['carto_voyager', 'Voyager', 'CARTO'], ['carto_dark', 'Tmavá', 'CARTO'], ['carto_light', 'Světlá', 'CARTO'],
  ['esri_street', 'Silniční', 'Esri'], ['esri_sat', 'Satelit', 'Esri'], ['osm', 'OpenStreetMap', 'Open source'], ['otm', 'OpenTopoMap', 'Open source'],
  ['g_roadmap', 'Google mapa', 'Google', true], ['g_satellite', 'Google satelit', 'Google', true], ['g_terrain', 'Google terén', 'Google', true]
];

let LOOK = null;
const P = {}; // Palette
function computeLook() {
  const a = S.appearance;
  const light = a.theme === 'light' || (a.theme === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches);
  const accent = argb(a.accent);
  const dark = hex('#141B26'), white = hex('#FFFFFF');
  const base = light ? (a.cardTint ? lerpC(white, accent, 0.10) : white) : (a.cardTint ? lerpC(dark, accent, 0.12) : dark);
  const high = light ? hex('#E3E8EF') : hex('#223042');
  Object.assign(P, light ? {
    Background: '#EEF1F5', Tile: '#FFFFFF', TileHigh: '#E3E8EF', Sheet: 'rgba(246,248,251,.95)', Amber: '#C77800', Good: '#1B9E55', Bad: '#D32F2F', Text: '#111820', Muted: '#55627A', Line: 'rgba(0,0,0,.10)', TextRGB: '17,24,32', Label: '#55627A', WeatherMuted: '#55627A'
  } : {
    Background: '#0B0F14', Tile: '#151C26', TileHigh: '#1D2633', Sheet: 'rgba(18,24,34,.95)', Amber: '#FFB300', Good: '#3DDC84', Bad: '#FF5252', Text: '#F2F5F9', Muted: '#8A96A8', Line: 'rgba(255,255,255,.08)', TextRGB: '242,245,249', Label: '#B4BECB', WeatherMuted: '#AEB7C4'
  });
  P.Accent = rgba(accent, 1);
  LOOK = {
    light, accentC: accent, accent: rgba(accent, 1),
    card: rgba(base, a.cardAlpha), cardHigh: rgba(high, Math.min(1, a.cardAlpha + 0.15)),
    border: a.border ? (light ? 'rgba(0,0,0,.10)' : 'rgba(255,255,255,.08)') : null,
    corner: a.corner, gap: a.gap, titles: a.titles, animations: a.animations, darkMap: a.darkMap, mapStyle: a.mapStyle, seconds: a.seconds,
    background: a.background, textScale: a.textScale
  };
  document.documentElement.style.setProperty('--accent', LOOK.accent);
}
const tA = a => `rgba(${P.TextRGB},${a})`;

function backgroundCss(i, light) {
  const acc = LOOK ? LOOK.accentC : argb(0xFF4FC3F7);
  const c = x => rgba(x, 1);
  if (light) switch (i) {
    case 1: return 'linear-gradient(147deg,#DCE8FA,#EADCF7,#F7DCE6,#F2F4F8)';
    case 2: return 'linear-gradient(#E9EBEE,#D5D9DF)';
    case 3: return '#fff';
    case 4: return 'linear-gradient(#D8E8F8,#C3D6EC)';
    case 5: return 'linear-gradient(#F6DDE8,#F8E4D4,#F1F1F4)';
    case 6: return 'linear-gradient(#D7EFE4,#C4E0D3)';
    default: return `linear-gradient(${c(lerpC(hex('#F4F7FB'), acc, .08))},#E6EBF2)`;
  }
  switch (i) {
    case 1: return 'linear-gradient(147deg,#0B1D3A,#1B0F33,#2A0F1F,#0A0E14)';
    case 2: return 'linear-gradient(#1C1F24,#0E1013)';
    case 3: return '#000';
    case 4: return 'linear-gradient(#0A2540,#050B18)';
    case 5: return 'linear-gradient(#2B1530,#3A1E12,#0B0B10)';
    case 6: return 'linear-gradient(#0E2A22,#06110E)';
    default: return `linear-gradient(${c(lerpC(hex('#0E1726'), acc, .06))},#070A10)`;
  }
}
function fontCss(id) {
  switch (id) {
    case 'condensed': return "'Roboto Condensed', Roboto, sans-serif";
    case 'light': return "Roboto, sans-serif; font-weight:300";
    case 'serif': return "'Roboto Serif', Georgia, serif";
    case 'mono': return "'Roboto Mono', monospace";
    case 'casual': return "'Comic Sans MS', 'Chalkboard SE', cursive";
    default: return 'Roboto, system-ui, sans-serif';
  }
}

/* ---------------- Mřížka a rozložení (Layout.kt) ---------------- */
const COLS = 24;
const SLOTS = {
  CENTER: { dx: 0, dy: 0, where: 'uprostřed' }, UP: { dx: 0, dy: -1, where: 'nahoře' }, DOWN: { dx: 0, dy: 1, where: 'dole' },
  LEFT: { dx: -1, dy: 0, where: 'vlevo' }, RIGHT: { dx: 1, dy: 0, where: 'vpravo' }, MENU: { dx: 0, dy: 2, where: 'menu' }
};
function slotAt(dx, dy) { return Object.keys(SLOTS).find(k => SLOTS[k].dx === dx && SLOTS[k].dy === dy) || null; }
const Grid = {
  col: v => Math.floor(v * COLS / 4),
  row: v => Math.floor((v * S.rows + 6) / 12),
};
function edge(v, from, to) { return Math.floor((v * to + Math.floor(from / 2)) / from); }
function scaleRows(c, from, to) { const y = edge(c.y, from, to); return Object.assign({}, c, { y, h: Math.max(1, edge(c.y + c.h, from, to) - y) }); }
function overlaps(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
let idCounter = 0;
function newId() { return 'w' + Date.now().toString(36) + (idCounter++); }

const CATEGORIES = { DRIVING: 'Jízda', NAVIGATION: 'Navigace', VEHICLE: 'Vozidlo', INFO: 'Info', MEDIA: 'Média', PHONE: 'Telefon' };
// [název, popis, kategorie, šířka, výška, min. šířka, min. výška] v původní mřížce 4 × 12
const WT = {
  MAP: ['Mapa', 'Mapa Mapy.com s polohou auta a naplánovanou trasou', 'NAVIGATION', 4, 4, 2, 2],
  DIRECTIONS: ['Navigace', 'Další manévr z Mapy.com, cíl a příjezd, rychlé cíle Domů a Práce', 'NAVIGATION', 2, 3, 2, 2],
  SPEED_LIMIT: ['Povolená rychlost', 'Omezení na silnici, kde jedeš (OpenStreetMap)', 'NAVIGATION', 1, 2, 1, 2],
  COMPASS: ['Kompas', 'Směr jízdy, nadmořská výška a rychlost z GPS', 'NAVIGATION', 2, 3, 1, 2],
  GPS: ['GPS', 'Satelity, přesnost, výška a stáří polohy', 'NAVIGATION', 2, 3, 2, 2],
  SPEED: ['Rychlost', 'Velká digitální rychlost z GPS', 'DRIVING', 2, 3, 1, 2],
  SPEED_GAUGE: ['Rychloměr a spotřeba', 'Obloukový rychloměr a pod ním okamžitá a průměrná spotřeba, ujeto a dojezd z auta', 'DRIVING', 2, 4, 2, 2],
  TRIP: ['Jízda', 'Ujetá vzdálenost, čas, průměr, maximum, odhad paliva a ceny', 'DRIVING', 2, 3, 2, 2],
  GFORCE: ['Přetížení', 'Boční a podélné přetížení v g se špičkami', 'DRIVING', 2, 3, 2, 2],
  PERF: ['Časomíra', '0–50, 0–100 km/h a 400 m s pevným startem', 'DRIVING', 4, 3, 2, 2],
  TRIP_COMPUTER: ['Jízda', 'Ujeto, čas v pohybu, průměrná a nejvyšší rychlost, začátek, počet jízd a průměrná spotřeba; podržením vynuluješ', 'VEHICLE', 2, 6, 2, 4],
  CAR_COMPUTER: ['Palubní počítač', 'Okamžitá spotřeba, dojezd a průměr z auta', 'VEHICLE', 2, 4, 2, 2],
  DOORS: ['Stav vozu', 'Auto shora s dveřmi, výstrahy, světla, ruční brzda a napětí', 'VEHICLE', 2, 4, 2, 2],
  VOLTAGE: ['Napětí', 'Napětí palubní sítě a spojení s autem', 'VEHICLE', 2, 2, 1, 2],
  CAR_APPS: ['Zvuk, volant, klima', 'Rychlé zkratky: DSP a ekvalizér, učení tlačítek na volantu, klimatizace, nastavení vozu', 'VEHICLE', 4, 2, 2, 1],
  SERVICE: ['Servis', 'Nejbližší termín z servisní knížky: olej, filtry, brzdy', 'VEHICLE', 2, 2, 2, 2],
  FUEL: ['Spotřeba z tankování', 'Dlouhodobý průměr a poslední nádrž', 'VEHICLE', 2, 2, 2, 2],
  CLOCK: ['Hodiny', 'Čas a datum', 'INFO', 4, 2, 1, 1],
  WEATHER: ['Počasí', 'Aktuální teplota a předpověď na 5 dní v místě, kde jsi', 'INFO', 2, 3, 2, 2],
  MEDIA: ['Právě hraje', 'Skladba, obal alba a ovládání přehrávání', 'MEDIA', 2, 3, 2, 2],
  PHONE_DIAL: ['Rychlá volba', 'Pět kontaktů v zelených kolečkách se jménem a seznam kontaktů, volání jedním klepnutím', 'PHONE', 1, 7, 1, 1],
  DOCK: ['Dok aplikací', 'Oblíbené aplikace na jedno klepnutí', 'MEDIA', 4, 2, 1, 1]
};
const RETIRED = ['CAR_COMPUTER', 'TRIP'];
const wt = {
  title: t => WT[t][0], desc: t => WT[t][1], cat: t => WT[t][2],
  w: t => Grid.col(WT[t][3]), h: t => Grid.row(WT[t][4]),
  minW: t => Math.max(1, Math.floor(WT[t][5] * COLS / 8)), minH: t => Math.max(1, Math.floor(WT[t][6] * S.rows / 16))
};

const Layout = {
  page(slot) { return S.pages.find(p => p.slot === slot); },
  setCells(slot, cells) { S.pages = S.pages.map(p => p.slot === slot ? Object.assign({}, p, { cells }) : p); save(); },
  rename(slot, name) { S.pages = S.pages.map(p => p.slot === slot ? Object.assign({}, p, { name: name.trim() || p.name }) : p); save(); },
  setEnabled(slot, en) { S.pages = S.pages.map(p => p.slot === slot ? Object.assign({}, p, { enabled: en || slot === 'CENTER' }) : p); save(); },
  findSpace(cells, w, h) {
    for (let y = 0; y <= S.rows - h; y++) for (let x = 0; x <= COLS - w; x++) {
      const probe = { x, y, w, h };
      if (!cells.some(c => overlaps(c, probe))) return [x, y];
    }
    return null;
  },
  fits(cells, c) { return c.x >= 0 && c.y >= 0 && c.w >= 1 && c.h >= 1 && c.x + c.w <= COLS && c.y + c.h <= S.rows && !cells.some(o => o.id !== c.id && overlaps(o, c)); },
  setRows(rows) {
    const old = S.rows;
    if (rows === old || rows < 8) return;
    S.rows = rows;
    S.pages = S.pages.map(p => Object.assign({}, p, { cells: p.cells.map(c => scaleRows(c, old, rows)) }));
    save();
  },
  /** Stav rádia (radio-state.json) převedený na aktuální počet řádků. */
  fromBaseline(b) {
    return b.pages.map(p => Object.assign({}, p, { cells: p.cells.map(c => scaleRows(Object.assign({ scale: 1 }, c), b.rows, S.rows)) }));
  }
};

/* ---------------- Uložený stav ---------------- */
const S = {
  pages: [], rows: 21, appearance: Object.assign({}, DEFAULT_APPEARANCE),
  quickDial: [], favorites: ['ytmusic', 'phone', 'mapy', 'gmaps'],
  prefs: { dataMode: 'snapshot', showBars: true, homeAddress: '', workAddress: '', musicApp: 'YouTube Music', navHeadingUp: true, autoFuel: true },
  fuel: [], service: [], drives: [], trip: null, odometer: null, warningLabels: {},
  baseline: null, baseAt: null, seenVersion: null, dismissedRadio: null
};
// Dočasný stav UI (UiBus)
const U = { panel: null, editing: false, slot: 'CENTER', selected: null, showGrid: true, pickerTab: 0, dialog: null, undo: [], hintUntil: 0, pickerCat: null, pickerQuery: '', fuelForm: null, logTab: 0 };

function save() {
  try {
    const o = {};
    for (const k of ['pages', 'rows', 'appearance', 'quickDial', 'favorites', 'prefs', 'fuel', 'service', 'drives', 'trip', 'odometer', 'warningLabels', 'baseAt', 'seenVersion', 'dismissedRadio', 'sendDraft']) o[k] = S[k];
    localStorage.setItem(STORE_KEY, JSON.stringify(o));
  } catch (e) { /* neuloženo */ }
}
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return false;
    const o = JSON.parse(raw);
    Object.assign(S, o);
    S.appearance = Object.assign({}, DEFAULT_APPEARANCE, o.appearance || {});
    S.prefs = Object.assign({ dataMode: 'snapshot', showBars: true, homeAddress: '', workAddress: '', musicApp: 'YouTube Music', navHeadingUp: true, autoFuel: true }, o.prefs || {});
    return Array.isArray(S.pages) && S.pages.length > 0;
  } catch (e) { return false; }
}
function applyBaseline(b, keepPersonal) {
  S.rows = b.rows;
  S.pages = b.pages.map(p => Object.assign({}, p, { cells: p.cells.map(c => Object.assign({ scale: 1 }, c)) }));
  S.appearance = Object.assign({}, DEFAULT_APPEARANCE, b.appearance);
  if (!keepPersonal || !S.quickDial.length) S.quickDial = (b.quickDial || []).map(c => Object.assign({}, c));
  S.baseAt = b.capturedAt;
  save();
}

/* ---------------- Data z auta (CarState + ukázkový režim) ---------------- */
let CAR = {};
const GPS = { fix: null, speed: null, sats: null, error: null, demo: false };
let demoT = 0, demoAngle = 0;
const SNAPSHOT_CAR = { linked: true, instantL100: null, rangeKm: 380, trip1: { avgL100: 5.9, avgKmh: 41, distanceKm: 801 }, trip2: { avgL100: 5.9, avgKmh: 44, distanceKm: 2715 }, doors: {}, warnings: [], volts: 11.8, headlights: null, handbrake: null };

function carTick() {
  const mode = S.prefs.dataMode;
  if (mode === 'demo') {
    const t = demoT++;
    const speed = Math.max(0, Math.round(70 + 45 * Math.sin(t / 9)));
    const instant = Math.round((5.6 + 2.4 * Math.sin(t / 4)) * 10) / 10;
    demoAngle += speed / 3.6 / 1500;
    const lat = HK_LAT + 0.0135 * Math.cos(demoAngle), lon = HK_LON + 0.021 * Math.sin(demoAngle);
    const bearing = ((demoAngle * 180 / Math.PI + 90) % 360 + 360) % 360;
    GPS.demo = true;
    GPS.fix = { lat, lon, speed, bearing, alt: 240, acc: 5, at: Date.now() };
    GPS.speed = speed; GPS.sats = 11;
    CAR = { linked: true, instantL100: instant, rangeKm: 640 - t % 600, trip1: { avgL100: 6.1, avgKmh: 62, distanceKm: 348 + Math.floor(t / 20) }, trip2: { avgL100: 6.4, avgKmh: 54, distanceKm: 2715 + Math.floor(t / 20) }, doors: { tailgate: t % 40 >= 30 && t % 40 <= 34 }, volts: 14.1, headlights: true, handbrake: false, warnings: [] };
  } else {
    if (GPS.demo) { GPS.demo = false; GPS.fix = GPS.real || null; GPS.speed = GPS.realSpeed == null ? null : GPS.realSpeed; }
    CAR = mode === 'snapshot' ? JSON.parse(JSON.stringify(SNAPSHOT_CAR)) : { linked: false, warnings: [] };
  }
  Trip.update();
}

function startGps() {
  if (!navigator.geolocation) { GPS.error = 'Bez GPS'; return; }
  try {
    navigator.geolocation.watchPosition(p => {
      const c = p.coords;
      const sp = c.speed != null && c.speed >= 0 ? Math.round(c.speed * 3.6) : 0;
      GPS.real = { lat: c.latitude, lon: c.longitude, speed: sp, bearing: c.heading != null && !isNaN(c.heading) ? c.heading : null, alt: c.altitude, acc: c.accuracy, at: p.timestamp };
      GPS.realSpeed = sp;
      if (!GPS.demo) { GPS.fix = GPS.real; GPS.speed = sp; }
      GPS.error = null;
    }, e => { GPS.error = e.code === 1 ? 'Poloha není povolená' : 'Bez signálu GPS'; }, { enableHighAccuracy: true, maximumAge: 1000 });
  } catch (e) { GPS.error = 'Bez GPS'; }
}

/* ---------------- Jízda (Trip.kt): rozjezd ≥ 3 km/h, konec po stání > 5 min, kratší než 300 m se nezapisuje ---------------- */
const Trip = {
  PAUSE_MS: 5 * 60 * 1000, MIN_DRIVE_M: 300,
  fresh(now) { return { startedAt: now, distanceM: 0, movingMs: 0, topKmh: 0, lastMoveAt: 0, lastFix: null, active: false, day: new Date(now).toDateString(), dayMovingMs: 0, drives: 0, startPos: null }; },
  get s() { if (!S.trip) S.trip = this.fresh(Date.now()); return S.trip; },
  update() {
    const now = Date.now(), t = this.s;
    const today = new Date(now).toDateString();
    if (t.day !== today) { t.day = today; t.dayMovingMs = 0; t.drives = 0; }
    const f = GPS.fix, speed = GPS.speed || 0;
    if (f && t.lastFix && speed >= 3) {
      const d = haversine(t.lastFix.lat, t.lastFix.lon, f.lat, f.lon);
      if (d < 200) {
        if (!t.active) { Object.assign(t, { active: true, startedAt: now, distanceM: 0, movingMs: 0, topKmh: 0, startPos: { lat: f.lat, lon: f.lon } }); t.drives++; }
        t.distanceM += d; t.movingMs += 1000; t.dayMovingMs += 1000; t.topKmh = Math.max(t.topKmh, speed); t.lastMoveAt = now;
      }
    }
    if (t.active && t.lastMoveAt && now - t.lastMoveAt > this.PAUSE_MS) this.endDrive();
    if (f) t.lastFix = { lat: f.lat, lon: f.lon };
    if (Math.random() < 0.1) save();
  },
  endDrive() {
    const t = this.s;
    if (t.active && t.distanceM >= this.MIN_DRIVE_M) {
      S.drives.unshift({ id: newId(), start: t.startedAt, end: t.lastMoveAt || Date.now(), distanceM: Math.round(t.distanceM), movingMs: t.movingMs, topKmh: t.topKmh, avgKmh: this.avg(t), from: t.startPos, to: t.lastFix, note: '' });
      S.drives = S.drives.slice(0, 500);
    } else if (t.active && t.distanceM < this.MIN_DRIVE_M) t.drives = Math.max(0, t.drives - 1);
    t.active = false; t.lastMoveAt = 0;
    save();
  },
  avg(t) { return t.movingMs > 0 ? t.distanceM / 1000 / (t.movingMs / 3600000) : 0; }
};
function haversine(a1, o1, a2, o2) {
  const R = 6371000, r = Math.PI / 180, dLa = (a2 - a1) * r, dLo = (o2 - o1) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a1 * r) * Math.cos(a2 * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* ---------------- Kniha tankování (FuelLog.kt) ---------------- */
const FuelLog = {
  stats(list) {
    // Spotřeba mezi plnými nádržemi: litry od minulé plné / km mezi nimi.
    const asc = list.slice().sort((a, b) => a.odometer - b.odometer);
    let lastFull = null, litres = 0, sumL = 0, sumKm = 0, lastL100 = null;
    for (const r of asc) {
      if (lastFull) litres += r.litres;
      if (r.full) {
        if (lastFull && r.odometer > lastFull.odometer) { const km = r.odometer - lastFull.odometer; lastL100 = litres / km * 100; sumL += litres; sumKm += km; }
        lastFull = r; litres = 0;
      }
    }
    return { averageL100: sumKm > 0 ? sumL / sumKm * 100 : null, lastL100, count: list.length, totalPrice: list.reduce((s, r) => s + (r.price || 0), 0) };
  }
};

/* ---------------- Počasí (Open-Meteo + Nominatim) ---------------- */
const Weather = { tempC: null, code: null, isDay: true, days: [], place: null, approximate: false, error: null, at: 0, loading: false };
async function refreshWeather(force) {
  if (Weather.loading || (!force && Date.now() - Weather.at < 15 * 60 * 1000)) return;
  Weather.loading = true;
  const f = GPS.real || null;
  const lat = f ? f.lat : HK_LAT, lon = f ? f.lon : HK_LON;
  Weather.approximate = !f;
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=6`;
    const j = await (await fetch(u)).json();
    Weather.tempC = j.current.temperature_2m; Weather.code = j.current.weather_code; Weather.isDay = j.current.is_day === 1;
    Weather.days = j.daily.time.map((d, i) => ({ date: new Date(d + 'T12:00'), code: j.daily.weather_code[i], maxC: j.daily.temperature_2m_max[i], minC: j.daily.temperature_2m_min[i] }));
    Weather.error = null; Weather.at = Date.now();
    try {
      const n = await (await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=cs&lat=${lat}&lon=${lon}`)).json();
      const a = n.address || {};
      Weather.place = a.village || a.town || a.city || a.municipality || a.suburb || null;
    } catch (e) { if (!f) Weather.place = 'Hradec Králové'; }
  } catch (e) { Weather.error = 'Počasí se nepodařilo načíst'; }
  Weather.loading = false;
  scheduleRender();
}

/* ---------------- Přehrávač (v sandboxu jen ukázka) ---------------- */
const Media = { playing: false, idx: 0, list: [['Nic nehraje', '']], get title() { return null; } };
const DEMO_TRACKS = [['Za každou vteřinu s tebou', 'Klondike256'], ['Holky z naší školky', 'Olympic'], ['Jarní tání', 'Olympic']];
