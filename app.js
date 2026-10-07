// BarWijnig — testversie
// Werkt volledig in de browser: geen server, geen API-kosten.
// Data: data/wines.json · Aroma-iconen: aromas.js · Verhaalformat: FORMAT.md

const state = { wines: [], current: null, version: 'kort', scanner: null };
const $ = (id) => document.getElementById(id);
const SVG_NS = 'http://www.w3.org/2000/svg';

// ---------- Kleine helpers ----------
function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'style') n.setAttribute('style', v);
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  kids.flat().forEach((c) => c != null && n.append(c.nodeType ? c : document.createTextNode(c)));
  return n;
}
function icon(d, { size = 20, stroke = '#FFF4E3', width = 2.4 } = {}) {
  const s = document.createElementNS(SVG_NS, 'svg');
  s.setAttribute('width', size); s.setAttribute('height', size);
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none');
  s.setAttribute('stroke', stroke); s.setAttribute('stroke-width', width);
  s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', d);
  s.appendChild(p);
  return s;
}
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ---------- Iconen voor de verhaalonderdelen ----------
const I = {
  weetje: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  boek: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM8 7h7',
  druif: 'M12 4c1-1 3-1 4 0M9 9a2 2 0 1 0 0 .1M15 9a2 2 0 1 0 0 .1M12 13a2 2 0 1 0 0 .1M9 17a2 2 0 1 0 0 .1M15 17a2 2 0 1 0 0 .1',
  vat: 'M6 4h12c1.5 5 1.5 11 0 16H6C4.5 15 4.5 9 6 4zM5 9h14M5 15h14',
  kaart: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  proost: 'M8 3h4l-.5 6a2 2 0 0 1-3 0zM14 3h4l-.5 6a2 2 0 0 1-3 0zM10 11v8M16 11v8M7 20h6M13 20h6',
  punaise: 'M9 3h6l-1 6 3 3H7l3-3zM12 12v9',
  glas: 'M7 3h10l-1 7a4 4 0 0 1-8 0zM12 14v6M8 21h8',
  oog: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z',
  neus: 'M13 3c0 4-2 7-5 11-1.5 2-.5 5 2 5h2.5a2.5 2.5 0 0 0 2.5-2.5M10.5 16.5c.8.6 1.8.6 2.5 0',
  tong: 'M3 9c2.5 2 5.5 3 9 3s6.5-1 9-3M7 11.5V14a5 5 0 0 0 10 0v-2.5M12 12v4',
};

// Vaste labels uit FORMAT.md → titel, icoon, kleur, en of het een uitgelicht (geel) kaartje is.
// 'proef' = vervangen door de proefkaart (de tekst blijft wel in het voorleesverhaal).
const DELEN = {
  'Het wijnweetje van deze fles!': { titel: 'Het wijnweetje van deze fles!', icoon: I.weetje, kleur: '#E8A33D', geel: true },
  'Het hele verhaal van deze fles!': { titel: 'Het hele verhaal van deze fles!', icoon: I.boek, kleur: '#E8A33D', geel: true },
  'Wat je proeft.': { proef: true },
  'In je glas.': { proef: true },
  'Op je tong.': { proef: true },
  'De druif.': { titel: 'De druif', icoon: I.druif, kleur: '#5B3A8C' },
  'Hoe gemaakt.': { titel: 'Hoe gemaakt', icoon: I.vat, kleur: '#9A5B2E' },
  'Waar vandaan.': { titel: 'Waar vandaan', icoon: I.kaart, kleur: '#2F6B5E' },
  'Het verhaal.': { titel: 'Het verhaal', icoon: I.boek, kleur: '#7A1F3D' },
  'Schenken.': { titel: 'Schenken', icoon: I.proost, kleur: '#C2410C' },
  'Onthoud.': { titel: 'Onthoud', icoon: I.punaise, kleur: '#9A5B2E' },
};

function splitDelen(tekst) {
  return (tekst || '').split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean).map((t) => {
    const label = Object.keys(DELEN).find((l) => t.startsWith(l));
    return { label, meta: label ? DELEN[label] : null, body: label ? t.slice(label.length).trim() : t };
  });
}

// ---------- Data ----------
async function loadWines() {
  try {
    const res = await fetch('data/wines.json', { cache: 'no-cache' });
    state.wines = (await res.json()).wijnen || [];
  } catch (e) { state.wines = []; }
}
const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function findByCode(code) {
  const clean = String(code).replace(/\D/g, '');
  return state.wines.find((w) => (w.ean || []).some((e) => String(e).replace(/\D/g, '') === clean));
}
function search(q) {
  const n = normalize(q).trim();
  if (n.length < 2) return [];
  return state.wines.filter((w) => normalize([w.naam, w.producent, w.regio, w.appellation, w.land, (w.druiven || []).join(' ')].join(' ')).includes(n)).slice(0, 8);
}

