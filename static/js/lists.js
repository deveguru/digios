/* Every admin list: rows per page, sort by any column (asc/desc), instant filters — no "apply" button needed.
   th[data-sort]  -> server sort over all rows (?sort=&dir=)
   other headers  -> sort the rows shown on this page
   form[method=get] filters -> submit on change; text boxes after a short pause (focus and caret are kept) */
(function () {
  const fa2en = s => String(s).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const go = (mut) => { const u = new URL(location.href); mut(u.searchParams); u.searchParams.delete('page'); location.href = u.toString(); };
  const ARROW = d => `<span class="sarr">${d === 'asc' ? '▲' : d === 'desc' ? '▼' : '⇅'}</span>`;

  function serverSort(th) {
    const key = th.dataset.sort, p = new URLSearchParams(location.search), cur = p.get('sort'), dir = p.get('dir');
    const active = cur === key, next = active ? (dir === 'asc' ? 'desc' : 'asc') : 'desc';
    th.classList.add('sortable'); if (active) th.classList.add('sorted');
    th.insertAdjacentHTML('beforeend', ARROW(active ? (dir || 'desc') : ''));
    th.title = 'مرتب‌سازی (کلیک: ' + (next === 'asc' ? 'کم به زیاد' : 'زیاد به کم') + ')';
    th.addEventListener('click', () => go(s => { s.set('sort', key); s.set('dir', next); }));
  }

  function cellVal(td) {
    if (!td) return '';
    const inp = td.querySelector('input:not([type=checkbox]),select');
    let t = inp ? (inp.tagName === 'SELECT' ? ((inp.options[inp.selectedIndex] || {}).text || '') : inp.value) : td.innerText;
    t = fa2en(t).trim();
    const n = t.replace(/[,٬\s]/g, '').replace(/تومان|ms|٪|%/g, '');
    if (/^[#]?-?\d+(\.\d+)?$/.test(n.replace(/^#/, ''))) return parseFloat(n.replace(/^#/, ''));
    if (/^\d{4}\/\d{2}\/\d{2}/.test(t)) return t;               // jalali dates sort as text
    return t.toLowerCase();
  }

  function clientSort(table) {
    const ths = [...(table.tHead ? table.tHead.rows[0].cells : [])];
    const body = table.tBodies[0];
    if (!body || body.rows.length < 2) return;
    ths.forEach((th, i) => {
      if (th.dataset.sort || th.dataset.nosort !== undefined || !th.textContent.trim() || th.querySelector('input')) return;
      th.classList.add('sortable'); th.insertAdjacentHTML('beforeend', ARROW(''));
      th.title = 'مرتب‌سازی ردیف‌های همین صفحه';
      th.addEventListener('click', () => {
        const dir = th.dataset.dir === 'asc' ? 'desc' : 'asc';
        ths.forEach(x => { delete x.dataset.dir; x.classList.remove('sorted'); const a = x.querySelector('.sarr'); if (a) a.textContent = '⇅'; });
        th.dataset.dir = dir; th.classList.add('sorted'); th.querySelector('.sarr').textContent = dir === 'asc' ? '▲' : '▼';
        const rows = [...body.rows];
        rows.sort((a, b) => { const x = cellVal(a.cells[i]), y = cellVal(b.cells[i]);
          const r = (typeof x === 'number' && typeof y === 'number') ? x - y : String(x).localeCompare(String(y), 'fa');
          return dir === 'asc' ? r : -r; });
        rows.forEach(r => body.appendChild(r));
      });
    });
  }

  function instantFilters(f) {
    if (f.dataset.manual !== undefined) return;
    let t;
    const submit = (el) => { try { sessionStorage.setItem('lf_focus', el && el.name ? el.name : ''); } catch (e) {}
      const u = new URL(f.action || location.href, location.href); const fd = new FormData(f);
      const keep = new URLSearchParams(location.search); ['sort', 'dir', 'per'].forEach(k => { if (keep.get(k) && !fd.has(k)) fd.set(k, keep.get(k)); });
      u.search = new URLSearchParams([...fd].filter(([k, v]) => v !== '')).toString(); location.href = u.toString(); };
    f.querySelectorAll('select, input[type=checkbox], input[type=radio], input[data-jdate], input[type=date]').forEach(el =>
      el.addEventListener('change', () => submit(el)));
    f.querySelectorAll('input[type=text], input[type=search], input:not([type])').forEach(el => {
      if (el.dataset.jdate !== undefined) return;
      el.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => submit(el), 700); });
      el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(t); submit(el); } });
    });
    try {   // keep typing where the user left off after the page reloads
      const n = sessionStorage.getItem('lf_focus'); sessionStorage.removeItem('lf_focus');
      const el = n && f.querySelector(`[name="${CSS.escape(n)}"]`);
      if (el && el.matches('input[type=text],input[type=search],input:not([type])')) { el.focus(); const v = el.value; el.value = ''; el.value = v; }
    } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    const main = document.querySelector('.main') || document.body;
    main.querySelectorAll('th[data-sort]').forEach(serverSort);
    main.querySelectorAll('table.t').forEach(clientSort);
    main.querySelectorAll('table.t.rsp').forEach(t => {        // mobile card view: every cell gets its column name
      const heads = t.tHead ? [...t.tHead.rows[0].cells].map(h => h.textContent.replace(/[▲▼⇅]/g, '').trim()) : [];
      [...t.tBodies[0].rows].forEach(r => [...r.cells].forEach((c, i) => { if (heads[i]) c.dataset.l = heads[i];
        else if (c.querySelector('input[type=checkbox]')) c.dataset.l = 'انتخاب'; }));
    });
    main.querySelectorAll('select[data-per]').forEach(s => s.addEventListener('change', () => go(p => p.set('per', s.value))));
    main.querySelectorAll('form').forEach(f => { if ((f.getAttribute('method') || 'get').toLowerCase() === 'get') instantFilters(f); });
  });
})();
