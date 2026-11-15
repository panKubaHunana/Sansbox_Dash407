'use strict';
/* Panely (Vzhled, Nastavení, Tankování, Kniha jízd, Auto…) a obsluha všech klepnutí. */

const PANEL_TITLES = { APPS: 'Aplikace', SETTINGS: 'Nastavení', FUEL: 'Tankování', CAR: 'Auto a signály', DESTINATION: 'Kam jedeme?', PICKER: 'Přidat na plochu', OBD: 'OBD adaptér', SERVICE: 'Servisní knížka', CARAPPS: 'Zvuk, volant a klimatizace', LOGBOOK: 'Kniha jízd' };
let panelKey = null;
const LIVE_PANELS = ['CAR'];

function openPanel(p) { U.panel = p; panelKey = null; render(); }
function closePanel() { U.panel = null; panelKey = null; render(); }
function refreshPanel() { panelKey = null; renderPanel(); }

function renderPanel() {
  const host = document.getElementById('panelHost');
  const p = U.panel;
  if (!p || p === 'PAGES') { if (p === 'PAGES') pagesDialog(); host.innerHTML = ''; panelKey = null; return; }
  const key = p + '|' + JSON.stringify(S.appearance) + (LIVE_PANELS.includes(p) ? Math.floor(Date.now() / 1000) : '');
  if (key === panelKey) return;
  panelKey = key;
  const prevScroll = host.querySelector('.pbody') ? host.querySelector('.pbody').scrollTop : 0;
  if (p === 'APPEARANCE') { host.innerHTML = appearanceHtml(); }
  else {
    host.innerHTML = `<div class="panel" style="background:${backgroundCss(LOOK.background, LOOK.light)};color:${P.Text}"><div class="phead"><div class="back clickable" data-act="close">${icon('arrow_back', 30, P.Text)}</div><div class="title">${PANEL_TITLES[p]}</div></div><div class="pbody">${panelBody(p)}</div></div>`;
  }
  const pb = host.querySelector('.pbody'); if (pb) pb.scrollTop = prevScroll;
}

const pill = (text, sel, act, extra = '') => `<div class="pill clickable" data-act="${act}" style="background:${sel ? rgba(LOOK.accentC, .28) : tA(.07)};box-shadow:inset 0 0 0 1px ${sel ? LOOK.accent : tA(.12)};color:${P.Text};${extra}">${text}</div>`;
const sect = t => `<div class="sect" style="color:${LOOK.accent}">${t}</div>`;
const sw = (label, on, act) => `<div class="srow clickable" data-act="${act}"><div class="lab">${label}</div><div class="switch${on ? ' on' : ''}" style="border-color:${on ? LOOK.accent : P.Muted};background:${on ? LOOK.accent : 'transparent'}"><i style="background:${on ? '#06121C' : P.Muted}"></i></div></div>`;
const slider = (label, value, v, min, max, step, key) => `<div><div class="row" style="font-size:16px"><div style="flex:1">${label}</div><div style="color:${P.Muted}">${value}</div></div><input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-ap="${key}"></div>`;
const tile = (title, body) => `<div class="tile" style="background:${P.Tile}"><div class="tt" style="color:${P.Muted}">${title}</div>${body}</div>`;
const tf = (label, key, value, type = 'text') => `<div class="tflabel">${label}</div><input class="tf" type="${type}" data-f="${key}" value="${esc(value == null ? '' : value)}" ${type === 'number' ? 'inputmode="decimal"' : ''}>`;
const btn = (t, a, filled) => `<div class="btn clickable ${filled ? '' : 'out'}" data-act="${a}" style="${filled ? `background:${LOOK.accent};color:#06121C` : `color:${LOOK.accent}`}">${t}</div>`;