// ---------- Proefkaart ----------
const LAGEN = [['fruit', '1', 'n1'], ['maken', '2', 'n2'], ['rijping', '3', 'n3']];

function aromaChip(key) {
  const a = (window.AROMAS || {})[key] || { naam: key };
  const bg = a.bg || '#F3E6D6';
  const kleur = a.kleur || '#6E3C1C';
  return el('div', { class: 'aroma' },
    el('div', { class: 'aroma-icoon', style: `background:${bg}` }, a.d ? icon(a.d, { size: 22, stroke: kleur, width: 2 }) : null),
    el('span', {}, a.naam));
}

function zintuigBlok(titel, d, kleur, data) {
  const lagen = el('div', { class: 'lagen' });
  LAGEN.forEach(([key, nr, cls]) => {
    const items = (data && data[key]) || [];
    lagen.append(el('div', { class: 'laag' },
      el('span', { class: `nr ${cls}` }, nr),
      items.length ? el('div', { class: 'aromas' }, items.map(aromaChip)) : el('span', { class: 'leeg' }, '–')));
  });
  return el('div', { class: 'zintuig' },
    el('div', { class: 'zintuig-hoofd' }, el('div', { class: 'zintuig-icoon', style: `background:${kleur}` }, icon(d, { size: 34, width: 2 })), titel),
    lagen);
}

function proefkaart(w) {
  const p = w.proef;
  const legenda = el('div', { class: 'legenda' },
    LAGEN.map(([, nr, cls], i) => el('span', {}, el('span', { class: `nr ${cls}` }, nr), ['Fruit', 'Maken', 'Rijping'][i])));
  return el('section', { class: 'proefkaart' },
    el('div', { class: 'proef-kop' }, el('h2', {}, 'Proefkaart'), legenda),
    el('div', { class: 'zintuig' },
      el('div', { class: 'zintuig-hoofd' }, el('div', { class: 'zintuig-icoon', style: 'background:#2F6B5E' }, icon(I.oog, { size: 32, width: 2 })), 'Zie'),
      el('div', { class: 'kleurbol', style: `background:${p.kleur.hex}` }),
      el('div', { class: 'kleurnaam' }, p.kleur.naam)),
    zintuigBlok('Ruik', I.neus, '#7A1F3D', p.geur),
    zintuigBlok('Proef', I.tong, '#C2410C', p.smaak));
}

function deelKaart(meta, body) {
  return el('section', { class: `deel${meta.geel ? ' uitgelicht' : ''}` },
    el('div', { class: 'deel-kop' }, el('div', { class: 'deel-icoon', style: `background:${meta.kleur}` }, icon(meta.icoon)), el('h2', {}, meta.titel)),
    el('p', {}, body));
}

// ---------- Verhaal tonen ----------
function openWine(w) {
  state.current = w;
  state.version = 'kort';
  $('w-region').textContent = [w.appellation || w.regio, w.land].filter(Boolean).join(' · ');
  $('w-name').textContent = w.naam;
  const chips = $('w-chips');
  chips.replaceChildren(...[w.producent, ...(w.druiven || [])].filter(Boolean).map((c) => el('span', {}, c)));
  $('w-source-list').replaceChildren(...(w.bronnen || []).map((b) => el('li', {}, el('a', { href: b.url, target: '_blank', rel: 'noopener' }, b.titel || b.url))));
  renderVersion();
  show('story');
  history.replaceState(null, '', `#${encodeURIComponent(w.id)}`);
}

