/*
  <scroll-tabs>  Wix custom element
  Featured projects: vertical scroll drives a horizontal tab track.
  Each card is an image carousel; clicking it opens a lightbox gallery.

  EDIT SECTION TEXT, TABS AND PROJECTS BELOW.
  Add real photos by pasting image URLs into each project's  images: [ ]  list.
  (Leave it empty to show placeholders.)
*/

// ---------- SETTINGS ----------
const ACCENT = '#f47f20';
const TOP_OFFSET = 0;        // set to your fixed header height in px (e.g. 80) if it overlaps
const PIN_MIN_WIDTH = 900;   // below this width: no pinning, simple tabs
const DWELL = 0.22;          // 0-0.4: how long each tab "rests" while scrolling

// ---------- CONTENT ----------
const SECTION = {
  eyebrow: 'Our Work',
  headingWhite: 'Featured Commercial',
  headingAccent: 'Projects',
  subtitle: "Explore a selection of commercial spaces we've built across Greater Houston."
};

const TABS = [
  { name: 'Dental', projects: [
    { title: 'Grace Dental', location: 'Houston, TX', images: [] },
    { title: 'Studio ONE Dental', location: 'Houston, TX', images: [] },
    { title: 'Willis Kids', location: 'Southeast TX', images: [] },
    { title: 'Park Dentistry for Kids', location: 'Houston', images: [] }
  ] },
  { name: 'Medical', projects: [
    { title: 'Medical Project 1', location: 'Houston, TX', images: [] },
    { title: 'Medical Project 2', location: 'Houston, TX', images: [] },
    { title: 'Medical Project 3', location: 'Houston, TX', images: [] },
    { title: 'Medical Project 4', location: 'Houston, TX', images: [] }
  ] },
  { name: 'Optical', projects: [
    { title: 'Optical Project 1', location: 'Houston, TX', images: [] },
    { title: 'Optical Project 2', location: 'Houston, TX', images: [] },
    { title: 'Optical Project 3', location: 'Houston, TX', images: [] },
    { title: 'Optical Project 4', location: 'Houston, TX', images: [] }
  ] },
  { name: 'Veterinary', projects: [
    { title: 'Veterinary Project 1', location: 'Houston, TX', images: [] },
    { title: 'Veterinary Project 2', location: 'Houston, TX', images: [] },
    { title: 'Veterinary Project 3', location: 'Houston, TX', images: [] },
    { title: 'Veterinary Project 4', location: 'Houston, TX', images: [] }
  ] },
  { name: 'Other', projects: [
    { title: 'Other Project 1', location: 'Houston, TX', images: [] },
    { title: 'Other Project 2', location: 'Houston, TX', images: [] },
    { title: 'Other Project 3', location: 'Houston, TX', images: [] },
    { title: 'Other Project 4', location: 'Houston, TX', images: [] }
  ] }
];

// ---------- HELPERS ----------
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const HUES = ['#33394a', '#3a4a43', '#4a3a41', '#45473a', '#3d3d3d'];

function placeholder(tabIdx, n) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${HUES[tabIdx % 5]}"/><stop offset="1" stop-color="#1a1a1a"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)"/><text x="600" y="440" text-anchor="middle" fill="#bdbdbd" font-family="Arial,sans-serif" font-size="44">Image placeholder</text><text x="600" y="500" text-anchor="middle" fill="#8a8a8a" font-family="Arial,sans-serif" font-size="32">Photo ${n}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
const imagesOf = (ti, p) => (p.images && p.images.length) ? p.images : [1, 2, 3].map(n => placeholder(ti, n));

function loadFonts() {
  if (document.getElementById('scroll-tabs-fonts')) return;
  const l = document.createElement('link');
  l.id = 'scroll-tabs-fonts'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Poppins:wght@400;500;600&display=swap';
  document.head.appendChild(l);
}

