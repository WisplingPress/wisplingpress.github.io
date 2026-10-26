// Printify editor automation (run in the editor page after navigating to /app/editor/<blueprint>/99/dtg).
// window.__pc({sides:[{side:'Front side',url:'https://wisplingpress.github.io/print/pfy/X.png',name:'X.png',widthCm:9,left:69.9,top:0}],color:'Black'})
window.__pc = async function (cfg) {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const txt = () => document.body.innerText;
  const byText = (t, sel = 'button,a,div,span,label,li') => [...document.querySelectorAll(sel)].filter(e => e.offsetParent && e.textContent.trim() === t);
  const click = el => { for (const ty of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) el.dispatchEvent(new MouseEvent(ty, { bubbles: true, cancelable: true, view: window })); };
  const setVal = (inp, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; inp.focus(); s.call(inp, String(v)); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); inp.blur(); };
  let t0 = Date.now(); while (!/Save product/.test(txt()) && Date.now() - t0 < 30000) await W(500);
  await W(1500);
  if (!HTMLInputElement.prototype.__patched) {
    const orig = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function () { if (this.type === 'file' && window.__nextFile) { const dt = new DataTransfer(); dt.items.add(window.__nextFile); this.files = dt.files; window.__nextFile = null; this.dispatchEvent(new Event('change', { bubbles: true })); window.__fired = true; return; } return orig.call(this); };
    HTMLInputElement.prototype.__patched = 1;
  }
  const log = [];
  for (const s of cfg.sides) {
    const chip = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === s.side);
    chip.click(); await W(1500);
    const blob = await (await fetch(s.url, { cache: 'no-store' })).blob();
    if (blob.size < 5000) return 'ERR file ' + s.url + ' ' + blob.size;
    window.__nextFile = new File([blob], s.name, { type: 'image/png' }); window.__fired = false;
    const up = byText('Upload')[0]; click(up); await W(1500);
    const dev = byText('My device')[0]; if (!dev) return 'ERR no My device';
    click(dev.closest('button,div[role=button],li') || dev);
    t0 = Date.now(); while (!txt().includes(s.name) && Date.now() - t0 < 90000) await W(1000);
    if (!txt().includes(s.name)) return 'ERR upload timeout ' + s.name;
    await W(2500);
    if (s.widthCm) {
      const nums = () => [...document.querySelectorAll('input[type=number],input[inputmode]')].filter(i => i.offsetParent);
      let n = nums(); setVal(n[0], s.widthCm); await W(1200);
      n = nums(); setVal(n[4], s.left); await W(800); n = nums(); setVal(n[5], s.top); await W(1200);
    }
    const n2 = [...document.querySelectorAll('input[type=number],input[inputmode]')].filter(i => i.offsetParent).map(i => i.value);
    const dpi = (txt().match(/\((\d+) DPI\)/) || [])[1];
    log.push(s.side + ' ' + n2.slice(0, 6).join('/') + ' dpi' + dpi);
  }
  // variants: black only
  const sv = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Select variants'); sv.click(); await W(2000);
  for (const name of [cfg.color || 'Black', 'White']) {
    const el = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === name && e.offsetParent);
    let c = el; for (let i = 0; i < 5 && c && !c.querySelector('input[type=checkbox]'); i++) c = c.parentElement;
    const cb = c.querySelector('input[type=checkbox]');
    if ((name !== 'White' && !cb.checked) || (name === 'White' && cb.checked)) cb.click();
    await W(800);
  }
  const sel = (txt().match(/(\d+) variants selected/) || [])[1];
  const blk = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === (cfg.color || 'Black') && e.offsetParent);
  let bc = blk; for (let i = 0; i < 5 && bc && !bc.querySelector('input[type=checkbox]'); i++) bc = bc.parentElement;
  const sizes = (bc.innerText.match(/(\d+)\/(\d+) sizes/) || [])[0];
  const gf = /Global Fulfillment eligible/.test(txt());
  [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Save product').click();
  t0 = Date.now(); while (!/mockup-library|product-details/.test(location.href) && Date.now() - t0 < 60000) await W(1000);
  const id = (location.href.match(/products\/([0-9a-f]{24})/) || [])[1];
  return JSON.stringify({ id, sel, sizes, gf, log });
};
'pc ready';
