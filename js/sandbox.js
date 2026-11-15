'use strict';
/* Funkce sandboxu mimo obrazovku rádia: měřítko, odeslání změn Claudovi, aktualizace, start. */

/* ---------- Měřítko: obrazovka 768 × 1024 se vejde do telefonu / iPadu ---------- */
function layoutStage() {
  const st = document.getElementById('stage'), wrap = document.getElementById('radioWrap'), r = $radio(), bar = document.getElementById('sbx');
  const vw = window.innerWidth, vh = window.innerHeight;
  const landscape = vw > vh * 1.05;
  st.className = landscape ? 'landscape' : 'portrait';
  const cs = getComputedStyle(st);
  const padV = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom), padH = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  let sc;
  if (landscape) sc = Math.min((vh - padV - 8) / SCREEN_H, (vw - padH - 230) / SCREEN_W);
  else { const barH = Math.max(bar.offsetHeight, 96); sc = Math.min((vw - padH - 8) / SCREEN_W, (vh - padV - barH - 20) / SCREEN_H); }
  sc = Math.max(0.2, sc);
  wrap.style.width = SCREEN_W * sc + 'px'; wrap.style.height = SCREEN_H * sc + 'px';
  r.style.transform = `scale(${sc})`;
  if (!landscape) wrap.style.marginTop = '6px'; else wrap.style.marginTop = '0';
}

/* ---------- Seznam změn proti stavu rádia ---------- */
const APPEAR_LABELS = { accent: 'Barva zvýraznění', background: 'Pozadí', cardAlpha: 'Průhlednost karet', corner: 'Zaoblení rohů', gap: 'Mezery mezi widgety', border: 'Rámeček karet', textScale: 'Velikost písma', animations: 'Animace', titles: 'Nadpisy widgetů', darkMap: 'Tmavá mapa', mapStyle: 'Styl mapy', seconds: 'Sekundy v hodinách', cardTint: 'Podbarvené karty', theme: 'Motiv', font: 'Písmo', intro: 'Úvodní animace', introStyle: 'Styl úvodu', introSeconds: 'Délka úvodu' };
function fmtAp(k, v) {
  if (k === 'accent') return '#' + (Number(v) & 0xffffff).toString(16).toUpperCase().padStart(6, '0');
  if (k === 'background') return BACKGROUND_NAMES[v] || v;
  if (k === 'cardAlpha' || k === 'textScale') return Math.round(v * 100) + ' %';
  if (typeof v === 'boolean') return v ? 'zapnuto' : 'vypnuto';
  return String(v);
}
function cellText(c) { return `${wt.title(c.type)} (${c.type}) – sloupec ${c.x}, řádek ${c.y}, ${c.w} × ${c.h}${c.scale && c.scale !== 1 ? ', text ' + Math.round(c.scale * 100) + ' %' : ''}`; }
/** Strukturované změny proti stavu rádia: každá má klíč, text a možnost vrátit ji v sandboxu. */
function computeChangeItems() {
  const out = [];
  const b = S.baseline;
  if (!b) return out;
  const base = Layout.fromBaseline(b);
  for (const p of S.pages) {
    const bp = base.find(x => x.slot === p.slot);
    if (!bp) continue;
    const tag = `Plocha „${p.name}“ (${SLOTS[p.slot].where})`;
    const slot = p.slot;
    if (p.name !== bp.name) out.push({ key: `page:${slot}:name`, text: `${tag}: přejmenována z „${bp.name}“`, revert: () => Layout.rename(slot, bp.name) });
    if (p.enabled !== bp.enabled) out.push({ key: `page:${slot}:enabled`, text: `${tag}: ${p.enabled ? 'zapnuta' : 'vypnuta'}`, revert: () => Layout.setEnabled(slot, bp.enabled) });
    for (const c of p.cells) {
      const o = bp.cells.find(x => x.id === c.id);
      if (!o) {
        out.push({ key: `cell:${slot}:${c.id}:add`, text: `${tag}: přidán widget ${cellText(c)}`, revert: () => Layout.setCells(slot, Layout.page(slot).cells.filter(x => x.id !== c.id)) });
        continue;
      }
      const ch = [];
      if (o.x !== c.x || o.y !== c.y) ch.push(`posun z ${o.x},${o.y} na ${c.x},${c.y}`);
      if (o.w !== c.w || o.h !== c.h) ch.push(`velikost z ${o.w} × ${o.h} na ${c.w} × ${c.h}`);
      if ((o.scale || 1) !== (c.scale || 1)) ch.push(`text z ${Math.round((o.scale || 1) * 100)} % na ${Math.round((c.scale || 1) * 100)} %`);
      if (ch.length) out.push({
        key: `cell:${slot}:${c.id}:edit`, text: `${tag}: ${wt.title(c.type)} – ${ch.join(', ')}`,
        revert: () => {
          const cells = Layout.page(slot).cells, back = Object.assign({}, c, { x: o.x, y: o.y, w: o.w, h: o.h, scale: o.scale || 1 });
          if (!Layout.fits(cells, back)) return `${wt.title(c.type)} nejde vrátit – původní místo zabírá jiný widget. Nejdřív vrať ten.`;
          Layout.setCells(slot, cells.map(x => x.id === c.id ? back : x));
        }
      });
    }
    for (const o of bp.cells) if (!p.cells.find(x => x.id === o.id)) out.push({
      key: `cell:${slot}:${o.id}:del`, text: `${tag}: odebrán widget ${cellText(o)}`,
      revert: () => {
        const cells = Layout.page(slot).cells;
        if (!Layout.fits(cells, o)) return `${wt.title(o.type)} nejde vrátit – na jeho místě je teď jiný widget. Nejdřív ho posuň nebo vrať.`;
        Layout.setCells(slot, cells.concat([Object.assign({}, o)]));
      }
    });
  }
  const ba = Object.assign({}, DEFAULT_APPEARANCE, b.appearance);
  for (const k of Object.keys(APPEAR_LABELS)) if (JSON.stringify(ba[k]) !== JSON.stringify(S.appearance[k])) out.push({ key: `ap:${k}`, text: `Vzhled › ${APPEAR_LABELS[k]}: ${fmtAp(k, ba[k])} → ${fmtAp(k, S.appearance[k])}`, revert: () => { S.appearance[k] = ba[k]; save(); } });
  return out;
}
function computeChanges() { return computeChangeItems().map(i => i.text); }

