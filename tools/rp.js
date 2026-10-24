// Reprice a published Printify product and push ONLY "Colors, sizes, prices, and SKUs" to Etsy; keep it visible (Hide in store off).
window.__PRICES2 = {
  tee: [[['S','M','L','XL'],14.49],[['2XL'],16.49],[['3XL'],17.49],[['4XL','5XL'],17.99]],
  hood: [[['S','M','L','XL'],29.99],[['2XL'],31.99],[['3XL','4XL'],32.99],[['5XL'],33.49]],
  hood_back: [[['S','M','L','XL'],24.99],[['2XL'],26.49],[['3XL'],27.49],[['4XL','5XL'],27.99]],
};
window.__rp = async function (kind, dry) {
  const W = ms => new Promise(r => setTimeout(r, ms));
  let t0 = Date.now(); while (!/Detailed table view/.test(document.body.innerText) && Date.now() - t0 < 30000) await W(500);
  await W(1500);
  const r2 = await window.__setPrices(window.__PRICES2[kind]);
  if (/ERR/.test(r2)) return 'ERR prices ' + r2;
  const box = label => { const lab = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim() === label && e.offsetParent).pop(); let c = lab; for (let i = 0; i < 6 && c && !c.querySelector('[role=checkbox],input[type=checkbox]'); i++) c = c.parentElement; return c && c.querySelector('[role=checkbox],input[type=checkbox]'); };
  const isOn = el => el.tagName === 'INPUT' ? el.checked : el.getAttribute('aria-checked') === 'true';
  const set = async (label, on) => { const el = box(label); if (!el) return label + ':missing'; if (isOn(el) !== on) { el.click(); await W(500); } return label + ':' + isOn(box(label)); };
  const st = [];
  st.push(await set('Hide in store', false));
  for (const l of ['Product title', 'Description', 'Mockups', 'Tags', 'Shipping profile']) st.push(await set(l, false));
  st.push(await set('Colors, sizes, prices, and SKUs', true));
  const ok = st.join(',');
  if (/missing|Hide in store:true|title:true|Description:true|Mockups:true|Tags:true|profile:true|SKUs:false/.test(ok)) return 'ERR boxes ' + ok + ' | ' + r2;
  if (dry) return 'DRY ' + r2 + ' | ' + ok;
  [...document.querySelectorAll('button')].find(b => b.offsetParent && b.textContent.trim() === 'Publish').click();
  await W(3000);
  const d = [...document.querySelectorAll('[role=dialog],pfy-dialog,.modal')].filter(e => e.offsetParent).pop();
  const dtxt = d ? d.innerText.replace(/\s+/g, ' ').slice(0, 200) : '';
  const cf = d && [...d.querySelectorAll('button')].find(b => b.textContent.trim() === 'Confirm'); if (cf) cf.click();
  t0 = Date.now(); while (!/store\/products/.test(location.href) && Date.now() - t0 < 20000) await W(500);
  return r2 + ' | ' + ok + ' | dlg: ' + dtxt + ' | ' + location.pathname;
};
'rp ready';
