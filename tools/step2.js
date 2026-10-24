// Reprice queue step: localStorage.__rpjobs = [[productId, kind], ...]; results in __rpres.
(async () => {
  const jobs = JSON.parse(localStorage.getItem('__rpjobs') || '[]');
  const res = JSON.parse(localStorage.getItem('__rpres') || '[]');
  const id = location.pathname.split('/').pop();
  const i = jobs.findIndex(j => j[0] === id);
  if (i < 0) { window.__STEP = 'not a job page'; return; }
  const [pid, kind] = jobs[i];
  if (!res.some(r => r.startsWith(pid + ' ::'))) {
    for (const f of ['pd.js', 'rp.js']) eval(await (await fetch('https://wisplingpress.github.io/tools/' + f + '?' + Date.now(), { cache: 'no-store' })).text());
    let r; try { r = await window.__rp(kind); } catch (e) { r = 'ERR ' + e.message; }
    res.push(pid + ' :: ' + kind + ' :: ' + r); localStorage.setItem('__rpres', JSON.stringify(res));
    if (/^ERR/.test(r)) { localStorage.setItem('__rpstop', r); window.__STEP = 'stopped ' + r; return; }
  }
  const next = jobs[i + 1];
  window.__STEP = 'done ' + pid;
  if (next && !localStorage.getItem('__rpstop')) setTimeout(() => { location.href = '/app/product-details/' + next[0]; }, 2500);
  else localStorage.setItem('__rpdone', '1');
})();
'step2 started';