/* Rozpracované odeslání: co je vyřazené, odebrané, upravené a vlastní řádky (uloží se v telefonu). */
function draft() {
  if (!S.sendDraft) S.sendDraft = { excluded: {}, removed: {}, edits: {}, custom: [], note: '' };
  return S.sendDraft;
}
/** Položky, které se opravdu pošlou (zaškrtnuté, neodebrané, s upraveným textem) + vlastní řádky. */
function sendLines() {
  const d = draft();
  const lines = computeChangeItems().filter(i => !d.removed[i.key] && !d.excluded[i.key]).map(i => (d.edits[i.key] || i.text).trim()).filter(Boolean);
  return lines.concat(d.custom.map(t => t.trim()).filter(Boolean));
}
function changePackage() {
  const d = draft(), note = (d.note || '').trim();
  const lines = sendLines();
  const pkg = { sandbox: APP_VERSION, radioVersion: S.baseline ? S.baseline.radioVersion : null, sent: new Date().toISOString(), grid: { cols: COLS, rows: S.rows, area: [SCREEN_W, areaBox().h] }, onlyListed: true, appearance: S.appearance, pages: S.pages.map(p => ({ slot: p.slot, name: p.name, enabled: p.enabled, cells: p.cells.map(c => ({ id: c.id, type: c.type, x: c.x, y: c.y, w: c.w, h: c.h, scale: c.scale || 1 })) })) };
  const body = `## Změny ze sandboxu Dash 407\n\n${note ? '**Poznámka:** ' + note + '\n\n' : ''}**Proveď jen tyto změny (proti rádiu ${pkg.radioVersion}):**\n${lines.length ? lines.map(c => '- ' + c).join('\n') : '- (bez změn rozložení a vzhledu – jen poznámka)'}\n\nSandbox ${APP_VERSION} · mřížka ${COLS} × ${S.rows} · ${new Date().toLocaleString('cs')}\n\n<details><summary>Celý stav sandboxu pro Clauda (JSON – řiď se seznamem výše)</summary>\n\n\`\`\`json\n${JSON.stringify(pkg)}\n\`\`\`\n</details>\n`;
  return { lines, body, title: 'Sandbox: ' + (note ? note.slice(0, 60) : lines.length + ' změn rozložení/vzhledu') };
}

