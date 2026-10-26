// Composite real print files onto Flow-generated Brad blank-garment photos (in-browser, no download).
window.__XMF = ['XM_01_CHRISTMAS_POSTER','XM_02_CHRISTMAS_HAS_LANDED','XM_03_THE_FIRST_DELIVERY','XM_04_MEASURE_OF_CHRISTMAS','XM_05_NAUGHTY_OR_NICE','XM_06_ONE_NIGHT_ONLY','XM_07_SNOWBALL_SEASON','XM_08_FULL_TIME_FESTIVE','XM_09_TO_EVERY_ROOFTOP','XM_10_LUNCH_ATOP_NORTH_POLE','XM_11_WINTER_BULK','XM_12_SLIDE_INTO_CHRISTMAS','XM_13_SANTA_MRS_CLAUS_KISS','XM_14_CROSSING_INTO_CHRISTMAS','XM_15_ONE_GIANT_LEAP','XM_16_FORGET_THE_PUMPKIN'];
window.__load = src => new Promise((res, rej) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = rej; im.src = src; });
window.__shirt = function (im) {
  const c = new OffscreenCanvas(im.width, im.height), x = c.getContext('2d'); x.drawImage(im, 0, 0);
  const W = im.width, H = im.height, d = x.getImageData(0, 0, W, H).data;
  const dark = (px, py) => { const i = (py * W + px) * 4, r = d[i], g = d[i + 1], b = d[i + 2]; const l = .299 * r + .587 * g + .114 * b; return l < 42 && Math.max(r, g, b) - Math.min(r, g, b) < 28; };
  const span = py => { let best = [0, 0], s = -1; for (let px = Math.floor(W * .12); px < W * .88; px++) { if (dark(px, py)) { if (s < 0) s = px; } else if (s >= 0) { if (px - s > best[1] - best[0]) best = [s, px]; s = -1; } } if (s >= 0 && W * .88 - s > best[1] - best[0]) best = [s, Math.floor(W * .88)]; return best; };
  let y0 = -1; for (let py = Math.floor(H * .18); py < H * .6; py += 2) { const [a, b] = span(py); if (b - a > W * .30) { y0 = py; break; } }
  const rows = []; for (let py = y0 + Math.floor(H * .06); py < y0 + Math.floor(H * .2); py += 4) rows.push(span(py));
  rows.sort((p, q) => (p[1] - p[0]) - (q[1] - q[0])); const m = rows[Math.floor(rows.length / 2)];
  return { y0, a: m[0], b: m[1], W, H };
};
window.__comp = async function (flowSrc, file, kind, opt = {}) {
  const [im, pr] = await Promise.all([window.__load(flowSrc), window.__load('https://wisplingpress.github.io/print/pfy/' + file + '.png')]);
  const s = window.__shirt(im); const tw = s.b - s.a, cx = (s.a + s.b) / 2;
  let pw = tw * (opt.wf || (kind === 'tee' ? 0.56 : 0.52)); let ph = pw * pr.height / pr.width;
  const maxH = s.H * (kind === 'tee' ? 0.30 : 0.27); if (ph > maxH) { ph = maxH; pw = ph * pr.width / pr.height; }
  const top = s.y0 + s.H * (opt.tf || 0.075);
  const c = document.createElement('canvas'); c.width = s.W; c.height = s.H; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
  const p = document.createElement('canvas'); p.width = Math.round(pw); p.height = Math.round(ph); const px = p.getContext('2d');
  px.drawImage(pr, 0, 0, p.width, p.height);
  // fabric shading: soft-light the garment luminance into the print, keep print alpha
  px.globalCompositeOperation = 'source-atop'; px.globalAlpha = 0.55; px.filter = 'grayscale(1) contrast(1.6) brightness(2.4)';
  px.globalCompositeOperation = 'multiply'; px.drawImage(im, cx - pw / 2, top, pw, ph, 0, 0, p.width, p.height);
  px.filter = 'none'; px.globalAlpha = 1; px.globalCompositeOperation = 'destination-in'; px.drawImage(pr, 0, 0, p.width, p.height);
  x.globalAlpha = 0.94; x.drawImage(p, Math.round(cx - pw / 2), Math.round(top)); x.globalAlpha = 1;
  return { url: c.toDataURL('image/jpeg', 0.93), s, pw: Math.round(pw), top: Math.round(top) };
};
'brad ready';