function renderVersion() {
  const w = state.current;
  const v = w[state.version] || {};
  $('tab-kort').classList.toggle('active', state.version === 'kort');
  $('tab-lang').classList.toggle('active', state.version === 'lang');

  const woorden = (v.tekst || '').split(/\s+/).filter(Boolean).length;
  const sec = Math.round((woorden / 150) * 60 / 5) * 5;
  $('duur').textContent = sec < 60 ? `ca. ${sec} seconden luisteren` : `ca. ${(sec / 60).toFixed(1).replace('.', ',').replace(',0', '')} minuut luisteren`;

  // Onderdelen: kaartjes, met de proefkaart op de plek van geur/smaak
  const box = $('w-text');
  box.replaceChildren();
  let proefGeplaatst = false;
  splitDelen(v.tekst).forEach(({ meta, body, label }) => {
    if (meta && meta.proef) {
      if (w.proef && !proefGeplaatst) { box.append(proefkaart(w)); proefGeplaatst = true; }
      if (!w.proef) box.append(deelKaart({ titel: label.replace(/\.$/, ''), icoon: I.glas, kleur: '#7A1F3D' }, body));
      return;
    }
    box.append(meta ? deelKaart(meta, body) : el('section', { class: 'deel' }, el('p', {}, body)));
  });

  // Afspelen: eigen mp3 (de BarWijnig-stem), anders voorlezen door de telefoon
  stopAudio();
  speechSynthesis.cancel();
  const player = $('player');
  player.replaceChildren();
  if (v.audio) {
    const b = el('button', { class: 'luister' }, playIcon(false), el('span', {}, 'Luister'));
    const balk = el('div', { class: 'voortgang' }, el('div'));
    b.addEventListener('click', () => toggleAudio(v.audio, b, balk));
    player.append(b, balk);
  } else if (v.tekst && 'speechSynthesis' in window) {
    const b = el('button', { class: 'voorlees' }, icon('M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13', { size: 22, stroke: '#3B2316', width: 2.2 }), el('span', {}, 'Lees voor'));
    b.addEventListener('click', () => speak(v.tekst, b));
    player.append(b);
  }
  player.classList.add('een');

  renderKoopEnMeer(w);
}

// ---------- Eigen audio ----------
let audio = null;
function playIcon(speelt) {
  const s = icon(speelt ? 'M8 5h3v14H8zM13 5h3v14h-3z' : 'M8 5v14l11-7z', { size: 22, stroke: '#FFF4E3', width: 1.5 });
  s.setAttribute('fill', '#FFF4E3');
  return s;
}
function stopAudio() { if (audio) { audio.pause(); audio = null; } }
function toggleAudio(src, btn, balk) {
  const label = btn.querySelector('span');
  const zet = (speelt) => { btn.firstChild.replaceWith(playIcon(speelt)); label.textContent = speelt ? 'Pauze' : 'Luister'; };
  if (!audio || !audio.src.endsWith(src)) {
    stopAudio();
    audio = new Audio(src);
    audio.addEventListener('timeupdate', () => { if (audio && audio.duration) balk.firstChild.style.width = `${(audio.currentTime / audio.duration) * 100}%`; });
    audio.addEventListener('ended', () => { zet(false); balk.firstChild.style.width = '100%'; });
  }
  if (audio.paused) { audio.play().then(() => zet(true)).catch(() => zet(false)); }
  else { audio.pause(); zet(false); }
}

// ---------- Koop deze fles & Meer zoals deze ----------
function wijnType(w) {
  const k = normalize((w.proef && w.proef.kleur && w.proef.kleur.naam) || '');
  if (/roze|rose|zalm/.test(k)) return 'rosé';
  if (/geel|goud|citroen|stro|groen/.test(k)) return 'wit';
  return 'rood';
}
function aromaSet(w) {
  const s = new Set();
  if (!w.proef) return s;
  ['geur', 'smaak'].forEach((z) => Object.values(w.proef[z] || {}).flat().forEach((a) => s.add(a)));
  return s;
}
function lijkendeWijnen(w, max = 3) {
  const type = wijnType(w), A = aromaSet(w), druiven = new Set(w.druiven || []);
  return state.wines
    .filter((x) => x.id !== w.id && wijnType(x) === type)
    .map((x) => {
      const B = aromaSet(x);
      const gedeeld = [...A].filter((a) => B.has(a));
      const zelfdeDruif = (x.druiven || []).filter((d) => druiven.has(d));
      const score = zelfdeDruif.length * 3 + (x.appellation && x.appellation === w.appellation ? 2 : 0) + (x.land === w.land ? 1 : 0) + gedeeld.length * 1.5;
      let waarom = '';
      if (zelfdeDruif.length) waarom = `Ook ${zelfdeDruif[0].toLowerCase()}`;
      else if (gedeeld.length) waarom = `Ook ${gedeeld.slice(0, 2).map((a) => ((window.AROMAS || {})[a] || { naam: a }).naam.toLowerCase()).join(' en ')}`;
      else if (x.land === w.land) waarom = `Ook uit ${x.land}`;
      else waarom = `Ook een ${{ rood: 'rode wijn', wit: 'witte wijn', 'rosé': 'rosé' }[type]}`;
      return { x, score, waarom };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}
function renderKoopEnMeer(w) {
  // "Koop deze fles": verschijnt zodra er een (affiliate)link in de data staat
  $('w-koop').replaceChildren(...(w.koop ? [el('a', { class: 'koop', href: w.koop, target: '_blank', rel: 'sponsored noopener' }, 'Koop deze fles')] : []));

  const recs = lijkendeWijnen(w);
  const box = $('w-meer');
  box.replaceChildren();
  if (!recs.length) return;
  box.append(el('h2', {}, 'Meer wijnen zoals deze'), el('p', { class: 'meer-sub' }, 'Gekozen op druif, aroma’s en herkomst'));
  recs.forEach(({ x, waarom }) => box.append(
    el('button', { class: 'meer-kaart', onclick: () => openWine(x) },
      el('div', { class: 'kleurbol', style: `background:${(x.proef && x.proef.kleur.hex) || '#8E1B2E'}` }),
      el('div', {}, el('b', {}, x.naam), el('small', {}, [x.appellation || x.regio, x.land].filter(Boolean).join(' · ')), el('small', { class: 'waarom' }, waarom)))));
}

function speak(text, btn) {
  const label = btn.querySelector('span');
  if (speechSynthesis.speaking) { speechSynthesis.cancel(); label.textContent = 'Lees voor'; return; }
  const u = new SpeechSynthesisUtterance(text.replace(/\n+/g, ' '));
  u.lang = 'nl-NL';
  const nl = speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith('nl'));
  if (nl) u.voice = nl;
  u.onend = () => { label.textContent = 'Lees voor'; };
  label.textContent = 'Stop';
  speechSynthesis.speak(u);
}

// ---------- Onbekende fles ----------
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
    try { await navigator.clipboard.writeText(text); alert('Gekopieerd. Plak het in een bericht aan de keldermeester.'); }
    catch (e) { prompt('Kopieer deze tekst:', text); }
  }
}