/* ---------- Spodní / boční lišta sandboxu ---------- */
function renderSandboxBar() {
  const bar = document.getElementById('sbx');
  const n = computeChanges().length;
  const modes = { snapshot: 'Snímek z rádia', demo: 'Ukázková jízda', off: 'Bez auta' };
  const key = [n, S.prefs.dataMode, S.prefs.showBars, Upd.available ? Upd.remote.version : '', Upd.radioNewer, U.editing].join('|');
  if (bar.dataset.key === key) return;
  bar.dataset.key = key;
  bar.innerHTML =
    `<button class="sb${n ? ' hot' : ''}" data-sb="send"><span class="mi">send</span>Odeslat změny${n ? ` <span class="badge">${n}</span>` : ''}</button>` +
    `<button class="sb${Upd.available || Upd.radioNewer ? ' hot' : ''}" data-sb="update"><span class="mi">system_update</span>Aktualizace${Upd.available || Upd.radioNewer ? ' <span class="badge">!</span>' : ''}</button>` +
    `<button class="sb" data-sb="mode"><span class="mi">directions_car</span>${modes[S.prefs.dataMode]}</button>` +
    `<button class="sb" data-sb="bars"><span class="mi">${S.prefs.showBars ? 'web_asset' : 'crop_free'}</span>Lišty ${S.prefs.showBars ? 'zapnuté' : 'skryté'}</button>` +
    `<button class="sb" data-sb="reset"><span class="mi">restart_alt</span>Stav rádia</button>` +
    `<div class="sbinfo">Sandbox ${APP_VERSION} · rádio ${S.baseline ? S.baseline.radioVersion : '?'}${Upd.radioLatest ? ' (GitHub ' + Upd.radioLatest + ')' : ''}</div>`;
  layoutStage();
}

function sheet(html) {
  closeSheet();
  const d = document.createElement('div');
  d.className = 'sheet'; d.id = 'sheet';
  d.innerHTML = `<div class="in">${html}</div>`;
  d.addEventListener('click', e => { if (e.target === d) closeSheet(); });
  document.body.appendChild(d);
  return d;
}
function closeSheet() { const s = document.getElementById('sheet'); if (s) s.remove(); }

