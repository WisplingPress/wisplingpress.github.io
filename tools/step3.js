// Shopify-store publish step: localStorage.__shjobs = [productId,...]; tick Hide in store, leave Shipping profile unticked, Publish, Confirm, go to next.
(async () => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const jobs = JSON.parse(localStorage.getItem('__shjobs') || '[]');
  const res = JSON.parse(localStorage.getItem('__shres') || '[]');
  const id = location.pathname.split('/').pop();
  const i = jobs.indexOf(id);
  if (i < 0) { window.__STEP = 'not a job page'; return; }
  if (!res.some(r => r.startsWith(id + ' ::'))) {
    let r;
    try {
      let t0 = Date.now(); while (!/Hide in store/.test(document.body.innerText) && Date.now() - t0 < 30000) await W(500);
      await W(2000);
      const box = label => { const lab = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim() === label && e.offsetParent).pop(); let c = lab; for (let k = 0; k < 6 && c && !c.querySelector('[role=checkbox],input[type=checkbox]'); k++) c = c.parentElement; return c && c.querySelector('[role=checkbox],input[type=checkbox]'); };
      const isOn = el => el.tagName === 'INPUT' ? el.checked : el.getAttribute('aria-checked') === 'true';
      const h = box('Hide in store'); if (!isOn(h)) { h.click(); await W(600); }
      const s = box('Shipping profile'); if (s && isOn(s)) { s.click(); await W(600); }
      if (!isOn(box('Hide in store')) || (s && isOn(box('Shipping profile')))) throw new Error('boxes');
      const pbs = [...document.querySelectorAll('button')].filter(b => b.offsetParent && b.textContent.trim() === 'Publish'); pbs[pbs.length - 1].click();
      await W(3000);
      const d = [...document.querySelectorAll('[role=dialog],pfy-dialog,.modal')].filter(e => e.offsetParent).pop();
      const dt = d ? d.innerText.replace(/\s+/g, ' ').slice(0, 120) : '';
      const cf = d && [...d.querySelectorAll('button')].find(b => /^(Confirm|Publish)$/.test(b.textContent.trim())); if (cf) cf.click();
      t0 = Date.now(); while (!/store\/products/.test(location.href) && Date.now() - t0 < 25000) await W(500);
      if (!/store\/products/.test(location.href)) throw new Error('publish did not go through');
      r = 'ok hidden | ' + dt + ' | ' + location.pathname;
    } catch (e) { r = 'ERR ' + e.message; }
    res.push(id + ' :: ' + r); localStorage.setItem('__shres', JSON.stringify(res));
    if (/^ERR/.test(r)) { window.__STEP = 'stopped ' + r; return; }
  }
  const next = jobs[i + 1];
  window.__STEP = 'done ' + id;
  if (next) setTimeout(() => { location.href = '/app/product-details/' + next; }, 2500);
  else localStorage.setItem('__shdone', '1');
})();
'step3 started';