// ---------- Scanner ----------
async function startScan() {
  if (typeof Html5Qrcode === 'undefined') { alert('De scanner laadt nog, probeer het zo opnieuw.'); return; }
  show('scanner');
  const F = Html5QrcodeSupportedFormats;
  state.scanner = new Html5Qrcode('reader', {
    formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E],
    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    verbose: false,
  });
  try {
    await state.scanner.start({ facingMode: 'environment' }, { fps: 10 }, async (code) => {
      await stopScan(false);
      if (navigator.vibrate) navigator.vibrate(60);
      const w = findByCode(code);
      w ? openWine(w) : unknownWine(code);
    });
  } catch (e) {
    await stopScan();
    alert('De camera kon niet worden geopend. Geef de browser toestemming voor de camera, of zoek op naam.');
  }
}
async function stopScan(terug = true) {
  if (state.scanner) {
    try { await state.scanner.stop(); } catch (e) { /* al gestopt */ }
    try { state.scanner.clear(); } catch (e) { /* niets */ }
    state.scanner = null;
  }
  if (terug) show('start');
}

// ---------- Koppelingen ----------
function naarStart() { stopAudio(); speechSynthesis.cancel(); history.replaceState(null, '', location.pathname); show('start'); }

// Leeftijdscheck: één keer per toestel
function leeftijdscheck() {
  let ok = false;
  try { ok = localStorage.getItem('barwijnig-18plus') === 'ja'; } catch (e) { /* geen opslag: elke keer vragen */ }
  if (ok) return;
  $('leeftijd').hidden = false;
  $('btn-18-ja').onclick = () => { try { localStorage.setItem('barwijnig-18plus', 'ja'); } catch (e) { /* niets */ } $('leeftijd').hidden = true; };
  $('btn-18-nee').onclick = () => { $('leeftijd-nee').hidden = false; $('btn-18-ja').hidden = true; $('btn-18-nee').hidden = true; };
}
function bind() {
  $('btn-scan').onclick = startScan;
  $('btn-stop').onclick = () => stopScan();
  $('btn-naam').onclick = async () => { await stopScan(); $('search').focus(); };
  $('btn-back').onclick = naarStart;
  $('btn-back2').onclick = naarStart;
  $('btn-again').onclick = startScan;
  $('btn-share').onclick = shareUnknown;
  $('tab-kort').onclick = () => { state.version = 'kort'; renderVersion(); };
  $('tab-lang').onclick = () => { state.version = 'lang'; renderVersion(); };
  $('search').oninput = (e) => {
    $('results').replaceChildren(...search(e.target.value).map((w) =>
      el('li', {}, el('button', { onclick: () => openWine(w) }, w.naam, el('small', {}, [w.producent, w.appellation || w.regio].filter(Boolean).join(' · '))))));
  };
}

// Directe link naar een wijn (bv. via QR-code): .../#wijn-id
function openFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  const w = id && state.wines.find((x) => x.id === id);
  if (w) openWine(w);
}

(async function init() {
  leeftijdscheck();
  bind();
  await loadWines();
  openFromHash();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
