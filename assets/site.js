// Wisp: behavior shared by every page (nav, menus, reveal on scroll, tilt cards, copy buttons, phone buy bar).
(() => {
  const d = document, root = d.documentElement;
  const $ = (s, r = d) => r.querySelector(s), $$ = (s, r = d) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // reveal on scroll. Content is only hidden once this script runs, so it can never get stuck invisible.
  if ('IntersectionObserver' in window && !reduce) {
    root.classList.add('rv-ready');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
      { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    $$('.rv').forEach(el => io.observe(el));
  }

  // nav background once the page scrolls
  const nav = $('#nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // "Modes" dropdown (desktop)
  $$('.dd').forEach(dd => {
    const btn = $('.dd-btn', dd); let t = 0;
    const isOpen = () => dd.classList.contains('open');
    const set = v => { dd.classList.toggle('open', v); btn.setAttribute('aria-expanded', String(v)); };
    btn.addEventListener('click', e => {
      if (fine && e.detail > 0 && dd.matches(':hover')) { set(true); return; } // already opened by hovering
      set(!isOpen());
    });
    if (fine) {
      dd.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { clearTimeout(t); set(true); } });
      dd.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') t = setTimeout(() => set(false), 140); });
    }
    dd.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) { set(false); btn.focus(); } });
    dd.addEventListener('focusout', e => { if (!dd.contains(e.relatedTarget)) set(false); });
    d.addEventListener('click', e => { if (!dd.contains(e.target)) set(false); });
  });

  // phone menu
  const mbtn = $('.menu-btn'), mnav = $('#mnav');
  if (mbtn && mnav) {
    const isOpen = () => mbtn.getAttribute('aria-expanded') === 'true';
    const set = v => {
      mbtn.setAttribute('aria-expanded', String(v)); mbtn.setAttribute('aria-label', v ? 'Close menu' : 'Open menu');
      root.classList.toggle('menu-open', v); mnav.hidden = !v; mnav.classList.toggle('in', v);
    };
    mbtn.addEventListener('click', () => set(!isOpen()));
    mnav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    d.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) { set(false); mbtn.focus(); } });
    mnav.addEventListener('focusout', e => { if (isOpen() && e.relatedTarget && !mnav.contains(e.relatedTarget) && e.relatedTarget !== mbtn) set(false); });
    addEventListener('resize', () => { if (innerWidth > 960 && isOpen()) set(false); });
  }

  // copy buttons (the LAUNCH code)
  let live = null;
  const say = msg => {
    if (!live) { live = d.createElement('p'); live.className = 'sr-only'; live.setAttribute('role', 'status'); d.body.append(live); }
    live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 30);
  };
  $$('[data-copy]').forEach(b => {
    const label = b.textContent;
    b.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copied!'; say(`Copied ${b.dataset.copy}`); }
      catch { b.textContent = b.dataset.copy; }
      setTimeout(() => { b.textContent = label; }, 1600);
    });
  });

  // 3D tilt cards (mouse only, never with reduced motion)
  if (fine && !reduce) $$('.tilt').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', ((x - .5) * 12).toFixed(2) + 'deg'); el.style.setProperty('--rx', ((.5 - y) * 10).toFixed(2) + 'deg');
      el.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); el.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      el.classList.add('active');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.classList.remove('active'); });
  });

  // phone buy bar: shows after the first screen, hides while a buy button is already on screen
  const bar = $('#buybar');
  if (bar && 'IntersectionObserver' in window) {
    d.body.classList.add('has-buybar');
    const onScreen = new Set();
    const update = () => bar.classList.toggle('show', scrollY > innerHeight * .7 && onScreen.size === 0 && !root.classList.contains('menu-open'));
    const io = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)); update(); });
    $$('[data-buybar-hide]').forEach(el => io.observe(el));
    addEventListener('scroll', update, { passive: true });
    if (mbtn) mbtn.addEventListener('click', update);
  }
})();
