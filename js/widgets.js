'use strict';
/* Widgety – stejné rozměry, písma a chování jako v rádiu (home/Widgets*.kt). Rozměry v px = dp. */

let FS = 1; // měřítko písma pro právě kreslený widget (textScale × zvětšení widgetu)
const sp = v => (v * FS).toFixed(2) + 'px';
const spN = v => v * FS;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function icon(name, size, color, extra = '') { return `<span class="mi" style="font-size:${size}px;color:${color};${extra}">${name}</span>`; }

/** Karta widgetu (WidgetCard). body(cw, ch) dostane rozměr obsahu. */
function card(W, H, o, body) {
  const pad = o.pad == null ? 14 : o.pad;
  const hasTitle = LOOK.titles && (o.title || o.action);
  const cw = W - 2 * pad, ch = H - 2 * pad - (hasTitle ? 26 : 0);
  const border = LOOK.border ? `box-shadow: inset 0 0 0 1px ${LOOK.border};` : '';
  let h = `<div class="card${o.act ? ' clickable' : ''}" ${o.act ? `data-act="${o.act}"` : ''} ${o.long ? `data-long="${o.long}"` : ''} style="left:0;top:0;width:${W}px;height:${H}px;border-radius:${LOOK.corner}px;background:${o.bg || LOOK.card};${border}padding:${pad}px">`;
  if (hasTitle) h += `<div class="ctitle"><div class="t" style="color:${LOOK.accent};font-size:${sp(13)}">${o.title ? esc(o.title) : ''}</div>${o.action || ''}</div>`;
  h += `<div class="cbody">${body(cw, ch)}</div></div>`;
  return h;
}
/** FitText: velké číslo přes celou plochu. */
function fit(text, x, y, w, h, o = {}) {
  const chars = Math.max(1, String(text).length);
  const dp = Math.max(8, Math.min(h * (o.heightPart || 0.82), w / (chars * (o.wpc || 0.58))));
  const px = Math.min(dp, (o.maxSp || 120) * FS);
  return `<div class="fit" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;justify-content:${o.align || 'center'};color:${o.color || P.Text};font-size:${px}px;line-height:${px * 1.05}px;font-weight:${o.weight || 500}">${esc(text)}</div>`;
}
function statRow(label, value) {
  return `<div class="row" style="width:100%"><div class="nowrap" style="flex:1;color:${P.Muted};font-size:${sp(15)}">${esc(label)}</div><div class="nowrap" style="color:${P.Text};font-size:${sp(15)};font-weight:500">${esc(value)}</div></div>`;
}
function reading(value, label, color) {
  return `<div class="col"><div class="nowrap" style="color:${color || P.Text};font-size:${sp(26)};font-weight:700">${esc(value)}</div><div class="nowrap" style="color:${P.Muted};font-size:${sp(13)}">${esc(label)}</div></div>`;
}
function roundBtn(name, size, filled, act) {
  return `<div class="rbtn clickable" data-act="${act}" style="width:${size}px;height:${size}px;background:${filled ? LOOK.accent : tA(0.12)}">${icon(name, size * 0.55, filled ? '#06121C' : P.Text)}</div>`;
}
function arcPath(cx, cy, r, a0, sweep) {
  const rad = d => d * Math.PI / 180;
  const x0 = cx + r * Math.cos(rad(a0)), y0 = cy + r * Math.sin(rad(a0));
  const x1 = cx + r * Math.cos(rad(a0 + sweep)), y1 = cy + r * Math.sin(rad(a0 + sweep));
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

const W_RENDER = {
  /* ---------- Jízda ---------- */
  SPEED(c, W, H) {
    return card(W, H, { title: 'Rychlost' }, (cw, ch) => {
      const lh = spN(14) * 1.2;
      return fit(GPS.speed == null ? DASH : String(GPS.speed), 0, 0, cw, ch - lh, { weight: 700, maxSp: 160, wpc: 0.62 }) +
        `<div style="position:absolute;bottom:0;width:100%;text-align:center;color:${P.Muted};font-size:${sp(14)}">km/h · GPS</div>`;
    });
  },
  SPEED_GAUGE(c, W, H) {
    return card(W, H, { pad: 12, act: 'panel:CAR' }, (cw, ch) => {
      const showCar = ch > 170 && cw > 160;
      const valueSp = clamp(Math.min(cw / 9, ch / 9, 30), 15, 99);
      const labPx = clamp(valueSp * 0.55, 12, 17) * FS, valPx = valueSp * FS;
      const rowH = labPx * 1.17 + valPx * 1.17;
      const gh = showCar ? ch - 6 - 4 - 2 * rowH : ch;
      const side = Math.max(10, Math.min(cw, gh));
      const speed = GPS.speed;
      const stroke = Math.max(side * 0.075, 6), d = side - stroke, r = d / 2;
      const part = clamp(speed || 0, 0, 200) / 200;
      const ox = (cw - side) / 2, oy = (gh - side) / 2;
      let s = `<svg style="position:absolute;left:${ox}px;top:${oy}px" width="${side}" height="${side}">` +
        `<path d="${arcPath(side / 2, side / 2, r, 135, 270)}" fill="none" stroke="${tA(0.1)}" stroke-width="${stroke}" stroke-linecap="round"/>`;
      if (part > 0) s += `<path d="${arcPath(side / 2, side / 2, r, 135, Math.max(0.5, 270 * part))}" fill="none" stroke="${(speed || 0) > 130 ? P.Amber : LOOK.accent}" stroke-width="${stroke}" stroke-linecap="round"/>`;
      s += `</svg>`;
      const big = clamp(side * 0.24, 28, 80), small = clamp(side * 0.065, 12, 18);
      s += `<div class="col" style="position:absolute;left:0;top:0;width:${cw}px;height:${gh}px;align-items:center;justify-content:center">` +
        `<div style="color:${P.Text};font-size:${sp(big)};font-weight:700;line-height:1.17">${speed == null ? DASH : speed}</div><div style="color:${P.Muted};font-size:${sp(small)};line-height:1.17">km/h</div></div>`;
      if (showCar) {
        const gr = (label, value, color) => `<div class="col" style="flex:1;align-items:center;min-width:0"><div class="nowrap" style="max-width:100%;color:${P.Muted};font-size:${labPx}px;line-height:1.17">${label}</div><div class="nowrap" style="color:${color || P.Text};font-size:${valPx}px;font-weight:500;line-height:1.17">${value}</div></div>`;
        const t1 = CAR.trip1 || null;
        s += `<div style="position:absolute;left:0;top:${gh + 6}px;width:${cw}px">` +
          `<div class="row">${gr('okamž. spotřeba', CAR.instantL100 != null ? decimal(CAR.instantL100) + ' l' : DASH + ' l')}${gr('průměr. spotřeba', t1 && t1.avgL100 != null ? decimal(t1.avgL100) + ' l' : DASH + ' l')}</div>` +
          `<div class="row" style="margin-top:4px">${gr('ujeto', t1 && t1.distanceKm != null ? t1.distanceKm + ' km' : DASH + ' km')}${gr('dojezd', CAR.rangeKm != null ? CAR.rangeKm + ' km' : DASH + ' km', (CAR.rangeKm == null ? 999 : CAR.rangeKm) < 80 ? P.Amber : P.Text)}</div></div>`;
      }
      return s;
    });
  },
  TRIP(c, W, H, pv) {
    const t = Trip.s, st = FuelLog.stats(S.fuel), km = t.distanceM / 1000;
    const litres = st.averageL100 != null ? km * st.averageL100 / 100 : null;
    const last = S.fuel[0], ppl = last && last.litres > 0 ? last.price / last.litres : null;
    const cost = litres != null && ppl != null ? litres * ppl : null;
    const action = `<div class="clickable" data-act="trip:end" style="color:${LOOK.accent};font-size:${sp(15)};font-weight:500;padding:0 4px">Vynulovat</div>`;
    return card(W, H, { title: 'Jízda', action }, (cw, ch) => {
      const main = (w, h) => `<div style="position:relative;width:${w}px;height:${h}px">${fit(formatKm(km * 1000), 0, 0, w - 36, h - spN(14) * 2.4, { weight: 700, maxSp: 56, align: 'flex-start' })}<div style="position:absolute;right:0;top:${h - spN(14) * 2.4 - 26}px;color:${P.Muted};font-size:${sp(15)}">KM</div>` +
        `<div style="position:absolute;bottom:0;left:0;color:${P.Muted};font-size:${sp(14)};line-height:1.2">od ${hm(t.startedAt)}<br>${litres != null ? decimal(litres) + ' l' : '– l'}, ${cost != null ? decimal(cost, 0) + ' Kč' : '– Kč'}</div></div>`;
      const stats = `<div class="col" style="gap:2px;flex:1">${statRow('Čas', formatDuration(Date.now() - t.startedAt))}${statRow('V pohybu', formatDuration(t.movingMs))}${statRow('Průměr', Math.round(Trip.avg(t)) + ' km/h')}${statRow('Maximum', Math.round(t.topKmh) + ' km/h')}</div>`;
      if (cw > 260) return `<div class="row" style="width:${cw}px;height:${ch}px;gap:10px">${main(cw * 0.47, ch)}${stats}</div>`;
      return `<div class="col" style="width:${cw}px;height:${ch}px">${main(cw, ch - spN(15) * 4.8)}${stats}</div>`;
    });
  },
  TRIP_COMPUTER(c, W, H) {
    const t = Trip.s, st = FuelLog.stats(S.fuel);
    const movingMin = Math.floor(t.dayMovingMs / 60000);
    const avgL = CAR.trip2 && CAR.trip2.avgL100 != null ? CAR.trip2.avgL100 : st.averageL100;
    const rows = [
      ['Ujeto km', t.distanceM < 10000 ? decimal(t.distanceM / 1000) : Math.round(t.distanceM / 1000).toString()],
      ['V pohybu', pad2(Math.floor(movingMin / 60)) + ':' + pad2(movingMin % 60)],
      ['Průměr km/h', String(Math.round(Trip.avg(t)))],
      ['Maximum km/h', String(Math.round(t.topKmh))],
      ['Začátek', hm(t.startedAt)],
      ['Počet jízd', String(t.drives)],
      ['Průměr l/100km', avgL != null ? decimal(avgL) : DASH]
    ];
    return card(W, H, { pad: 14, act: 'panel:LOGBOOK', long: 'trip:confirm' }, (cw, ch) => {
      const fs = clamp(Math.min(ch / rows.length * 0.5, cw / 14, 22), 12, 99);
      return `<div class="col" style="width:${cw}px;height:${ch}px;justify-content:space-evenly">` + rows.map(([l, v]) =>
        `<div class="row"><div class="nowrap" style="flex:1;color:${P.Label};font-size:${sp(fs)}">${l}</div><div class="nowrap" style="color:${P.Text};font-size:${sp(fs)}">${v}</div></div>`).join('') + `</div>`;
    });
  },
  GFORCE(c, W, H) {
    const action = `<div class="clickable" data-act="g:reset" style="color:${LOOK.accent};font-size:${sp(15)};font-weight:500;padding:0 4px">Vynulovat</div>`;
    return card(W, H, { title: 'Přetížení', action }, (cw, ch) => {
      if (!GF.available) return `<div class="clickable" data-act="g:enable" style="color:${P.Muted};font-size:${sp(15)}">${GF.asked ? 'Telefon nedává data zrychlení' : 'Klepni a povol senzor pohybu (v rádiu: senzor jednotky)'}</div>`;
      const s = Math.min(ch, cw * 0.5), r = s / 2;
      const px = r + clamp(GF.lat, -1, 1) * r, py = r - clamp(GF.lon, -1, 1) * r;
      return `<div class="row" style="width:${cw}px;height:${ch}px"><svg width="${s}" height="${s}" style="flex:none"><circle cx="${r}" cy="${r}" r="${r - 1}" fill="none" stroke="${tA(0.1)}" stroke-width="2"/><circle cx="${r}" cy="${r}" r="${r / 2}" fill="none" stroke="${tA(0.08)}" stroke-width="2"/><line x1="0" y1="${r}" x2="${s}" y2="${r}" stroke="${tA(0.08)}" stroke-width="2"/><line x1="${r}" y1="0" x2="${r}" y2="${s}" stroke="${tA(0.08)}" stroke-width="2"/><circle cx="${px}" cy="${py}" r="${r * 0.16}" fill="${rgba(LOOK.accentC, 0.3)}"/><circle cx="${px}" cy="${py}" r="${r * 0.09}" fill="${LOOK.accent}"/></svg>` +
        `<div class="col" style="flex:1;gap:2px;margin-left:10px">${statRow('Bočně', (GF.lat >= 0 ? '+' : '') + decimal(GF.lat, 2) + ' g')}${statRow('Podélně', (GF.lon >= 0 ? '+' : '') + decimal(GF.lon, 2) + ' g')}${statRow('Max. zatáčka', decimal(GF.peakSide, 2) + ' g')}${statRow('Max. brzdění', decimal(GF.peakBrake, 2) + ' g')}</div></div>`;
    });
  },
  PERF(c, W, H) {
    const action = `<span class="mi clickable" data-act="perf:reset" style="font-size:24px;color:${P.Muted}">refresh</span>`;
    return card(W, H, { title: 'Časomíra', action }, (cw, ch) => {
      const ph = Perf.phase;
      const [txt, col] = ph === 'READY' ? ['Připraveno: vyraz, až budeš chtít', P.Good] : ph === 'RUNNING' ? ['Měřím…', LOOK.accent] : ph === 'DONE' ? ['Hotovo – klepni na ↻ pro nové měření', P.Text] : ['Zastav a připrav se', P.Muted];
      const top = spN(17) * 1.3 + 6, bot = spN(12) * 1.3;
      const v = (label, s, i) => `<div style="position:absolute;left:${i * cw / 3}px;top:${top}px;width:${cw / 3}px;height:${ch - top - bot}px"><div style="text-align:center;color:${P.Muted};font-size:${sp(14)}">${label}</div>${fit(s == null ? DASH : decimal(s) + ' s', 0, spN(14) * 1.2, cw / 3, ch - top - bot - spN(14) * 1.2, { weight: 700, maxSp: 44 })}</div>`;
      return `<div class="nowrap" style="color:${col};font-size:${sp(17)};font-weight:500">${txt}</div>` + v('0–50', Perf.t50, 0) + v('0–100', Perf.t100, 1) + v('400 m', Perf.t400, 2) +
        `<div class="nowrap" style="position:absolute;bottom:0;color:${P.Muted};font-size:${sp(12)}">Měří se z GPS (1× za sekundu), výsledek je orientační.</div>`;
    });
  },
  /* ---------- Navigace ---------- */
  COMPASS(c, W, H) {
    const f = GPS.fix, b = f && f.bearing != null ? f.bearing : 0;
    return card(W, H, { title: 'Kompas' }, (cw, ch) => {
      const s = Math.min(ch, cw * 0.55), r = s / 2 - 2, C = s / 2;
      let ticks = '';
      for (let i = 0; i < 12; i++) { const a = i * 30 * Math.PI / 180, inner = i % 3 === 0 ? 0.78 : 0.88; ticks += `<line x1="${C + r * inner * Math.sin(a)}" y1="${C - r * inner * Math.cos(a)}" x2="${C + r * Math.sin(a)}" y2="${C - r * Math.cos(a)}" stroke="${tA(i % 3 === 0 ? 0.6 : 0.25)}" stroke-width="3"/>`; }
      const svg = `<svg width="${s}" height="${s}" style="flex:none;transform:rotate(${-b}deg)"><circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="${tA(0.12)}" stroke-width="3"/>${ticks}<path d="M${C} ${C - r * 0.7} L${C - r * 0.14} ${C} L${C + r * 0.14} ${C}Z" fill="${P.Bad}"/><path d="M${C} ${C + r * 0.7} L${C - r * 0.14} ${C} L${C + r * 0.14} ${C}Z" fill="${tA(0.5)}"/></svg>`;
      const names = ['S', 'SV', 'V', 'JV', 'J', 'JZ', 'Z', 'SZ'];
      const card_ = names[Math.floor((((b % 360) + 360) % 360) / 45 + 0.5) % 8];
      return `<div class="row" style="width:${cw}px;height:${ch}px">${svg}<div class="col" style="flex:1;margin-left:10px;gap:2px"><div style="font-size:${sp(34)};font-weight:700;color:${P.Text}">${f ? card_ : DASH}</div><div style="color:${P.Muted};font-size:${sp(15)}">${f ? Math.round(b) + '°' : ''}</div>${statRow('Výška', f && f.alt != null ? Math.round(f.alt) + ' m' : DASH)}${statRow('Rychlost', GPS.speed != null ? GPS.speed + ' km/h' : DASH)}</div></div>`;
    });
  },
  GPS(c, W, H) {
    const f = GPS.fix;
    return card(W, H, { title: 'GPS' }, () => `<div class="col" style="gap:2px">${statRow('Stav', f ? (GPS.demo ? 'Ukázka' : 'Poloha OK') : (GPS.error || 'Hledám…'))}${statRow('Satelity', GPS.sats != null ? String(GPS.sats) : DASH)}${statRow('Přesnost', f && f.acc != null ? '±' + Math.round(f.acc) + ' m' : DASH)}${statRow('Výška', f && f.alt != null ? Math.round(f.alt) + ' m' : DASH)}${statRow('Stáří', f ? Math.max(0, Math.round((Date.now() - f.at) / 1000)) + ' s' : DASH)}${statRow('Poloha', f ? decimal(f.lat, 4) + ', ' + decimal(f.lon, 4) : DASH)}</div>`);
  },
  SPEED_LIMIT(c, W, H) {
    const lim = SpeedLimit.value;
    return card(W, H, { title: 'Limit', pad: 10 }, (cw, ch) => {
      const s = Math.min(cw, ch) * 0.92;
      return `<div class="fill" style="display:flex;align-items:center;justify-content:center"><div style="width:${s}px;height:${s}px;border-radius:50%;background:#fff;border:${s * 0.11}px solid #E53935;display:flex;align-items:center;justify-content:center;color:#111;font-weight:700;font-size:${(lim != null && lim >= 100 ? 0.36 : 0.44) * s}px">${lim == null ? DASH : lim}</div></div>`;
    });
  },
  DIRECTIONS(c, W, H) {
    const r = Route.current, now = new Date();
    const st = r ? 'Trasa' : 'Bez trasy';
    const action = `<div style="width:8px;height:8px;border-radius:50%;background:${r ? P.Good : P.Muted};margin-right:6px"></div><div style="color:${P.Muted};font-size:${sp(13)}">${st}</div>`;
    return card(W, H, { title: 'Navigace', action, act: 'panel:DESTINATION' }, (cw, ch) => {
      if (r) {
        const rem = GPS.fix ? haversine(GPS.fix.lat, GPS.fix.lon, r.lat, r.lon) * 1.3 : r.lengthM;
        const sec = rem / (50 / 3.6), arr = new Date(Date.now() + sec * 1000);
        return `<div class="col" style="height:${ch}px;justify-content:space-evenly"><div class="nowrap" style="color:${P.Text};font-size:${sp(20)};font-weight:700">${esc(r.name)}</div><div class="nowrap" style="color:${LOOK.accent};font-size:${sp(18)};font-weight:500">${formatKm(rem)} km · ${Math.round(sec / 60)} min</div><div style="color:${P.Muted};font-size:${sp(15)}">Příjezd ${hm(arr)}</div><div class="row"><div class="pill clickable" data-act="route:clear" style="background:${LOOK.accent};color:#06121C">${icon('close', 18, '#06121C')} Zrušit trasu</div></div></div>`;
      }
      const chips = (S.prefs.homeAddress || S.prefs.workAddress) ? spN(15) * 1.2 + 44 : spN(15) * 1.25;
      let h = fit(timeText(now, false), 0, 0, cw, ch - chips, { weight: 700, maxSp: 80 }) + `<div style="position:absolute;left:0;right:0;top:${ch - chips}px;text-align:center;color:${P.Muted};font-size:${sp(15)}" class="nowrap">${dateText(now)}</div>`;
      if (S.prefs.homeAddress || S.prefs.workAddress) h += `<div class="row" style="position:absolute;bottom:0;left:0;right:0;justify-content:center;gap:8px">${S.prefs.homeAddress ? `<div class="pill clickable" data-act="route:home" style="background:${tA(0.12)};color:${P.Text}">${icon('home', 18, P.Text)} Domů</div>` : ''}${S.prefs.workAddress ? `<div class="pill clickable" data-act="route:work" style="background:${tA(0.12)};color:${P.Text}">${icon('work', 18, P.Text)} Práce</div>` : ''}</div>`;
      return h;
    });
  },
  MAP(c, W, H, pv) {
    return `<div class="card" data-act="map" style="left:0;top:0;width:${W}px;height:${H}px;border-radius:${LOOK.corner}px;background:${LOOK.darkMap ? '#1B2430' : '#E8E4DA'}">${MapRender.html(W, H, 16)}</div>`;
  },
  /* ---------- Vozidlo ---------- */
  CAR_COMPUTER(c, W, H) {
    return card(W, H, { title: 'Palubní počítač', act: 'panel:CAR' }, () => `<div class="col" style="height:100%;justify-content:space-evenly">${reading(CAR.instantL100 != null ? decimal(CAR.instantL100) : DASH, 'okamžitá l/100 km')}${reading(CAR.rangeKm != null ? String(CAR.rangeKm) : DASH, 'dojezd km', (CAR.rangeKm == null ? 999 : CAR.rangeKm) < 80 ? P.Amber : null)}${reading(CAR.trip1 ? decimal(CAR.trip1.avgL100) : DASH, 'průměr l/100 km (Trip 1)')}${CAR.linked ? '' : `<div style="color:${P.Muted};font-size:${sp(13)}">Bez dat z auta</div>`}</div>`);
  },
  DOORS(c, W, H) {
    const good = P.Good, bad = P.Bad;
    const warn = !CAR.linked ? ['Bez dat z auta', P.Muted] : !CAR.warnings.length ? ['Auto nehlásí žádnou výstrahu', good] : CAR.warnings.length === 1 ? [S.warningLabels[CAR.warnings[0]] || 'Výstraha kód 0x' + CAR.warnings[0].toString(16).toUpperCase().padStart(2, '0'), bad] : ['Výstrahy: ' + CAR.warnings.length, bad];
    const lights = CAR.headlights === true ? ['Zapnuto', good] : CAR.headlights === false ? ['Vypnuto', P.Text] : [DASH, P.Muted];
    const brake = CAR.handbrake === true ? ['Zataženo', bad] : CAR.handbrake === false ? ['Uvolněno', good] : [DASH, P.Muted];
    const v = CAR.volts;
    const volts = v == null ? [DASH + ' V', P.Muted] : v < 11.8 ? [decimal(v) + ' V', bad] : v < 12.2 ? [decimal(v) + ' V', P.Amber] : [decimal(v) + ' V', good];
    const rows = [['VÝSTRAHY VOZU', warn], ['SVĚTLA', lights], ['RUČNÍ BRZDA', brake], ['NAPĚTÍ', volts]];
    return card(W, H, { pad: 14, act: 'panel:CAR' }, (cw, ch) => {
      const inner = cw - 12, picW = inner * 0.85 / 2, txtW = inner * 1.15 / 2;
      const fs = clamp(Math.min(ch / 9.5, txtW / 13, 22), 12, 99);
      return `<div class="row" style="width:${cw}px;height:${ch}px">` +
        `<div style="width:${picW}px;height:${ch}px;display:flex;align-items:center;justify-content:center;flex:none">${carPicture(CAR.doors || {}, picW, ch - 8)}</div>` +
        `<div class="col" style="width:${txtW}px;margin-left:12px;height:${ch}px;justify-content:space-evenly;flex:none">` +
        rows.map(([l, [val, col]]) => `<div><div class="nowrap" style="color:${P.Label};font-size:${sp(fs)};font-weight:700">${l}</div><div style="color:${col};font-size:${sp(fs)};font-weight:700;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(val)}</div></div>`).join('') + `</div></div>`;
    });
  },
  VOLTAGE(c, W, H) {
    const v = CAR.volts;
    return card(W, H, { title: 'Napětí', act: 'panel:CAR' }, (cw, ch) => fit(v != null ? decimal(v) + ' V' : '– V', 0, 0, cw, ch - spN(13) * 1.3, { weight: 700, maxSp: 64, color: v != null && v < 11.8 ? P.Bad : P.Text }) +
      `<div class="nowrap" style="position:absolute;bottom:0;width:100%;text-align:center;color:${CAR.linked ? P.Good : P.Muted};font-size:${sp(13)}">${CAR.linked ? 'Auto připojeno' : 'Bez dat z auta'}</div>`);
  },
  FUEL(c, W, H) {
    const st = FuelLog.stats(S.fuel);
    return card(W, H, { title: 'Spotřeba', act: 'panel:FUEL' }, () => `<div class="row" style="height:100%"><div style="flex:1">${reading(st.averageL100 != null ? decimal(st.averageL100) : DASH, 'průměr l/100')}</div><div style="flex:1">${reading(st.lastL100 != null ? decimal(st.lastL100) : DASH, 'poslední nádrž')}</div></div>` +
      (S.fuel.length ? '' : `<div style="position:absolute;bottom:0;color:${P.Muted};font-size:${sp(12)}">Klepni a zapiš tankování</div>`));
  },
  SERVICE(c, W, H) {
    const due = Service.mostUrgent();
    return card(W, H, { title: 'Servis', act: 'panel:SERVICE' }, () => `<div class="col" style="height:100%;justify-content:center">` + (due == null
      ? `<div style="color:${P.Text};font-size:${sp(18)};font-weight:500">Zapiš první servis</div><div style="color:${P.Muted};font-size:${sp(13)}">Servisní knížka je prázdná</div>`
      : `<div style="color:${P.Text};font-size:${sp(18)};font-weight:500">${esc(due.label)}</div><div style="color:${due.color};font-size:${sp(16)};font-weight:700">${due.level}</div><div style="color:${P.Muted};font-size:${sp(13)}">${due.line}</div>`) + `</div>`);
  },
  CAR_APPS(c, W, H) {
    const items = [['DSP', 'graphic_eq'], ['Volant', 'touch_app'], ['Klima', 'ac_unit'], ['Vůz', 'directions_car']];
    return card(W, H, { pad: 8 }, () => `<div class="row" style="height:100%;justify-content:space-evenly">` + items.map(([l, ic]) => `<div class="col clickable" data-act="radioapp:${l}" style="flex:1;align-items:center;justify-content:center;border-radius:16px;padding:6px 0">${icon(ic, 34, LOOK.accent)}<div style="color:${P.Text};font-size:${sp(14)}">${l}</div></div>`).join('') + `</div>`);
  },
  /* ---------- Info ---------- */
  CLOCK(c, W, H) {
    const now = new Date();
    return card(W, H, { pad: 10 }, (cw, ch) => fit(timeText(now, LOOK.seconds), 0, 0, cw, ch - spN(17) * 1.3, { weight: 700, maxSp: 140 }) + `<div class="nowrap" style="position:absolute;bottom:0;width:100%;text-align:center;color:${P.Muted};font-size:${sp(17)}">${dateText(now)}</div>`);
  },
  WEATHER(c, W, H) {
    const w = Weather;
    const place = w.place ? (w.approximate ? w.place + ' (bez GPS)' : w.place) : null;
    return card(W, H, { pad: 14 }, (cw, ch) => {
      let h = `<div class="row" style="justify-content:flex-end;height:30px">${place ? icon('location_on', 22, P.WeatherMuted) + `<div class="nowrap" style="color:${P.WeatherMuted};font-size:${sp(18)};margin:0 14px 0 4px">${esc(place)}</div>` : ''}<span class="mi clickable" data-act="weather:refresh" style="font-size:30px;color:${P.WeatherMuted}">refresh</span></div>`;
      let fh = 0;
      if (w.days.length) {
        const count = cw < 230 ? 3 : cw < 330 ? 4 : 5;
        fh = spN(17) * 2.6 + 34 + 8;
        h += `<div class="row" style="margin-top:8px;justify-content:space-between">` + w.days.slice(0, count).map((d, i) => `<div class="col" style="flex:1;align-items:center;gap:4px"><div class="nowrap" style="color:${P.WeatherMuted};font-size:${sp(17)}">${i === 0 ? 'Dnes' : cap(DAYS_SHORT[d.date.getDay()])}</div>${icon(wIcon(d.code, true), 34, wTint(d.code, true))}<div class="nowrap" style="color:${P.Text};font-size:${sp(17)};font-weight:700">${d.maxC != null ? Math.round(d.maxC) + '°' : '–'} / ${d.minC != null ? Math.round(d.minC) + '°' : '–'}</div></div>`).join('') + `</div>`;
      }
      const rest = ch - 30 - (w.days.length ? fh : 0);
      if (w.tempC == null && w.error) h += `<div style="position:absolute;bottom:0;height:${rest}px;display:flex;align-items:center;color:${P.Muted};font-size:${sp(16)}">${w.error}</div>`;
      else {
        const text = w.tempC != null ? Math.round(w.tempC) + ' °C' : '– °C';
        const isz = Math.min(rest * 0.8, cw * 0.3, 150);
        const px = Math.min(Math.max(16, Math.min(rest * 0.82, (cw - isz - 28) / (text.length * 0.58))), 130 * FS);
        h += `<div class="row" style="position:absolute;bottom:0;left:0;width:${cw}px;height:${rest}px;justify-content:center">${icon(wIcon(w.code, w.isDay), isz, wTint(w.code, w.isDay))}<div style="margin-left:28px;color:${P.Text};font-size:${px}px;font-weight:700;white-space:nowrap">${text}</div></div>`;
      }
      return h;
    });
  },
  MEDIA(c, W, H) {
    const m = mediaState();
    // Tlačítka se musí vejít vedle sebe: velké + 2 × malé (0,86) + 2 mezery 8 px v šířce bez okrajů (2 × 22 px).
    const inner = W - 44;
    const big = clamp(Math.min((H - 24) * 0.36, 76, (inner - 16) / 2.72), 32, 76), small = big * 0.86;
    const titleSp = clamp(Math.min((H - 24) * 0.13, 32), 16, 32);
    const bg = `linear-gradient(135deg,#3D8FC4,#7466A6,#B8735E,#1A1414)`;
    return `<div class="card clickable" data-act="media:open" style="left:0;top:0;width:${W}px;height:${H}px;border-radius:${LOOK.corner}px;background:${bg}">` +
      `<div class="fill" style="background:linear-gradient(transparent, rgba(0,0,0,.3))"></div>` +
      `<div class="col" style="position:absolute;inset:0;padding:12px 22px;align-items:center">` +
      `<div style="flex:1.1"></div><div class="row" style="max-width:100%">${icon('music_note', titleSp * 1.1, '#fff')}<div class="nowrap" style="color:#fff;font-size:${sp(titleSp)};font-weight:500">${esc(m.title)}</div></div>` +
      (m.artist ? `<div class="nowrap" style="max-width:100%;color:rgba(255,255,255,.8);font-size:${sp(titleSp * 0.65)}">${esc(m.artist)}</div>` : '') +
      `<div style="flex:.5"></div><div class="row" style="width:100%;justify-content:space-between">${roundBtn('skip_previous', small, false, 'media:prev')}${roundBtn(m.playing ? 'pause' : 'play_arrow', big, true, 'media:play')}${roundBtn('skip_next', small, false, 'media:next')}</div><div style="flex:.15"></div></div></div>`;
  },
  DOCK(c, W, H) {
    const shown = S.favorites.map(id => APPS.find(a => a.id === id)).filter(Boolean);
    return card(W, H, { pad: 8 }, (cw, ch) => {
      const slots = shown.length + 1, vertical = ch > cw * 1.4;
      const byMain = (vertical ? ch : cw) / slots, cross = vertical ? cw : ch;
      const sz = Math.min(byMain * 0.8, cross * 0.8, 84);
      let h = `<div class="${vertical ? 'col' : 'row'}" style="width:${cw}px;height:${ch}px;justify-content:space-evenly;align-items:center">`;
      if (!shown.length) h += `<div style="color:${P.Muted};font-size:${sp(15)};padding:0 8px">Dok je prázdný – klepni na tužku a vyber aplikace</div>`;
      for (const a of shown) h += `<div class="rbtn clickable" data-act="app:${a.id}" style="width:${sz}px;height:${sz}px;background:rgba(255,255,255,.92)">${appIcon(a, sz * 0.72)}</div>`;
      h += `<div class="rbtn clickable" data-act="dock:edit" style="width:${sz * 0.7}px;height:${sz * 0.7}px">${icon(shown.length ? 'edit' : 'add', sz * 0.28, P.Muted)}</div></div>`;
      return h;
    });
  },
  /* ---------- Telefon ---------- */
  PHONE_DIAL(c, W, H) {
    return card(W, H, { pad: 6 }, (cw, ch) => {
      const gap = 6, label = 40;
      const vertical = ch > cw * 1.8, horizontal = !vertical && cw > ch * 1.8;
      const ic = Math.max(24, vertical ? Math.min(cw * 0.72, (ch - gap * 5) / 6 - label - 4, 84) : horizontal ? Math.min((cw - gap * 5) / 6 * 0.85, ch - label - 4, 84) : Math.min((cw - gap * 2) / 3 * 0.8, (ch - gap) / 2 - label - 4, 84));
      const nameW = vertical ? cw : horizontal ? (cw - gap * 5) / 6 : (cw - gap * 2) / 3;
      const name = (t, col) => `<div style="height:${label}px;width:${nameW}px;display:flex;align-items:flex-end;justify-content:center"><div style="color:${col};font-size:${sp(16)};line-height:${sp(19)};text-align:center;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word">${esc(t)}</div></div>`;
      const item = i => {
        let h = `<div class="col" style="align-items:center;gap:4px">`;
        if (i < 5) {
          const k = S.quickDial[i];
          h += name(k ? k.name : 'Přidat', k ? P.Text : P.Muted);
          h += `<div class="rbtn clickable" data-act="dial:${i}" data-long="dialedit:${i}" style="width:${ic}px;height:${ic}px;background:${k ? '#10E01A' : tA(0.08)}">${k ? `<span style="color:#fff;font-size:${ic * 0.38 * FS}px;font-weight:700">${esc(initials(k.name))}</span>` : icon('add', ic * 0.45, P.Muted)}</div>`;
        } else {
          h += name('Kontakty', P.Text) + `<div class="rbtn clickable" data-act="contacts" style="width:${ic}px;height:${ic}px;background:#F1F3F6">${icon('contacts', ic * 0.5, '#1E88E5')}</div>`;
        }
        return h + `</div>`;
      };
      let h = '';
      if (vertical) h = `<div class="col" style="gap:${gap}px;align-items:center">${[0, 1, 2, 3, 4, 5].map(item).join('')}</div>`;
      else if (horizontal) h = `<div class="row" style="gap:${gap}px">${[0, 1, 2, 3, 4, 5].map(item).join('')}</div>`;
      else h = `<div class="col" style="gap:${gap}px;align-items:center"><div class="row" style="gap:${gap}px">${[0, 1, 2].map(item).join('')}</div><div class="row" style="gap:${gap}px">${[3, 4, 5].map(item).join('')}</div></div>`;
      return `<div class="fill" style="display:flex;align-items:center;justify-content:center">${h}</div>`;
    });
  }
};

/** Iniciály: „Honza Novák“ → „HN“. Emoji (např. ❤️) zůstane jako znak. */
function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map(p => Array.from(p)[0].toUpperCase()).join('') || '?';
}