/* ---------- Kontrola změn před odesláním ---------- */
function openSend() {
  const d = sheet('');
  d.id = 'sheet';
  renderSend();
  d.addEventListener('click', onSendClick);
  d.addEventListener('input', onSendInput);
}
function renderSend() {
  const box = document.querySelector('#sheet .in');
  if (!box) return;
  const scroll = box.scrollTop;
  const dr = draft(), items = computeChangeItems();
  const shown = items.filter(i => !dr.removed[i.key]), removed = items.length - shown.length;
  const nSend = sendLines().length;
  let h = `<h3>Kontrola změn před odesláním</h3><div class="muted">Proti stavu rádia ${S.baseline ? esc(S.baseline.radioVersion) : ''}. Zaškrtnuté položky se pošlou Claudovi. Text můžeš přepsat, položku odebrat ze seznamu (v sandboxu zůstane) nebo ji rovnou vrátit zpět v sandboxu.</div>`;
  if (!items.length) h += `<div class="chg">Proti rádiu nemáš žádnou změnu rozložení ani vzhledu.</div>`;
  for (const i of shown) {
    const ex = !!dr.excluded[i.key];
    h += `<div class="ci${ex ? ' off' : ''}"><label class="ck"><input type="checkbox" data-k="${esc(i.key)}" ${ex ? '' : 'checked'}></label><textarea rows="2" data-edit="${esc(i.key)}">${esc(dr.edits[i.key] || i.text)}</textarea><div class="cbtn"><button class="ib" data-revert="${esc(i.key)}" title="Vrátit v sandboxu"><span class="mi">undo</span></button><button class="ib" data-remove="${esc(i.key)}" title="Odebrat ze seznamu"><span class="mi">delete</span></button></div></div>`;
  }
  dr.custom.forEach((t, n) => {
    h += `<div class="ci"><label class="ck"><span class="mi" style="color:#4FC3F7">edit_note</span></label><textarea rows="2" data-custom="${n}" placeholder="Vlastní požadavek…">${esc(t)}</textarea><div class="cbtn"><button class="ib" data-delcustom="${n}" title="Smazat řádek"><span class="mi">delete</span></button></div></div>`;
  });
  h += `<div class="acts" style="margin-top:6px"><button class="sb" data-s="addline"><span class="mi">add</span>Přidat vlastní řádek</button>${removed ? `<button class="sb" data-s="restore"><span class="mi">restore</span>Vrátit odebrané (${removed})</button>` : ''}${Object.keys(dr.edits).length ? `<button class="sb" data-s="resettext"><span class="mi">format_clear</span>Původní texty</button>` : ''}</div>`;
  h += `<div class="muted" style="margin:12px 0 4px">Poznámka pro Clauda:</div><textarea data-note="1" placeholder="Např. Na plochu Jízda chci rychloměr přes celou šířku…">${esc(dr.note || '')}</textarea>`;
  h += `<details style="margin-top:10px"><summary class="muted">Náhled zprávy (${nSend} ${nSend === 1 ? 'položka' : nSend >= 2 && nSend <= 4 ? 'položky' : 'položek'})</summary><div class="chg" style="white-space:pre-wrap">${esc(sendPreview())}</div></details>`;
  h += `<div class="acts"><button class="sb hot" data-s="git"><span class="mi">bug_report</span>Vytvořit úkol na GitHubu</button><button class="sb" data-s="share"><span class="mi">ios_share</span>Sdílet (do Claude)</button><button class="sb" data-s="copy"><span class="mi">content_copy</span>Kopírovat</button><button class="sb" data-s="close"><span class="mi">close</span>Zavřít</button></div>`;
  h += `<div class="acts"><button class="sb danger" data-s="discard" ${items.length ? '' : 'disabled'}><span class="mi">delete_sweep</span>Zahodit všechny změny (vrátit stav rádia)</button></div>`;
  h += `<div class="muted" style="margin-top:10px">Na GitHubu jen potvrď „Submit new issue“ a pak Claudovi napiš „zpracuj změny ze sandboxu“.</div>`;
  box.innerHTML = h;
  box.scrollTop = scroll;
}
function sendPreview() {
  const d = draft(), lines = sendLines();
  return (d.note ? 'Poznámka: ' + d.note.trim() + '\n\n' : '') + (lines.length ? lines.map(l => '• ' + l).join('\n') : '(nic k odeslání)');
}
function updatePreview() {
  const sum = document.querySelector('#sheet details summary'), pv = document.querySelector('#sheet details .chg');
  if (pv) pv.textContent = sendPreview();
  if (sum) { const n = sendLines().length; sum.textContent = `Náhled zprávy (${n} ${n === 1 ? 'položka' : n >= 2 && n <= 4 ? 'položky' : 'položek'})`; }
}
function onSendInput(e) {
  const t = e.target, d = draft();
  if (t.dataset.k) { if (t.checked) delete d.excluded[t.dataset.k]; else d.excluded[t.dataset.k] = true; t.closest('.ci').classList.toggle('off', !t.checked); }
  else if (t.dataset.edit) { const it = computeChangeItems().find(i => i.key === t.dataset.edit); if (it && t.value.trim() === it.text) delete d.edits[t.dataset.edit]; else d.edits[t.dataset.edit] = t.value; }
  else if (t.dataset.custom != null) d.custom[+t.dataset.custom] = t.value;
  else if (t.dataset.note) d.note = t.value;
  else return;
  save(); updatePreview();
}
function onSendClick(e) {
  const b = e.target.closest('button');
  if (!b) return;
  const d = draft();
  if (b.dataset.revert) {
    const it = computeChangeItems().find(i => i.key === b.dataset.revert);
    if (it) {
      const err = it.revert();
      if (err) { alert(err); return; }
      delete d.edits[it.key]; delete d.excluded[it.key];
      save(); wrapReset(); render();
    }
    renderSend(); return;
  }
  if (b.dataset.remove) { d.removed[b.dataset.remove] = true; save(); renderSend(); return; }
  if (b.dataset.delcustom != null) { d.custom.splice(+b.dataset.delcustom, 1); save(); renderSend(); return; }
  const s = b.dataset.s;
  if (s === 'addline') { d.custom.push(''); save(); renderSend(); const tas = document.querySelectorAll('#sheet [data-custom]'); if (tas.length) tas[tas.length - 1].focus(); }
  else if (s === 'restore') { d.removed = {}; save(); renderSend(); }
  else if (s === 'resettext') { d.edits = {}; save(); renderSend(); }
  else if (s === 'close') closeSheet();
  else if (s === 'discard') {
    if (!confirm('Zahodit všechny změny v sandboxu? Rozložení a vzhled se vrátí přesně podle rádia a seznam změn se vymaže.')) return;
    applyBaseline(S.baseline, true); S.sendDraft = null; U.editing = false; U.selected = null; U.undo = []; save(); wrapReset(); render(); renderSend();
  }
  else if (s === 'git' || s === 'share' || s === 'copy') {
    const p = changePackage();
    if (!p.lines.length && !(d.note || '').trim()) { alert('Není co odeslat – zaškrtni aspoň jednu změnu nebo napiš poznámku.'); return; }
    if (s === 'git') {
      let url = `https://github.com/${SANDBOX_REPO}/issues/new?title=${encodeURIComponent(p.title)}&body=${encodeURIComponent(p.body)}`;
      if (url.length > 7800) { copyText(p.body); url = `https://github.com/${SANDBOX_REPO}/issues/new?title=${encodeURIComponent(p.title)}&body=${encodeURIComponent('(Text změn je ve schránce – vlož ho sem.)')}`; alert('Změn je hodně, text se zkopíroval do schránky. Na GitHubu ho vlož do popisu úkolu.'); }
      window.open(url, '_blank');
    } else if (s === 'share') {
      if (navigator.share) navigator.share({ title: p.title, text: p.body }).catch(() => { });
      else { copyText(p.body); alert('Zkopírováno – vlož do chatu s Claudem.'); }
    } else { copyText(p.body); b.innerHTML = '<span class="mi">check</span>Zkopírováno'; }
  }
}
function wrapReset() { const w = document.querySelector('#area .pagewrap'); if (w) w._last = null; }
function copyText(t) {
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).catch(() => fallbackCopy(t));
  else fallbackCopy(t);
}
function fallbackCopy(t) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) { } a.remove(); }

