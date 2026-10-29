// Fix outdated text on Etsy listing photos, in the Etsy listing editor page.
// __fx.patch(url) -> {action:'keep'|'patch'|'drop', blob, notes}
// __fx.listing(badIdx[], dry) -> re-uploads all photos in order with patched ones (drops "Made for You" cards), then publishes.
(() => {
  const sl = ms => new Promise(r => setTimeout(r, ms));
  const S = window.__fx = window.__fx || {};
  S.init = async () => {
    if (!window.Tesseract) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    if (!S.w) S.w = await Tesseract.createWorker('eng');
    if (!S.fonts) {
      for (const [name, url] of [['FxIt', 'https://wisplingpress.github.io/fonts/im-fell-english-latin-400-italic.woff'], ['FxSC', 'https://wisplingpress.github.io/fonts/IMFellSC.ttf']]) {
        const buf = await (await fetch(url)).arrayBuffer(); const f = new FontFace(name, buf); await f.load(); document.fonts.add(f);
      }
      S.fonts = true;
    }
    return 'ready';
  };
  const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
  // lines of text in the bottom part of the image, with boxes in image coords
  async function lines(cv, from) {
    const W = cv.width, H = cv.height, y0 = Math.round(H * from), sc = Math.min(2, 2400 / W);
    const c = document.createElement('canvas'); c.width = W * sc; c.height = (H - y0) * sc;
    c.getContext('2d').drawImage(cv, 0, y0, W, H - y0, 0, 0, c.width, c.height);
    const r = await S.w.recognize(c, {}, { blocks: true });
    const out = [];
    for (const b of r.data.blocks || []) for (const p of b.paragraphs) for (const l of p.lines) {
      const bb = l.bbox; out.push({ t: l.text.trim(), x0: bb.x0 / sc, x1: bb.x1 / sc, y0: bb.y0 / sc + y0, y1: bb.y1 / sc + y0 });
    }
    return out;
  }
  function bgColour(ctx, x0, y0, x1, y1) {
    // median of a 1px frame just outside the box
    const px = []; const W = ctx.canvas.width, H = ctx.canvas.height;
    const get = (x, y) => { x = Math.max(0, Math.min(W - 1, x | 0)); y = Math.max(0, Math.min(H - 1, y | 0)); const d = ctx.getImageData(x, y, 1, 1).data; px.push([d[0], d[1], d[2]]); };
    for (let x = x0; x <= x1; x += Math.max(1, (x1 - x0) / 60)) { get(x, y0 - 3); get(x, y1 + 3); }
    for (let y = y0; y <= y1; y += 2) { get(x0 - 4, y); get(x1 + 4, y); }
    px.sort((a, b) => lum(...a) - lum(...b)); return px[px.length >> 1];
  }
  function inkColour(ctx, x0, y0, x1, y1, bg) {
    const d = ctx.getImageData(x0 | 0, y0 | 0, Math.max(1, (x1 - x0) | 0), Math.max(1, (y1 - y0) | 0)).data; const bl = lum(...bg);
    let best = null, bd = -1;
    for (let i = 0; i < d.length; i += 4) { const l = lum(d[i], d[i + 1], d[i + 2]); const dd = Math.abs(l - bl); if (dd > bd) { bd = dd; best = [d[i], d[i + 1], d[i + 2]]; } }
    // soften: average of pixels within 25% of the extreme
    let s = [0, 0, 0], n = 0; const el = lum(...best);
    for (let i = 0; i < d.length; i += 4) { const l = lum(d[i], d[i + 1], d[i + 2]); if (Math.abs(l - el) < Math.abs(el - bl) * 0.25) { s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2]; n++; } }
    return n ? s.map(v => Math.round(v / n)) : best;
  }
  function fitDraw(ctx, font, orig, neu, L, colour) {
    const w = L.x1 - L.x0; let sz = 40;
    ctx.font = `${sz}px ${font}`; sz = sz * w / ctx.measureText(orig).width;
    sz = Math.min(sz, (L.y1 - L.y0) * 2.2);
    ctx.font = `${sz}px ${font}`; ctx.fillStyle = `rgb(${colour.join(',')})`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
    const cx = (L.x0 + L.x1) / 2; ctx.fillText(neu, cx, L.y1 - (L.y1 - L.y0) * 0.12);
    return Math.round(sz);
  }
  S.patch = async (url) => {
    await S.init();
    const blob = await (await fetch(url)).blob(); const bmp = await createImageBitmap(blob);
    const cv = document.createElement('canvas'); cv.width = bmp.width; cv.height = bmp.height; const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(bmp, 0, 0);
    const all = await lines(cv, 0.0);
    if (all.some(l => /^made for you/i.test(l.t))) return { action: 'drop', notes: 'Made for You card' };
    const bad = all.filter(l => /printed|\bU\.?K\b|claude|anthropic|help of a/i.test(l.t) && l.y0 > cv.height * 0.55);
    if (!bad.length) return { action: 'keep', notes: 'no bad line found', lines: all.map(l => l.t).slice(-4) };
    const notes = [];
    for (const L of bad) {
      const pad = Math.max(4, (L.y1 - L.y0) * 0.35);
      const B = { x0: L.x0 - pad * 2, y0: L.y0 - pad, x1: L.x1 + pad * 2, y1: L.y1 + pad };
      const bg = bgColour(ctx, B.x0, B.y0, B.x1, B.y1); const ink = inkColour(ctx, L.x0, L.y0, L.x1, L.y1, bg);
      const dark = lum(...bg) < 110;
      // soft-edged cover: solid in the middle, feathered at the edges so no box shows
      { const f = Math.max(8, pad * 1.6); const m = document.createElement('canvas'); m.width = cv.width; m.height = cv.height; const mc = m.getContext('2d');
        mc.fillStyle = `rgb(${bg.join(',')})`; mc.fillRect(B.x0 - f * 0.5, B.y0 - f * 0.3, B.x1 - B.x0 + f, B.y1 - B.y0 + f * 0.6);
        ctx.save(); ctx.filter = `blur(${f * 0.6}px)`; ctx.drawImage(m, 0, 0); ctx.restore();
        ctx.fillStyle = `rgb(${bg.join(',')})`; ctx.fillRect(B.x0 + f * 0.3, B.y0 + 1, B.x1 - B.x0 - f * 0.6, B.y1 - B.y0 - 2); }
      const t = L.t;
      if (/help of a|claude|anthropic/i.test(t)) { notes.push('erased AI line'); continue; }
      if (/big print on the back/i.test(t)) { const s = fitDraw(ctx, 'FxSC', 'The big print on the back  ·  Printed to order in the UK', 'The big print on the back  ·  Printed to order', L, ink); notes.push('back-print line ' + s); continue; }
      if (/wispling/i.test(t) && dark) { const s = fitDraw(ctx, 'FxIt', 'by Wispling Press  ·  Printed to order in the UK', 'by Wispling Press  ·  Printed to order', L, ink); notes.push('footer ' + s); continue; }
      if (/wispling/i.test(t)) { const s = fitDraw(ctx, 'FxSC', 'Wispling Press  ·  printed to order in the UK', 'Wispling Press  ·  printed to order', L, ink); notes.push('card footer ' + s); continue; }
      notes.push('ERASED UNKNOWN: ' + t);
    }
    const out = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.93));
    return { action: 'patch', blob: out, notes: notes.join('; '), lines: bad.map(l => l.t) };
  };
  // preview a patched image on top of the page (for checking)
  S.preview = async (url) => { const r = await S.patch(url); if (!r.blob) return r.action + ' ' + r.notes; let d = document.getElementById('__fxprev'); if (!d) { d = document.createElement('div'); d.id = '__fxprev'; d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#fff;overflow:auto'; document.body.appendChild(d); } const u = URL.createObjectURL(r.blob); d.innerHTML = `<img src="${u}" style="width:100%">`; return r.action + ' ' + r.notes + ' | ' + JSON.stringify(r.lines); };
  S.listing = async (badIdx, dry) => {
    await S.init();
    for (let i = 0; i < 30 && !document.querySelector('.le-media-grid__item[id]'); i++) await sl(500);
    const imgs = [...document.querySelectorAll('.le-media-grid__item[id] img')].map(i => i.src.replace(/il_[0-9a-zA-Z]+(?=\.\d+_)/, 'il_fullxfull'));
    if (!imgs.length) return 'ERR no photos';
    const files = []; const rep = [];
    for (let i = 0; i < imgs.length; i++) {
      if (badIdx.includes(i)) {
        const r = await S.patch(imgs[i]); rep.push(i + ':' + r.action + (r.notes ? '(' + r.notes + ')' : ''));
        if (r.action === 'drop') continue;
        if (r.action === 'patch') { files.push(new File([r.blob], `photo_${i + 1}.jpg`, { type: 'image/jpeg' })); continue; }
      }
      const b = await (await fetch(imgs[i])).blob(); files.push(new File([b], `photo_${i + 1}.jpg`, { type: b.type || 'image/jpeg' }));
    }
    S.lastFiles = files;
    if (files.some(f => f.size < 15000)) return 'ERR small file ' + files.map(f => f.size).join(',');
    if (dry) return 'DRY ' + rep.join(' | ') + ' | files ' + files.length + '/' + imgs.length;
    document.querySelector('.le-media-grid__item[id]').querySelector('button').click(); await sl(1500);
    const vis = () => [...document.querySelectorAll('[role=dialog] button')].filter(b => b.offsetParent);
    const thumbs = () => vis().filter(b => b.className.startsWith('le-media-grid__item')).length;
    const del = () => vis().find(b => b.classList.contains('wt-btn--icon') && !b.getAttribute('aria-label') && !b.innerText.trim());
    let n = 0; while (thumbs() > 0 && n < 25) { const d = del(); if (!d) break; d.click(); await sl(900); n++; }
    const done = vis().find(b => b.innerText.trim() === 'Done'); if (done) done.click(); await sl(800);
    const inp = document.querySelector('input[type=file]'); const dt = new DataTransfer(); files.forEach(f => dt.items.add(f)); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
    let g = 0; for (let i = 0; i < 60; i++) { await sl(1000); g = document.querySelectorAll('.le-media-grid__item[id]').length; if (g >= files.length) break; }
    await sl(2500);
    const res = rep.join(' | ') + ' | deleted ' + n + ' up ' + files.length + ' grid ' + g;
    if (g !== files.length) return res + ' | NOT SAVED';
    const pub = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Publish changes'); if (!pub) return res + ' | no Publish button';
    pub.click(); for (let i = 0; i < 25 && !location.href.includes('/tools/listings'); i++) await sl(700);
    return res + ' | ' + (location.href.includes('/tools/listings') ? 'SAVED' : 'NOT SAVED ' + location.href);
  };
})();
'fx ready';
