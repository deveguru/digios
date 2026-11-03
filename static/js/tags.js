/* coloured dots for status selects + TAG() helper for JS-rendered lists */
(function(){
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  window.TAG=(label,color)=>`<span class="badge tag" style="--c:${color||'#64748b'}"><i class="dot"></i>${esc(label)}</span>`;
  window.OSTAG=(slug,label)=>TAG(label||slug,(window.OSC||{})[slug]);
  function colors(sel){if(sel._dc)return sel._dc;let m={};const d=sel.dataset.dots;
    if(d==='order')m=window.OSC||{};else{try{m=JSON.parse(d)}catch(e){}}return sel._dc=m}
  function enhance(sel){if(sel._dsel)return;sel._dsel=1;const w=document.createElement('span');w.className='dsel';
    sel.parentNode.insertBefore(w,sel);const dot=document.createElement('i');dot.className='dot';w.append(dot,sel);
    const up=()=>{const c=colors(sel)[sel.value]||'#94a3b8';w.style.setProperty('--c',c)};sel.addEventListener('change',up);up();
    [...sel.options].forEach(o=>{const c=colors(sel)[o.value];if(c)o.textContent='● '+o.textContent.replace(/^● /,'')})}
  const scan=root=>root.querySelectorAll&&root.querySelectorAll('select[data-dots]').forEach(enhance);
  document.addEventListener('DOMContentLoaded',()=>{scan(document);new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>n.nodeType===1&&(n.matches('select[data-dots]')?enhance(n):scan(n))))).observe(document.body,{childList:true,subtree:true})});
})();
