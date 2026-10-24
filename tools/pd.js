// Printify product-details helper: fill title/description/tags from listing_text.json, publish tags too, then "Save as draft" (Etsy draft).
window.__pd = async function (key, opts = {}) {
  const W = ms => new Promise(r => setTimeout(r, ms));
  let t0 = Date.now(); while (!document.querySelector('textarea') && Date.now() - t0 < 30000) await W(500);
  await W(1500);
  const L = window.__LT || (window.__LT = await (await fetch('https://wisplingpress.github.io/tools/listing_text.json?' + Date.now(), { cache: 'no-store' })).json());
  const d = L[key]; if (!d) return 'ERR no text ' + key;
  const setV = (el, v) => { const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.dispatchEvent(new Event('blur', { bubbles: true })); };
  const title = [...document.querySelectorAll('input[type=text]')].find(i => i.offsetParent && !i.placeholder);
  setV(title, d.title.slice(0, 140)); await W(500);
  const ta = [...document.querySelectorAll('textarea')].find(e => e.offsetParent); setV(ta, d.description); await W(500);
  // remove existing tags
  for (let i = 0; i < 20; i++) { const x = [...document.querySelectorAll('pfy-chip button, .chip button, button[aria-label*="emove"]')].find(b => b.offsetParent && /close|cancel|remove/i.test(b.textContent + (b.getAttribute('aria-label') || ''))); if (!x) break; x.click(); await W(200); }
  const tin = [...document.querySelectorAll('input')].find(i => i.offsetParent && i.placeholder === 'Add tag');
  const addB = () => [...document.querySelectorAll('button')].find(b => b.offsetParent && b.textContent.trim() === 'Add');
  for (const tg of (d.tags || []).slice(0, 13)) { setV(tin, tg); await W(150); tin.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true })); await W(250); if (tin.value) { addB()?.click(); await W(250); } }
  // publish tags too
  const lab = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim() === 'Tags' && e.offsetParent).pop();
  let c = lab; for (let i = 0; i < 5 && c && !c.querySelector('[role=checkbox]'); i++) c = c.parentElement;
  const cb = c && c.querySelector('[role=checkbox]'); if (cb && cb.getAttribute('aria-checked') === 'false') { cb.click(); await W(400); }
  const txt = document.body.innerText;
  const nTags = (txt.match(/(\d+) left/) || [])[1];
  const res = { key, title: title.value.slice(0, 50), tagsLeft: nTags, tagsPub: cb && cb.getAttribute('aria-checked') };
  if (opts.dry) return JSON.stringify(res);
  [...document.querySelectorAll('button')].find(b => b.offsetParent && b.textContent.trim() === 'Save as draft').click();
  await W(4000);
  // confirm dialog if any
  const conf = [...document.querySelectorAll('button')].find(b => b.offsetParent && /^(Save as draft|Confirm|Continue|Publish anyway)$/.test(b.textContent.trim()) && b.closest('[role=dialog],.modal,pfy-dialog'));
  if (conf) { conf.click(); await W(4000); }
  res.after = location.href.slice(-60); res.msg = (document.body.innerText.match(/(Publishing|published|draft)[^\n]{0,80}/i) || [''])[0];
  return JSON.stringify(res);
};
'pd ready';