const ICON = {
  pin: `<svg viewBox="0 0 24 24" width="20" height="20" fill="${ACCENT}" aria-hidden="true"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>`,
  left: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>`,
  right: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>`,
  close: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>`
};

// ---------- ELEMENT ----------
class ScrollTabs extends HTMLElement {
  constructor() {
    super();
    this.active = 0;
    this.raf = 0;
    this.onScroll = () => { if (!this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.update(); }); };
  }

  connectedCallback() {
    this.style.display = 'block';
    this.style.width = '100%';
    loadFonts();
    if (!this.shadowRoot) this.build();
    this.mountLightbox();
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onScroll);
    this.update();
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
    this.closeLightbox(true);
    if (this.lb && this.lb.host.parentNode) this.lb.host.parentNode.removeChild(this.lb.host);
  }

  build() {
    const root = this.attachShadow({ mode: 'open' });
    const N = TABS.length;
    const card = (ti, pi, p) => {
      const imgs = imagesOf(ti, p);
      return `<article class="card" data-idx="0" data-count="${imgs.length}" data-t="${ti}" data-p="${pi}">
        <div class="frame">
          <div class="media" role="button" tabindex="0" aria-label="Open gallery: ${esc(p.title)}">
            <div class="slides">${imgs.map((src, k) => `<img src="${src}" alt="${esc(p.title)} photo ${k + 1}" loading="lazy" draggable="false">`).join('')}</div>
          </div>
          ${imgs.length > 1 ? `<button class="nav prev" aria-label="Previous photo">${ICON.left}</button><button class="nav next" aria-label="Next photo">${ICON.right}</button>
          <div class="dots">${imgs.map((_, k) => `<button class="dot${k === 0 ? ' on' : ''}" data-i="${k}" aria-label="Photo ${k + 1}"></button>`).join('')}</div>` : ''}
          <div class="info"><h3>${esc(p.title)}</h3><p>${ICON.pin}<span>${esc(p.location)}</span></p></div>
        </div>
      </article>`;
    };

    root.innerHTML = `<style>
      :host { display:block; }
      * { box-sizing:border-box; }
      button { font:inherit; }
      .stage { position:absolute; left:0; top:0; width:100%; height:100vh; overflow:hidden; background:#000; color:#fff;
        font-family:'Poppins',Arial,sans-serif; display:flex; flex-direction:column; justify-content:center; padding:20px 0; }
      .wrap { width:100%; max-width:1180px; margin:0 auto; padding:0 24px; }
      .head { text-align:center; margin-bottom:clamp(14px,3.2vh,32px); }
      .eyebrow { margin:0 0 clamp(6px,1.5vh,14px); font-family:'Oswald',sans-serif; font-weight:500; font-size:clamp(16px,1.5vw,20px); letter-spacing:.02em; text-transform:uppercase; color:${ACCENT}; }
      h2 { margin:0 0 clamp(8px,1.8vh,18px); font-family:'Oswald',sans-serif; font-weight:700; font-size:clamp(34px,5vw,64px); line-height:1.05; letter-spacing:.005em; text-transform:uppercase; }
      h2 span { color:${ACCENT}; }
      .sub { margin:0; font-size:clamp(14px,1.4vw,18px); font-weight:400; }
      .tabs { display:flex; border-top:1px solid rgba(255,255,255,.4); border-bottom:1px solid rgba(255,255,255,.4); }
      .tab { flex:1; height:clamp(48px,8vh,74px); border:0; background:#000; color:#fff; cursor:pointer; font-family:'Oswald',sans-serif; font-weight:500;
        font-size:clamp(17px,1.7vw,23px); letter-spacing:.03em; text-transform:uppercase; transition:background .2s,color .2s; }
      .tab:hover { color:${ACCENT}; }
      .tab[aria-selected="true"] { background:#fff; color:${ACCENT}; }
      .tab:focus-visible, .media:focus-visible, .nav:focus-visible, .dot:focus-visible { outline:2px solid ${ACCENT}; outline-offset:-2px; }
      .viewport { overflow:hidden; margin-top:6px; }
      .track { display:flex; width:${N * 100}%; will-change:transform; }
      .panel { flex:0 0 ${100 / N}%; }
      .cards { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
      .card { min-width:0; }
      .frame { position:relative; height:clamp(250px,42vh,340px); border-radius:12px; overflow:hidden; background:#151515; }
      .media { position:absolute; inset:0; cursor:pointer; overflow:hidden; }
      .slides { display:flex; height:100%; transition:transform .45s cubic-bezier(.4,0,.2,1); }
      .slides img { flex:0 0 100%; width:100%; height:100%; object-fit:cover; display:block; user-select:none; }
      .info { position:absolute; left:0; right:0; bottom:0; padding:14px 16px 16px; pointer-events:none;
        background:linear-gradient(to bottom,rgba(40,40,58,.28),rgba(40,40,58,.6)); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); }
      .info h3 { margin:0 0 8px; font-size:clamp(14px,1.35vw,17px); font-weight:500; line-height:1.25; }
      .info p { margin:0; display:flex; align-items:center; gap:8px; font-size:clamp(12px,1.1vw,14px); font-weight:500; color:rgba(255,255,255,.92); }
      .nav { position:absolute; top:calc(50% - 38px); width:34px; height:34px; border-radius:50%; border:0; display:grid; place-items:center; cursor:pointer;
        background:rgba(0,0,0,.55); color:#fff; opacity:0; transition:opacity .2s,background .2s; }
      .nav:hover { background:${ACCENT}; }
      .prev { left:10px; } .next { right:10px; }
      .card:hover .nav, .card:focus-within .nav { opacity:1; }
      @media (hover:none) { .nav { opacity:.9; } }
      .dots { position:absolute; left:0; right:0; bottom:88px; display:flex; justify-content:center; }
      .dot { width:18px; height:18px; padding:0; border:0; background:none; cursor:pointer; display:grid; place-items:center; }
      .dot::before { content:''; width:7px; height:7px; border-radius:50%; background:rgba(255,255,255,.55); transition:background .2s,transform .2s; }
      .dot.on::before { background:${ACCENT}; transform:scale(1.25); }

      :host(.compact) .stage { position:relative; height:auto; min-height:100%; justify-content:flex-start; padding:44px 0 48px; }
      :host(.compact) .track { width:100%; transform:none !important; }
      :host(.compact) .panel { display:none; flex-basis:100%; }
      :host(.compact) .panel.on { display:block; }
      :host(.compact) .cards { grid-template-columns:repeat(2,1fr); }
      :host(.compact) .frame { height:clamp(220px,52vw,320px); }
      :host(.compact) .wrap { padding:0 16px; }
      :host(.compact) .tabs { overflow-x:auto; scrollbar-width:none; }
      :host(.compact) .tabs::-webkit-scrollbar { display:none; }
      :host(.compact) .tab { flex:0 0 auto; padding:0 22px; height:52px; }
    </style>
    <div class="stage">
      <div class="wrap">
        <header class="head">
          <p class="eyebrow">${esc(SECTION.eyebrow)}</p>
          <h2>${esc(SECTION.headingWhite)} <span>${esc(SECTION.headingAccent)}</span></h2>
          <p class="sub">${esc(SECTION.subtitle)}</p>
        </header>
        <div class="tabs" role="tablist">
          ${TABS.map((t, i) => `<button class="tab" role="tab" data-i="${i}" aria-selected="${i === 0}">${esc(t.name)}</button>`).join('')}
        </div>
      </div>
      <div class="viewport"><div class="wrap" style="max-width:none;padding:0">
        <div class="track">
          ${TABS.map((t, ti) => `<section class="panel${ti === 0 ? ' on' : ''}" role="tabpanel" aria-label="${esc(t.name)}"><div class="wrap"><div class="cards">${t.projects.map((p, pi) => card(ti, pi, p)).join('')}</div></div></section>`).join('')}
        </div>
      </div></div>
    </div>`;

    this.stage = root.querySelector('.stage');
    this.track = root.querySelector('.track');
    this.tabs = [...root.querySelectorAll('.tab')];
    this.panels = [...root.querySelectorAll('.panel')];
    this.setActive(0, true);

    root.addEventListener('click', e => {
      const tab = e.target.closest('.tab');
      if (tab) return this.goTo(+tab.dataset.i);
      const cardEl = e.target.closest('.card');
      if (!cardEl) return;
      const count = +cardEl.dataset.count, idx = +cardEl.dataset.idx;
      if (e.target.closest('.prev')) return this.setSlide(cardEl, (idx - 1 + count) % count);
      if (e.target.closest('.next')) return this.setSlide(cardEl, (idx + 1) % count);
      const dot = e.target.closest('.dot');
      if (dot) return this.setSlide(cardEl, +dot.dataset.i);
      if (e.target.closest('.media')) this.openLightbox(+cardEl.dataset.t, +cardEl.dataset.p, idx, e.target.closest('.media'));
    });
    root.addEventListener('keydown', e => {
      const m = e.target.closest && e.target.closest('.media');
      if (m && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); m.click(); }
    });
  }

  setSlide(cardEl, i) {
    cardEl.dataset.idx = i;
    cardEl.querySelector('.slides').style.transform = `translateX(${-i * 100}%)`;
    cardEl.querySelectorAll('.dot').forEach((d, k) => d.classList.toggle('on', k === i));
  }

  setActive(i, force) {
    if (i === this.active && !force) return;
    this.active = i;
    this.tabs.forEach((t, n) => t.setAttribute('aria-selected', n === i));
    this.panels.forEach((p, n) => { p.classList.toggle('on', n === i); p.inert = n !== i; });
  }

  place(mode, rect) {
    const s = this.stage.style;
    s.height = `calc(100vh - ${TOP_OFFSET}px)`;
    if (mode === 'fixed') { s.position = 'fixed'; s.top = TOP_OFFSET + 'px'; s.bottom = 'auto'; s.left = rect.left + 'px'; s.width = rect.width + 'px'; }
    else if (mode === 'after') { s.position = 'absolute'; s.top = 'auto'; s.bottom = '0'; s.left = '0'; s.width = '100%'; }
    else { s.position = 'absolute'; s.top = '0'; s.bottom = 'auto'; s.left = '0'; s.width = '100%'; }
  }

  update() {
    if (!this.stage) return;
    const narrow = window.innerWidth < PIN_MIN_WIDTH;
    this.classList.toggle('compact', narrow);
    const s = this.stage.style;
    if (narrow) { s.position = s.top = s.bottom = s.left = s.width = s.height = ''; this.track.style.transform = ''; return; }

    const N = TABS.length;
    const rect = this.getBoundingClientRect();
    const vh = window.innerHeight;
    const runway = Math.max(rect.height - (vh - TOP_OFFSET), 1);
    const p = clamp((TOP_OFFSET - rect.top) / runway, 0, 1);
    this.place(rect.top > TOP_OFFSET ? 'before' : (rect.bottom <= vh ? 'after' : 'fixed'), rect);

    // each tab rests for a moment, then glides to the next
    const t = p * (N - 1);
    const i = Math.min(Math.floor(t), N - 2);
    let e = clamp((t - i - DWELL) / (1 - 2 * DWELL), 0, 1);
    e = e * e * (3 - 2 * e);
    const pos = p >= 1 ? N - 1 : i + e;
    this.track.style.transform = `translate3d(${-pos * 100 / N}%,0,0)`;
    this.setActive(Math.round(pos));
  }

  goTo(i) {
    if (window.innerWidth < PIN_MIN_WIDTH) return this.setActive(i);
    const rect = this.getBoundingClientRect();
    const runway = Math.max(rect.height - (window.innerHeight - TOP_OFFSET), 1);
    const top = window.scrollY + rect.top - TOP_OFFSET;
    window.scrollTo({ top: top + (i / (TABS.length - 1)) * runway, behavior: 'smooth' });
  }

  // ---------- LIGHTBOX (lives on <body> so nothing in Wix can clip it) ----------
  mountLightbox() {
    if (this.lb) { document.body.appendChild(this.lb.host); return; }
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:none;';
    const r = host.attachShadow({ mode: 'open' });
    r.innerHTML = `<style>
      * { box-sizing:border-box; }
      .ov { position:absolute; inset:0; background:rgba(0,0,0,.95); display:flex; flex-direction:column; opacity:0; transition:opacity .2s; font-family:'Poppins',Arial,sans-serif; color:#fff; }
      .ov.show { opacity:1; }
      .main { position:relative; flex:1; min-height:0; }
      .big { position:absolute; top:56px; bottom:0; left:72px; right:72px; width:calc(100% - 144px); height:calc(100% - 56px); object-fit:contain; border-radius:8px; transition:opacity .15s; }
      .btn { position:absolute; width:44px; height:44px; border-radius:50%; border:0; background:rgba(255,255,255,.12); color:#fff; display:grid; place-items:center; cursor:pointer; transition:background .2s; }
      .btn:hover { background:${ACCENT}; }
      .btn:focus-visible, .th:focus-visible { outline:2px solid ${ACCENT}; outline-offset:2px; }
      .close { top:10px; right:14px; z-index:2; }
      .prev, .arr { top:50%; margin-top:-10px; }
      .prev { left:14px; } .next { right:14px; }
      .count { position:absolute; top:20px; left:20px; font-size:14px; color:rgba(255,255,255,.75); z-index:2; }
      .cap { text-align:center; padding:12px 16px 4px; }
      .cap b { font-weight:500; font-size:17px; } .cap span { color:${ACCENT}; font-size:14px; margin-left:10px; }
      .thumbs { display:flex; gap:8px; padding:8px 16px 18px; overflow-x:auto; justify-content:safe center; scrollbar-width:thin; }
      .th { flex:0 0 auto; width:76px; height:56px; padding:0; border:2px solid transparent; border-radius:6px; overflow:hidden; background:#111; cursor:pointer; opacity:.6; transition:opacity .2s,border-color .2s; }
      .th.on { opacity:1; border-color:${ACCENT}; }
      .th img { width:100%; height:100%; object-fit:cover; display:block; }
      @media (max-width:700px) { .big { left:8px; right:8px; width:calc(100% - 16px); } .btn.prev, .btn.next { top:auto; bottom:6px; margin:0; } .prev { left:8px; } .next { right:8px; } }
    </style>
    <div class="ov" role="dialog" aria-modal="true" aria-label="Project gallery">
      <div class="count"></div>
      <button class="btn close" aria-label="Close gallery">${ICON.close}</button>
      <div class="main">
        <img class="big" alt="">
        <button class="btn prev arr" aria-label="Previous photo">${ICON.left}</button>
        <button class="btn next arr" aria-label="Next photo">${ICON.right}</button>
      </div>
      <div class="cap"><b></b><span></span></div>
      <div class="thumbs"></div>
    </div>`;
    document.body.appendChild(host);

    const q = s => r.querySelector(s);
    this.lb = { host, ov: q('.ov'), big: q('.big'), count: q('.count'), cap: q('.cap'), thumbs: q('.thumbs'), imgs: [], i: 0, open: false, opener: null };
    const lb = this.lb;

    q('.close').addEventListener('click', () => this.closeLightbox());
    q('.prev').addEventListener('click', () => this.showLb(lb.i - 1));
    q('.next').addEventListener('click', () => this.showLb(lb.i + 1));
    lb.ov.addEventListener('click', e => { if (e.target === lb.ov || e.target.classList.contains('main') || e.target.classList.contains('cap')) this.closeLightbox(); });
    lb.thumbs.addEventListener('click', e => { const b = e.target.closest('.th'); if (b) this.showLb(+b.dataset.i); });
    lb.ov.addEventListener('wheel', e => e.preventDefault(), { passive: false });
    lb.ov.addEventListener('touchmove', e => { if (!e.target.closest || !e.target.closest('.thumbs')) e.preventDefault(); }, { passive: false });
    let x0 = null;
    q('.main').addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    q('.main').addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) this.showLb(lb.i + (dx < 0 ? 1 : -1));
    });
    this.onKey = e => {
      if (!lb.open) return;
      if (e.key === 'Escape') this.closeLightbox();
      else if (e.key === 'ArrowLeft') this.showLb(lb.i - 1);
      else if (e.key === 'ArrowRight') this.showLb(lb.i + 1);
      else return;
      e.preventDefault(); e.stopPropagation();
    };
  }

  openLightbox(ti, pi, idx, opener) {
    const lb = this.lb, p = TABS[ti].projects[pi];
    lb.imgs = imagesOf(ti, p);
    lb.opener = opener;
    lb.cap.querySelector('b').textContent = p.title;
    lb.cap.querySelector('span').textContent = p.location;
    lb.thumbs.innerHTML = lb.imgs.map((src, k) => `<button class="th" data-i="${k}" aria-label="Show photo ${k + 1}"><img src="${src}" alt="" draggable="false"></button>`).join('');
    lb.open = true;
    lb.host.style.display = 'block';
    window.addEventListener('keydown', this.onKey, true);
    this.showLb(idx);
    requestAnimationFrame(() => { lb.ov.classList.add('show'); lb.host.shadowRoot.querySelector('.close').focus({ preventScroll: true }); });
  }

  showLb(i) {
    const lb = this.lb, n = lb.imgs.length;
    lb.i = (i + n) % n;
    lb.big.style.opacity = '0';
    lb.big.src = lb.imgs[lb.i];
    lb.big.alt = lb.cap.querySelector('b').textContent + ' photo ' + (lb.i + 1);
    requestAnimationFrame(() => { lb.big.style.opacity = '1'; });
    lb.count.textContent = (lb.i + 1) + ' / ' + n;
    [...lb.thumbs.children].forEach((b, k) => b.classList.toggle('on', k === lb.i));
    const th = lb.thumbs.children[lb.i];
    if (th) lb.thumbs.scrollLeft = th.offsetLeft - (lb.thumbs.clientWidth - th.clientWidth) / 2;
    const prev = lb.host.shadowRoot.querySelectorAll('.arr');
    prev.forEach(b => { b.style.display = n > 1 ? '' : 'none'; });
  }

  closeLightbox(instant) {
    const lb = this.lb;
    if (!lb || !lb.open) return;
    lb.open = false;
    window.removeEventListener('keydown', this.onKey, true);
    lb.ov.classList.remove('show');
    const done = () => { lb.host.style.display = 'none'; };
    instant ? done() : setTimeout(done, 200);
    if (lb.opener && lb.opener.focus) lb.opener.focus({ preventScroll: true });
  }
}

if (!customElements.get('scroll-tabs')) customElements.define('scroll-tabs', ScrollTabs);