/* ---------- Aktualizace: sandbox (version.json) a verze v rádiu (GitHub Releases) ---------- */
const Upd = {
  remote: null, available: false, radioLatest: null, radioNewer: false, checking: false,
  async check(manual) {
    if (this.checking) return;
    this.checking = true;
    try {
      const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
      this.remote = await r.json();
      this.available = cmpVer(this.remote.version, APP_VERSION) > 0 || (cmpVer(this.remote.version, APP_VERSION) === 0 && (this.remote.build || 0) > APP_BUILD);
    } catch (e) { if (manual) toast('Aktualizaci se nepodařilo zjistit – chybí internet?'); }
    try {
      const j = await (await fetch(`https://api.github.com/repos/${RADIO_REPO}/releases/latest`, { cache: 'no-store' })).json();
      if (j && j.tag_name) {
        this.radioLatest = j.tag_name.replace(/^v/, '');
        const base = S.baseline ? S.baseline.radioVersion : '0';
        const mirror = this.remote ? this.remote.radioVersion : base;
        // Rádio má novější vydání (podle hlavní a vedlejší verze), než jaké sandbox kopíruje.
        this.radioNewer = cmpVer(majorMinor(this.radioLatest), majorMinor(mirror)) > 0;
      }
    } catch (e) { /* GitHub nedostupný */ }
    this.checking = false;
    renderSandboxBar();
    if (U.panel === 'SETTINGS') refreshPanel();
    if (this.available) this.offer();
    else if (manual) this.info();
  },
  offer() {
    const n = this.remote;
    const notes = (n.notes || []).map(x => `<div style="display:flex;gap:6px"><span>•</span><span>${esc(x)}</span></div>`).join('');
    const same = n.version === APP_VERSION;
    dialog(same ? `Aktualizace sandboxu ${esc(n.version)}` : `Nová verze ${esc(n.version)}`, `<div style="font-size:16px;color:${P.Text}">${same ? 'Sandbox má na GitHubu vylepšení (verze zůstává stejná jako v rádiu). Stáhnout a rovnou nainstalovat?' : `Máš verzi ${APP_VERSION}. Na GitHubu je novější – stáhnout a rovnou nainstalovat?`}</div><div style="margin-top:6px">Odpovídá rádiu ${esc(n.radioVersion)}.</div><div style="margin-top:10px">${notes}</div>`, [['Později', 'updlater'], ['Stáhnout a nainstalovat', 'updinstall', true]]);
  },
  info() {
    const base = S.baseline ? S.baseline.radioVersion : '?';
    let t = `Sandbox ${APP_VERSION} je nejnovější.<br>Kopíruje rádio ve verzi ${esc(base)}.`;
    if (this.radioLatest) t += `<br>Na GitHubu je pro rádio vydání ${esc(this.radioLatest)}.`;
    if (this.radioNewer) t += `<br><br><b style="color:${P.Amber}">Rádio má novější verzi, než jakou sandbox ukazuje.</b> Pošli Claudovi žádost o srovnání sandboxu s rádiem.`;
    dialog('Aktualizace', t, this.radioNewer ? [['OK', 'dlgclose'], ['Požádat o srovnání', 'syncreq', true]] : [['OK', 'dlgclose']]);
  },
  async install() {
    dialog('Instaluji verzi ' + esc(this.remote.version), 'Stahuji nové soubory… Sandbox se sám znovu spustí a ukáže novinky.', []);
    try {
      if ('caches' in window) { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); }
      const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
      if (reg) await reg.update();
    } catch (e) { }
    localStorage.setItem('sbx407_pending_changelog', '1');
    location.replace(location.pathname + '?v=' + encodeURIComponent(this.remote.version));
  }
};
function cmpVer(a, b) { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0 ? 1 : -1; } return 0; }
function majorMinor(v) { return String(v).split('.').slice(0, 2).join('.'); }

