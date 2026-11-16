/* Service worker sandboxu: aplikace funguje i bez internetu; version.json a radio-state.json vždy čerstvé. */
const CACHE = 'sbx407-3.0.1-b1';
const FILES = ['./', 'index.html', 'style.css', 'js/core.js', 'js/widgets.js', 'js/ui.js', 'js/panels.js', 'js/sandbox.js',
  'manifest.webmanifest', 'radio-state.json', 'assets/car_407sw.png', 'assets/intro_peugeot.jpg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'fonts/fonts.css', 'fonts/material-icons.woff2', 'fonts/roboto-condensed-latin-400-normal.woff2', 'fonts/roboto-condensed-latin-700-normal.woff2', 'fonts/roboto-condensed-latin-ext-400-normal.woff2', 'fonts/roboto-condensed-latin-ext-700-normal.woff2', 'fonts/roboto-latin-300-normal.woff2', 'fonts/roboto-latin-400-normal.woff2', 'fonts/roboto-latin-500-normal.woff2', 'fonts/roboto-latin-700-normal.woff2', 'fonts/roboto-latin-ext-300-normal.woff2', 'fonts/roboto-latin-ext-400-normal.woff2', 'fonts/roboto-latin-ext-500-normal.woff2', 'fonts/roboto-latin-ext-700-normal.woff2', 'fonts/roboto-mono-latin-400-normal.woff2', 'fonts/roboto-mono-latin-ext-400-normal.woff2', 'fonts/roboto-serif-latin-400-normal.woff2', 'fonts/roboto-serif-latin-700-normal.woff2', 'fonts/roboto-serif-latin-ext-400-normal.woff2', 'fonts/roboto-serif-latin-ext-700-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith('sbx407')).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const same = u.origin === location.origin;
  // Náhled návrhu (navrh/): vždy čerstvý ze sítě, bez sítě z mezipaměti.
  if (same && u.pathname.includes('/navrh/')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
    return;
  }
  // Aktualizace a stav rádia: vždy ze sítě, bez sítě z mezipaměti.
  if (same && (u.pathname.endsWith('version.json') || u.pathname.endsWith('radio-state.json'))) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(u.pathname.endsWith('radio-state.json') ? 'radio-state.json' : e.request, cp)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
    return;
  }
  // Data z internetu (počasí, GitHub, hledání) se necachují.
  if (!same && !/fonts\.(googleapis|gstatic)\.com|basemaps\.cartocdn\.com|arcgisonline|tile\.openstreetmap|opentopomap/.test(u.host)) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: same }).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  })));
});
