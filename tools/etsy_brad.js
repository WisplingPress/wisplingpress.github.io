// Run in the Etsy listing editor: put the Brad worn image FIRST, keep existing photos after it (size chart stays last).
window.__eb = async function (key, dry, ord) {
  const sl = ms => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 30 && !document.querySelector('.le-media-grid__item[id]'); i++) await sl(500);
  const idb = () => new Promise((res, rej) => { const q = indexedDB.open('bradxm', 1); q.onupgradeneeded = () => q.result.createObjectStore('img'); q.onsuccess = () => res(q.result); q.onerror = rej; });
  const db = await idb(); const durl = await new Promise(r => { const q = db.transaction('img').objectStore('img').get(key); q.onsuccess = () => r(q.result); });
  if (!durl) return 'ERR no brad image ' + key;
  const brad = new File([await (await fetch(durl)).blob()], key.toLowerCase() + '_brad.jpg', { type: 'image/jpeg' });
  const imgs = [...document.querySelectorAll('.le-media-grid__item[id] img')].map(i => i.src.replace(/il_\d+x\d+|il_\d+xN|il_[0-9a-z]+(?=\.)/, 'il_fullxfull'));
  if (!imgs.length) return 'ERR no current photos';
  if (imgs.some(u => /brad/.test(u))) return 'SKIP already has brad?';
  const old = await Promise.all(imgs.map(async (u, i) => { const b = await (await fetch(u)).blob(); return new File([b], `photo_${i + 2}.jpg`, { type: b.type || 'image/jpeg' }); }));
  if (old.some(f => f.size < 20000)) return 'ERR small fetch ' + old.map(f => f.size).join(',');
  if (dry) return 'DRY ' + key + ' old ' + old.length + ' sizes ' + old.map(f => f.size).join(',') + ' brad ' + brad.size;
  const oldN = imgs.length;
  document.querySelector('.le-media-grid__item[id]').querySelector('button').click(); await sl(1500);
  const vis = () => [...document.querySelectorAll('[role=dialog] button')].filter(b => b.offsetParent);
  const thumbs = () => vis().filter(b => b.className.startsWith('le-media-grid__item')).length;
  const del = () => vis().find(b => b.classList.contains('wt-btn--icon') && !b.getAttribute('aria-label') && !b.innerText.trim());
  let n = 0; while (thumbs() > 0 && n < 25) { del().click(); await sl(900); n++; }
  const done = vis().find(b => b.innerText.trim() === 'Done'); if (done) done.click(); await sl(800);
  const o2 = ord ? ord.map(i => old[i]) : old; const files = [brad, ...o2];
  const inp = document.querySelector('input[type=file]'); const dt = new DataTransfer(); files.forEach(f => dt.items.add(f)); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
  let g = 0; for (let i = 0; i < 60; i++) { await sl(1000); g = document.querySelectorAll('.le-media-grid__item[id]').length; if (g >= files.length) break; }
  await sl(2500);
  const res = key + ' old ' + oldN + ' deleted ' + n + ' up ' + files.length + ' grid ' + g;
  if (g !== files.length) return res + ' | NOT SAVED';
  const pub = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Publish changes'); if (!pub) return res + ' | no Publish button';
  pub.click(); for (let i = 0; i < 20 && !location.href.includes('/tools/listings'); i++) await sl(700);
  return res + ' | ' + (location.href.includes('/tools/listings') ? 'SAVED' : 'NOT SAVED ' + location.href);
};
'eb ready';