window.sandboxAct = (a, b) => {
  if (a === 'syncreq') {
    closeDialog();
    const body = `## Srovnat sandbox s rádiem\n\nRádio má na GitHubu vydání **${Upd.radioLatest}**, sandbox ${APP_VERSION} kopíruje rádio ${S.baseline ? S.baseline.radioVersion : '?'}.\nProsím přenes změny z Dash 407 do sandboxu (vzhled, widgety, radio-state.json) a vydej novou verzi sandboxu.`;
    window.open(`https://github.com/${SANDBOX_REPO}/issues/new?title=${encodeURIComponent('Srovnat sandbox s rádiem ' + Upd.radioLatest)}&body=${encodeURIComponent(body)}`, '_blank');
  }
  if (a === 'basenew') { applyBaseline(S.pendingBaseline, true); S.baseline = S.pendingBaseline; closeDialog(); toast('Sandbox teď odpovídá rádiu ' + S.baseline.radioVersion); }
  if (a === 'basekeep') { S.baseAt = S.pendingBaseline.capturedAt; save(); closeDialog(); }
};

function onSandboxButton(id) {
  if (id === 'send') openSend();
  else if (id === 'update') Upd.check(true);
  else if (id === 'mode') { const order = ['snapshot', 'demo', 'off']; S.prefs.dataMode = order[(order.indexOf(S.prefs.dataMode) + 1) % 3]; demoT = 0; save(); carTick(); render(); toast({ snapshot: 'Data: snímek z rádia 15. 11.', demo: 'Data: ukázková jízda', off: 'Data: bez auta' }[S.prefs.dataMode]); }
  else if (id === 'bars') { S.prefs.showBars = !S.prefs.showBars; save(); render(); }
  else if (id === 'reset') dialog('Vrátit stav rádia?', 'Rozložení všech ploch a vzhled se vrátí přesně podle rádia. Neodeslané změny se ztratí.', [['Zrušit', 'dlgclose'], ['Vrátit', 'fullreset', true]]);
}

/** Počet řádků mřížky podle tvaru plochy (PageGrid v rádiu, s prodlevou 1,5 s). */
function checkRows() {
  const ab = areaBox(), g = LOOK.gap / 2;
  const w = SCREEN_W - 2 * g, h = ab.pageH - 2 * g;
  // 2.12: v režimu úprav se mřížka nepřepočítává (jako v rádiu).
  if (U.editing || U.slot === 'MENU' || h < SCREEN_H * 0.5) return;
  const rows = clamp(Math.round(COLS * h / w), 12, 48);
  if (rows !== S.rows) { Layout.setRows(rows); render(); }
}