function wIcon(code, day) {
  if (code === 0 || code === 1) return day ? 'wb_sunny' : 'nights_stay';
  if (code === 2) return 'wb_cloudy';
  if ([3, 45, 48].includes(code) || code == null) return 'cloud';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'ac_unit';
  if ([95, 96, 99].includes(code)) return 'bolt';
  return 'grain';
}
function wTint(code, day) {
  if (code === 0 || code === 1) return day ? '#FFD60A' : '#B0BEC5';
  if ([2, 3, 45, 48].includes(code) || code == null) return '#C9C3C4';
  if ([95, 96, 99].includes(code)) return '#FFB300';
  return '#4FC3F7';
}

/** Peugeot 407 SW shora se značkami dveří (CarParts.kt, poměr 0,68; obrázek 0,451). */
function carPicture(doors, maxW, maxH) {
  let h = maxH, w = h * 0.68;
  if (w > maxW) { w = maxW; h = w / 0.68; }
  const bw = Math.min(h * 0.451, w * 0.7), left = (w - bw) / 2;
  const red = P.Bad, outline = 'rgba(138,150,168,.7)';
  const doorW = w * 0.13, doorH = h * 0.2;
  let svg = '';
  if (doors.bonnet) svg += `<rect x="${left + bw * 0.1}" y="${h * 0.02}" width="${bw * 0.8}" height="${h * 0.2}" rx="14" fill="${red}" fill-opacity=".45"/>`;
  if (doors.tailgate) svg += `<rect x="${left + bw * 0.12}" y="${h * 0.8}" width="${bw * 0.76}" height="${h * 0.18}" rx="14" fill="${red}" fill-opacity=".45"/>`;
  const door = (open, x, y, bodyX) => {
    let s = '';
    if (open) s += `<rect x="${x}" y="${y}" width="${doorW}" height="${doorH}" rx="8" fill="${red}" fill-opacity=".75"/>`;
    s += `<rect x="${x + 1}" y="${y + 1}" width="${doorW - 2}" height="${doorH - 2}" rx="8" fill="none" stroke="${open ? red : outline}" stroke-width="2"/>`;
    if (open) s += `<rect x="${bodyX}" y="${y}" width="${bw * 0.3}" height="${doorH}" rx="8" fill="${red}" fill-opacity=".35"/>`;
    return s;
  };
  const rightBody = left + bw * 0.7;
  svg += door(doors.frontLeft, 0, h * 0.3, left) + door(doors.frontRight, w - doorW, h * 0.3, rightBody) + door(doors.rearLeft, 0, h * 0.55, left) + door(doors.rearRight, w - doorW, h * 0.55, rightBody);
  return `<div style="position:relative;width:${w}px;height:${h}px"><img src="assets/car_407sw.png" alt="" style="position:absolute;left:${left}px;top:0;width:${bw}px;height:${h}px;object-fit:contain"><svg style="position:absolute;inset:0" width="${w}" height="${h}">${svg}</svg></div>`;
}