/* ---------- Vzhled: spodní list přes plochu ---------- */
function appearanceHtml() {
  const a = S.appearance;
  let h = `<div class="fill" data-act="close" style="z-index:50"></div><div class="col" data-stop="1" style="position:absolute;left:0;right:0;bottom:0;height:62%;border-radius:26px 26px 0 0;background:${P.Sheet};color:${P.Text};z-index:51">` +
    `<div class="row" style="padding:8px 8px 0 20px"><div style="flex:1;font-size:22px;font-weight:500">Vzhled</div><div class="clickable" data-act="ap:reset" style="color:${LOOK.accent};font-size:16px;font-weight:500;padding:10px">Výchozí</div><div class="rbtn clickable" data-act="close" style="width:48px;height:48px">${icon('close', 28, P.Text)}</div></div>` +
    `<div class="pbody" style="padding:8px 20px 20px">`;
  h += sect('Barva zvýraznění') + `<div class="hscroll" style="gap:10px">` + ACCENTS.map(c => `<div class="rbtn clickable" data-act="ap:accent:${c}" style="width:44px;height:44px;background:${rgba(argb(c), 1)};${a.accent === c ? 'box-shadow:inset 0 0 0 3px #fff' : ''}">${a.accent === c ? icon('check', 24, '#06121C') : ''}</div>`).join('') + `</div>`;
  h += sect('Pozadí') + `<div class="hscroll" style="gap:10px">` + BACKGROUND_NAMES.map((n, i) => `<div class="col clickable" data-act="ap:bg:${i}" style="align-items:center"><div style="width:64px;height:86px;border-radius:12px;background:${backgroundCss(i, LOOK.light)};box-shadow:inset 0 0 0 ${a.background === i ? 3 : 1}px ${a.background === i ? LOOK.accent : tA(.2)}"></div><div style="color:${P.Muted};font-size:12px">${n}</div></div>`).join('') + `</div>`;
  h += `<div class="col" style="gap:14px;margin-top:14px">` +
    slider('Průhlednost karet', Math.round(a.cardAlpha * 100) + ' %', a.cardAlpha, 0.2, 1, 0.01, 'cardAlpha') +
    slider('Zaoblení rohů', a.corner + ' dp', a.corner, 0, 36, 1, 'corner') +
    slider('Mezery mezi widgety', a.gap + ' dp', a.gap, 0, 20, 1, 'gap') +
    slider('Velikost písma', Math.round(a.textScale * 100) + ' %', a.textScale, 0.8, 1.4, 0.05, 'textScale') + `</div>`;
  h += sw('Rámeček karet', a.border, 'ap:t:border') + sw('Karty podbarvené zvýrazněním', a.cardTint, 'ap:t:cardTint') + sw('Nadpisy widgetů', a.titles, 'ap:t:titles') + sw('Animace při přechodu mezi plochami', a.animations, 'ap:t:animations') + sw('Sekundy v hodinách', a.seconds, 'ap:t:seconds');
  h += sect('Motiv') + `<div class="hscroll">` + [['dark', 'Tmavý'], ['light', 'Světlý'], ['auto', 'Podle systému']].map(([id, n]) => pill(n, a.theme === id, 'ap:theme:' + id)).join('') + `</div><div style="color:${P.Muted};font-size:13px;margin-top:6px">Světlý motiv je pro den; v noci oslňuje, proto je výchozí tmavý. „Podle systému“ se řídí nastavením Androidu v rádiu.</div>`;
  h += sect('Písmo') + `<div class="hscroll">` + FONTS.map(([id, n]) => pill(n, a.font === id, 'ap:font:' + id)).join('') + `</div>`;
  h += sect('Úvodní animace') + sw('Zobrazit při spuštění', a.intro, 'ap:t:intro') + `<div class="hscroll">` + [['photo', 'Lev PEUGEOT'], ['modern', 'Moderní'], ['retro', 'Retro'], ['custom', 'Vlastní obrázek']].map(([id, n]) => pill(n, a.introStyle === id, 'ap:intro:' + id)).join('') + `</div>` + slider('Délka', decimal(a.introSeconds) + ' s', a.introSeconds, 2, 8, 0.5, 'introSeconds') + `<div class="hscroll" style="margin-top:6px">${pill('Přehrát náhled', true, 'intro:preview')}</div>`;
  h += sect('Mapa') + sw('Tmavá mapa', a.darkMap, 'ap:t:darkMap');
  let group = null;
  for (const m of MAP_SOURCES) {
    if (m[2] !== group) { if (group) h += `</div>`; group = m[2]; h += `<div style="color:${P.Muted};font-size:13px;margin:8px 0 4px">${group}${m[3] ? ' · potřebuje API klíč (v sandboxu se kreslí CARTO)' : ' · bez klíče'}</div><div class="hscroll">`; }
    h += pill(m[1], a.mapStyle === m[0], 'ap:map:' + m[0]);
  }
  h += `</div></div></div>`;
  return h;
}

/* ---------- Výběr plochy (PagesDialog) ---------- */
function pagesDialog() {
  let b = `Mezi plochami přejíždíš tahem prstu. Menu s nastavením je pod plochou dole. Klepni na plochu, na kterou chceš přejít.<div class="col" style="align-items:center;margin-top:12px;gap:8px">`;
  for (let row = -1; row <= 1; row++) {
    b += `<div class="row" style="gap:8px">`;
    for (let col = -1; col <= 1; col++) {
      const s = slotAt(col, row), p = s && S.pages.find(x => x.slot === s);
      if (!p) { b += `<div style="width:104px;height:72px"></div>`; continue; }
      const cur = s === U.slot;
      b += `<div class="col clickable" data-act="gopage:${s}" style="width:104px;height:72px;border-radius:14px;align-items:center;justify-content:center;background:${cur ? LOOK.accent : tA(p.enabled ? .12 : .04)}"><div style="color:${cur ? '#06121C' : P.Text};font-size:15px;font-weight:500">${esc(p.name)}</div>${p.enabled ? '' : `<div style="color:${P.Muted};font-size:12px">zapnout</div>`}</div>`;
    }
    b += `</div>`;
  }
  b += `<div class="col clickable" data-act="gopage:MENU" style="width:104px;height:56px;border-radius:14px;align-items:center;justify-content:center;background:${U.slot === 'MENU' ? LOOK.accent : tA(.12)};color:${U.slot === 'MENU' ? '#06121C' : P.Text};font-size:15px;font-weight:500">Menu</div></div>`;
  U.dialog = { title: 'Plochy', body: b, buttons: [['Zavřít', 'pages:close']] };
}

function panelBody(p) {
  switch (p) {
    case 'PICKER': return pickerBody();
    case 'SETTINGS': return settingsBody();
    case 'FUEL': return fuelBody();
    case 'LOGBOOK': return logbookBody();
    case 'CAR': return carBody();
    case 'SERVICE': return serviceBody();
    case 'DESTINATION': return destinationBody();
    case 'APPS': return appsBody(false);
    case 'CARAPPS': return carAppsBody();
    case 'OBD': return obdBody();
  }
  return '';
}

