// Printify editor automation for the narrow (mobile) editor layout in the Claude browser pane.
// Navigate to https://printify.com/app/editor/<6 tee | 77 hoodie | 49 sweatshirt>/99/dtg first, then:
// window.__pcm({sides:[{side:'Front side',file:'X_CHEST.png',widthCm:9,left:69.9,top:0},{side:'Back side',file:'X_ART.png'}]})
window.__pcm = async function (cfg) {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const B = t => [...document.querySelectorAll('button')].find(b => b.offsetParent && b.textContent.trim().replace(/\s+/g, ' ') === t);
  const N = () => [...document.querySelectorAll('input[type=number]')].filter(i => i.offsetParent);
  const setVal = (inp, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; inp.focus(); s.call(inp, String(v)); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); inp.blur(); };
  let t0 = Date.now(); while (!B('add') && Date.now() - t0 < 25000) await W(500);
  for (const t of ['Got it', 'Explore by myself', 'close']) B(t)?.click();
  await W(1000);
  if (!HTMLInputElement.prototype.__patched) {
    const orig = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function () { if (this.type === 'file' && window.__nextFile) { const dt = new DataTransfer(); dt.items.add(window.__nextFile); this.files = dt.files; window.__nextFile = null; this.dispatchEvent(new Event('change', { bubbles: true })); window.__fired = true; return; } return orig.call(this); };
    HTMLInputElement.prototype.__patched = 1;
  }
  const log = [];
  for (const s of cfg.sides) {
    B('close')?.click(); await W(500);
    B(s.side).click(); await W(1500);
    const blob = await (await fetch('https://wisplingpress.github.io/print/pfy/' + s.file, { cache: 'no-store' })).blob();
    if (blob.size < 5000) return 'ERR file ' + s.file;
    window.__nextFile = new File([blob], s.file, { type: 'image/png' }); window.__fired = false;
    B('add').click(); await W(1500);
    const md = [...document.querySelectorAll('*')].filter(e => e.offsetParent && e.textContent.trim() === 'My device').pop();
    if (!md) return 'ERR no My device';
    md.parentElement.click();
    t0 = Date.now(); while (!window.__fired && Date.now() - t0 < 10000) await W(300);
    await W(1500);
    t0 = Date.now(); while ((/Adding file/.test(document.body.innerText) || !B('crop')) && Date.now() - t0 < 60000) await W(1000);
    await W(2500);
    B('layers Layers').click(); await W(2000);
    const layerTxt = document.body.innerText;
    if (!layerTxt.includes(s.file)) return 'ERR layer missing ' + s.file;
    if (s.widthCm) { setVal(N()[0], s.widthCm); await W(1200); setVal(N()[4], s.left); await W(1000); setVal(N()[5], s.top); await W(1200); }
    const dpi = (document.body.innerText.match(/\((\d+) DPI\)/) || [])[1];
    log.push(s.side + ':' + N().map(i => i.value).join('/') + ' dpi' + dpi);
    B('close')?.click(); await W(800);
  }
  B('palette Variants').click(); await W(2000);
  B('Select variants')?.click(); await W(2000);
  for (const name of [cfg.color || 'Black', 'White']) {
    const el = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === name && e.offsetParent);
    let c = el; for (let i = 0; i < 5 && c && !c.querySelector('input[type=checkbox]'); i++) c = c.parentElement;
    const cb = c.querySelector('input[type=checkbox]');
    if ((name !== 'White' && !cb.checked) || (name === 'White' && cb.checked)) cb.click();
    await W(800);
  }
  const txt = document.body.innerText;
  const sel = (txt.match(/(\d+) variants selected/) || [])[1];
  const gf = /Global Fulfillment eligible/.test(txt);
  if (cfg.dry) return JSON.stringify({ sel, gf, log });
  B('Save').click();
  t0 = Date.now(); while (!/mockup-library|product-details/.test(location.href) && Date.now() - t0 < 40000) await W(1000);
  const id = (location.href.match(/products\/([0-9a-f]{24})/) || [])[1];
  return JSON.stringify({ id, sel, gf, log });
};
'pcm ready';
