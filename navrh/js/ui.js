'use strict';
/* Vykreslení obrazovky rádia: lišty jednotky, plochy v kříži, Menu, režim úprav, dialogy. */

const $radio = () => document.getElementById('radio');
let renderQueued = false;
function scheduleRender() { if (!renderQueued) { renderQueued = true; requestAnimationFrame(() => { renderQueued = false; render(); }); } }

const EDITBAR_H = 117; // lišta úprav je v rádiu pod plochou (Column), plocha se o ni zmenší
function areaBox() {
  const bars = S.prefs.showBars;
  const h = bars ? SCREEN_H - TOP_BAR - BOTTOM_BAR : SCREEN_H;
  const eb = U.editing && U.slot !== 'MENU' ? EDITBAR_H : 0;
  return { top: bars ? TOP_BAR : 0, h, pageH: h - eb };
}
let lastPageH = null, rowsTimer = null;

function buildSkeleton() {
  $radio().innerHTML = `<div id="topbar"></div><div id="area"><div class="bg"></div><div class="pagewrap"></div><div id="hint" class="hint" style="opacity:0"></div><div id="editbarHost"></div><div id="panelHost"></div></div><div id="bottombar"></div><div id="dialogHost"></div>`;
}

/* ---------- Lišty jednotky (statická kopie toho, co kreslí rádio) ---------- */
function renderBars() {
  const tb = document.getElementById('topbar'), bb = document.getElementById('bottombar');
  const show = S.prefs.showBars;
  tb.style.display = bb.style.display = show ? '' : 'none';
  if (!show) return;
  const now = new Date();
  const v = CAR.volts != null ? decimal(CAR.volts) : '12,7';
  tb.innerHTML = `<div class="status"><span class="mi">battery_charging_full</span><span>${v}V</span><span class="mi">volume_up</span><span style="margin-left:-10px">2</span><span>${timeText(now, false)}</span>` +
    `<div class="r"><span class="mi">bluetooth</span><span style="font-size:13px;line-height:12px;text-align:center">4G<br>⇅</span><span class="mi">signal_cellular_alt</span><span class="mi">battery_full</span><span class="mi">sd_storage</span></div></div>` +
    `<div class="apps">` + [['filter_vintage', '#F4511E'], ['navigation', '#1E7BE0'], ['school', '#F57C00'], ['music_note', '#E53935'], ['headset', '#3F51B5'], ['radio', '#1976D2'], ['power_settings_new', '#43A047'], ['filter_none', '#1E88E5']]
      .map(([ic, col], i) => `<div class="app" data-act="unitapp:${i}"><span class="mi" style="color:${col}">${ic}</span></div>`).join('') + `</div>`;
  if (!bb.dataset.ok) {
    bb.dataset.ok = 1;
    bb.innerHTML = `<div class="side" style="left:0" ><span class="mi" data-act="home">home</span><span class="mi" data-act="back">undo</span></div>` +
      `<div class="temp" style="left:110px"><div class="tri up"></div><div class="tbox">24.0°C</div><div class="tri down"></div></div>` +
      `<div class="lbl" style="left:200px">OFF</div>` +
      `<div class="fan"><span class="mi">air</span><div class="ticks"><i></i><i></i><i></i><i></i><i></i><i class="off"></i><i class="off"></i></div><span class="mi" style="font-size:40px">air</span></div>` +
      `<div class="lbl" style="left:524px">A/C</div>` +
      `<div class="temp" style="left:590px"><div class="tri up"></div><div class="tbox">21.0°C</div><div class="tri down"></div></div>` +
      `<div class="side" style="right:0;width:84px"><span class="mi">volume_up</span><span class="mi">volume_down</span></div>` +
      `<div class="tab">▲</div>` +
      `<div class="row2"><span class="mi">sync</span><span>DUAL</span><span class="mi">wb_iridescent</span><span class="mi">airline_seat_recline_normal</span></div>`;
  }
}