function pickerBody() {
  let h = `<div class="row" style="gap:8px">${pill('Widgety', U.pickerTab === 0, 'ptab:0')}${pill('Aplikace do doku', U.pickerTab === 1, 'ptab:1')}`;
  if (U.pickerTab === 0) h += `<input class="tf" style="flex:1;margin-left:8px" placeholder="Hledat" data-f="pickerQuery" value="${esc(U.pickerQuery)}">`;
  h += `</div>`;
  if (U.pickerTab === 1) return h + `<div style="height:8px"></div>` + appsBody(true);
  h += `<div class="hscroll" style="padding:12px 0">${pill('Vše', !U.pickerCat, 'pcat:')}${Object.keys(CATEGORIES).map(k => pill(CATEGORIES[k], U.pickerCat === k, 'pcat:' + k)).join('')}</div>`;
  const q = U.pickerQuery.toLowerCase();
  const list = Object.keys(WT).filter(t => !RETIRED.includes(t) && (!U.pickerCat || wt.cat(t) === U.pickerCat) && (!q || wt.title(t).toLowerCase().includes(q) || wt.desc(t).toLowerCase().includes(q)));
  h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 12px">`;
  const colW = (SCREEN_W - 32 - 12) / 2;
  for (const t of list) {
    const ratio = clamp(wt.h(t) / wt.w(t), 0.45, 1.6), ph = 170 * ratio;
    FS = LOOK.textScale;
    let prev = '';
    try { prev = W_RENDER[t]({ id: 'pv', type: t, scale: 1 }, colW, ph, true); } catch (e) { prev = ''; }
    h += `<div class="col clickable" data-act="add:${t}" style="border-radius:18px"><div style="position:relative;width:${colW}px;height:${ph}px;pointer-events:none">${prev}</div><div style="margin-top:6px;font-size:17px;font-weight:500">${wt.title(t)}</div><div style="color:${P.Muted};font-size:13px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${wt.desc(t)}</div><div style="color:${LOOK.accent};font-size:12px">${wt.w(t)} × ${wt.h(t)} · ${CATEGORIES[wt.cat(t)]}</div></div>`;
  }
  return h + `</div>`;
}

function appsBody(fav) {
  let h = fav ? `<div style="color:${P.Muted};font-size:14px;margin-bottom:8px">Klepnutím přidáš nebo odebereš aplikaci z doku. (V sandboxu jsou to zástupci aplikací z rádia.)</div>` : `<div style="color:${P.Muted};font-size:14px;margin-bottom:8px">V rádiu je tu seznam všech nainstalovaných aplikací. Sandbox je spustit neumí – ukazuje zástupce.</div>`;
  h += `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px 8px">`;
  for (const a of APPS) {
    const on = S.favorites.includes(a.id);
    h += `<div class="col clickable" data-act="${fav ? 'fav:' : 'app:'}${a.id}" style="align-items:center;gap:6px"><div class="rbtn" style="width:72px;height:72px;background:rgba(255,255,255,.92);${fav && on ? `box-shadow:0 0 0 3px ${LOOK.accent}` : ''}">${appIcon(a, 52)}</div><div style="font-size:14px;text-align:center">${a.label}</div>${fav ? `<div style="font-size:12px;color:${on ? LOOK.accent : P.Muted}">${on ? 'v doku' : 'přidat'}</div>` : ''}</div>`;
  }
  return h + `</div>`;
}

function settingsBody() {
  const pr = S.prefs;
  let h = sect('Ukázkový režim a data z auta') + `<div style="color:${P.Muted};font-size:15px;margin-bottom:8px">V rádiu chodí data z CAN boxu. Sandbox je nemá, proto volíš zdroj:</div><div class="hscroll">${pill('Snímek z rádia (15. 11.)', pr.dataMode === 'snapshot', 'mode:snapshot')}${pill('Ukázková jízda', pr.dataMode === 'demo', 'mode:demo')}${pill('Bez auta', pr.dataMode === 'off', 'mode:off')}</div>`;
  h += `<div style="color:${P.Muted};font-size:13px;margin-top:6px">Ukázková jízda = vymyšlená jízda kolem Hradce Králové (stejná jako Ukázkový režim v rádiu). Rychlost a poloha jinak jdou z GPS telefonu.</div>`;
  h += sect('Barva rychlosti – typ silnice') + `<div class="hscroll">${pill('Podle mapy (jako rádio)', pr.testRoad === 'auto', 'road:auto')}${pill('V obci', pr.testRoad === 'town', 'road:town')}${pill('Mimo obec', pr.testRoad === 'rural', 'road:rural')}${pill('Dálnice', pr.testRoad === 'motorway', 'road:motorway')}</div><div style="color:${P.Muted};font-size:13px;margin-top:6px">Rádio pozná typ silnice z OpenStreetMap. Tady ho můžeš zvolit ručně a v Ukázkové jízdě (25–115 km/h) vyzkoušet zelenou, oranžovou a červenou. Teď: ${SPEED_ZONES[roadZone()][0]}.</div>`;
  h += sect('Navigace') + tf('Domů', 'homeAddress', pr.homeAddress) + tf('Práce', 'workAddress', pr.workAddress) + `<div style="color:${P.Muted};font-size:13px;margin-top:6px">Mapy.com a Google klíče se v sandboxu nezadávají – mapa používá CARTO bez klíče.</div>`;
  h += sect('Hudba') + `<div class="srow"><div class="lab">Výchozí přehrávač</div><div style="color:${P.Muted}">${esc(pr.musicApp)}</div></div>`;
  h += sect('Tankování') + sw('Automatické tankování (okno „Tankoval jsi?“ u pumpy)', pr.autoFuel, 'pref:autoFuel');
  h += sect('Lišty rádia') + sw('Horní a spodní lišta jednotky', pr.showBars, 'pref:showBars') + `<div style="color:${P.Muted};font-size:13px">Vypnuto = náhled, jak by vypadalo rádio se skrytými lištami (mřížka se přepočítá stejně jako v rádiu).</div>`;
  h += sect('Rozložení') + `<div class="row" style="gap:8px;flex-wrap:wrap">${btn('Obnovit výchozí rozložení ploch', 'layout:reset')}</div>`;
  h += sect('Aktualizace') + `<div class="srow"><div class="lab">Sandbox</div><div style="color:${P.Muted}">${APP_VERSION} (odpovídá rádiu ${S.baseline ? S.baseline.radioVersion : '?'})</div></div><div class="srow"><div class="lab">Rádio na GitHubu</div><div style="color:${P.Muted}">${Upd.radioLatest || 'zatím nezjištěno'}</div></div><div class="row" style="gap:8px">${btn('Zkontrolovat teď', 'upd:check', true)}</div>`;
  h += sect('O aplikaci') + `<div style="color:${P.Muted};font-size:14px;line-height:1.5">Sandbox Dash 407 – kopie launcheru z rádia Peugeot 407 SW (Hizpo, 768 × 1024). Změny tady se do rádia nedostanou samy: pošli je Claudovi tlačítkem „Odeslat změny“ pod obrazovkou.<br>Počasí: Open-Meteo, místa: © OpenStreetMap (Nominatim), mapy: © OpenStreetMap © CARTO.</div>`;
  return h;
}

