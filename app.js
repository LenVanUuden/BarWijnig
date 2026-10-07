// BarWijnig — testversie
// Werkt volledig in de browser: geen server, geen API-kosten.
// Data: data/wines.json  ·  Audio: audio/<id>-kort.mp3 / -lang.mp3

const state = { wines: [], current: null, version: 'kort', scanner: null };

const $ = (id) => document.getElementById(id);
const show = (id) => {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo(0, 0);
};

// ---------- Data ----------
async function loadWines() {
  try {
    const res = await fetch('data/wines.json', { cache: 'no-cache' });
    const data = await res.json();
    state.wines = data.wijnen || [];
  } catch (e) {
    state.wines = [];
  }
  $('catalog-count').textContent = state.wines.length
    ? `${state.wines.length} wijnen met een verhaal`
    : 'De eerste verhalen worden nu gemaakt.';
}

const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function findByCode(code) {
  const clean = String(code).replace(/\D/g, '');
  return state.wines.find((w) => (w.ean || []).some((e) => String(e).replace(/\D/g, '') === clean));
}

function search(q) {
  const n = normalize(q).trim();
  if (n.length < 2) return [];
  return state.wines
    .filter((w) => normalize([w.naam, w.producent, w.regio, w.appellation, (w.druiven || []).join(' ')].join(' ')).includes(n))
    .slice(0, 8);
}

// ---------- Verhaal tonen ----------
function openWine(w) {
  state.current = w;
  state.version = 'kort';
  $('w-region').textContent = [w.appellation || w.regio, w.land].filter(Boolean).join(' · ');
  $('w-name').textContent = w.naam;
  $('w-meta').textContent = [w.producent, (w.druiven || []).join(', ')].filter(Boolean).join(' — ');
  const list = $('w-source-list');
  list.innerHTML = '';
  (w.bronnen || []).forEach((b) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = b.url; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = b.titel || b.url;
    li.appendChild(a); list.appendChild(li);
  });
  renderVersion();
  show('story');
  history.replaceState(null, '', `#${encodeURIComponent(w.id)}`);
}

function renderVersion() {
  const w = state.current;
  const v = w[state.version] || {};
  $('tab-kort').classList.toggle('active', state.version === 'kort');
  $('tab-lang').classList.toggle('active', state.version === 'lang');

  // Tekst: alinea's gescheiden door lege regel
  const text = $('w-text');
  text.innerHTML = '';
  // Vaste labels (zie FORMAT.md) vet weergeven
  const LABELS = ['In je glas.', 'Op je tong.', 'De druif.', 'Hoe gemaakt.', 'Waar vandaan.', 'Het verhaal.', 'Schenken.', 'Wat je proeft.', 'Onthoud.'];
  (v.tekst || '').split(/\n\s*\n/).forEach((para) => {
    const p = document.createElement('p');
    const t = para.trim();
    const label = LABELS.find((l) => t.startsWith(l));
    if (label) {
      const s = document.createElement('strong');
      s.textContent = label.replace(/\.$/, '');
      p.appendChild(s);
      p.appendChild(document.createElement('br'));
      p.appendChild(document.createTextNode(t.slice(label.length).trim()));
    } else {
      p.textContent = t;
    }
    text.appendChild(p);
  });

  // Afspelen: 1) Spotify-aflevering  2) eigen mp3  3) voorlezen door de telefoon
  speechSynthesis.cancel();
  const player = $('player');
  player.innerHTML = '';
  if (v.spotify) {
    const a = document.createElement('a');
    a.className = 'spotify'; a.href = v.spotify; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = '▶ Luister op Spotify';
    player.appendChild(a);
  }
  if (v.audio) {
    const audio = document.createElement('audio');
    audio.controls = true; audio.preload = 'none'; audio.src = v.audio;
    player.appendChild(audio);
  } else if (v.tekst && 'speechSynthesis' in window) {
    const b = document.createElement('button');
    b.className = 'speak';
    b.textContent = '🔊 Lees voor';
    b.onclick = () => speak(v.tekst, b);
    player.appendChild(b);
  }
}

function speak(text, btn) {
  if (speechSynthesis.speaking) { speechSynthesis.cancel(); btn.textContent = '🔊 Lees voor'; return; }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'nl-NL';
  const nl = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith('nl'));
  if (nl) u.voice = nl;
  u.onend = () => { btn.textContent = '🔊 Lees voor'; };
  btn.textContent = '⏹ Stop';
  speechSynthesis.speak(u);
}

// ---------- Onbekende wijn ----------
function unknownWine(code) {
  $('u-code').textContent = code;
  try {
    const key = 'gezochte-wijnen';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    if (!list.includes(code)) { list.push(code); localStorage.setItem(key, JSON.stringify(list)); }
  } catch (e) { /* opslag niet beschikbaar: geen probleem */ }
  show('unknown');
}

async function shareUnknown() {
  const code = $('u-code').textContent;
  const text = `BarWijnig: deze fles staat nog niet in de app. Barcode ${code}`;
  if (navigator.share) {
    try { await navigator.share({ text }); } catch (e) { /* geannuleerd */ }
  } else {
    try { await navigator.clipboard.writeText(text); alert('Gekopieerd. Plak het in een bericht aan de maker.'); }
    catch (e) { prompt('Kopieer deze tekst:', text); }
  }
}

// ---------- Scanner ----------
async function startScan() {
  if (typeof Html5Qrcode === 'undefined') { alert('Scanner laadt nog, probeer het zo opnieuw.'); return; }
  show('scanner');
  const formats = [
    Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.UPC_E,
  ];
  state.scanner = new Html5Qrcode('reader', {
    formatsToSupport: formats,
    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
  });
  try {
    await state.scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 280, height: 140 } },
      async (code) => {
        await stopScan();
        if (navigator.vibrate) navigator.vibrate(60);
        const w = findByCode(code);
        w ? openWine(w) : unknownWine(code);
      },
    );
  } catch (e) {
    await stopScan();
    alert('De camera kon niet worden geopend. Geef de browser toestemming voor de camera, of zoek op naam.');
  }
}

async function stopScan() {
  if (state.scanner) {
    try { await state.scanner.stop(); } catch (e) { /* al gestopt */ }
    try { state.scanner.clear(); } catch (e) { /* niets */ }
    state.scanner = null;
  }
  show('start');
}

// ---------- Koppelingen ----------
function bind() {
  $('btn-scan').onclick = startScan;
  $('btn-stop').onclick = stopScan;
  $('btn-back').onclick = () => { speechSynthesis.cancel(); history.replaceState(null, '', location.pathname); show('start'); };
  $('btn-back2').onclick = () => show('start');
  $('btn-share').onclick = shareUnknown;
  $('tab-kort').onclick = () => { state.version = 'kort'; renderVersion(); };
  $('tab-lang').onclick = () => { state.version = 'lang'; renderVersion(); };
  $('search').oninput = (e) => {
    const ul = $('results');
    ul.innerHTML = '';
    search(e.target.value).forEach((w) => {
      const li = document.createElement('li');
      li.textContent = w.naam;
      const s = document.createElement('small');
      s.textContent = [w.producent, w.appellation || w.regio].filter(Boolean).join(' · ');
      li.appendChild(s);
      li.onclick = () => openWine(w);
      ul.appendChild(li);
    });
  };
}

// Directe link naar een wijn (bv. via QR-code): .../#wijn-id
function openFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const w = state.wines.find((x) => x.id === id);
  if (w) openWine(w);
}

(async function init() {
  bind();
  await loadWines();
  openFromHash();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
