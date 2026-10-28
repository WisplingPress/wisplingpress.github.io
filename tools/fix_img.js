// Etsy listing editor helper (28 Oct 2026): remove outdated text from listing photos.
//  - "... Printed to order in the UK" -> keep "... Printed to order" (pixels re-used, re-centred)
//  - any line with "Designed with the help of AI ..." or a bare "Printed in the UK" -> line erased
// Usage in the editor:  await __fxPrep([2,0])  (indices of photos to fix) -> previews;  await __fxApply() -> re-upload + publish
(() => {
  const sl = ms => new Promise(r => setTimeout(r, ms));
  const loadTess = async () => {
    if (window.__tw) return window.__tw;
    if (!window.Tesseract) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    window.__tw = await Tesseract.createWorker('eng'); return window.__tw;
  };
  const photoUrls = () => [...document.querySelectorAll('.le-media-grid__item[id] img')].map(i => i.src.replace(/il_\d+x\d+|il_\d+xN|il_[0-9a-z]+(?=\.)/, 'il_fullxfull'));
  // fill rows y0..y1 between x0..x1 with a per-row colour sampled just outside the box
  const rowFill = (ctx, W, x0, y0, x1, y1) => {
    const img = ctx.getImageData(0, y0, W, y1 - y0); const d = img.data;
    for (let y = 0; y < y1 - y0; y++) {
      const sample = []; for (const x of [x0 - 40, x0 - 25, x0 - 12, x1 + 12, x1 + 25, x1 + 40]) { if (x < 0 || x >= W) continue; const i = (y * W + x) * 4; sample.push([d[i], d[i + 1], d[i + 2]]); }
      if (!sample.length) continue;
      const med = [0, 1, 2].map(c => sample.map(s => s[c]).sort((a, b) => a - b)[Math.floor(sample.length / 2)]);
      for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) { const i = (y * W + x) * 4; d[i] = med[0]; d[i + 1] = med[1]; d[i + 2] = med[2]; }
    }
    ctx.putImageData(img, 0, y0);
  };
  window.__fxOne = async (url) => {
    const tw = await loadTess();
    const bmp = await createImageBitmap(await (await fetch(url)).blob());
    const W = bmp.width, H = bmp.height; const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d'); ctx.drawImage(bmp, 0, 0);
    const r = await tw.recognize(c, {}, { blocks: true });
    const lines = (r.data.blocks || []).flatMap(b => b.paragraphs.flatMap(p => p.lines));
    const log = [];
    for (const L of lines) {
      const words = L.words; const txt = words.map(w => w.text).join(' ');
      const low = txt.toLowerCase();
      const isAI = /help of a|claude|anthropic/.test(low);
      const ukIdx = words.findIndex((w, i) => /^in$/i.test(w.text) && words[i + 1] && /^the$/i.test(words[i + 1].text) && words[i + 2] && /u\.?k/i.test(words[i + 2].text));
      const orderIdx = words.findIndex(w => /^order$/i.test(w.text));
      const pad = Math.round((L.bbox.y1 - L.bbox.y0) * 0.35);
      const bx0 = L.bbox.x0 - pad, by0 = Math.max(0, L.bbox.y0 - pad), bx1 = L.bbox.x1 + pad, by1 = Math.min(H, L.bbox.y1 + pad);
      if (isAI || (/printed/.test(low) && /\bu\.?k\b/.test(low) && orderIdx < 0)) {
        rowFill(ctx, W, bx0, by0, bx1, by1); log.push('ERASE: ' + txt);
      } else if (ukIdx > 0 && orderIdx >= 0 && orderIdx === ukIdx - 1) {
        const keepX1 = words[orderIdx].bbox.x1 + 2;
        const segW = keepX1 - bx0, segH = by1 - by0;
        const seg = ctx.getImageData(bx0, by0, segW, segH);
        rowFill(ctx, W, bx0, by0, bx1, by1);
        // paste kept text re-centred on the original line centre; blend only the brighter (text) pixels
        const cx = (L.bbox.x0 + L.bbox.x1) / 2; const nx = Math.round(cx - (keepX1 - L.bbox.x0) / 2) - (L.bbox.x0 - bx0);
        const dst = ctx.getImageData(nx, by0, segW, segH);
        for (let i = 0; i < seg.data.length; i += 4) {
          const ls = seg.data[i] + seg.data[i + 1] + seg.data[i + 2], ld = dst.data[i] + dst.data[i + 1] + dst.data[i + 2];
          const dark = ld < 380; // dark background -> keep lighter pixels; light background -> keep darker pixels
          if (dark ? ls > ld : ls < ld) { dst.data[i] = seg.data[i]; dst.data[i + 1] = seg.data[i + 1]; dst.data[i + 2] = seg.data[i + 2]; }
        }
        ctx.putImageData(dst, nx, by0); log.push('TRIM: ' + txt);
      }
    }
    const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.93));
    return { blob, log, W, H, url: URL.createObjectURL(blob) };
  };
  window.__fxPrep = async (idx) => {
    for (let i = 0; i < 30 && !document.querySelector('.le-media-grid__item[id]'); i++) await sl(500);
    const urls = photoUrls(); window.__fxUrls = urls; window.__fxNew = {};
    const out = [];
    for (const i of idx) { const r = await window.__fxOne(urls[i]); window.__fxNew[i] = r; out.push(i + ': ' + (r.log.join(' | ') || 'NO CHANGE')); }
    const old = document.getElementById('__fxv'); if (old) old.remove();
    const v = document.createElement('div'); v.id = '__fxv'; v.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#222;display:flex;gap:6px;overflow:auto';
    v.innerHTML = idx.map(i => `<img src="${window.__fxNew[i].url}" style="height:100%">`).join(''); document.body.appendChild(v);
    return out.join('\n');
  };
  window.__fxCrop = (i, y0frac) => { const v = document.getElementById('__fxv'); v.innerHTML = `<img src="${window.__fxNew[i].url}" style="width:100%;margin-top:-${y0frac * 100}%">`; };
  window.__fxApply = async () => {
    const v = document.getElementById('__fxv'); if (v) v.remove();
    const urls = window.__fxUrls; if (photoUrls().join() !== urls.join()) return 'ERR photos changed since prep';
    const files = await Promise.all(urls.map(async (u, i) => { const b = window.__fxNew[i] ? window.__fxNew[i].blob : await (await fetch(u)).blob(); return new File([b], `photo_${i + 1}.jpg`, { type: 'image/jpeg' }); }));
    if (files.some(f => f.size < 20000)) return 'ERR small file ' + files.map(f => f.size).join(',');
    document.querySelector('.le-media-grid__item[id]').querySelector('button').click(); await sl(1500);
    const vis = () => [...document.querySelectorAll('[role=dialog] button')].filter(b => b.offsetParent);
    const thumbs = () => vis().filter(b => b.className.startsWith('le-media-grid__item')).length;
    const del = () => vis().find(b => b.classList.contains('wt-btn--icon') && !b.getAttribute('aria-label') && !b.innerText.trim());
    let n = 0; while (thumbs() > 0 && n < 25) { const b = del(); if (!b) break; b.click(); await sl(900); n++; }
    const done = vis().find(b => b.innerText.trim() === 'Done'); if (done) done.click(); await sl(800);
    const inp = document.querySelector('input[type=file]'); const dt = new DataTransfer(); files.forEach(f => dt.items.add(f)); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
    let g = 0; for (let i = 0; i < 60; i++) { await sl(1000); g = document.querySelectorAll('.le-media-grid__item[id]').length; if (g >= files.length) break; }
    await sl(2500);
    const res = 'deleted ' + n + ' up ' + files.length + ' grid ' + g;
    if (g !== files.length) return res + ' | NOT SAVED (grid mismatch)';
    const pub = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Publish changes'); if (!pub) return res + ' | no Publish button';
    pub.click(); for (let i = 0; i < 25 && !location.href.includes('/tools/listings'); i++) await sl(700);
    return res + ' | ' + (location.href.includes('/tools/listings') ? 'SAVED' : 'NOT SAVED ' + location.href);
  };
})();
'fx ready';