function fuelBody() {
  const st = FuelLog.stats(S.fuel), f = U.fuelForm;
  let h = `<div class="row" style="gap:12px">${['Průměr l/100 km', 'Poslední nádrž', 'Tankování', 'Celkem Kč'].map((l, i) => `<div class="tile" style="flex:1;background:${P.Tile}"><div class="tt" style="color:${P.Muted}">${l}</div><div style="font-size:26px;font-weight:700">${[st.averageL100 != null ? decimal(st.averageL100) : DASH, st.lastL100 != null ? decimal(st.lastL100) : DASH, String(st.count), Math.round(st.totalPrice).toLocaleString('cs')][i]}</div></div>`).join('')}</div>`;
  if (f) {
    h += tile('Nové tankování', tf('Stav tachometru (km)', 'fuel.odometer', f.odometer, 'number') + tf('Litry', 'fuel.litres', f.litres, 'number') + tf('Cena celkem (Kč)', 'fuel.price', f.price, 'number') + (f.litres > 0 && f.price > 0 ? `<div style="color:${LOOK.accent};margin-top:6px">${decimal(f.price / f.litres, 2)} Kč/l</div>` : '') + sw('Plná nádrž', f.full, 'fuel:full') + `<div class="row" style="gap:8px;justify-content:flex-end">${btn('Zrušit', 'fuel:cancel')}${btn('Uložit', 'fuel:save', true)}</div>`);
  } else h += `<div class="row" style="margin-bottom:12px">${btn(icon('add', 20, '#06121C') + ' Zapsat tankování', 'fuel:new', true)}</div>`;
  h += tile('Kniha tankování', S.fuel.length ? `<table class="tb"><tr style="color:${P.Muted}"><th>Datum</th><th>Tachometr</th><th>Litry</th><th>Kč</th><th>Kč/l</th><th></th></tr>` + S.fuel.map((r, i) => `<tr><td>${new Date(r.date).toLocaleDateString('cs')}</td><td>${r.odometer.toLocaleString('cs')}</td><td>${decimal(r.litres, 2)}${r.full ? '' : ' *'}</td><td>${Math.round(r.price)}</td><td>${r.litres ? decimal(r.price / r.litres, 2) : DASH}</td><td><span class="mi clickable" data-act="fuel:del:${i}" style="font-size:22px;color:${P.Muted}">delete</span></td></tr>`).join('') + `</table><div style="color:${P.Muted};font-size:13px;margin-top:6px">* nebyla plná nádrž</div>` : `<div style="color:${P.Muted}">Zatím žádné tankování.</div>`);
  return h;
}

