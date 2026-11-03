/* DigiPG storefront behaviour */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const CSRF = (document.querySelector('meta[name=csrf]') || {}).content || '';
  const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const money = n => fa(Number(n || 0).toLocaleString('en-US').replace(/,/g, '٬')) + ' تومان';
  const ICON = (n) => `<svg class="ic"><use href="${document.body.dataset.icons || '/static/icons/ui.svg'}#${n}"></use></svg>`;
  window.DPG = { $, $$, CSRF, fa, money, ICON };

  // theme (light default) — stored per visitor
  document.addEventListener('click', e => { const b = e.target.closest('[data-theme-toggle]'); if (!b) return;
    const d = document.documentElement, n = d.dataset.theme === 'dark' ? 'light' : 'dark'; d.dataset.theme = n;
    try { localStorage.setItem('theme', n); } catch (_) {} document.cookie = 'theme=' + n + ';path=/;max-age=31536000'; });

  // auto-scroll for every slider (banner/product/deals/categories/stories): one card at a time, pauses while the user touches,
  // hovers or drags it and starts again a few seconds later; back to the start at the end. Off with prefers-reduced-motion.
  function autoplay(r, box, rtl, isDown) {
    const sec = +((box && box.dataset.autoplay) || document.body.dataset.autoscroll || 0);
    if (!sec || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || r._auto) return; r._auto = 1;
    const dir = rtl ? -1 : 1; let pausedUntil = 0, hover = false;
    const pause = (ms) => { pausedUntil = Date.now() + ms; };
    r.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
    r.addEventListener('pointerleave', () => { hover = false; pause(1500); });
    ['pointerdown', 'touchstart', 'wheel', 'focusin'].forEach(ev => r.addEventListener(ev, () => pause(6000), { passive: true }));
    const step = () => { const first = r.firstElementChild; if (!first) return r.clientWidth;
      const gap = parseFloat(getComputedStyle(r).columnGap || getComputedStyle(r).gap) || 0;
      return (box && box.classList.contains('banners')) ? r.clientWidth : first.getBoundingClientRect().width + gap; };
    setInterval(() => {
      if (hover || isDown() || document.hidden || Date.now() < pausedUntil) return;
      const max = r.scrollWidth - r.clientWidth; if (max < 8) return;
      const rect = r.getBoundingClientRect(); if (rect.bottom < 0 || rect.top > innerHeight) return;   // only while visible
      if (Math.abs(r.scrollLeft) >= max - 6) r.scrollTo({ left: 0, behavior: 'smooth' });
      else r.scrollBy({ left: step() * dir, behavior: 'smooth' });
    }, sec * 1000);
  }

  // rails: mouse drag-to-scroll with momentum, arrows, dots; no scrollbar
  function rail(r) {
    if (r._rail) return; r._rail = 1;
    let down = false, moved = 0, sx = 0, sl = 0, v = 0, lx = 0, lt = 0, raf;
    const rtl = getComputedStyle(r).direction === 'rtl';
    r.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moved = 0; sx = lx = e.clientX; sl = r.scrollLeft; lt = performance.now(); v = 0; cancelAnimationFrame(raf); r._pid = e.pointerId; });
    r.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); if (moved < 6) return;
      if (!r.classList.contains('dragging')) { r.classList.add('dragging'); try { r.setPointerCapture(r._pid); } catch (_) {} } r.scrollLeft = sl - dx;
      const now = performance.now(); v = (e.clientX - lx) / Math.max(1, now - lt); lx = e.clientX; lt = now; });
    const up = e => { if (!down) return; down = false; r.classList.remove('dragging'); if (moved < 6) return;
      let vel = v * 16; const step = () => { if (Math.abs(vel) < 0.4) return; r.scrollLeft -= vel; vel *= 0.93; raf = requestAnimationFrame(step); }; step(); };
    r.addEventListener('pointerup', up); r.addEventListener('pointercancel', up);
    r.addEventListener('click', e => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    r.addEventListener('dragstart', e => e.preventDefault());
    const box = r.closest('[data-rail]');
    autoplay(r, box, rtl, () => down);
    if (!box) return;
    const prev = box.querySelector('[data-prev]'), next = box.querySelector('[data-next]'), dots = box.querySelector('.dots');
    const page = () => r.clientWidth * 0.85, dir = rtl ? -1 : 1;
    prev && prev.addEventListener('click', () => r.scrollBy({ left: -page() * dir, behavior: 'smooth' }));
    next && next.addEventListener('click', () => r.scrollBy({ left: page() * dir, behavior: 'smooth' }));
    const upd = () => { const max = r.scrollWidth - r.clientWidth, pos = Math.abs(r.scrollLeft);
      if (prev) prev.disabled = pos < 4; if (next) next.disabled = pos > max - 4;
      if (dots) { const n = dots.children.length, i = Math.round(pos / Math.max(1, r.clientWidth)); [...dots.children].forEach((d, k) => d.classList.toggle('on', k === Math.min(i, n - 1))); } };
    r.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();

  }
  $$('.rail, .stories, .chips').forEach(rail);
  // floating cart (mobile): number of items + total, just above the bottom menu bar
  function showMcart(count, total, pulse) {
    const m = $('#mcart'); if (!m || !count) { if (m) m.hidden = true; return; }
    const n = m.querySelector('[data-mc-n]'), t = m.querySelector('[data-mc-t]');
    if (n) n.textContent = fa(count); if (t) t.textContent = total || '';
    m.hidden = false; if (pulse) { m.classList.remove('pulse'); void m.offsetWidth; m.classList.add('pulse'); }
  }
  window.showMcart = showMcart;
  if (+(document.body.dataset.cart || 0) > 0 && matchMedia('(max-width:820px)').matches && !/^\/(cart|checkout)\//.test(location.pathname))
    fetch('/cart/mini').then(r => r.json()).then(j => showMcart(j.count, j.total)).catch(() => {});
  // countdown timers of special-offer sections (server clock, corrected for the visitor's clock drift)
  $$('.cd[data-end]').forEach(cd => {
    const skew = (+cd.dataset.now || Date.now()) - Date.now(), end = +cd.dataset.end;
    const faD = n => String(n).padStart(2, '0').replace(/\d/g, d => document.documentElement.lang === 'en' ? d : '۰۱۲۳۴۵۶۷۸۹'[d]);
    const u = k => cd.querySelector(`[data-u="${k}"]`);
    const tick = () => {
      let left = Math.max(0, end - (Date.now() + skew)), sec = Math.floor(left / 1000);
      const d = Math.floor(sec / 86400); sec %= 86400;
      u('d').textContent = faD(d); u('d').parentNode.classList.toggle('d0', d === 0);
      u('h').textContent = faD(Math.floor(sec / 3600)); u('m').textContent = faD(Math.floor(sec % 3600 / 60)); u('s').textContent = faD(sec % 60);
      if (left <= 0) { cd.classList.add('over'); clearInterval(t); if (cd.dataset.mode === 'daily') setTimeout(() => location.reload(), 1500); }
    };
    const t = setInterval(tick, 1000); tick();
  });

  window.toast = function (msg) {
    let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600);
  };
  window.post = async function (url, data) {
    const fd = data instanceof FormData ? data : new FormData();
    if (!(data instanceof FormData)) for (const k in (data || {})) fd.append(k, data[k]);
    fd.append('_csrf', CSRF);
    const r = await fetch(url, { method: 'POST', body: fd, headers: { 'X-Requested-With': 'fetch', 'X-CSRF': CSRF } });
    try { return await r.json(); } catch (e) { return { ok: false, message: 'خطا' }; }
  };

  // drawer
  $$('[data-open]').forEach(b => b.addEventListener('click', () => { const t = $(b.dataset.open); if (t) t.classList.add('open'); }));
  $$('[data-close]').forEach(b => b.addEventListener('click', () => { const t = b.closest('.drawer,.modal,.chatw,.sviewer'); if (t) t.classList.remove('open'); }));
  $$('.drawer .bg,.modal').forEach(b => b.addEventListener('click', e => { if (e.target === b) b.closest('.drawer,.modal').classList.remove('open'); }));

  // live search (Hero Header ajax search)
  $$('.search input').forEach(inp => {
    const box = inp.parentElement.querySelector('.suggest'); let h;
    inp.addEventListener('input', () => {
      clearTimeout(h); const q = inp.value.trim();
      if (q.length < 2) { box.style.display = 'none'; return; }
      h = setTimeout(async () => {
        const r = await fetch('/api/search?q=' + encodeURIComponent(q)).then(r => r.json());
        let html = r.categories.map(c => `<a href="${c.url}">${ICON('folder')}<span>${c.name}</span></a>`).join('');
        html += r.products.map(p => `<a href="${p.url}"><img src="${p.img}" alt=""><span class="grow">${p.name}</span><span class="p">${p.instock ? p.price : 'ناموجود'}</span></a>`).join('');
        html += `<a href="/shop/?s=${encodeURIComponent(q)}" class="center"><b class="grow">مشاهده همه نتایج «${q}»</b></a>`;
        box.innerHTML = html; box.style.display = 'block';
      }, 220);
    });
    document.addEventListener('click', e => { if (!inp.parentElement.contains(e.target)) box.style.display = 'none'; });
  });

  // hero slideshow
  const slides = $$('.hero .slide');
  if (slides.length > 1) { let i = 0; const iv = (+$('.hero').dataset.interval || 6) * 1000;
    setInterval(() => { slides[i].classList.remove('on'); i = (i + 1) % slides.length; slides[i].classList.add('on'); }, iv); }

  // stories viewer
  const sv = $('#sviewer');
  if (sv) {
    const items = $$('.story'); let idx = 0, tm;
    const show = i => { const s = items[i]; if (!s) { sv.classList.remove('open'); return; } idx = i;
      $('img', sv).src = s.dataset.full; $('.cap', sv).innerHTML = `<b>${s.dataset.title}</b>` + (s.dataset.link ? `<br><a class="btn sm" href="${s.dataset.link}">مشاهده</a>` : '');
      const bar = $('.bar i', sv); bar.style.transition = 'none'; bar.style.width = '0'; requestAnimationFrame(() => { bar.style.transition = 'width 5s linear'; bar.style.width = '100%'; });
      clearTimeout(tm); tm = setTimeout(() => show(idx + 1), 5000); };
    items.forEach((s, i) => s.addEventListener('click', () => { sv.classList.add('open'); show(i); }));
    sv.addEventListener('click', e => { if (e.target.closest('a,.x')) return; const r = sv.getBoundingClientRect(); show(e.clientX < r.width / 2 ? idx + 1 : Math.max(0, idx - 1)); });
    $('.x', sv).addEventListener('click', () => { clearTimeout(tm); sv.classList.remove('open'); });
  }

  // add to cart buttons (ajax)
  document.addEventListener('submit', async e => {
    const f = e.target.closest('form[data-ajax-cart]'); if (!f) return;
    e.preventDefault(); const btn = $('button[type=submit]', f); if (btn) btn.disabled = true;
    const r = await post('/cart/add', new FormData(f)); if (btn) btn.disabled = false;
    toast(r.message || (r.ok ? 'اضافه شد' : 'خطا'));
    if (r.ok) $$('.cart-count').forEach(n => { n.textContent = fa(r.count); n.classList.remove('hide'); });
    if (r.ok) showMcart(r.count, r.total, true);
  });

  // sales monitor beacons
  const track = (extra) => { const fd = new FormData(); fd.append('page', location.href); for (const k in extra || {}) fd.append(k, extra[k]);
    navigator.sendBeacon ? navigator.sendBeacon('/api/track', fd) : fetch('/api/track', { method: 'POST', body: fd }); };
  if (document.body.dataset.monitor === '1') {
    track(); setInterval(() => document.visibilityState === 'visible' && track(), 60000);
    document.addEventListener('click', e => { const a = e.target.closest('[data-pid]'); if (a) track({ click: a.dataset.pid, ref: location.href }); }, true);
  }

  // support form (Sticky Suite)
  const sf = $('#supportForm');
  if (sf) sf.addEventListener('submit', async e => { e.preventDefault(); const r = await post('/api/support', new FormData(sf)); toast(r.message); if (r.ok) { sf.reset(); sf.closest('.modal').classList.remove('open'); } });

  // assistant widget
  const cw = $('#chatw');
  if (cw) {
    const msgs = $('.msgs', cw), form = $('form', cw), sid = localStorage.getItem('la_sid') || ('la_' + Math.random().toString(36).slice(2) + Date.now());
    localStorage.setItem('la_sid', sid);
    const add = (t, who) => { const d = document.createElement('div'); d.className = 'm ' + who; d.innerHTML = t.replace(/</g, '&lt;').replace(/\[([^\]]+)\]\((https?:[^)\s]+|tel:[^)\s]+|\/[^)\s]*)\)/g, '<a href="$2" target="_blank" style="text-decoration:underline">$1</a>'); msgs.appendChild(d); msgs.scrollTop = 1e9; };
    $$('[data-chat]').forEach(b => b.addEventListener('click', () => { cw.classList.toggle('open'); if (!msgs.children.length) add(cw.dataset.welcome, 'a'); }));
    form.addEventListener('submit', async e => { e.preventDefault(); const inp = $('input[name=message]', form); const t = inp.value.trim(); if (!t) return;
      add(t, 'u'); inp.value = ''; const fd = new FormData(form); fd.set('message', t); fd.set('session', sid);
      const r = await post('/api/assistant', fd); add(r.reply || 'خطا در دریافت پاسخ', 'a');
      (r.tracking_images || []).forEach(u => { const d = document.createElement('div'); d.className = 'm a'; d.innerHTML = `<img src="${u}" style="border-radius:10px">`; msgs.appendChild(d); }); });
  }

  // product page: gallery, variations, qty, tabs, sticky product bar
  const pp = $('#pp');
  if (pp) {
    const main = $('.gal .main img', pp);
    $$('.gal .th button', pp).forEach(b => b.addEventListener('click', () => { $$('.gal .th button', pp).forEach(x => x.classList.remove('on')); b.classList.add('on'); main.src = b.dataset.large; }));
    if (main) main.addEventListener('click', () => window.open(main.dataset.full || main.src, '_blank'));
    $$('.qty', pp).forEach(q => { const i = $('input', q); $$('button', q).forEach(b => b.addEventListener('click', () => { i.value = Math.max(1, (+i.value || 1) + (+b.dataset.d)); })); });
    $$('.tabs button').forEach(b => b.addEventListener('click', () => { $$('.tabs button').forEach(x => x.classList.remove('on')); b.classList.add('on'); $$('.tabc').forEach(c => c.classList.toggle('hide', c.id !== b.dataset.t)); }));
    const V = JSON.parse(($('#vars') || {}).textContent || '[]'), sel = {};
    const priceEl = $('#pprice'), vid = $('input[name=variation_id]', pp), buy = $('.btn.buy', pp), stockEl = $('#pstock');
    const keys = $$('.opt[data-k]', pp).map(o => o.dataset.k);
    const match = () => keys.some(k => !sel[k]) ? null : V.find(v => keys.every(k => !v.attrs[k] || decodeURIComponent(v.attrs[k]) === decodeURIComponent(sel[k])));
    $$('.opt[data-k] button', pp).forEach(b => b.addEventListener('click', () => {
      const k = b.closest('.opt').dataset.k; sel[k] = b.dataset.v; $$('button', b.closest('.opt')).forEach(x => x.classList.toggle('on', x === b));
      const v = match();
      if (v) { vid.value = v.id; priceEl.innerHTML = (v.regular > v.price ? `<span class="old">${money(v.regular)}</span> ` : '') + money(v.price);
        buy.disabled = !v.instock; stockEl.textContent = v.instock ? (v.stock != null ? `موجودی: ${fa(v.stock)} عدد` : 'موجود') : 'ناموجود';
        if (v.img) main.src = v.img; }
      else { vid.value = ''; buy.disabled = true; stockEl.textContent = 'این ترکیب موجود نیست'; }
    }));
    const bar = $('.pbar'), anchor = $('.buybox', pp);
    if (bar && anchor) new IntersectionObserver(([e]) => bar.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0)).observe(anchor);
  }

  // OTP login
  const lo = $('#otpForm');
  if (lo) {
    const step2 = $('#otpStep2', lo), msg = $('#otpMsg');
    $('#otpSend').addEventListener('click', async () => { const r = await post('/auth/otp/send', { phone: $('[name=phone]', lo).value }); msg.textContent = r.message; msg.className = 'alert ' + (r.ok ? 'ok' : 'error'); if (r.ok) step2.classList.remove('hide'); });
    lo.addEventListener('submit', async e => { e.preventDefault(); const r = await post('/auth/otp/verify', new FormData(lo)); if (r.ok) location.href = r.redirect; else { msg.textContent = r.message; msg.className = 'alert error'; } });
  }
  $$('[data-tabs]').forEach(t => $$('button', t).forEach(b => b.addEventListener('click', () => { $$('button', t).forEach(x => x.classList.toggle('on', x === b)); $$(t.dataset.tabs).forEach(p => p.classList.toggle('hide', p.id !== b.dataset.t)); })));
})();