/* ---------- Kříž ploch ---------- */
function crossHtml(current, cell, act) {
  const gap = cell * 0.25;
  let h = `<div class="cross${act ? ' clickable' : ''}" ${act ? `data-act="${act}"` : ''} style="gap:${gap}px;${act ? 'padding:4px;' : ''}">`;
  for (let row = -1; row <= 2; row++) {
    h += `<div class="r" style="gap:${gap}px">`;
    for (let col = -1; col <= 1; col++) {
      const s = slotAt(col, row), page = s && S.pages.find(p => p.slot === s), rr = cell * 0.28;
      let st = `width:${cell}px;height:${cell}px;border-radius:${rr}px;`;
      if (!s) st += '';
      else if (s === current) st += `background:${LOOK.accent};`;
      else if (s === 'MENU') st += `border-radius:50%;border:1.5px solid ${rgba(LOOK.accentC, .8)};`;
      else if (page && page.enabled) st += `border:1.5px solid rgba(255,255,255,.7);`;
      else st += `border:1px solid rgba(255,255,255,.18);`;
      h += `<b style="${st}"></b>`;
    }
    h += `</div>`;
  }
  return h + `</div>`;
}

/* ---------- Hlavní vykreslení ---------- */
let anim = null; // probíhající přechod mezi plochami
function render() {
  computeLook();
  const r = $radio();
  r.style.fontFamily = fontCss(S.appearance.font).split(';')[0];
  r.style.fontWeight = S.appearance.font === 'light' ? 300 : S.appearance.font === 'medium' ? 500 : '';
  renderBars();
  const ab = areaBox();
  const area = document.getElementById('area');
  area.style.top = ab.top + 'px'; area.style.height = ab.h + 'px';
  area.querySelector('.bg').style.background = backgroundCss(LOOK.background, LOOK.light);
  area.style.color = P.Text;
  if (ab.pageH !== lastPageH) {
    // PageGrid v rádiu: po 1,5 s ustálené velikosti se počet řádků dopočítá podle tvaru plochy.
    lastPageH = ab.pageH; clearTimeout(rowsTimer); rowsTimer = setTimeout(checkRows, 1500);
  }
  area.querySelector('.pagewrap').style.height = ab.pageH + 'px';
  area.querySelector('.pagewrap').style.bottom = 'auto';
  if (!drag && !anim) {
    const wrap = area.querySelector('.pagewrap');
    const html = `<div class="page">${pageHtml(U.slot, ab)}</div>`;
    if (html !== wrap._last || !wrap.firstChild) { wrap.innerHTML = html; wrap._last = html; }
  }
  document.getElementById('editbarHost').innerHTML = U.editing && U.slot !== 'MENU' ? editBarHtml() : '';
  renderHint();
  renderPanel();
  renderDialog();
  renderSandboxBar();
}

function pageHtml(slot, ab) {
  if (slot === 'MENU') return menuHtml(ab);
  const page = Layout.page(slot) || S.pages[0];
  const g = LOOK.gap / 2;
  const W = SCREEN_W - 2 * g, H = ab.pageH - 2 * g;
  const cw = W / COLS, ch = H / S.rows;
  let h = `<div class="grid" data-grid="1" style="left:${g}px;top:${g}px;width:${W}px;height:${H}px">`;
  if (U.editing && U.showGrid) {
    let lines = '';
    for (let i = 0; i <= COLS; i++) lines += `<line x1="${i * cw}" y1="0" x2="${i * cw}" y2="${H}" stroke="rgba(255,255,255,${i % 3 === 0 ? .13 : .05})" stroke-width="1.2"/>`;
    for (let j = 0; j <= S.rows; j++) lines += `<line x1="0" y1="${j * ch}" x2="${W}" y2="${j * ch}" stroke="rgba(255,255,255,${j % 3 === 0 ? .13 : .05})" stroke-width="1"/>`;
    h += `<svg class="fill" width="${W}" height="${H}" data-act="deselect">${lines}</svg>`;
  }
  if (!page.cells.length) {
    h += `<div class="col" style="position:absolute;inset:0;align-items:center;justify-content:center;padding:24px;pointer-events:none"><div style="color:${P.Text};font-size:${20 * LOOK.textScale}px;font-weight:500">Plocha „${esc(page.name)}“ je prázdná</div><div style="color:${P.Muted};font-size:${15 * LOOK.textScale}px">${U.editing ? 'Klepni na + a přidej widget' : 'V Menu klepni na Rozložení a přidej widgety'}</div></div>`;
  }
  for (const c of page.cells) h += cellHtml(c, cw, ch);
  return h + `</div>`;
}