function logbookBody() {
  const t = Trip.s;
  let h = `<div class="row" style="gap:8px;margin-bottom:12px">${pill('Jízdy', U.logTab === 0, 'log:0')}${pill('Statistika', U.logTab === 1, 'log:1')}</div>`;
  if (U.logTab === 1) {
    const now = new Date(), d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const wk = d0 - ((now.getDay() + 6) % 7) * 86400000, mo = new Date(now.getFullYear(), now.getMonth(), 1).getTime(), yr = new Date(now.getFullYear(), 0, 1).getTime();
    const sum = from => { const l = S.drives.filter(d => d.start >= from); return [l.length, l.reduce((s, d) => s + d.distanceM, 0) / 1000, l.reduce((s, d) => s + d.movingMs, 0)]; };
    return h + `<div class="row" style="gap:12px">${[['Dnes', d0], ['Tento týden', wk], ['Tento měsíc', mo], ['Letos', yr]].map(([n, f]) => { const [c, km, ms] = sum(f); return `<div class="tile" style="flex:1;background:${P.Tile}"><div class="tt" style="color:${P.Muted}">${n}</div><div style="font-size:24px;font-weight:700">${decimal(km)} km</div><div style="color:${P.Muted};font-size:14px">${c} jízd · ${formatDuration(ms)}</div></div>`; }).join('')}</div>`;
  }
  h += tile('Právě teď', `<div class="row" style="gap:16px;flex-wrap:wrap;font-size:15px"><div>${t.active ? 'Jízda probíhá' : 'Auto stojí'}</div><div>Ujeto ${decimal(t.distanceM / 1000)} km</div><div>Začátek ${hm(t.startedAt)}</div><div>Dnes jízd: ${t.drives}</div></div><div class="row" style="margin-top:8px">${btn('Ukončit jízdu', 'trip:end')}</div>`);
  h += tile('Jízdy', S.drives.length ? `<table class="tb"><tr style="color:${P.Muted}"><th>Datum</th><th>Začátek</th><th>Konec</th><th>km</th><th>Ø km/h</th><th>Max</th></tr>` + S.drives.slice(0, 100).map(d => `<tr><td>${new Date(d.start).toLocaleDateString('cs')}</td><td>${hm(d.start)}</td><td>${hm(d.end)}</td><td>${decimal(d.distanceM / 1000)}</td><td>${Math.round(d.avgKmh)}</td><td>${Math.round(d.topKmh)}</td></tr>`).join('') + `</table>` : `<div style="color:${P.Muted}">Zatím žádná jízda. Jízda začne rozjezdem (GPS ≥ 3 km/h) a skončí po stání delším než 5 minut; kratší než 300 m se nezapisují.</div>`);
  h += `<div style="color:${P.Muted};font-size:13px">V rádiu je navíc trasa na mapě, teplotní mapa, stav tachometru a export do Excelu – v sandboxu zatím zjednodušeně.</div>`;
  return h;
}

function carBody() {
  const t1 = CAR.trip1, t2 = CAR.trip2;
  const tp = (n, t) => tile(n, t ? `<div class="row" style="gap:12px">${reading(decimal(t.avgL100), 'průměr l/100 km')}${reading(String(t.avgKmh || DASH), 'průměr km/h')}${reading(String(t.distanceKm), 'ujeto km')}</div>` : `<div style="color:${P.Muted}">Bez dat</div>`);
  let h = `<div class="row" style="gap:12px;align-items:stretch"><div style="flex:1">${tp('Trip 1', t1)}</div><div style="flex:1">${tp('Trip 2', t2)}</div></div>`;
  h += tile('Stav vozu', `<div class="row" style="gap:16px">${reading(CAR.instantL100 != null ? decimal(CAR.instantL100) : DASH, 'okamžitá l/100 km')}${reading(CAR.rangeKm != null ? CAR.rangeKm + ' km' : DASH, 'dojezd')}${reading(CAR.volts != null ? decimal(CAR.volts) + ' V' : DASH, 'napětí')}${reading(CAR.linked ? 'spojeno' : 'nespojeno', 'CAN box', CAR.linked ? P.Good : P.Muted)}</div>`);
  const now = Date.now();
  const raw = CAR.linked ? [['0x33 okamžitá/dojezd', '33 06 ' + (CAR.instantL100 != null ? Math.round(CAR.instantL100 * 10).toString(16).toUpperCase().padStart(4, '0') : 'FFFF') + ' ' + (CAR.rangeKm || 0).toString(16).toUpperCase().padStart(4, '0')], ['0x34 Trip 1', '34 06 ' + (t1 ? Math.round(t1.avgL100 * 10).toString(16).toUpperCase().padStart(4, '0') : '0000')], ['0x35 Trip 2', '35 06 ' + (t2 ? Math.round(t2.avgL100 * 10).toString(16).toUpperCase().padStart(4, '0') : '0000')], ['0x38 dveře', '38 01 ' + (CAR.doors && CAR.doors.tailgate ? '08' : '00')], ['0x3A výstrahy', '3A 02 00 00']] : [];
  h += tile('Signály z MCU / CAN (ukázka formátu)', raw.length ? `<table class="tb">${raw.map(([k, v]) => `<tr><td>${k}</td><td style="font-family:'Roboto Mono',monospace">${v}</td><td style="color:${P.Muted}">${hm(now)}</td></tr>`).join('')}</table>` : `<div style="color:${P.Muted}">Bez dat z auta.</div>`);
  return h + `<div style="color:${P.Muted};font-size:13px">Skutečné rámce chodí jen v rádiu ze služby mcu_service. Sandbox ukazuje data podle zvoleného zdroje (Nastavení).</div>`;
}

function serviceBody() {
  const f = U.svcForm;
  let h = '';
  const due = Service.mostUrgent();
  h += tile('Nejbližší termín', due ? `<div style="font-size:20px;font-weight:500">${esc(due.label)}</div><div style="color:${due.color};font-weight:700">${due.level}</div><div style="color:${P.Muted}">${due.line}</div>` : `<div style="color:${P.Muted}">Servisní knížka je prázdná.</div>`);
  if (f) h += tile('Nový záznam', `<div class="hscroll">${SERVICE_KINDS.map(k => pill(k[1], f.kind === k[0], 'svc:kind:' + k[0])).join('')}</div>` + tf('Stav tachometru (km)', 'svc.km', f.km, 'number') + tf('Datum', 'svc.date', f.date, 'date') + `<div class="row" style="gap:8px;justify-content:flex-end;margin-top:10px">${btn('Zrušit', 'svc:cancel')}${btn('Uložit', 'svc:save', true)}</div>`);
  else h += `<div class="row" style="margin-bottom:12px">${btn(icon('add', 20, '#06121C') + ' Zapsat servis', 'svc:new', true)}</div>`;
  h += tile('Historie', S.service.length ? `<table class="tb">${S.service.map((s, i) => `<tr><td>${new Date(s.date).toLocaleDateString('cs')}</td><td>${esc((SERVICE_KINDS.find(k => k[0] === s.kind) || [0, s.kind])[1])}</td><td>${s.km ? s.km.toLocaleString('cs') + ' km' : DASH}</td><td><span class="mi clickable" data-act="svc:del:${i}" style="font-size:22px;color:${P.Muted}">delete</span></td></tr>`).join('')}</table>` : `<div style="color:${P.Muted}">Zatím nic.</div>`);
  return h;
}

