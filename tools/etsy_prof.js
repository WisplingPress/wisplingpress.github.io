// Reset an Etsy Printify delivery profile to our rates (open the profile editor first).
// Usage: await __profPrep(kind)  then repeat  await __profRows(kind)  until it returns 'bad=0', then  await __profSave(kind)
// kind: 'tee' | 'hood'. Method that sticks: focus + native setter + input/change + el.blur() (a synthetic 'blur' Event reverts).
(() => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const EU = ['Austria','Belgium','Bulgaria','Croatia','Cyprus','Czech Republic','Denmark','Estonia','Finland','France','Germany','Greece','Hungary','Ireland','Italy','Latvia','Lithuania','Luxembourg','Malta','Poland','Portugal','Romania','Slovakia','Slovenia','Spain','Sweden','The Netherlands'];
  const EFTA = ['Iceland','Liechtenstein','Norway','Switzerland'];
  const NAME = { tee: 'Printify tees: printed in your region', hood: 'Printify hoodies: printed in your region' };
  window.__rate = (kind, c) => {
    const H = kind === 'hood';
    if (c === 'United Kingdom') return [3.79, 2.00, 2, 5];
    if (c === 'United States') return [H ? 6.99 : 4.99, 2.49, 3, 8];
    if (c === 'Canada') return [H ? 7.99 : 6.99, 2.49, 5, 12];
    if (c === 'Australia' || c === 'New Zealand') return [H ? 10.99 : 7.99, 2.49, 6, 15];
    if (EFTA.includes(c)) return [H ? 9.99 : 7.49, 2.49, 6, 15];
    if (EU.includes(c)) return [H ? 6.99 : 5.99, 2.49, 6, 15];
    if (c === 'Everywhere else') return H ? [11.99, 7.99, 10, 30] : [9.99, 4.00, 10, 30];
    return null;
  };
  const setSel = async (s, v) => { s.focus(); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, v); s.dispatchEvent(new Event('change', { bubbles: true })); s.dispatchEvent(new Event('input', { bubbles: true })); s.blur(); await W(15); };
  const setInp = async (el, v) => { el.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.blur(); await W(15); };
  const rows = () => [...document.querySelectorAll('select[id^=consolidated_shipping_service_]')].map(s => { let row = s; for (let i = 0; i < 14; i++) { if (row.parentElement.querySelectorAll('select[id^=consolidated_shipping_service_]').length > 1) break; row = row.parentElement; } return row; });
  const cname = row => row.innerText.split('\n').map(x => x.trim()).filter(Boolean)[0];
  const optVal = (s, txt) => ([...s.options].find(o => o.text.trim() === txt) || {}).value;
  const ok = (kind, row) => { const q = x => row.querySelector(x); const R = __rate(kind, cname(row)); if (!R) return true; return +q('input[id^=primary_cost]').value === R[0] && +q('input[id^=secondary_cost]').value === R[1] && +q('select#min_delivery_input').value === R[2] && +q('select#max_delivery_input').value === R[3] && q('select[id^=consolidated_shipping_service_]').selectedOptions[0].text === 'Other'; };
  window.__profPrep = async kind => {
    const sc = document.getElementById('shipping_country');
    if (sc.selectedOptions[0].text !== 'United Kingdom') { await setSel(sc, optVal(sc, 'United Kingdom')); await W(3000); }
    await setInp(document.getElementById('origin_postal_code'), 'BB1 3BY');
    await setInp(document.getElementById('profile_name'), NAME[kind]);
    for (const s of document.querySelectorAll('select[id^=consolidated_shipping_service_]')) if (s.selectedOptions[0].text !== 'Other') await setSel(s, optVal(s, 'Other'));
    await W(1500);
    const unknown = rows().map(cname).filter(c => !__rate(kind, c));
    return 'prep ' + document.getElementById('profile_name').value + ' | ' + sc.selectedOptions[0].text + ' ' + document.getElementById('origin_postal_code').value + ' | rows ' + rows().length + (unknown.length ? ' | UNKNOWN ' + unknown.join(',') : '');
  };
  window.__profRows = async (kind, ms = 32000) => {
    const t0 = Date.now(); let done = 0;
    for (const row of rows()) {
      if (Date.now() - t0 > ms) break;
      if (ok(kind, row)) continue;
      const R = __rate(kind, cname(row)); const q = x => row.querySelector(x);
      const sv = q('select[id^=consolidated_shipping_service_]'); if (sv.selectedOptions[0].text !== 'Other') await setSel(sv, optVal(sv, 'Other'));
      const ch = q('select[id^=charge_option_]'); if (ch && ch.selectedOptions[0].text !== 'Fixed price') await setSel(ch, optVal(ch, 'Fixed price'));
      await setSel(q('select#min_delivery_input'), String(R[2])); await setSel(q('select#max_delivery_input'), String(R[3]));
      await setInp(q('input[id^=primary_cost]'), R[0].toFixed(2)); await setInp(q('input[id^=secondary_cost]'), R[1].toFixed(2));
      done++;
    }
    const bad = rows().filter(r => !ok(kind, r)).map(cname);
    return 'set ' + done + ' | bad=' + bad.length + (bad.length ? ' ' + bad.join(',') : '');
  };
  window.__profSave = async kind => {
    const nm = document.getElementById('profile_name').value, cty = document.getElementById('shipping_country').selectedOptions[0].text, pc = document.getElementById('origin_postal_code').value;
    const bad = rows().filter(r => !ok(kind, r)).map(cname);
    if (nm !== NAME[kind] || cty !== 'United Kingdom' || pc !== 'BB1 3BY' || bad.length) return 'NOT SAVED ' + nm + ' ' + cty + ' ' + pc + ' bad ' + bad.join(',');
    [...document.querySelectorAll('button')].find(b => b.offsetParent && /^Save profile/.test(b.innerText.trim())).click();
    await W(6000);
    return 'saved ' + nm + ' | modal open: ' + !!document.getElementById('profile_name') + ' | err: ' + ((document.body.innerText.match(/[^\n]*(error|required|invalid|went wrong)[^\n]*/i) || [''])[0]).slice(0, 120);
  };
  window.__profCheck = kind => { const bad = rows().filter(r => !ok(kind, r)).map(cname); return document.getElementById('profile_name').value + ' | ' + document.getElementById('shipping_country').selectedOptions[0].text + ' ' + document.getElementById('origin_postal_code').value + ' | rows ' + rows().length + ' | bad ' + bad.length + ' ' + bad.join(','); };
  window.__profOpen = async pid => { const a = document.querySelector('a[href*="shipping_profile_id:' + pid + '"]'); if (!a) return 'no row'; const b = [...a.closest('tr').querySelectorAll('button')]; b[3].click(); await W(400); b[4].click(); await W(4500); return 'open ' + (document.getElementById('profile_name') || {}).value; };
})();
'etsy_prof ready';
