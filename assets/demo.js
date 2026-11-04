// Wisp: the little "drag over it, get the answer" demo on the mode pages.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const tokenize = html => { const out = [], re = /(<[^>]+>|&[a-z#0-9]+;)/gi; let last = 0, m; while ((m = re.exec(html))) { out.push(...html.slice(last, m.index)); out.push(m[0]); last = re.lastIndex; } out.push(...html.slice(last)); return out; };

  document.querySelectorAll('[data-demo]').forEach(demo => {
    const q = s => demo.querySelector(s);
    let scenes;
    try { scenes = JSON.parse(q('script[type="application/json"]').textContent); } catch { return; }
    const win = q('.d-win'), body = q('.d-body'), title = q('.d-title'), sel = q('.d-sel'), dim = q('.d-dim'), panel = q('.d-panel'),
      ans = q('.d-ans'), foot = q('.d-foot'), mode = q('.d-mode'), hud = q('.d-hud'), cur = q('.d-cur');
    const fig = demo.closest('figure'), capKeys = fig && fig.querySelector('.dc-keys'), capText = fig && fig.querySelector('.dc-text');
    const kbds = s => s.keys.map(k => `<kbd>${k}</kbd>`).join('');

    function load(s) {
      win.classList.toggle('dark', !!s.dark); title.textContent = s.title; body.innerHTML = s.body; mode.textContent = s.mode;
      if (capKeys) capKeys.innerHTML = kbds(s);
      if (capText) capText.textContent = s.caption;
    }
    // where the selection and the answer panel go, measured from the live layout
    function layout(s) {
      const D = demo.getBoundingClientRect(), t = (body.querySelector('.target') || body).getBoundingClientRect();
      const pad = Math.max(5, D.width * .012), W = D.width, H = D.height;
      const r = { x: t.left - D.left - pad, y: t.top - D.top - pad, w: t.width + pad * 2, h: t.height + pad * 2 };
      ans.innerHTML = s.answer; foot.textContent = s.status;
      const pw = panel.offsetWidth, ph = panel.offsetHeight;
      const px = clamp(r.x + r.w * .1, 10, W - pw - 10);
      let py = r.y + r.h + 12;
      if (py + ph > H - 10) py = r.y - ph - 12 >= 10 ? r.y - ph - 12 : H - ph - 10;
      return { r, px, py, pw, ph, W, H };
    }
    const moveCur = (x, y, ms) => { cur.style.transitionDuration = ms + 'ms'; cur.style.transform = `translate(${x}px, ${y}px)`; };
    function finalFrame(s) {
      load(s); const L = layout(s);
      sel.style.transition = 'none'; panel.style.transition = 'none';
      Object.assign(sel.style, { left: L.r.x + 'px', top: L.r.y + 'px', width: L.r.w + 'px', height: L.r.h + 'px', opacity: 1 });
      Object.assign(panel.style, { left: L.px + 'px', top: L.py + 'px' }); panel.classList.add('on');
      moveCur(L.px + L.pw - 30, L.py + L.ph - 14, 0);
      void demo.offsetWidth; sel.style.transition = ''; panel.style.transition = '';
    }
    async function type(html) {
      const tk = tokenize(html); let i = 0;
      while (i < tk.length) {
        i++; while (i < tk.length && tk[i - 1].length > 1 && tk[i - 1][0] === '<') i++;
        ans.innerHTML = tk.slice(0, i).join('') + '<span class="tcaret"></span>';
        await sleep(24);
      }
      ans.innerHTML = html;
    }
    async function play(s) {
      win.classList.add('swap'); panel.classList.remove('on'); sel.style.opacity = 0; sel.classList.remove('flash');
      await sleep(480);
      load(s); win.classList.remove('swap'); foot.textContent = 'READY';
      await sleep(600);
      const L = layout(s); ans.innerHTML = '';
      moveCur(L.r.x - 18, L.r.y - 14, 650); await sleep(720);
      hud.innerHTML = kbds(s); hud.classList.add('on'); await sleep(260);
      hud.classList.add('down'); await sleep(520); hud.classList.remove('down');
      dim.classList.add('on'); cur.classList.add('x'); moveCur(L.r.x, L.r.y, 300); await sleep(380); hud.classList.remove('on');
      sel.style.transition = 'none'; Object.assign(sel.style, { left: L.r.x + 'px', top: L.r.y + 'px', width: '0px', height: '0px', opacity: 1 });
      void sel.offsetWidth; sel.style.transition = '';
      sel.style.width = L.r.w + 'px'; sel.style.height = L.r.h + 'px'; moveCur(L.r.x + L.r.w, L.r.y + L.r.h, 900);
      await sleep(1000);
      sel.classList.add('flash'); cur.classList.remove('x'); dim.classList.remove('on');
      Object.assign(panel.style, { left: L.px + 'px', top: L.py + 'px' });
      ans.innerHTML = '<span class="working"><i class="spin"></i>Working…</span>'; foot.textContent = 'WORKING';
      panel.classList.add('on');
      moveCur(Math.min(L.px + L.pw + 16, L.W - 26), L.py + L.ph * .8, 900);
      await sleep(1000);
      await type(s.answer);
      foot.textContent = s.status;
      await sleep(3400);
    }

    // first frame right away (also what reduced-motion users see), then loop while on screen
    finalFrame(scenes[0]);
    if (reduce) { addEventListener('resize', () => finalFrame(scenes[0])); return; }
    let visible = false, wake = null, running = false;
    async function loop() {
      running = true; let i = 0;
      await sleep(1600);
      for (;;) {
        if (!visible || document.hidden) await new Promise(r => { wake = r; });
        i = (i + 1) % scenes.length;
        if (scenes.length === 1 && i === 0) i = 0;
        await play(scenes[i]);
      }
    }
    const kick = () => { if (visible && !document.hidden && wake) { const w = wake; wake = null; w(); } };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !running) loop(); kick(); }, { threshold: .25 }).observe(demo);
    document.addEventListener('visibilitychange', kick);
    let rt = 0;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (panel.classList.contains('on')) { const s = scenes.find(x => x.title === title.textContent) || scenes[0]; const L = layout(s); Object.assign(sel.style, { left: L.r.x + 'px', top: L.r.y + 'px', width: L.r.w + 'px', height: L.r.h + 'px' }); Object.assign(panel.style, { left: L.px + 'px', top: L.py + 'px' }); } }, 150); });
  });
})();
