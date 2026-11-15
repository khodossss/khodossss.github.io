/* Alexander Khodos — the pipeline run on its author.
   00 ingest/01 detect: ASCII decode of the portrait + detection boxes; 02 extract/03 link: entity tagging into a graph;
   04 segment: SAR mask sweep; 05 deploy: toy loops of the three repos. Reduced motion = every end state at once. */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  document.documentElement.classList.add('js');
  const G = window.gsap && window.ScrollTrigger ? window.gsap : null;
  if (G) G.registerPlugin(ScrollTrigger);
  const onView = (el, fn, opts = {}) => {
    const io = new IntersectionObserver(es => es.forEach(e => fn(e.isIntersecting, e)), opts);
    io.observe(el); return io;
  };

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!RM && window.Lenis && G) {
    lenis = new Lenis({ lerp: 0.12 });
    lenis.on('scroll', ScrollTrigger.update);
    G.ticker.add(t => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'), t = id.length > 1 && $(id);
    if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { offset: -64 }); else t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
    if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
  }));

  /* ---------- nav: current stage ---------- */
  const links = new Map($$('.pipe a').map(a => [a.getAttribute('href').slice(1), a]));
  links.forEach((a, id) => {
    const s = document.getElementById(id); if (!s) return;
    onView(s, vis => { if (vis) { links.forEach(l => l.classList.remove('on')); a.classList.add('on'); } }, { rootMargin: '-45% 0px -50% 0px' });
  });

  /* ---------- typed title (brand behaviour: type 1.3 s, hold, erase 0.8 s) ---------- */
  const typed = $('#typed');
  if (!RM && typed) {
    const titles = ['AI Engineer', 'Data Scientist', 'LLM Engineer', 'AI Developer'];
    (async () => {
      let i = 2;
      for (;;) {
        const t = titles[i];
        await sleep(1600);
        for (let k = t.length - 1; k >= 0; k--) { typed.textContent = t.slice(0, k); await sleep(800 / t.length); }
        i = (i + 1) % titles.length;
        const n = titles[i];
        for (let k = 1; k <= n.length; k++) { typed.textContent = n.slice(0, k); await sleep(1300 / n.length); }
      }
    })();
  }

  /* ---------- 00/01 portrait: ASCII decode, lens, detection boxes ---------- */
  const hero = $('#whoami'), portrait = $('#portrait'), cv = $('#ascii');
  const ctx = cv.getContext('2d');
  const RAMP = ' .`:-=+*cox%#@';
  const INK = ['rgba(0,255,136,.28)', 'rgba(0,255,136,.5)', 'rgba(0,255,136,.78)', 'rgba(190,255,222,1)'];
  let W = 0, H = 0, cols = 0, rows = 0, cw = 0, chh = 0, lum = null, asciiOK = true;
  let state = 'ok', busy = false;
  const lens = { r: 0, x: 0, y: 0, tx: 0, ty: 0, target: 0, raf: 0 };
  const imgFor = s => $(`.ph[data-state="${s}"]`);
  const ready = img => (img.complete && img.naturalWidth) ? Promise.resolve() : new Promise(r => {
    img.loading = 'eager'; img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true });
  });
  const diag = () => Math.hypot(W, H) + 20;
  const setLens = () => {
    cv.style.setProperty('--lx', lens.x + 'px'); cv.style.setProperty('--ly', lens.y + 'px'); cv.style.setProperty('--lr', (lens.r - 2) + 'px');
  };
  function measure() {
    const r = portrait.getBoundingClientRect();
    W = r.width; H = r.height;
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const fs = W < 560 ? 9 : 11;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `500 ${fs}px "JetBrains Mono", monospace`; ctx.textBaseline = 'top';
    cw = fs * 0.62; chh = fs * 1.16;
    cols = Math.ceil(W / cw); rows = Math.ceil(H / chh);
  }
  function sample(img) {
    const off = document.createElement('canvas'); off.width = cols; off.height = rows;
    const o = off.getContext('2d', { willReadFrequently: true });
    const iw = img.naturalWidth, ih = img.naturalHeight, s = Math.max(W / iw, H / ih), sw = W / s, sh = H / s;
    o.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, cols, rows);
    const d = o.getImageData(0, 0, cols, rows).data;
    lum = new Float32Array(cols * rows);
    let mx = 0;
    for (let i = 0; i < lum.length; i++) { const v = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255; lum[i] = v; if (v > mx) mx = v; }
    const k = 1 / Math.max(0.3, mx);
    for (let i = 0; i < lum.length; i++) lum[i] = Math.pow(Math.min(1, lum[i] * k), 0.85);
  }
  function draw(p) { // p: 0..1 scan progress; rows below the scan are noise
    ctx.fillStyle = '#080c10'; ctx.fillRect(0, 0, W, H);
    const scanRow = p * rows;
    for (let b = 0; b < 4; b++) {
      ctx.fillStyle = INK[b];
      for (let y = 0; y < rows; y++) {
        const resolved = y < scanRow;
        for (let x = 0; x < cols; x++) {
          const L = lum[y * cols + x];
          if (L < 0.06) continue;
          const bucket = Math.min(3, (L * 4) | 0);
          if (resolved) {
            if (bucket !== b) continue;
            ctx.fillText(RAMP[Math.min(RAMP.length - 1, (L * (RAMP.length - 1)) | 0)], x * cw, y * chh);
          } else if (b === 0 && Math.random() < 0.55) {
            ctx.fillText(RAMP[1 + ((Math.random() * (RAMP.length - 1)) | 0)], x * cw, y * chh);
          }
        }
      }
    }
    if (p < 1) { ctx.fillStyle = 'rgba(0,255,136,.9)'; ctx.fillRect(0, scanRow * chh, W, 2); }
  }
  function scramble(ms) {
    return new Promise(res => {
      const t0 = performance.now();
      const step = now => { const p = Math.min(1, (now - t0) / ms); draw(p); if (p < 1) requestAnimationFrame(step); else res(); };
      requestAnimationFrame(step);
    });
  }
  const tweenR = (r, d, ease) => G ? new Promise(res => G.to(lens, { r, duration: d, ease, onUpdate: setLens, onComplete: res })) : (lens.r = r, setLens(), Promise.resolve());
  function boxesIn() {
    const bs = $$(`.boxes[data-state="${state}"] .box`);
    if (G && !RM) G.fromTo(bs, { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, duration: .35, ease: 'power3.out', stagger: .14 });
  }
  async function decode(next, first) {
    busy = true;
    const img = imgFor(next);
    await ready(img);
    if (!first) { lens.x = W * .53; lens.y = H * .48; await tweenR(diag(), .45, 'power2.in'); }
    measure(); sample(img);
    $$('.ph').forEach(p => p.classList.toggle('on', p === img));
    state = next; hero.dataset.state = next;
    if (first) { draw(0); lens.x = W * .53; lens.y = H * .48; lens.r = diag(); setLens(); }
    $$('.boxes .box').forEach(b => b.style.opacity = 0);
    await scramble(first ? 1500 : 850);
    await sleep(first ? 250 : 120);
    await tweenR(0, first ? 1.1 : .8, 'power3.inOut');
    boxesIn();
    lens.target = 0; lens.r = 0; setLens();
    busy = false;
  }
  function lensLoop() {
    if (busy) { lens.raf = 0; return; }
    lens.r += (lens.target - lens.r) * .18; lens.x += (lens.tx - lens.x) * .25; lens.y += (lens.ty - lens.y) * .25;
    setLens();
    const moving = Math.abs(lens.target - lens.r) > .5 || Math.abs(lens.tx - lens.x) > .5 || Math.abs(lens.ty - lens.y) > .5;
    lens.raf = moving ? requestAnimationFrame(lensLoop) : 0;
  }
  hero.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || busy || !asciiOK || RM) return;
    const r = portrait.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const inside = x > 0 && y > 0 && x < r.width && y < r.height;
    if (inside && lens.target === 0) { lens.x = x; lens.y = y; }
    lens.tx = x; lens.ty = y; lens.target = inside ? Math.min(150, W * .19) : 0;
    if (!lens.raf) lens.raf = requestAnimationFrame(lensLoop);
  });
  hero.addEventListener('pointerleave', () => { if (busy) return; lens.target = 0; if (!lens.raf) lens.raf = requestAnimationFrame(lensLoop); });

  (async () => {
    if (RM) return;
    try {
      await Promise.race([document.fonts.load('500 11px "JetBrains Mono"'), sleep(900)]);
      await ready(imgFor('ok'));
      measure(); sample(imgFor('ok'));
    } catch (e) { asciiOK = false; cv.style.display = 'none'; return; }
    await decode('ok', true);
  })();
  let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { if (!asciiOK || RM || busy) return; measure(); sample(imgFor(state)); draw(1); }, 200); });

  // embedding readout — six of 512 dimensions, jittering while the hero is on screen
  const emb = $('#emb');
  const base = { fire: [0.0213, -0.1131, 0.0478, 0.0902, -0.0365, 0.0711], ok: [0.0198, -0.1042, 0.0521, 0.0867, -0.0402, 0.0659] };
  const fmt = v => (v >= 0 ? '+' : '') + v.toFixed(4);
  const renderEmb = j => { const v = base[state].map(b => b + (Math.random() - .5) * j); emb.textContent = v.slice(0, 3).map(fmt).join('  ') + '\n' + v.slice(3).map(fmt).join('  '); };
  renderEmb(0);
  if (!RM) { let iv = 0; onView(hero, vis => { clearInterval(iv); if (vis) iv = setInterval(() => renderEmb(busy ? .2 : .004), 140); }); }

  /* ---------- 02/03 entity extraction → graph (signature) ---------- */
  const svg = $('#graph'), gE = $('.edges', svg), gN = $('.nodes', svg);
  const narrow = matchMedia('(max-width: 980px)').matches, phone = matchMedia('(max-width: 600px)').matches;
  const VW = phone ? 380 : 600, VH = phone ? 1000 : 740;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const NS = 'http://www.w3.org/2000/svg';
  const jobs = $$('.job');
  const N = new Map(), LINKS = [];
  const node = (id, t, label) => { if (!N.has(id)) N.set(id, { id, t, label, x: 0, y: 0, shown: false, docs: [] }); return N.get(id); };
  const root = node('root', 'root', 'Alexander Khodos');
  const acts = jobs.map((job, k) => {
    const hub = node('hub' + k, 'hub', job.dataset.hub);
    LINKS.push({ a: root, b: hub });
    const marks = $$('mark', job), ents = [];
    marks.forEach(m => {
      const n = node('e:' + m.dataset.n, m.dataset.t, m.dataset.n);
      if (!ents.includes(n)) { ents.push(n); n.docs.push(k); LINKS.push({ a: hub, b: n }); }
    });
    return { job, hub, marks, ents };
  });

  // deterministic layout: springs + repulsion, then label-box collision
  (function layout() {
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const nodes = [...N.values()], cx = VW / 2, cy = VH / 2;
    const tw = n => n.label.length * (n.t === 'root' ? 9.6 : 7.3);
    root.x = cx; root.y = cy;
    const ang = [-2.45, -0.7, 0.75, 2.4];
    const HP = phone ? [[.3, .14], [.7, .36], [.7, .66], [.3, .88]] : [[.24, .16], [.76, .2], [.74, .8], [.26, .84]];
    acts.forEach((a, k) => { a.hub.x = VW * HP[k][0]; a.hub.y = VH * HP[k][1]; a.hub.pin = true; });
    acts.forEach(a => a.ents.forEach(n => { if (n.x) return; const t = rnd() * 6.28; n.x = a.hub.x + Math.cos(t) * 90; n.y = a.hub.y + Math.sin(t) * 90; }));
    const box = n => {
      const w = tw(n);
      if (n.t === 'root') return [n.x - w / 2 - 24, n.y - 34, n.x + w / 2 + 24, n.y + 52];
      if (n.t === 'hub') return [n.x - w / 2 - 4, n.y - 26, n.x + w / 2 + 4, n.y + 8];
      return n.x >= cx ? [n.x - 7, n.y - 10, n.x + 12 + w, n.y + 10] : [n.x - 12 - w, n.y - 10, n.x + 7, n.y + 10];
    };
    const clamp = n => {
      const w = tw(n);
      if (n.t === 'root') return;
      if (n.t === 'hub') { n.x = Math.max(w / 2 + 10, Math.min(VW - w / 2 - 10, n.x)); n.y = Math.max(36, Math.min(VH - 14, n.y)); return; }
      if (n.x >= cx) n.x = Math.min(VW - 16 - w, n.x); else n.x = Math.max(16 + w, n.x);
      n.y = Math.max(16, Math.min(VH - 16, n.y));
    };
    for (let it = 0; it < 520; it++) {
      const al = 1 - it / 520;
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const p = nodes[i], q = nodes[j]; let dx = q.x - p.x, dy = q.y - p.y; const d2 = dx * dx + dy * dy + .01;
        if (d2 > 200 * 200) continue;
        const f = (phone ? 1800 : 3400) / d2 * al, d = Math.sqrt(d2); dx /= d; dy /= d;
        if (!p.pin && p !== root) { p.x -= dx * f; p.y -= dy * f; } if (!q.pin && q !== root) { q.x += dx * f; q.y += dy * f; }
      }
      LINKS.forEach(l => {
        const T = l.a === root ? 260 : (phone ? 100 : 105); let dx = l.b.x - l.a.x, dy = l.b.y - l.a.y; const d = Math.hypot(dx, dy) || 1, k = (d - T) / d * .08;
        if (!l.b.pin) { l.b.x -= dx * k; l.b.y -= dy * k; } if (l.a !== root && !l.a.pin) { l.a.x += dx * k * .5; l.a.y += dy * k * .5; }
      });
      nodes.forEach(n => { if (n === root || n.pin) return; n.x += (cx - n.x) * .003; n.y += (cy - n.y) * .003;
        const dx = n.x - root.x, dy = n.y - root.y, d = Math.hypot(dx, dy) || 1, R = phone ? 95 : 125;
        if (d < R) { n.x = root.x + dx / d * R; n.y = root.y + dy / d * R; }
        clamp(n); });
    }
    for (let it = 0; it < 400; it++) {
      let moved = false;
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const p = nodes[i], q = nodes[j], A = box(p), B = box(q);
        const ox = Math.min(A[2], B[2]) - Math.max(A[0], B[0]), oy = Math.min(A[3], B[3]) - Math.max(A[1], B[1]);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        const s = (p.y <= q.y ? -1 : 1) * (oy / 2 + .5);
        const fp = p === root || p.pin, fq = q === root || q.pin, ks = fp || fq ? 2 : 1;
        if (!fp) p.y += s * ks; if (!fq) q.y -= s * ks;
        if (ox < 30) { const sx = (p.x <= q.x ? -1 : 1) * (ox / 2 + .5) * .5; if (!fp) p.x += sx; if (!fq) q.x -= sx; }
        clamp(p); clamp(q);
      }
      if (!moved) break;
    }
  })();

  // build SVG
  const el = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  LINKS.forEach(l => {
    l.el = el('line', { x1: l.a.x.toFixed(1), y1: l.a.y.toFixed(1), x2: l.b.x.toFixed(1), y2: l.b.y.toFixed(1), pathLength: 1, class: l.a === root ? 'root' : '' });
    gE.appendChild(l.el);
  });
  N.forEach(n => {
    const g = el('g', { class: 'n', 'data-t': n.t, transform: `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})` });
    const r = n.t === 'root' ? 9 : n.t === 'hub' ? 6 : 4.5;
    g.appendChild(el('circle', { r }));
    const t = el('text', {});
    t.textContent = n.label;
    if (n.t === 'root') { t.setAttribute('text-anchor', 'middle'); t.setAttribute('y', 30); }
    else if (n.t === 'hub') { t.setAttribute('text-anchor', 'middle'); t.setAttribute('y', -12); }
    else if (n.x >= VW / 2) { t.setAttribute('x', 10); t.setAttribute('y', 4); }
    else { t.setAttribute('x', -10); t.setAttribute('y', 4); t.setAttribute('text-anchor', 'end'); }
    g.appendChild(t); gN.appendChild(g); n.el = g;
  });
  root.el.classList.add('on'); root.shown = true;

  const cNodes = $('#g-nodes'), cEdges = $('#g-edges'), cMerged = $('#g-merged'), cap = $('#g-cap');
  let nNodes = 1, nEdges = 0, nMerged = 0;
  const counts = () => { if (cNodes) { cNodes.textContent = nNodes; cEdges.textContent = nEdges; cMerged.textContent = nMerged; } };
  const showNode = n => { if (n.shown) return false; n.shown = true; n.el.classList.add('on'); nNodes++; return true; };
  const showLink = (a, b) => { const l = LINKS.find(l => l.a === a && l.b === b); if (l && !l.on) { l.on = true; l.el.classList.add('on'); nEdges++; } };
  const flash = n => { n.el.classList.remove('flash'); void n.el.getBBox(); n.el.classList.add('flash'); };

  let capOwner = -1;
  const tagged = acts.map(() => false), graphed = acts.map(() => false);
  function tag(k, fast) {
    if (tagged[k]) return; tagged[k] = true;
    acts[k].marks.forEach((m, i) => fast ? m.classList.add('on') : setTimeout(() => m.classList.add('on'), 300 + i * 150));
  }
  function graph(k, fast) {
    if (graphed[k]) return; graphed[k] = true;
    const a = acts[k], seen = new Set(), merges = {};
    capOwner = Math.max(capOwner, k);
    const say = t => { if (cap && capOwner === k) cap.textContent = t; };
    const step = (fn, i) => fast ? fn() : setTimeout(fn, 300 + i * 150);
    step(() => { showNode(a.hub); showLink(root, a.hub); counts(); say(`${a.hub.label} · reading…`); }, -1.5);
    a.marks.forEach((m, i) => step(() => {
      const n = N.get('e:' + m.dataset.n);
      if (!showNode(n)) { nMerged++; merges[n.label] = (merges[n.label] || 1) + 1; flash(n); }
      seen.add(n); showLink(a.hub, n); counts();
    }, i));
    step(() => {
      const m = Object.entries(merges).map(([l, c]) => `${l}`).join(', ');
      say(`${a.hub.label} · ${a.marks.length} mentions → ${seen.size} entities` + (m ? ` · merged: ${m}` : ''));
    }, a.marks.length + 1);
  }
  const allNow = () => acts.forEach((a, k) => { tag(k, true); graph(k, true); });
  const mobile = narrow;
  if (RM) allNow();
  else {
    jobs.forEach((job, k) => onView(job, vis => {
      if (!vis) return;
      for (let j = 0; j <= k; j++) { tag(j, j < k); if (!mobile) graph(j, j < k); }
    }, { rootMargin: '0px 0px -35% 0px' }));
    if (mobile) onView($('.graph'), vis => {
      if (!vis) return;
      acts.forEach((a, k) => setTimeout(() => { tag(k, true); graph(k, false); }, k * 1500));
    }, { threshold: .35 });
  }

  /* ---------- 04 SAR: mask sweep ---------- */
  const sar = $('#publications'), mask = $('.sar-mask'), scan = $('.sar-scan'), lakesEl = $('#lakes'), waterEl = $('#water');
  if (!RM && G) {
    G.set(mask, { clipPath: 'inset(0% 0% 100% 0%)' }); lakesEl.textContent = '0'; waterEl.textContent = '0.0';
    let done = false;
    onView(sar, vis => {
      if (!vis || done) return; done = true;
      const c = { l: 0, w: 0 }, fig = $('.sar-fig');
      G.timeline()
        .set(scan, { opacity: 1, y: 0 })
        .to(scan, { y: () => fig.offsetHeight - 2, duration: 2.4, ease: 'none' }, 0)
        .to(mask, { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.4, ease: 'none' }, 0)
        .to(c, { l: 282, w: 27.2, duration: 2.4, ease: 'none', onUpdate: () => { lakesEl.textContent = Math.round(c.l); waterEl.textContent = c.w.toFixed(1); } }, 0)
        .to(scan, { opacity: 0, duration: .3 });
    }, { threshold: .4 });
  }
  const mt = $('#mask-toggle');
  mt.addEventListener('click', () => {
    const on = mt.getAttribute('aria-pressed') !== 'true';
    mt.setAttribute('aria-pressed', on); mt.textContent = 'mask: ' + (on ? 'on' : 'off'); sar.classList.toggle('off', !on);
  });

  /* ---------- 05 toy loops ---------- */
  function loopWhileVisible(el, tick, ms) {
    let iv = 0; tick();
    if (RM) return;
    onView(el, vis => { clearInterval(iv); if (vis) iv = setInterval(tick, ms); }, { threshold: .2 });
  }
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  // verifyn
  (() => {
    const box = $('#sim-verifyn'), out = $('.sim-out', box), stamp = $('.stamp', box);
    const claims = [
      { c: 'Lightning never strikes the same place twice.', q: 'lightning strikes same place twice', p: '0.93',
        s: [['national weather service', '0.95', 'refutes'], ['encyclopedia', '0.92', 'refutes'], ['viral facts blog', '0.18', 'supports']], v: 'FALSE', k: 'r' },
      { c: 'Honey from ancient Egyptian tombs was still edible.', q: 'egyptian tomb honey edible', p: '0.88',
        s: [['science magazine', '0.93', 'supports'], ['museum archive', '0.90', 'supports'], ['quiz site', '0.31', 'supports']], v: 'TRUE', k: 'g' },
      { c: 'Goldfish have a three-second memory.', q: 'goldfish memory span study', p: '0.91',
        s: [['university study', '0.94', 'refutes'], ['pet forum', '0.27', 'supports'], ['science desk', '0.89', 'refutes']], v: 'FALSE', k: 'r' },
    ];
    const script = cl => [
      `<span class="d">claim:</span> "${esc(cl.c)}"`,
      `<span class="c">deberta</span> pre-filter · check-worthy <span class="g">p=${cl.p}</span>`,
      `<span class="a">Thought:</span> need independent evidence.`,
      `<span class="a">Action:</span> web_search("${cl.q}")`,
      `<span class="a">Observation:</span> 9 results · 3 kept`,
      ...cl.s.map(([n, r, v]) => `  ${n.padEnd(26)} rep ${r}  <span class="${v === 'refutes' ? 'r' : 'g'}">${v}</span>`),
      `<span class="a">Final:</span> weighted by source reputation`,
    ];
    let ci = 0, li = 0, lines = script(claims[0]), hold = 0;
    const show = (cl) => { stamp.textContent = cl.v; stamp.style.color = cl.k === 'r' ? 'var(--red)' : 'var(--green)'; stamp.classList.add('on'); };
    if (RM) { out.innerHTML = lines.map(l => `<li>${l}</li>`).join(''); show(claims[0]); return; }
    loopWhileVisible(box, () => {
      if (hold) { if (--hold === 0) { stamp.classList.remove('on'); out.innerHTML = ''; ci = (ci + 1) % claims.length; lines = script(claims[ci]); li = 0; } return; }
      if (li < lines.length) { out.insertAdjacentHTML('beforeend', `<li>${lines[li++]}</li>`); if (li === lines.length) { show(claims[ci]); hold = 7; } }
    }, 480);
  })();

  // evoprompts: 4 genes, crossover + mutation, fitness from a hidden table
  (() => {
    const box = $('#sim-evo'), out = $('.sim-out', box), genEl = $('.gen', box), bestEl = $('.bestfit', box);
    const genes = [
      ['You are an assistant.', 'You are a fact-checker.', 'You are a careful analyst.', 'You are a domain expert.'],
      ['Be brief.', 'Be precise.', 'Be thorough.', 'Avoid speculation.'],
      ['Think step by step.', 'Cite the evidence.', 'List assumptions first.', 'Check each claim.'],
      ['Answer in JSON.', 'Answer in one line.', 'Use bullet points.', 'End with a verdict.'],
    ];
    const value = [[.02, .1, .14, .08], [.04, .13, .06, .1], [.1, .16, .05, .12], [.05, .02, .04, .13]];
    let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const fit = g => Math.min(.97, .38 + g.reduce((s, v, i) => s + value[i][v], 0) + (rnd() - .5) * .04);
    const mk = () => { const g = genes.map(o => (rnd() * o.length) | 0); return { g, f: fit(g), from: [], mut: -1 }; };
    let pop, gen;
    const reset = () => { pop = Array.from({ length: 5 }, mk).sort((a, b) => b.f - a.f); gen = 0; };
    const render = () => {
      genEl.textContent = gen; bestEl.textContent = pop[0].f.toFixed(2);
      out.innerHTML = pop.map(p => `<li><span class="fit">${p.f.toFixed(2)}</span><span>${p.g.map((v, i) => {
        const t = esc(genes[i][v]); return i === p.mut ? `<span class="mut">${t}</span>` : p.from[i] === 1 ? `<span class="x">${t}</span>` : t; }).join(' ')}</span></li>`).join('');
    };
    reset();
    const step = () => {
      if (gen >= 24) { reset(); render(); return; }
      gen++;
      const [A, B] = pop, kids = [];
      for (let c = 0; c < 3; c++) {
        const from = A.g.map(() => rnd() < .5 ? 0 : 1), g = A.g.map((v, i) => from[i] ? B.g[i] : v);
        let mut = -1; if (rnd() < .8) { mut = (rnd() * 4) | 0; g[mut] = (rnd() * genes[mut].length) | 0; }
        kids.push({ g, f: fit(g), from, mut });
      }
      pop = [A, B, ...kids].sort((a, b) => b.f - a.f);
      render();
    };
    if (RM) { for (let i = 0; i < 12; i++) step(); return; }
    render(); loopWhileVisible(box, step, 1300);
  })();

  // routent: disjoint LinUCB over [1, hard] features
  (() => {
    const box = $('#sim-route'), out = $('.sim-out', box), tEl = $('.t', box), avgEl = $('.avg', box), last = $('.last', box), learned = $('.learned', box);
    const arms = [{ n: 'large', easy: .66, hard: .9 }, { n: 'medium', easy: .8, hard: .63 }, { n: 'small', easy: .87, hard: .34 }];
    const qs = { easy: ['extract a date', 'classify sentiment', 'translate a greeting', 'fix a typo'],
      hard: ['summarize a 40-page contract', 'multi-hop question over 3 docs', 'write a SQL migration', 'trace an entity graph'] };
    let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    out.innerHTML = arms.map(a => `<li><span>${a.n}</span><span class="track"><span class="fill"></span></span><span class="n">0</span></li>`).join('');
    const rowsEl = $$('li', out);
    let st, t, sum;
    const reset = () => { st = arms.map(() => ({ A: [[1, 0], [0, 1]], b: [1, 0], n: 0 })); t = 0; sum = 0; };
    const inv = m => { const d = m[0][0] * m[1][1] - m[0][1] * m[1][0]; return [[m[1][1] / d, -m[0][1] / d], [-m[1][0] / d, m[0][0] / d]]; };
    const mv = (m, v) => [m[0][0] * v[0] + m[0][1] * v[1], m[1][0] * v[0] + m[1][1] * v[1]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
    reset();
    const step = () => {
      if (t >= 80) reset();
      t++;
      const hard = rnd() < .5, x = [1, hard ? 1 : 0], q = qs[hard ? 'hard' : 'easy'][(rnd() * 4) | 0];
      const ucb = st.map(s => { const Ai = inv(s.A), th = mv(Ai, s.b); return dot(th, x) + .4 * Math.sqrt(dot(x, mv(Ai, x))); });
      const k = ucb.indexOf(Math.max(...ucb)), arm = arms[k];
      const r = Math.max(0, Math.min(1, arm[hard ? 'hard' : 'easy'] + (rnd() - .5) * .12));
      const s = st[k]; s.n++;
      s.A = [[s.A[0][0] + x[0] * x[0], s.A[0][1] + x[0] * x[1]], [s.A[1][0] + x[1] * x[0], s.A[1][1] + x[1] * x[1]]];
      s.b = [s.b[0] + r * x[0], s.b[1] + r * x[1]];
      sum += r;
      tEl.textContent = t; avgEl.textContent = (sum / t).toFixed(2);
      rowsEl.forEach((li, i) => {
        li.classList.toggle('pick', i === k);
        $('.fill', li).style.transform = `scaleX(${Math.max(.02, Math.min(1, ucb[i] / 1.6)).toFixed(3)})`;
        $('.n', li).textContent = st[i].n;
      });
      const best = xx => { const v = st.map(s => { const Ai = inv(s.A); return dot(mv(Ai, s.b), xx); }); return arms[v.indexOf(Math.max(...v))].n; };
      learned.innerHTML = t < 12 ? '<span class="d">exploring…</span>' : `learned: <span class="c">easy</span> → <span class="g">${best([1, 0])}</span> · <span class="a">hard</span> → <span class="g">${best([1, 1])}</span>`;
      last.innerHTML = `<span class="d">q#${t}</span> "${esc(q)}" <span class="${hard ? 'a' : 'c'}">[${hard ? 'hard' : 'easy'}]</span> → <span class="g">${arm.n}</span> · reward ${r.toFixed(2)}`;
    };
    if (RM) { for (let i = 0; i < 40; i++) step(); return; }
    loopWhileVisible(box, step, 900);
  })();

  // incognito-sql: names cross the server and come out as tokens
  (() => {
    const box = $('#sim-incog'), q = $('.q', box), real = $('.ic-real', box), seen = $('.ic-seen', box), foot = $('.ic-foot', box);
    const runs = [
      { sql: "SELECT full_name, city FROM volunteers WHERE city = 'Haifa' LIMIT 3", rows: [['Dana Levi', 'Haifa'], ['Yossi Cohen', 'Haifa'], ['Noa Mizrahi', 'Haifa']],
        next: k => `SELECT COUNT(*) FROM shifts WHERE volunteer = '${k}'`, ans: '4 shifts' },
      { sql: 'SELECT full_name, phone FROM donors ORDER BY amount DESC LIMIT 3', rows: [['Avi Peretz', '052-417-3390'], ['Maya Katz', '054-882-1067'], ['Lior Ben-David', '050-319-7724']],
        next: k => `SELECT SUM(amount) FROM donations WHERE donor = '${k}'`, ans: '3 donations' },
    ];
    const tok = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return 'tk_' + h.toString(16).slice(0, 6); };
    const phone = s => /\d{3}-/.test(s);
    const GL = 'abcdef0123456789_';
    const scramble = (el, from, to, ms) => new Promise(res => {
      const t0 = performance.now();
      const f = now => { const p = Math.min(1, (now - t0) / ms), n = Math.round(p * to.length);
        el.textContent = to.slice(0, n) + Array.from(from.slice(n), () => GL[(Math.random() * GL.length) | 0]).join('');
        if (p < 1) requestAnimationFrame(f); else res(); };
      requestAnimationFrame(f);
    });
    let ri = 0, busy = false, alive = false;
    const play = async () => {
      if (busy) return; busy = true;
      const r = runs[ri++ % runs.length];
      real.innerHTML = ''; seen.innerHTML = ''; foot.innerHTML = ''; q.innerHTML = '<span class="c">agent</span> ';
      const sp = document.createElement('span'); q.appendChild(sp);
      for (let i = 1; i <= r.sql.length && alive; i += 2) { sp.textContent = r.sql.slice(0, i); await sleep(18); }
      sp.textContent = r.sql;
      for (const [a, b] of r.rows) {
        if (!alive) break;
        real.insertAdjacentHTML('beforeend', `<li><span>${esc(a)}</span><span>${esc(b)}</span></li>`);
        const li = document.createElement('li'); li.innerHTML = '<span class="tk"></span><span class="v"></span>'; seen.appendChild(li);
        await sleep(250);
        const ps = [scramble($('.tk', li), a, tok(a), 650)];
        if (phone(b)) ps.push(scramble($('.v', li), b, tok(b), 650)); else $('.v', li).textContent = b;
        await Promise.all(ps);
        await sleep(200);
      }
      const k = tok(r.rows[0][0]);
      foot.innerHTML = `<span class="c">agent</span> ${esc(r.next(k))}<br><span class="g">→</span> ${r.ans} · <span class="d">values seen by the model:</span> <span class="g">0</span>`;
      await sleep(3200);
      busy = false;
    };
    if (RM) { alive = true; const r = runs[0]; q.innerHTML = `<span class="c">agent</span> ${esc(r.sql)}`;
      real.innerHTML = r.rows.map(([a, b]) => `<li><span>${esc(a)}</span><span>${esc(b)}</span></li>`).join('');
      seen.innerHTML = r.rows.map(([a, b]) => `<li><span class="tk">${tok(a)}</span><span class="v">${phone(b) ? tok(b) : esc(b)}</span></li>`).join('');
      foot.innerHTML = `<span class="g">→</span> ${r.ans} · values seen by the model: 0`; return; }
    let iv = 0;
    onView(box, v => { alive = v; clearInterval(iv); if (v) { play(); iv = setInterval(play, 600); } }, { threshold: .3 });
  })();

  // israeli-banks-mcp: four local sources sync read-only, the agent gets a month's categories
  (() => {
    const box = $('#sim-banks'), srcs = $$('.bk-src li', box), cats = $('.bk-cats', box), tx = $('.bk-tx', box), mon = $('.bk-month', box);
    const C = ['groceries', 'restaurants', 'transport', 'subscriptions', 'utilities'];
    const months = [
      { m: '2026-09', t: [['Shufersal', 412, 0], ['Rami Levy', 286, 0], ['Wolt', 164, 1], ['Rav-Kav top-up', 100, 2], ['Spotify', 22, 3], ['Electric Co.', 341, 4], ['Aroma', 58, 1], ['Gett', 74, 2], ['Netflix', 55, 3]] },
      { m: '2026-10', t: [['Rami Levy', 391, 0], ['Shufersal', 198, 0], ['Japanika', 132, 1], ['Rav-Kav top-up', 150, 2], ['Electric Co.', 296, 4], ['Spotify', 22, 3], ['Wolt', 88, 1], ['Water Co.', 117, 4]] },
    ];
    cats.innerHTML = C.map(c => `<li><span>${c}</span><span class="track"><span class="fill"></span></span><span class="n">0</span></li>`).join('');
    const rows = $$('li', cats);
    let mi = 0, busy = false, alive = false;
    const fmtA = v => v.toLocaleString('en-US') + ' ILS';
    const play = async () => {
      if (busy) return; busy = true;
      const M = months[mi++ % months.length], sum = C.map(() => 0);
      mon.textContent = `· ${M.m}`; tx.innerHTML = '';
      srcs.forEach(s => s.classList.remove('on'));
      rows.forEach(r => { $('.fill', r).style.transform = 'scaleX(0)'; $('.n', r).textContent = '0'; });
      for (const s of srcs) { if (!alive) break; await sleep(260); s.classList.add('on'); }
      const max = Math.max(...C.map((_, i) => M.t.filter(x => x[2] === i).reduce((a, x) => a + x[1], 0)));
      for (const [who, amt, c] of M.t) {
        if (!alive) break;
        sum[c] += amt;
        tx.innerHTML = `<span class="d">${esc(who)}</span> −${amt} <span class="g">→ ${C[c]}</span>`;
        $('.fill', rows[c]).style.transform = `scaleX(${(sum[c] / max).toFixed(3)})`;
        $('.n', rows[c]).textContent = sum[c];
        await sleep(420);
      }
      tx.innerHTML = `total ${fmtA(sum.reduce((a, b) => a + b, 0))} · <span class="d">no credentials in the agent's context</span>`;
      await sleep(3000);
      busy = false;
    };
    if (RM) { srcs.forEach(s => s.classList.add('on')); const M = months[0], sum = C.map(() => 0); M.t.forEach(([, a, c]) => sum[c] += a);
      const max = Math.max(...sum); mon.textContent = `· ${M.m}`;
      rows.forEach((r, i) => { $('.fill', r).style.transform = `scaleX(${(sum[i] / max).toFixed(3)})`; $('.n', r).textContent = sum[i]; });
      tx.textContent = `total ${fmtA(sum.reduce((a, b) => a + b, 0))}`; return; }
    let iv = 0;
    onView(box, v => { alive = v; clearInterval(iv); if (v) { play(); iv = setInterval(play, 600); } }, { threshold: .3 });
  })();

  /* ---------- about: languages get tagged like the stack ---------- */
  (() => {
    const ms = $$('.about mark.lg'); if (!ms.length) return;
    if (RM) { ms.forEach(m => m.classList.add('on')); return; }
    let done = false;
    onView($('.about-lines'), v => { if (!v || done) return; done = true; ms.forEach((m, i) => setTimeout(() => m.classList.add('on'), 300 + i * 220)); }, { rootMargin: '0px 0px -30% 0px' });
  })();

  /* ---------- copy ---------- */
  $$('.copy').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'copied'; b.classList.add('ok'); }
    catch (e) { b.textContent = 'select it'; }
    setTimeout(() => { b.textContent = 'copy'; b.classList.remove('ok'); }, 1500);
  }));
})();