function cellHtml(c, cw, ch) {
  if (!WT[c.type]) return '';
  const g = LOOK.gap / 2;
  const W = c.w * cw - 2 * g, H = c.h * ch - 2 * g;
  FS = LOOK.textScale * (c.scale || 1);
  let inner = '';
  try { inner = W_RENDER[c.type](c, W, H, U.editing); } catch (e) { inner = `<div style="color:red;font-size:12px">${esc(e.message)}</div>`; console.error(e); }
  const sel = U.editing && U.selected === c.id;
  let h = `<div class="cell" data-cell="${c.id}" style="left:${c.x * cw}px;top:${c.y * ch}px;width:${c.w * cw}px;height:${c.h * ch}px;padding:${g}px;z-index:${sel ? 1 : 0}"><div style="position:relative;width:${W}px;height:${H}px">${inner}`;
  if (U.editing) {
    h += `<div class="editov" data-edit="${c.id}" style="border-radius:${LOOK.corner}px;background:rgba(0,0,0,${sel ? .05 : .22});box-shadow:inset 0 0 0 ${sel ? 3 : 1}px ${sel ? LOOK.accent : 'rgba(255,255,255,.35)'}"></div>`;
    if (sel) h += `<div class="seltag" style="background:${rgba(LOOK.accentC, .85)}">${esc(wt.title(c.type))}</div><div class="handle" data-resize="${c.id}" style="background:${LOOK.accent}"><span class="mi" style="font-size:22px">open_in_full</span></div>`;
  }
  return h + `</div></div>`;
}

function renderHint() {
  const el = document.getElementById('hint');
  if (U.editing || Date.now() > U.hintUntil) { el.style.opacity = 0; return; }
  const name = U.slot === 'MENU' ? 'Menu' : (Layout.page(U.slot) || {}).name || '';
  el.innerHTML = crossHtml(U.slot, 8) + `<span>${esc(name)}</span>`;
  el.style.opacity = 1;
}

/* ---------- Menu (MenuPage.kt) ---------- */
const MENU_ITEMS = [['apps', 'Aplikace', 'APPS'], ['auto_awesome', 'Vzhled', 'APPEARANCE'], ['settings', 'Nastavení', 'SETTINGS'], ['search', 'Kam jedeme?', 'DESTINATION'], ['local_gas_station', 'Tankování', 'FUEL'], ['menu_book', 'Kniha jízd', 'LOGBOOK'], ['directions_car', 'Auto a signály', 'CAR'], ['build', 'Servisní knížka', 'SERVICE'], ['tune', 'Zvuk, volant, klima', 'CARAPPS'], ['bluetooth', 'OBD adaptér', 'OBD'], ['grid_view', 'Plochy', 'PAGES']];
function menuHtml(ab) {
  const r = Math.min(LOOK.corner, 28), now = new Date(), ts = LOOK.textScale;
  const f = v => (v * ts) + 'px';
  let h = `<div class="col" style="position:absolute;inset:0;padding:10px 12px;gap:10px">`;
  h += `<div class="row" style="border-radius:${r}px;background:${LOOK.card};padding:12px 18px"><div class="col" style="flex:1"><div style="color:${LOOK.accent};font-size:${f(15)};font-weight:700;letter-spacing:1.5px">Menu</div><div style="color:${P.Text};font-size:${f(34)};font-weight:700">${timeText(now, false)}</div><div style="color:${P.Muted};font-size:${f(15)}">${dateText(now)}</div></div>` +
    `<div class="row clickable" data-act="panel:CAR" style="border-radius:999px;border:1px solid ${CAR.linked ? P.Good : tA(.25)};padding:8px 14px"><div style="width:9px;height:9px;border-radius:50%;background:${CAR.linked ? P.Good : P.Muted};margin-right:8px"></div><span style="color:${P.Text};font-size:${f(15)};font-weight:500">${CAR.linked ? 'AUTO spojeno' : 'AUTO nespojeno'}</span></div></div>`;
  h += `<div style="border-radius:${r}px;background:${LOOK.card};padding:14px"><div class="row">${icon('dashboard', 24, LOOK.accent)}<span style="margin-left:8px;color:${P.Text};font-size:${f(17)};font-weight:500">Rozložení – kterou plochu upravit?</span></div><div class="hscroll" style="margin-top:8px">` +
    S.pages.filter(p => p.enabled).map(p => `<div class="pill clickable" data-act="editpage:${p.slot}" style="background:${tA(.12)};color:${P.Text};font-size:${f(16)};padding:10px 16px">${esc(p.name)}</div>`).join('') + `</div></div>`;
  h += `<div class="col" style="flex:1;gap:10px;min-height:0">`;
  for (let i = 0; i < MENU_ITEMS.length; i += 3) {
    h += `<div class="row" style="flex:1;gap:10px;align-items:stretch;min-height:0">`;
    for (let j = i; j < i + 3; j++) {
      const it = MENU_ITEMS[j];
      if (!it) { h += `<div style="flex:1"></div>`; continue; }
      h += `<div class="col clickable" data-act="panel:${it[2]}" style="flex:1;border-radius:${r}px;background:${LOOK.card};padding:8px;align-items:center;justify-content:center">${icon(it[0], 38, LOOK.accent)}<div style="margin-top:8px;color:${P.Text};font-size:${f(16)};font-weight:500;text-align:center">${it[1]}</div></div>`;
    }
    h += `</div>`;
  }
  h += `</div><div style="color:${P.Muted};font-size:${f(13)};text-align:center">Zpět na plochy: táhni prstem dolů, nebo stiskni Domů.</div></div>`;
  return h;
}