/* ---------- Úvodní obrazovka ---------- */
function showIntro(force) {
  const a = S.appearance;
  if (!force && !a.intro) return;
  const el = document.createElement('div');
  el.className = 'intro';
  if (a.introStyle === 'modern') el.innerHTML = `<div style="text-align:center;color:#fff"><div style="font-size:72px;font-weight:300;letter-spacing:18px">PEUGEOT</div><div style="font-size:22px;color:${LOOK.accent};letter-spacing:8px;margin-top:10px">407 SW</div></div>`;
  else if (a.introStyle === 'retro') el.innerHTML = `<div style="text-align:center;color:#FFB300;font-family:'Roboto Mono',monospace"><div style="font-size:64px">PEUGEOT 407</div><div style="font-size:20px;margin-top:12px">▂▃▅▆▇ SYSTEM READY ▇▆▅▃▂</div></div>`;
  else el.innerHTML = `<img src="assets/intro_peugeot.jpg" alt="">`;
  el.addEventListener('click', () => el.remove());
  $radio().appendChild(el);
  setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 500); }, a.introSeconds * 1000);
}

/* ---------- Start ---------- */
async function init() {
  buildSkeleton();
  let baseline = null;
  try { baseline = await (await fetch('radio-state.json', { cache: 'no-cache' })).json(); } catch (e) { }
  const had = load();
  if (baseline) {
    S.baseline = baseline;
    if (!had) applyBaseline(baseline, false);
    else if (S.baseAt && S.baseAt !== baseline.capturedAt) S.pendingBaseline = baseline;
  }
  if (!S.pages.length && baseline) applyBaseline(baseline, false);
  computeLook();
  setupInput();
  document.getElementById('sbx').addEventListener('click', e => { const b = e.target.closest('[data-sb]'); if (b) onSandboxButton(b.dataset.sb); });
  window.sandboxAct2 = window.sandboxAct;
  window.sandboxAct = (a, b, c) => { if (a === 'fullreset') { applyBaseline(S.baseline, true); S.sendDraft = null; save(); wrapReset(); U.slot = 'CENTER'; U.editing = false; closeDialog(); toast('Sandbox odpovídá rádiu ' + S.baseline.radioVersion); return; } window.sandboxAct2(a, b, c); };
  window.addEventListener('resize', layoutStage);
  window.addEventListener('orientationchange', () => setTimeout(layoutStage, 300));
  startGps();
  carTick();
  render();
  layoutStage();
  showIntro(false);
  refreshWeather(true);
  if (S.pendingBaseline) {
    dialog('Rádio se změnilo', `Claude nahrál nový stav rádia (${esc(S.pendingBaseline.radioVersion)}, ${esc(new Date(S.pendingBaseline.capturedAt).toLocaleString('cs'))}). Převzít jeho rozložení a vzhled? Tvoje neodeslané změny v sandboxu se přepíšou.`, [['Ponechat moje', 'basekeep'], ['Převzít stav rádia', 'basenew', true]]);
  } else if (localStorage.getItem('sbx407_pending_changelog')) {
    localStorage.removeItem('sbx407_pending_changelog');
    try {
      const v = await (await fetch('version.json?t=' + Date.now(), { cache: 'no-store' })).json();
      dialog('Co je nového ve verzi ' + esc(v.version), (v.notes || []).map(x => '• ' + esc(x)).join('<br>'), [['Rozumím', 'dlgclose', true]]);
    } catch (e) { }
  }
  setTimeout(() => Upd.check(false), 2500);
  setInterval(() => Upd.check(false), 30 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) Upd.check(false); });
  // Takt 1 s jako v rádiu: data, jízda, překreslení.
  setInterval(() => {
    carTick(); Perf.tick();
    if (Math.random() < 0.07) SpeedLimit.refresh();
    if (Date.now() - Weather.at > 15 * 60 * 1000) refreshWeather(false);
    if (!drag && !anim && !press && !document.hidden) render();
  }, 1000);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
}
document.addEventListener('DOMContentLoaded', init);
