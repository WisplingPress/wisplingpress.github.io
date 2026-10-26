// Run in Etsy listing editor: add the design video (keeps photos), then Publish changes.
window.__ev = async function (nn) {
  const sl = ms => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 30 && !document.querySelector('.le-media-grid__item[id]'); i++) await sl(500);
  if (/\bvideo\b/i.test([...document.querySelectorAll('.le-media-grid__item[id]')].map(e => e.innerHTML).join(' ')) && document.querySelector('.le-media-grid__item video, .le-media-grid__item [class*=video]')) return 'SKIP has video';
  const before = document.querySelectorAll('.le-media-grid__item[id]').length;
  const b = await (await fetch('https://wisplingpress.github.io/video/xm/XM_' + nn + '_video.mp4', { cache: 'no-store' })).blob();
  if (b.size < 1e6) return 'ERR fetch ' + b.size;
  const inp = document.querySelector('input[type=file][name=listing-media-upload], input[type=file]');
  const dt = new DataTransfer(); dt.items.add(new File([b], 'xm_' + nn + '_video.mp4', { type: 'video/mp4' })); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
  let g = before; for (let i = 0; i < 90; i++) { await sl(1000); g = document.querySelectorAll('.le-media-grid__item[id]').length; const busy = /uploading|processing/i.test(document.querySelector('[id*=media], .le-media-grid')?.innerText || ''); if (g > before && !busy) break; }
  await sl(3000);
  const err = (document.body.innerText.match(/(video[^\n]{0,80}(error|too|must|couldn)[^\n]{0,60})/i) || [''])[0];
  if (g <= before) return 'ERR not added ' + before + '->' + g + ' ' + err;
  const pub = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Publish changes'); if (!pub) return 'no Publish button ' + err;
  pub.click(); for (let i = 0; i < 25 && !location.href.includes('/tools/listings'); i++) await sl(800);
  return nn + ' grid ' + before + '->' + g + ' | ' + (location.href.includes('/tools/listings') ? 'SAVED' : 'NOT SAVED ' + err);
};
'ev ready';