/* ---------- Lišta úprav (EditBar) ---------- */
function editBarHtml() {
  const page = Layout.page(U.slot);
  const sel = page.cells.find(c => c.id === U.selected);
  const b = (ic, act) => `<div class="ebtn clickable" data-act="${act}">${icon(ic, 26, P.Text)}</div>`;
  return `<div class="editbar" style="border-radius:${Math.min(LOOK.corner, 30)}px;background:${LOOK.cardHigh}">` +
    `<div class="r1"><div style="width:8px;height:8px;border-radius:50%;background:${LOOK.accent};margin-right:8px"></div><div class="clickable" data-act="rename" style="color:${P.Text};font-size:17px;font-weight:500;padding:4px">Upravuji: ${esc(page.name)}</div>${icon('edit', 20, P.Muted, 'cursor:pointer')}<div style="flex:1"></div><div class="nowrap" style="color:${P.Muted};font-size:14px">${sel ? 'Táhni widget, roh mění velikost' : 'Klepni na widget'}</div><div style="width:8px"></div>${crossHtml(U.slot, 9, 'panel:PAGES')}</div>` +
    `<div class="r2">${b('add', 'picker')}${b('undo', 'undo')}${b('grid_on', 'togglegrid')}${b('text_fields', 'textsize')}${b('delete', 'delete')}${b('content_copy', 'copy')}<div style="flex:1"></div><div class="done clickable" data-act="done" style="background:${LOOK.accent}">${icon('check', 22, '#06121C')} Hotovo</div></div></div>`;
}

/* ---------- Toast a dialogy ---------- */
let toastTimer = null;
function toast(text) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; $radio().appendChild(el); }
  el.textContent = text; el.style.opacity = 1;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.style.opacity = 0, 2200);
}
/** Dialog jako AlertDialog v rádiu. buttons: [[text, act, filled]] */
function dialog(title, body, buttons) { U.dialog = { title, body, buttons }; scheduleRender(); }
function closeDialog() { U.dialog = null; scheduleRender(); }
function renderDialog() {
  const host = document.getElementById('dialogHost');
  const d = U.dialog;
  if (!d) { host.innerHTML = ''; return; }
  if (host.dataset.key === d.title + d.body && host.innerHTML) return; // nepřekreslovat (pole formuláře)
  host.dataset.key = d.title + d.body;
  host.innerHTML = `<div class="scrim" data-act="dialog:dismiss"><div class="dialog" data-stop="1" style="background:${LOOK.light ? '#EEF1F6' : '#1D2633'};color:${P.Text}"><h2>${d.title}</h2><div class="dt" style="color:${P.Muted}">${d.body}</div><div class="da">` +
    d.buttons.map(([t, a, filled]) => filled ? `<div class="fbtn clickable" data-act="${a}" style="background:${LOOK.accent}">${t}</div>` : `<div class="tbtn clickable" data-act="${a}" style="color:${LOOK.accent}">${t}</div>`).join('') + `</div></div></div>`;
}

