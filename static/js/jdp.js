/* Jalali (Shamsi) date picker for inputs with [data-jdate]. Value format: 1405/08/11 */
(function () {
  function div(a, b) { return ~~(a / b); }
  function jalCal(jy) {
    const br = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
    let gy = jy + 621, leapJ = -14, jp = br[0], jm, jump, leap, n, i;
    for (i = 1; i < br.length; i++) { jm = br[i]; jump = jm - jp; if (jy < jm) break; leapJ += div(jump, 33) * 8 + div(jump % 33, 4); jp = jm; }
    n = jy - jp; leapJ += div(n, 33) * 8 + div((n % 33) + 3, 4); if ((jump % 33) === 4 && jump - n === 4) leapJ += 1;
    const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150, march = 20 + leapJ - leapG;
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = (((n + 1) % 33) - 1) % 4; if (leap === -1) leap = 4;
    return { leap, gy, march };
  }
  function g2d(gy, gm, gd) { let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * ((gm + 9) % 12) + 2, 5) + gd - 34840408; return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752; }
  function d2g(jdn) { let j = 4 * jdn + 139361631; j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    const i = div(j % 1461, 4) * 5 + 308, gd = div(i % 153, 5) + 1, gm = (div(i, 153) % 12) + 1, gy = div(j, 1461) - 100100 + div(8 - gm, 6); return [gy, gm, gd]; }
  function j2d(jy, jm, jd) { const r = jalCal(jy); return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1; }
  function d2j(jdn) { const gy = d2g(jdn)[0]; let jy = gy - 621; const r = jalCal(jy), jdn1f = g2d(gy, 3, r.march); let k = jdn - jdn1f, jm, jd;
    if (k >= 0) { if (k <= 185) { jm = 1 + div(k, 31); jd = (k % 31) + 1; return [jy, jm, jd]; } k -= 186; }
    else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
    jm = 7 + div(k, 30); jd = (k % 30) + 1; return [jy, jm, jd]; }
  const monthLen = (y, m) => m <= 6 ? 31 : m <= 11 ? 30 : (jalCal(y).leap === 0 ? 30 : 29);
  const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  const DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
  const en = s => String(s || '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const pad = n => String(n).padStart(2, '0');
  const fd = n => document.documentElement.lang === 'fa' ? String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(n);
  const today = () => { const t = new Date(); return d2j(g2d(t.getFullYear(), t.getMonth() + 1, t.getDate())); };
  const css = `.jdp{position:absolute;z-index:999;background:var(--card,#fff);color:var(--ink,#111);border:1px solid var(--line,#ddd);border-radius:14px;box-shadow:0 20px 40px -12px rgba(0,0,0,.35);padding:10px;width:260px;font-size:13px;direction:rtl}
.jdp .h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-weight:800}.jdp .h button{border:0;background:var(--bg-2,#f1f5f9);border-radius:8px;width:30px;height:30px;cursor:pointer;color:inherit}
.jdp .g{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center}.jdp .g b{font-size:11px;color:var(--muted,#888);padding:3px 0}
.jdp .g button{border:0;background:none;border-radius:8px;padding:6px 0;cursor:pointer;color:inherit;font:inherit}.jdp .g button:hover{background:var(--brand-l,#fde7dd)}
.jdp .g button.on{background:var(--brand,#ef5c26);color:#fff}.jdp .g button.td{box-shadow:inset 0 0 0 1.5px var(--brand,#ef5c26)}
.jdp .f{display:flex;justify-content:space-between;margin-top:8px}.jdp .f button{border:0;background:none;color:var(--brand,#ef5c26);cursor:pointer;font:inherit;font-weight:700}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  let pop = null, cur = null;
  function close() { if (pop) { pop.remove(); pop = null; cur = null; } }
  function open(inp) {
    close(); cur = inp;
    const v = en(inp.value).split(/[^\d]+/).map(Number);
    let [y, m] = v[0] > 1000 ? v : today(); let sel = v[0] > 1000 ? v : null;
    pop = document.createElement('div'); pop.className = 'jdp'; document.body.appendChild(pop);
    const draw = () => {
      const first = (j2d(y, m, 1) + 2) % 7, n = monthLen(y, m), t = today();
      let h = `<div class="h"><button type="button" data-nav="-1">‹</button><span>${MONTHS[m - 1]} ${fd(y)}</span><button type="button" data-nav="1">›</button></div><div class="g">` + DAYS.map(d => `<b>${d}</b>`).join('');
      for (let i = 0; i < first; i++) h += '<span></span>';
      for (let d = 1; d <= n; d++) { const on = sel && sel[0] === y && sel[1] === m && sel[2] === d, td = t[0] === y && t[1] === m && t[2] === d;
        h += `<button type="button" data-d="${d}" class="${on ? 'on' : ''} ${td ? 'td' : ''}">${fd(d)}</button>`; }
      pop.innerHTML = h + '</div><div class="f"><button type="button" data-today>امروز</button><button type="button" data-clear>پاک کردن</button></div>';
    };
    draw();
    const r = inp.getBoundingClientRect();
    pop.style.top = (window.scrollY + r.bottom + 6) + 'px';
    pop.style.left = Math.max(8, Math.min(window.scrollX + r.right - 260, window.scrollX + document.documentElement.clientWidth - 270)) + 'px';
    pop.addEventListener('mousedown', e => e.preventDefault());
    pop.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.nav) { m += +b.dataset.nav; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } draw(); return; }
      if (b.dataset.today !== undefined) { const t = today(); y = t[0]; m = t[1]; set(t[0], t[1], t[2]); return; }
      if (b.dataset.clear !== undefined) { inp.value = ''; inp.dispatchEvent(new Event('change', { bubbles: true })); close(); return; }
      set(y, m, +b.dataset.d);
    });
    function set(yy, mm, dd) { inp.value = `${yy}/${pad(mm)}/${pad(dd)}`; inp.dispatchEvent(new Event('change', { bubbles: true })); close(); }
  }
  document.addEventListener('focusin', e => { const i = e.target.closest('input[data-jdate]'); if (i && i !== cur) open(i); });
  document.addEventListener('click', e => { if (pop && !pop.contains(e.target) && !e.target.closest('input[data-jdate]')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.querySelectorAll('input[data-jdate]').forEach(i => { i.setAttribute('autocomplete', 'off'); i.setAttribute('dir', 'ltr'); if (!i.placeholder) i.placeholder = '1405/01/01'; });
})();