function destinationBody() {
  let h = `<div class="row" style="gap:8px"><input class="tf" style="flex:1" placeholder="Adresa, město nebo místo" data-f="destQuery" value="${esc(U.destQuery || '')}">${btn('Hledat', 'dest:search', true)}</div>`;
  if (U.destLoading) h += `<div style="color:${LOOK.accent};margin-top:10px">Hledám…</div>`;
  for (const [i, p] of (U.destResults || []).entries()) h += `<div class="row clickable" data-act="dest:pick:${i}" style="padding:12px 4px;border-bottom:1px solid ${P.Line};gap:12px">${icon('place', 28, LOOK.accent)}<div class="col"><div style="font-size:17px">${esc(p.name)}</div><div style="color:${P.Muted};font-size:13px">${esc(p.sub)}</div></div></div>`;
  h += `<div style="color:${P.Muted};font-size:13px;margin-top:12px">V rádiu se trasa plánuje přes Mapy.com a navigace jede krok za krokem. Sandbox ukáže cíl a vzdálenost (odhad), bez navigace.</div>`;
  return h;
}

function carAppsBody() {
  return `<div style="color:${P.Muted};font-size:15px;margin-bottom:12px">Zkratky na původní aplikace jednotky. V sandboxu je nejde otevřít.</div><div class="row" style="gap:12px">` + [['DSP a ekvalizér', 'graphic_eq'], ['Učení tlačítek na volantu', 'touch_app'], ['Klimatizace', 'ac_unit'], ['Nastavení vozu', 'directions_car']].map(([n, ic]) => `<div class="tile col clickable" data-act="radioapp:${n}" style="flex:1;background:${P.Tile};align-items:center;gap:8px">${icon(ic, 40, LOOK.accent)}<div style="text-align:center">${n}</div></div>`).join('') + `</div>`;
}
function obdBody() {
  return tile('Adaptér', `<div style="font-size:17px">OBDII (ELM327 v2.1) · Bluetooth</div><div style="color:${P.Muted};font-size:14px;margin-top:4px">V sandboxu se k adaptéru nepřipojíš (iPhone neumí Bluetooth SPP). Hodnoty níže jsou z prvního testu v autě 15. 11.</div>`) +
    tile('Živá data (volnoběh 15. 11.)', `<table class="tb">${[['Otáčky', '820 ot/min'], ['Chladicí kapalina', '66 °C'], ['Sání', '11 °C'], ['MAP', '100 kPa'], ['Zatížení', '100 %'], ['Plyn', '82 %'], ['Napětí', '13,1 V']].map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>`);
}

