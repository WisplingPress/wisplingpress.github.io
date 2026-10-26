// Christmas 2026 batch helpers for the Printify product-details page (new single-page layout, Quick overview pricing).
window.__setP = async function (groups) {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const rows = () => Object.fromEntries([...document.querySelectorAll('[role=checkbox]')].filter(c => c.offsetParent).map(c => { let r = c; for (let i = 0; i < 4; i++) r = r.parentElement; return [r.innerText.trim().split(/\s+/)[0], c]; }).filter(([k]) => /^(S|M|L|XL|\dXL)$/.test(k)));
  const out = [];
  for (const [sizes, price] of groups) {
    let R = rows();
    for (const [k, c] of Object.entries(R)) { const want = sizes.includes(k); if ((c.getAttribute('aria-checked') === 'true') !== want) { c.click(); await W(250); } }
    R = rows(); const on = Object.entries(R).filter(([k, c]) => c.getAttribute('aria-checked') === 'true').map(([k]) => k).join('/');
    if (on !== sizes.join('/')) return 'ERR select ' + on + ' vs ' + sizes.join('/');
    [...document.querySelectorAll('button')].find(b => b.offsetParent && b.textContent.trim() === 'Edit price').click(); await W(1500);
    const dlg = [...document.querySelectorAll('[role=dialog],pfy-dialog,.modal,mat-dialog-container')].filter(e => e.offsetParent).pop();
    if (!dlg) return 'ERR no dialog';
    const inp = dlg.querySelector('input[type=number],input[inputmode],input');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inp, String(price)); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); await W(400);
    const ap = [...dlg.querySelectorAll('button')].find(b => /^(Apply|Save|Update)/.test(b.textContent.trim()));
    if (!ap) return 'ERR no apply: ' + dlg.innerText.slice(0, 200);
    ap.click(); await W(1500);
    out.push(on + '=' + price);
  }
  for (const c of Object.values(rows())) if (c.getAttribute('aria-checked') === 'true') { c.click(); await W(200); }
  const txt = document.body.innerText;
  const got = [...txt.matchAll(/\n(S|M|L|XL|2XL|3XL|4XL|5XL)\n\n1 color[\s\S]*?USD ([\d.]+)/g)].map(m => m[1] + ':' + m[2]).join(',');
  return out.join(' ; ') + ' => ' + got;
};
window.__box = function (label) { const lab = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim().replace(/\*$/, '') === label && e.offsetParent).pop(); let c = lab; for (let i = 0; i < 6 && c && !c.querySelector('[role=checkbox]'); i++) c = c.parentElement; return c && c.querySelector('[role=checkbox]'); };
window.__boxes = function () { return ['Hide in store', 'Product title', 'Description', 'Mockups', 'Colors, sizes, prices, and SKUs', 'Tags', 'Shipping profile'].map(l => { const b = window.__box(l); return l + ':' + (b ? b.getAttribute('aria-checked') : 'missing'); }).join(', '); };
'xm ready';
// Full product-details step: (on mockup-library page) save selection, then fill text, prices, publish live.
window.__XP = { tee: [[['S','M','L','XL'],17.99],[['2XL'],19.99],[['3XL','4XL','5XL'],20.99]], jumper: [[['S','M','L','XL'],24.99],[['2XL'],26.99],[['3XL'],27.99],[['4XL'],30.99]] };
window.__fin = async function (key, kind, dry) {
  const W = ms => new Promise(r => setTimeout(r, ms));
  let t0 = Date.now();
  if (/mockup-library/.test(location.href)) {
    const ss = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim() === 'Save selection').pop();
    if (!ss) return 'ERR no Save selection';
    (ss.closest('button') || ss).click();
    while (!/product-details/.test(location.href) && Date.now() - t0 < 25000) await W(500);
  }
  if (!/product-details/.test(location.href)) return 'ERR not on details ' + location.href;
  window.__LT = null;
  const r1 = await window.__pd(key, { dry: true, keepShip: true });
  const r2 = await window.__setPrices(window.__XP[kind]);
  const hide = window.__box('Hide in store'); if (hide && hide.getAttribute('aria-checked') === 'true') { hide.click(); await W(500); }
  const bx = window.__boxes();
  if (dry || /false|missing/.test(bx.replace('Hide in store:false', ''))) return 'STOP ' + r1 + ' | ' + r2 + ' | ' + bx;
  [...document.querySelectorAll('button')].find(b => b.offsetParent && b.textContent.trim() === 'Publish').click();
  await W(3000);
  const d = [...document.querySelectorAll('[role=dialog],pfy-dialog,.modal')].filter(e => e.offsetParent).pop();
  const cf = d && [...d.querySelectorAll('button')].find(b => b.textContent.trim() === 'Confirm'); if (cf) cf.click();
  t0 = Date.now(); while (!/store\/products/.test(location.href) && Date.now() - t0 < 20000) await W(500);
  return r1 + ' | ' + r2 + ' | ' + bx + ' | ' + location.pathname;
};