/* ---------- Přechody mezi plochami ---------- */
function goSlot(target) {
  const from = U.slot;
  if (target === from) return;
  U.selected = null;
  U.slot = target;
  U.hintUntil = Date.now() + 2500;
  setTimeout(scheduleRender, 2600);
  if (!LOOK.animations) { render(); return; }
  const ab = areaBox();
  const wrap = document.querySelector('#area .pagewrap');
  const old = wrap.querySelector('.page');
  const dx = SLOTS[target].dx - SLOTS[from].dx, dy = SLOTS[target].dy - SLOTS[from].dy;
  const nw = document.createElement('div');
  nw.className = 'page';
  nw.innerHTML = pageHtml(target, ab);
  const tr = dx !== 0 ? (k => `translateX(${k * 100}%)`) : (k => `translateY(${k * 100}%)`);
  const sgn = dx !== 0 ? Math.sign(dx) : Math.sign(dy);
  nw.style.transform = tr(sgn); nw.style.opacity = 0;
  wrap.appendChild(nw);
  anim = true;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const t = 'transform 320ms ease, opacity 320ms ease';
    nw.style.transition = t; if (old) old.style.transition = t;
    nw.style.transform = 'none'; nw.style.opacity = 1;
    if (old) { old.style.transform = tr(-sgn); old.style.opacity = 0; }
  }));
  setTimeout(() => { anim = null; if (old) old.remove(); wrap._last = null; render(); }, 340);
  renderHint();
}
function go(dx, dy) {
  let x = SLOTS[U.slot].dx, y = SLOTS[U.slot].dy;
  for (let i = 0; i < 3; i++) {
    x += dx; y += dy;
    const t = slotAt(x, y);
    if (!t) return;
    if (t === 'MENU' || (S.pages.find(p => p.slot === t) || {}).enabled) { goSlot(t); return; }
  }
}
function home() { U.panel = null; U.editing = false; U.selected = null; U.dialog = null; goSlot('CENTER'); render(); }

/* ---------- Ovládání dotykem ---------- */
let drag = null, press = null, suppressClick = false;
function scaleNow() { return document.getElementById('radio').getBoundingClientRect().width / SCREEN_W; }