/* ---------- Vstupy (pole a posuvníky) ---------- */
function onInput(e, final) {
  const el = e.target;
  if (el.dataset.ap) {
    const k = el.dataset.ap, v = parseFloat(el.value);
    S.appearance[k] = (k === 'corner' || k === 'gap') ? Math.round(v) : k === 'textScale' ? Math.round(v * 20) / 20 : k === 'introSeconds' ? Math.round(v * 2) / 2 : v;
    save();
    const lab = el.parentElement.querySelector('.row div:last-child');
    if (lab) lab.textContent = k === 'cardAlpha' ? Math.round(v * 100) + ' %' : k === 'textScale' ? Math.round(v * 100) + ' %' : k === 'introSeconds' ? decimal(v) + ' s' : Math.round(v) + ' dp';
    panelKey = 'APPEARANCE|' + JSON.stringify(S.appearance); // posuvník nepřekreslovat
    computeLook();
    const ab = areaBox();
    const wr = document.querySelector('#area .pagewrap'); wr.innerHTML = `<div class="page">${pageHtml(U.slot, ab)}</div>`; wr._last = null;
    return;
  }
  const f = el.dataset.f;
  if (!f) return;
  const val = el.value;
  if (f === 'pickerQuery') { U.pickerQuery = val; if (final) refreshPanel(); else debounce('pq', () => { const pos = el.selectionStart; refreshPanel(); const n = document.querySelector('[data-f="pickerQuery"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } }, 400); return; }
  if (f === 'destQuery') { U.destQuery = val; return; }
  if (f === 'homeAddress' || f === 'workAddress') { S.prefs[f] = val; save(); return; }
  if (f.startsWith('fuel.')) { U.fuelForm[f.slice(5)] = parseFloat(String(val).replace(',', '.')) || 0; return; }
  if (f.startsWith('svc.')) { U.svcForm[f.slice(4)] = f === 'svc.date' ? val : parseFloat(val) || 0; return; }
  if (f.startsWith('dlg.')) { U.dlg = U.dlg || {}; U.dlg[f.slice(4)] = val; return; }
}
const debTimers = {};
function debounce(k, fn, ms) { clearTimeout(debTimers[k]); debTimers[k] = setTimeout(fn, ms); }

/* ---------- Akce ---------- */
function act(name, el) {
  const [a, b, c] = name.split(':');
  switch (a) {
    case 'home': home(); return;
    case 'back':
      if (U.dialog) closeDialog(); else if (U.panel) closePanel(); else if (U.editing) { U.editing = false; U.selected = null; render(); } else if (U.slot !== 'CENTER') goSlot('CENTER');
      return;
    case 'unitapp': toast('Aplikace jednotky – v sandboxu se neotevře'); return;
    case 'panel': openPanel(b); return;
    case 'close': closePanel(); return;
    case 'deselect': U.selected = null; render(); return;
    case 'editpage': U.selected = null; U.slot = b; U.editing = true; render(); return;
    case 'gopage': {
      const p = S.pages.find(x => x.slot === b);
      if (p && !p.enabled) Layout.setEnabled(b, true);
      U.panel = null; U.dialog = null; goSlot(b); render(); return;
    }
    case 'pages': U.panel = null; U.dialog = null; render(); return;
    case 'dialog': if (b === 'dismiss') { if (U.panel === 'PAGES') U.panel = null; closeDialog(); } return;
    /* úpravy */
    case 'picker': U.pickerTab = 0; openPanel('PICKER'); return;
    case 'undo': { const l = U.undo.pop(); if (l) Layout.setCells(l[0], l[1]); render(); return; }
    case 'togglegrid': U.showGrid = !U.showGrid; render(); return;
    case 'textsize': {
      const page = Layout.page(U.slot), sel = page.cells.find(x => x.id === U.selected);
      if (!sel) { toast('Nejdřív klepni na widget'); return; }
      const steps = [0.85, 1, 1.15, 1.3, 1.5], i = steps.findIndex(s => Math.abs(s - (sel.scale || 1)) < 0.01), next = steps[(i + 1) % steps.length];
      U.undo.push([U.slot, page.cells]);
      Layout.setCells(U.slot, page.cells.map(x => x.id === sel.id ? Object.assign({}, x, { scale: next }) : x));
      toast(`Velikost textu ${Math.round(next * 100)} %`); render(); return;
    }
    case 'delete': {
      const page = Layout.page(U.slot), sel = page.cells.find(x => x.id === U.selected);
      if (!sel) { toast('Nejdřív klepni na widget'); return; }
      U.undo.push([U.slot, page.cells]); Layout.setCells(U.slot, page.cells.filter(x => x.id !== sel.id)); U.selected = null; render(); return;
    }
    case 'copy': {
      const page = Layout.page(U.slot), sel = page.cells.find(x => x.id === U.selected);
      if (!sel) { toast('Nejdřív klepni na widget'); return; }
      const spot = Layout.findSpace(page.cells, sel.w, sel.h);
      if (!spot) { toast('Na ploše není místo pro kopii'); return; }
      const cp = Object.assign({}, sel, { id: newId(), x: spot[0], y: spot[1] });
      U.undo.push([U.slot, page.cells]); Layout.setCells(U.slot, page.cells.concat([cp])); U.selected = cp.id; render(); return;
    }
    case 'done': U.editing = false; U.selected = null; U.undo = []; render(); return;
    case 'rename': {
      U.dlg = { name: Layout.page(U.slot).name };
      dialog('Název plochy', `<input class="tf" data-f="dlg.name" maxlength="20" value="${esc(U.dlg.name)}">`, [['Zrušit', 'dlgclose'], ['Uložit', 'renamesave']]);
      return;
    }
    case 'renamesave': Layout.rename(U.slot, (U.dlg.name || '').slice(0, 20)); closeDialog(); return;
    case 'dlgclose': closeDialog(); return;
    case 'add': addWidget(b); return;
    case 'ptab': U.pickerTab = +b; refreshPanel(); return;
    case 'pcat': U.pickerCat = b || null; refreshPanel(); return;
    case 'fav': S.favorites = S.favorites.includes(b) ? S.favorites.filter(x => x !== b) : S.favorites.concat([b]); save(); refreshPanel(); return;
    case 'dock': U.pickerTab = 1; openPanel('PICKER'); return;
    case 'app': toast((APPS.find(x => x.id === b) || {}).label + ' – v rádiu se otevře aplikace'); return;
    case 'radioapp': toast(b + ' – původní aplikace rádia, v sandboxu se neotevře'); return;
    /* vzhled */
    case 'ap': {
      const A = S.appearance;
      if (b === 'reset') S.appearance = Object.assign({}, DEFAULT_APPEARANCE);
      else if (b === 'accent') A.accent = +c; else if (b === 'bg') A.background = +c; else if (b === 't') A[c] = !A[c];
      else if (b === 'theme') A.theme = c; else if (b === 'font') A.font = c; else if (b === 'intro') A.introStyle = c; else if (b === 'map') A.mapStyle = c;
      save(); render(); return;
    }
    case 'intro': if (b === 'preview') { closePanel(); showIntro(true); } return;
    /* widgety */
    case 'trip':
      if (b === 'confirm') dialog('Ukončit jízdu?', 'Jízda se zapíše do Knihy jízd. Při dalším rozjezdu začne nová jízda a ujeto, průměr, maximum a začátek se vynulují.', [['Zrušit', 'dlgclose'], ['Ukončit', 'trip:end']]);
      else if (b === 'end') { Trip.endDrive(); S.trip = Trip.fresh(Date.now()); save(); U.dialog = null; render(); refreshPanel(); }
      return;
    case 'g': if (b === 'enable') enableMotion(); else { GF.base = null; GF.peakSide = GF.peakBrake = 0; } render(); return;
    case 'perf': Perf.reset(); render(); return;
    case 'weather': refreshWeather(true); return;
    case 'media':
      if (b === 'play') { Media.playing = !Media.playing; Media.forced = true; }
      else if (b === 'next') Media.idx++; else if (b === 'prev') Media.idx = Math.max(0, Media.idx - 1);
      else if (b === 'open') toast(S.prefs.musicApp + ' – v rádiu se otevře přehrávač');
      render(); return;
    case 'map': toast('Mapa sleduje auto – v rádiu klepnutí otevře Kam jedeme?'); return;
    case 'dial': {
      const k = S.quickDial[+b];
      if (!k) { act('dialedit:' + b); return; }
      if (k.number) location.href = 'tel:' + k.number.replace(/\s/g, '');
      else toast(`${k.name}: číslo doplň podržením kolečka`);
      return;
    }
    case 'dialedit': {
      const i = +b, k = S.quickDial[i] || { name: '', number: '' };
      U.dlg = { name: k.name, number: k.number };
      dialog('Kontakt ' + (i + 1), tf('Jméno', 'dlg.name', k.name) + tf('Telefonní číslo', 'dlg.number', k.number, 'tel') + `<div style="font-size:12px;margin-top:8px">Uloží se jen v tomto telefonu (repozitář je veřejný).</div>`, [['Smazat', 'dialdel:' + i], ['Zrušit', 'dlgclose'], ['Uložit', 'dialsave:' + i]]);
      return;
    }
    case 'dialsave': { const n = (U.dlg.number || '').trim(); S.quickDial[+b] = { name: (U.dlg.name || '').trim() || n || 'Kontakt', number: n }; save(); closeDialog(); render(); return; }
    case 'dialdel': S.quickDial[+b] = null; save(); closeDialog(); render(); return;
    case 'contacts': toast('Kontakty – v rádiu se otevře aplikace telefonu'); return;
    case 'route':
      if (b === 'clear') Route.current = null;
      else { const q = b === 'home' ? S.prefs.homeAddress : S.prefs.workAddress; geocode(q).then(r => { if (r[0]) setRoute(r[0]); }); }
      render(); return;
    /* nastavení */
    case 'mode': S.prefs.dataMode = b; demoT = 0; save(); carTick(); render(); refreshPanel(); return;
    case 'road': S.prefs.testRoad = b; save(); render(); refreshPanel(); return;
    case 'pref': S.prefs[b] = !S.prefs[b]; save(); render(); refreshPanel(); return;
    case 'layout':
      dialog('Obnovit rozložení?', 'Všechny plochy dostanou rozložení, které je teď v rádiu. Tvoje úpravy rozložení v sandboxu se ztratí.', [['Zrušit', 'dlgclose'], ['Obnovit', 'layoutreset']]);
      return;
    case 'layoutreset': if (S.baseline) { S.pages = Layout.fromBaseline(S.baseline); save(); } U.slot = 'CENTER'; closeDialog(); return;
    case 'upd': Upd.check(true); return;
    case 'updinstall': Upd.install(); return;
    case 'updlater': closeDialog(); return;
    /* tankování */
    case 'fuel':
      if (b === 'new') U.fuelForm = { odometer: Service.currentKm() || '', litres: '', price: '', full: true };
      else if (b === 'cancel') U.fuelForm = null;
      else if (b === 'full') U.fuelForm.full = !U.fuelForm.full;
      else if (b === 'save') { const f = U.fuelForm; if (!(f.odometer > 0 && f.litres > 0)) { toast('Vyplň tachometr a litry'); return; } S.fuel.unshift({ date: Date.now(), odometer: +f.odometer, litres: +f.litres, price: +f.price || 0, full: f.full, lat: GPS.real ? GPS.real.lat : null, lon: GPS.real ? GPS.real.lon : null }); U.fuelForm = null; save(); }
      else if (b === 'del') { S.fuel.splice(+c, 1); save(); }
      refreshPanel(); render(); return;
    case 'svc':
      if (b === 'new') U.svcForm = { kind: 'oil', km: Service.currentKm() || '', date: new Date().toISOString().slice(0, 10) };
      else if (b === 'cancel') U.svcForm = null;
      else if (b === 'kind') U.svcForm.kind = c;
      else if (b === 'save') { const f = U.svcForm; S.service.unshift({ kind: f.kind, km: +f.km || 0, date: new Date(f.date).getTime() || Date.now() }); U.svcForm = null; save(); }
      else if (b === 'del') { S.service.splice(+c, 1); save(); }
      refreshPanel(); render(); return;
    case 'log': U.logTab = +b; refreshPanel(); return;
    case 'dest':
      if (b === 'search') { U.destLoading = true; refreshPanel(); geocode(U.destQuery).then(r => { U.destResults = r; U.destLoading = false; refreshPanel(); }); }
      else if (b === 'pick') { setRoute(U.destResults[+c]); closePanel(); }
      return;
  }
  if (window.sandboxAct) window.sandboxAct(a, b, c);
}

async function geocode(q) {
  if (!q) return [];
  try {
    const j = await (await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&accept-language=cs&countrycodes=cz,sk,de,at,pl&q=' + encodeURIComponent(q))).json();
    return j.map(p => ({ name: p.name || p.display_name.split(',')[0], sub: p.display_name, lat: +p.lat, lon: +p.lon }));
  } catch (e) { toast('Hledání nefunguje – chybí internet?'); return []; }
}
function setRoute(p) {
  const f = GPS.fix || { lat: HK_LAT, lon: HK_LON };
  Route.current = { name: p.name, lat: p.lat, lon: p.lon, lengthM: haversine(f.lat, f.lon, p.lat, p.lon) * 1.3 };
  render();
}