/* ---------- Přetížení (senzor telefonu) ---------- */
const GF = { available: false, asked: false, lat: 0, lon: 0, peakSide: 0, peakBrake: 0, base: null };
function enableMotion() {
  GF.asked = true;
  const go = () => {
    window.addEventListener('devicemotion', e => {
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (!a || a.x == null) return;
      GF.available = true;
      const lat = (a.x || 0) / 9.81, lon = -(a.y || 0) / 9.81;
      if (!GF.base) GF.base = { lat, lon };
      GF.lat = lat - GF.base.lat; GF.lon = lon - GF.base.lon;
      GF.peakSide = Math.max(GF.peakSide, Math.abs(GF.lat)); if (GF.lon < 0) GF.peakBrake = Math.max(GF.peakBrake, -GF.lon);
    });
  };
  if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) DeviceMotionEvent.requestPermission().then(r => { if (r === 'granted') go(); scheduleRender(); }).catch(() => scheduleRender());
  else go();
}

/* ---------- Časomíra z GPS ---------- */
const Perf = { phase: 'WAITING', t50: null, t100: null, t400: null, start: 0, dist: 0, stillSince: 0,
  tick() {
    const s = GPS.speed || 0, now = Date.now();
    if (this.phase === 'WAITING') { if (s === 0) { if (!this.stillSince) this.stillSince = now; if (now - this.stillSince > 2000) this.phase = 'READY'; } else this.stillSince = 0; }
    else if (this.phase === 'READY') { if (s > 2) { this.phase = 'RUNNING'; this.start = now - 1000; this.dist = 0; } }
    else if (this.phase === 'RUNNING') {
      this.dist += s / 3.6; const el = (now - this.start) / 1000;
      if (this.t50 == null && s >= 50) this.t50 = el; if (this.t100 == null && s >= 100) this.t100 = el; if (this.t400 == null && this.dist >= 400) this.t400 = el;
      if ((this.t100 != null && this.t400 != null) || el > 60 || s === 0) this.phase = 'DONE';
    }
  },
  reset() { Object.assign(this, { phase: 'WAITING', t50: null, t100: null, t400: null, stillSince: 0 }); }
};