function setupInput() {
  const r = $radio();
  r.addEventListener('pointerdown', e => {
    if (e.target.closest('input,textarea,select')) return;
    const sc = scaleNow();
    const ed = e.target.closest('[data-edit]'), rs = e.target.closest('[data-resize]');
    if (U.editing && !U.panel && (ed || rs)) {
      const id = (rs || ed).dataset.resize || ed.dataset.edit;
      U.selected = id;
      const cellEl = r.querySelector(`[data-cell="${id}"]`);
      drag = { id, mode: rs ? 'resize' : 'move', x0: e.clientX, y0: e.clientY, sc, el: cellEl, moved: false };
      render();
      drag.el = r.querySelector(`[data-cell="${id}"]`);
      e.preventDefault();
      return;
    }
    press = { x0: e.clientX, y0: e.clientY, sc, t: Date.now(), target: e.target, moved: false, swipe: !U.editing && !U.panel && !U.dialog && !!e.target.closest('#area') };
    const lt = e.target.closest('[data-long]');
    if (lt && !U.editing) press.long = setTimeout(() => { if (press && !press.moved) { press.fired = true; act(lt.dataset.long); } }, 600);
  });
  window.addEventListener('pointermove', e => {
    if (drag) {
      const dx = (e.clientX - drag.x0) / drag.sc, dy = (e.clientY - drag.y0) / drag.sc;
      drag.dx = dx; drag.dy = dy; drag.moved = drag.moved || Math.hypot(dx, dy) > 4;
      if (drag.el) {
        if (drag.mode === 'move') { drag.el.style.transform = `translate(${dx}px,${dy}px)`; drag.el.style.zIndex = 2; }
        else { const c = cellOf(drag.id); const g = gridMetrics(); drag.el.style.width = Math.max(g.cw * .8, c.w * g.cw + dx) + 'px'; drag.el.style.height = Math.max(g.ch * .8, c.h * g.ch + dy) + 'px'; drag.el.style.zIndex = 2; }
      }
      return;
    }
    if (press) {
      const dx = (e.clientX - press.x0) / press.sc, dy = (e.clientY - press.y0) / press.sc;
      if (Math.hypot(dx, dy) > 12) { press.moved = true; clearTimeout(press.long); }
      press.dx = dx; press.dy = dy;
    }
  });
  window.addEventListener('pointerup', e => {
    if (drag) {
      const d = drag; drag = null;
      if (d.moved) {
        const c = cellOf(d.id), g = gridMetrics(), page = Layout.page(U.slot);
        let next;
        if (d.mode === 'move') next = Object.assign({}, c, { x: clamp(Math.round((c.x * g.cw + d.dx) / g.cw), 0, COLS - c.w), y: clamp(Math.round((c.y * g.ch + d.dy) / g.ch), 0, S.rows - c.h) });
        else next = Object.assign({}, c, { w: clamp(Math.round((c.w * g.cw + d.dx) / g.cw), wt.minW(c.type), COLS - c.x), h: clamp(Math.round((c.h * g.ch + d.dy) / g.ch), wt.minH(c.type), S.rows - c.y) });
        if (JSON.stringify(next) !== JSON.stringify(c) && Layout.fits(page.cells, next)) {
          U.undo.push([U.slot, page.cells]);
          Layout.setCells(U.slot, page.cells.map(x => x.id === next.id ? next : x));
        }
      }
      suppressClick = true; setTimeout(() => suppressClick = false, 50);
      document.querySelector('#area .pagewrap')._last = null;
      render();
      return;
    }
    if (press) {
      const p = press; press = null;
      clearTimeout(p.long);
      if (p.fired) { suppressClick = true; setTimeout(() => suppressClick = false, 50); return; }
      if (p.moved) {
        suppressClick = true; setTimeout(() => suppressClick = false, 50);
        if (p.swipe && !p.target.closest('.hscroll,.pbody')) {
          const lim = 90;
          if (Math.abs(p.dx) > Math.abs(p.dy) && Math.abs(p.dx) > lim) go(p.dx < 0 ? 1 : -1, 0);
          else if (Math.abs(p.dy) > lim) go(0, p.dy < 0 ? 1 : -1);
        }
      }
    }
  });
  r.addEventListener('click', e => {
    if (suppressClick) { e.stopPropagation(); return; }
    const stop = e.target.closest('[data-stop]');
    const a = e.target.closest('[data-act]');
    if (!a) { if (U.editing && !stop) { U.selected = null; render(); } return; }
    if (stop && !stop.contains(a)) return;
    if (a.dataset.act === 'dialog:dismiss' && e.target !== a) return;
    act(a.dataset.act, a, e);
  });
  r.addEventListener('input', e => onInput(e));
  r.addEventListener('change', e => onInput(e, true));
}
function gridMetrics() { const ab = areaBox(), g = LOOK.gap / 2; return { cw: (SCREEN_W - 2 * g) / COLS, ch: (ab.pageH - 2 * g) / S.rows }; }
function cellOf(id) { return Layout.page(U.slot).cells.find(c => c.id === id); }

/** Přidání widgetu (Panels.kt › addWidget): když se nevejde, zmenšuje se až na minimum. */
function addWidget(type) {
  const page = Layout.page(U.slot === 'MENU' ? 'CENTER' : U.slot);
  if (U.slot === 'MENU') U.slot = 'CENTER';
  let w = wt.w(type), h = wt.h(type), spot = Layout.findSpace(page.cells, w, h);
  while (!spot && (w > wt.minW(type) || h > wt.minH(type))) { if (h > wt.minH(type)) h--; else w--; spot = Layout.findSpace(page.cells, w, h); }
  if (!spot) { toast(`Na ploše „${page.name}“ není místo. Zmenši nebo smaž jiný widget.`); return; }
  const cell = { id: newId(), type, x: spot[0], y: spot[1], w, h, scale: 1 };
  U.undo.push([page.slot, page.cells]);
  Layout.setCells(page.slot, page.cells.concat([cell]));
  U.editing = true; U.selected = cell.id; U.panel = null;
  toast(`${wt.title(type)} přidán na plochu ${page.name}`);
  render();
}
