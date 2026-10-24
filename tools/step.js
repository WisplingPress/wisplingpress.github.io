// One publish step: run __pub for the product in the URL, record the result, then load the next product.
(async () => {
  const jobs = JSON.parse(localStorage.getItem('__pubjobs') || '[]');
  const res = JSON.parse(localStorage.getItem('__pubres') || '[]');
  const id = location.pathname.split('/').pop();
  const i = jobs.findIndex(j => j[0] === id);
  if (i < 0) { window.__STEP = 'not a job page'; return; }
  const [pid, key, kind] = jobs[i];
  if (!res.some(r => r.startsWith(key + ' ::'))) {
    const tx = await (await fetch('https://wisplingpress.github.io/tools/pd.js?' + Date.now(), { cache: 'no-store' })).text();
    eval(tx); window.__LT = null;
    let r; try { r = await window.__pub(key, kind); } catch (e) { r = 'ERR ' + e.message; }
    res.push(key + ' :: ' + r); localStorage.setItem('__pubres', JSON.stringify(res));
  }
  const next = jobs[i + 1];
  window.__STEP = 'done ' + key;
  if (next) setTimeout(() => { location.href = '/app/product-details/' + next[0]; }, 2500);
  else localStorage.setItem('__pubdone', '1');
})();
'step started';