/* ---------- Povolená rychlost (Overpass) ---------- */
const SpeedLimit = { value: null, at: 0, lastPos: null,
  async refresh() {
    const f = GPS.fix;
    if (!f || Date.now() - this.at < 15000) return;
    if (this.lastPos && haversine(this.lastPos.lat, this.lastPos.lon, f.lat, f.lon) < 60) return;
    this.at = Date.now(); this.lastPos = { lat: f.lat, lon: f.lon };
    try {
      const q = `[out:json][timeout:8];way(around:25,${f.lat},${f.lon})[highway][maxspeed];out tags 1;`;
      const j = await (await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q))).json();
      const v = j.elements && j.elements[0] && parseInt(j.elements[0].tags.maxspeed, 10);
      this.value = isNaN(v) ? null : v;
    } catch (e) { /* bez limitu */ }
  }
};

/* ---------- Trasa (zjednodušeně: cíl z Nominatim, vzdálenost vzdušnou čarou × 1,3) ---------- */
const Route = { current: null };

/* ---------- Mapa z dlaždic ---------- */
const MapRender = {
  url(id, z, x, y) {
    const s = 'abcd'[(x + y) % 4];
    switch (id) {
      case 'carto_dark': return `https://${s}.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}@2x.png`;
      case 'carto_light': return `https://${s}.basemaps.cartocdn.com/light_all/${z}/${x}/${y}@2x.png`;
      case 'esri_street': return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`;
      case 'esri_sat': return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
      case 'osm': return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
      case 'otm': return `https://${'abc'[(x + y) % 3]}.tile.opentopomap.org/${z}/${x}/${y}.png`;
      default: return `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}@2x.png`;
    }
  },
  effective() {
    let id = LOOK.mapStyle;
    const src = MAP_SOURCES.find(m => m[0] === id);
    if (!src || src[3]) id = 'carto_voyager'; // Mapy.com a Google potřebují klíč – v sandboxu CARTO
    if (LOOK.darkMap && (id === 'carto_voyager' || id === 'carto_light')) return { id: 'carto_dark', filter: '' };
    const dark = id === 'carto_dark' || id === 'esri_sat';
    return { id, filter: LOOK.darkMap && !dark ? 'filter:invert(1) hue-rotate(180deg) brightness(.82);' : '' };
  },
  html(W, H, zoom) {
    const f = GPS.fix, lat = f ? f.lat : HK_LAT, lon = f ? f.lon : HK_LON;
    const ts = 256, world = ts * Math.pow(2, zoom);
    const mx = (lon + 180) / 360 * world;
    const r = lat * Math.PI / 180, my = (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * world;
    const ay = f ? H * 0.62 : H / 2;
    const left = mx - W / 2, top = my - ay;
    const src = this.effective();
    let h = `<div class="fill" style="${src.filter}">`;
    for (let tx = Math.floor(left / ts); tx <= Math.floor((left + W) / ts); tx++) for (let ty = Math.floor(top / ts); ty <= Math.floor((top + H) / ts); ty++) {
      h += `<img src="${this.url(src.id, zoom, tx, ty)}" style="position:absolute;left:${Math.round(tx * ts - left)}px;top:${Math.round(ty * ts - top)}px;width:${ts + 1}px;height:${ts + 1}px" alt="" draggable="false">`;
    }
    h += `</div>`;
    if (Route.current) {
      const rx = (Route.current.lon + 180) / 360 * world - left, rr = Route.current.lat * Math.PI / 180;
      const ry = (1 - Math.log(Math.tan(rr) + 1 / Math.cos(rr)) / Math.PI) / 2 * world - top;
      h += `<svg class="fill" width="${W}" height="${H}"><line x1="${W / 2}" y1="${ay}" x2="${rx}" y2="${ry}" stroke="${LOOK.accent}" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 10"/></svg>`;
    }
    const b = f && f.bearing != null ? f.bearing : 0;
    h += `<div style="position:absolute;left:${W / 2 - 18}px;top:${ay - 18}px;width:36px;height:36px;transform:rotate(${b}deg)"><svg width="36" height="36"><circle cx="18" cy="18" r="16" fill="${LOOK.accent}" stroke="#fff" stroke-width="3"/><path d="M18 7 L25 25 L18 21 L11 25Z" fill="#06121C"/></svg></div>`;
    h += `<div style="position:absolute;right:8px;bottom:6px;font-size:11px;color:${LOOK.darkMap ? '#cfd6df' : '#333'};opacity:.8">© OpenStreetMap © CARTO</div>`;
    return h;
  }
};

/* ---------- Aplikace (v sandboxu jen jako zástupci) ---------- */
const APPS = [
  { id: 'ytmusic', label: 'YouTube Music', color: '#FF0000', ic: 'play_circle' },
  { id: 'phone', label: 'Telefon', color: '#1E88E5', ic: 'call' },
  { id: 'mapy', label: 'Mapy.com', color: '#2E7D32', ic: 'map', text: 'M' },
  { id: 'gmaps', label: 'Mapy Google', color: '#34A853', ic: 'place' },
  { id: 'spotify', label: 'Spotify', color: '#1DB954', ic: 'graphic_eq' },
  { id: 'waze', label: 'Waze', color: '#33CCFF', ic: 'navigation' },
  { id: 'radio', label: 'Rádio', color: '#1565C0', ic: 'radio' },
  { id: 'bt', label: 'Bluetooth hudba', color: '#3949AB', ic: 'headset' },
  { id: 'settings', label: 'Nastavení', color: '#607D8B', ic: 'settings' },
  { id: 'chrome', label: 'Chrome', color: '#4285F4', ic: 'public' },
  { id: 'files', label: 'Soubory', color: '#FB8C00', ic: 'folder' },
  { id: 'carsettings', label: 'Nastavení vozu', color: '#E65100', ic: 'directions_car' }
];
function appIcon(a, size) {
  if (a.text) return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${a.color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${size * 0.6}px">${a.text}</div>`;
  return icon(a.ic, size, a.color);
}

function mediaState() {
  const mode = S.prefs.dataMode;
  if (mode === 'off' && !Media.forced) return { title: 'Nic nehraje', artist: '', playing: false };
  const t = DEMO_TRACKS[Media.idx % DEMO_TRACKS.length];
  return { title: t[0], artist: t[1], playing: Media.playing };
}

/* ---------- Servisní knížka (zjednodušená) ---------- */
const SERVICE_KINDS = [['oil', 'Olej a olejový filtr', 15000, 365], ['air', 'Vzduchový filtr', 30000, 730], ['fuelf', 'Palivový filtr', 60000, 1460], ['cabin', 'Kabinový filtr', 15000, 365], ['brakes', 'Brzdová kapalina', null, 730], ['stk', 'STK', null, 730]];
const Service = {
  currentKm() {
    const fuel = S.fuel.map(f => f.odometer || 0), sv = S.service.map(s => s.km || 0);
    return Math.max(0, ...fuel, ...sv, S.odometer || 0) || null;
  },
  mostUrgent() {
    if (!S.service.length) return null;
    const km = this.currentKm(), now = Date.now();
    let best = null;
    for (const [id, label, everyKm, everyDays] of SERVICE_KINDS) {
      const last = S.service.filter(s => s.kind === id).sort((a, b) => b.date - a.date)[0];
      if (!last) continue;
      const remKm = everyKm && km != null ? last.km + everyKm - km : null;
      const remDays = everyDays ? Math.round((last.date + everyDays * 86400000 - now) / 86400000) : null;
      const score = Math.min(remKm != null ? remKm / 50 : 9e9, remDays != null ? remDays : 9e9);
      if (!best || score < best.score) best = { score, label, remKm, remDays };
    }
    if (!best) return null;
    const level = best.score < 0 ? 'Po termínu' : best.score < 30 ? 'Brzy' : 'V pořádku';
    const color = best.score < 0 ? P.Bad : best.score < 30 ? P.Amber : P.Good;
    const line = [best.remKm != null ? (best.remKm >= 0 ? 'zbývá ' + best.remKm.toLocaleString('cs') + ' km' : 'o ' + (-best.remKm).toLocaleString('cs') + ' km přes') : null, best.remDays != null ? (best.remDays >= 0 ? 'za ' + best.remDays + ' dní' : 'o ' + (-best.remDays) + ' dní přes') : null].filter(Boolean).join('<br>');
    return { label: best.label, level, color, line };
  }
};
