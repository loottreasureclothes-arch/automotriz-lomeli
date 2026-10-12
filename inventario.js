/* Inventario con filtros, orden, chips, paginación y parámetros en la URL (?tipo=, ?marca=, ?sucursal=, ?q=). */
(() => {
  const {$, $$, esc, money, D} = L, PER = 9, P = L.params();
  const PLURAL = {'SUV': 'SUVs', 'Sedán': 'Sedanes', 'Pick Up': 'Pick Ups', 'Hatchback': 'Hatchbacks'};
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  const canon = (vals, opts) => [...new Set(vals.map(v => opts.find(o => [norm(o), norm(o) + 's', norm(o) + 'es'].includes(norm(v)))).filter(Boolean))];
  const multi = k => P.getAll(k).join(',').split(',').map(s => s.trim()).filter(Boolean);
  const PAGO = {bancario: 'Crédito bancario', autofin: 'Solo autofinanciamiento', remate: 'Remate de contado'}, TRANS = ['Automática', 'Estándar'];
  const FUELS = () => [...new Set(L.publicCars().map(c => c.fuel).filter(Boolean))];
  let all = L.publicCars();
  const brandsAll = () => [...new Set(L.publicCars().map(c => c.marca))].sort((a, b) => a.localeCompare(b));
  const bounds = () => { const p = all.map(c => c.price), y = all.map(c => c.year); return {pmin: Math.floor(Math.min(...p, 100000) / 10000) * 10000, pmax: Math.ceil(Math.max(...p, 200000) / 10000) * 10000, ymin: Math.min(...y, 2015), ymax: Math.max(...y, 2024)} };
  let B = bounds();
  const st = {q: P.get('q') || '', tipo: canon(multi('tipo'), D.types), marca: canon(multi('marca'), brandsAll()), suc: canon(multi('sucursal'), D.branches.map(b => b.id)), trans: canon(multi('trans'), TRANS), fuel: canon(multi('combustible'), FUELS()), pago: canon(multi('pago'), Object.keys(PAGO)),
    pmin: +P.get('pmin') || 0, pmax: +P.get('pmax') || 0, ymin: +P.get('ymin') || 0, ymax: +P.get('ymax') || 0, hideSep: P.get('separados') === 'ocultar', sort: P.get('orden') || 'recientes', page: Math.max(1, +P.get('pagina') || 1)};
  const LISTS = {tipo: 'Carrocería', marca: 'Marca', pago: 'Forma de pago', suc: 'Sucursal', trans: 'Transmisión', fuel: 'Combustible'};
  const field = (c, k) => ({tipo: c.tipo, marca: c.marca, pago: c.fin || 'bancario', suc: c.sucursal, trans: c.trans, fuel: c.fuel}[k]);

  function match(c, skip) {
    if (st.q) { const hay = norm([c.title, c.marca, c.modelo, c.version, c.folio, c.tipo, c.year, c.sucursal, c.trans].join(' ')); if (!st.q.split(/\s+/).filter(Boolean).every(t => hay.includes(norm(t)))) return false }
    for (const k of Object.keys(LISTS)) { if (k === skip || !st[k].length) continue; if (!st[k].includes(field(c, k))) return false }
    if (skip !== 'price' && ((st.pmin && c.price < st.pmin) || (st.pmax && c.price > st.pmax))) return false;
    if (skip !== 'year' && ((st.ymin && c.year < st.ymin) || (st.ymax && c.year > st.ymax))) return false;
    if (st.hideSep && c.separado) return false;
    return true;
  }
  const SORTS = {recientes: (a, b) => String(b.added).localeCompare(String(a.added)), 'precio-asc': (a, b) => a.price - b.price, 'precio-desc': (a, b) => b.price - a.price, anio: (a, b) => b.year - a.year || a.price - b.price};

  const opt = (k, v, label) => `<label class="fopt" data-opt="${k}|${esc(v)}"><input type="checkbox" name="${k}" value="${esc(v)}"> ${esc(label || v)} <em data-cnt="${k}|${esc(v)}"></em></label>`;
  const radio = (k, v, label) => `<label class="fopt"><input type="radio" name="${k}" value="${v}"> ${label} <em data-cnt="${k}|${v}"></em></label>`;
  function buildForm() {
    const years = []; for (let y = B.ymax; y >= B.ymin; y--) years.push(y);
    $('#filterForm').innerHTML = `<fieldset class="fgroup"><legend>Carrocería</legend><div class="fopts">${D.types.map(t => opt('tipo', t, PLURAL[t])).join('')}</div></fieldset>
    <fieldset class="fgroup"><legend>Precio</legend><div class="priceRange"><output id="priceOut"></output><label>Desde<input type="range" id="pminR" min="${B.pmin}" max="${B.pmax}" step="10000"></label><label>Hasta<input type="range" id="pmaxR" min="${B.pmin}" max="${B.pmax}" step="10000"></label></div></fieldset>
    <fieldset class="fgroup"><legend>Marca</legend><input type="search" id="brandQ" placeholder="Buscar marca" aria-label="Buscar marca"><div class="fopts" id="brandOpts">${brandsAll().map(b => opt('marca', b)).join('')}</div></fieldset>
    <fieldset class="fgroup"><legend>Año</legend><div class="yearRow"><label>Desde<select id="yminS"><option value="0">Cualquiera</option>${years.slice().reverse().map(y => `<option>${y}</option>`).join('')}</select></label><label>Hasta<select id="ymaxS"><option value="0">Cualquiera</option>${years.map(y => `<option>${y}</option>`).join('')}</select></label></div></fieldset>
    <fieldset class="fgroup"><legend>Forma de pago</legend><div class="fopts">${Object.entries(PAGO).map(([k, v]) => opt('pago', k, v)).join('')}</div></fieldset>
    <fieldset class="fgroup"><legend>Transmisión</legend><div class="fopts">${TRANS.map(v => opt('trans', v)).join('')}</div><p class="subtle">Solo autos con la transmisión confirmada.</p></fieldset>
    ${FUELS().length ? `<fieldset class="fgroup"><legend>Combustible</legend><div class="fopts">${FUELS().map(v => opt('fuel', v)).join('')}</div></fieldset>` : ''}
    ${all.some(c => c.sucursal) ? `<fieldset class="fgroup"><legend>Sucursal</legend><div class="fopts">${D.branches.map(b => opt('suc', b.id, b.name)).join('')}</div></fieldset>` : ''}`;
    $('#brandQ').oninput = e => $$('#brandOpts .fopt').forEach(l => l.hidden = !norm(l.textContent).includes(norm(e.target.value)));
  }
  function syncForm() {
    const f = $('#filterForm');
    $$('input[type=checkbox]', f).forEach(i => i.checked = st[i.name].includes(i.value));
    $('#pminR').value = st.pmin || B.pmin; $('#pmaxR').value = st.pmax || B.pmax;
    $('#yminS').value = st.ymin || 0; $('#ymaxS').value = st.ymax || 0;
    $('#q').value = st.q; $('#sort').value = SORTS[st.sort] ? st.sort : 'recientes'; $('#hideSep').checked = st.hideSep;
    priceText();
  }
  const priceText = () => $('#priceOut').textContent = money(+$('#pminR').value) + ' – ' + money(+$('#pmaxR').value);
  function readForm(e) {
    const f = $('#filterForm');
    for (const k of Object.keys(LISTS)) st[k] = $$(`input[name=${k}]:checked`, f).map(i => i.value);
    let a = +$('#pminR').value, b = +$('#pmaxR').value;
    if (a > b) { if (e?.target.id === 'pminR') $('#pmaxR').value = b = a; else $('#pminR').value = a = b }
    st.pmin = a > B.pmin ? a : 0; st.pmax = b < B.pmax ? b : 0;
    st.ymin = +$('#yminS').value; st.ymax = +$('#ymaxS').value;
    if (st.ymin && st.ymax && st.ymin > st.ymax) { [st.ymin, st.ymax] = [st.ymax, st.ymin]; $('#yminS').value = st.ymin; $('#ymaxS').value = st.ymax }
    st.page = 1; priceText(); render();
  }
  function chips() {
    const c = [];
    if (st.q) c.push(['q', '', `“${st.q}”`]);
    for (const k of Object.keys(LISTS)) st[k].forEach(v => c.push([k, v, k === 'tipo' ? PLURAL[v] : k === 'suc' ? 'Sucursal ' + v : k === 'pago' ? PAGO[v] : v]));
    if (st.pmin || st.pmax) c.push(['price', '', `${money(st.pmin || B.pmin)} – ${money(st.pmax || B.pmax)}`]);
    if (st.ymin || st.ymax) c.push(['year', '', `Año ${st.ymin || B.ymin}–${st.ymax || B.ymax}`]);
    if (st.hideSep) c.push(['hideSep', '', 'Sin separados']);
    $('#chips').innerHTML = c.map(([k, v, l]) => `<button type="button" data-rm="${k}" data-v="${esc(v)}" aria-label="Quitar filtro ${esc(l)}">${esc(l)} ×</button>`).join('') + (c.length ? '<button type="button" class="clear" data-rm="all">Limpiar todo</button>' : '');
    $('#filterNum').textContent = c.length ? `(${c.length})` : '';
  }
  $('#chips').onclick = e => { const b = e.target.closest('[data-rm]'); if (!b) return; const k = b.dataset.rm, v = b.dataset.v; if (k === 'all') return clearAll(); if (LISTS[k]) st[k] = st[k].filter(x => x !== v); else if (k === 'price') st.pmin = st.pmax = 0; else if (k === 'year') st.ymin = st.ymax = 0; else if (k === 'hideSep') st.hideSep = false; else st[k] = k === 'q' ? '' : 0; st.page = 1; syncForm(); render() };
  function clearAll() { Object.assign(st, {q: '', tipo: [], marca: [], pago: [], suc: [], trans: [], fuel: [], pmin: 0, pmax: 0, ymin: 0, ymax: 0, hideSep: false, page: 1}); $('#brandQ').value = ''; $$('#brandOpts .fopt').forEach(l => l.hidden = false); syncForm(); render() }
  function counts() {
    for (const k of Object.keys(LISTS)) { const base = all.filter(c => match(c, k)); $$(`[data-cnt^="${k}|"]`).forEach(s => { const v = s.dataset.cnt.slice(k.length + 1); s.textContent = base.filter(c => field(c, k) === v).length }) }
  }
  function heading() {
    const parts = []; if (st.tipo.length === 1) parts.push(PLURAL[st.tipo[0]]); if (st.marca.length === 1) parts.push(st.marca[0]);
    const label = parts.length ? parts.join(' ') : 'Autos';
    $('#invTitle').innerHTML = `${esc(label.toUpperCase())} <em>SEMINUEVOS</em>`;
    const hero = $('.pageHero'), ph = st.tipo.length === 1 ? L.typePhoto(st.tipo[0]) : ''; hero.classList.toggle('photoHero', !!ph); if (ph) hero.style.setProperty('--hero', `url(${ph})`); else hero.style.removeProperty('--hero');
    $('#crumbTail').innerHTML = parts.length ? `<a href="inventario.html">Inventario</a></span><span>${esc(label)}` : 'Inventario';
    document.title = `${parts.length ? label + ' seminuevos' : 'Inventario de autos seminuevos'} en Aguascalientes | Automotriz Lomelí`;
  }
  function url() {
    const p = new URLSearchParams();
    if (st.q) p.set('q', st.q);
    [['tipo', 'tipo'], ['marca', 'marca'], ['pago', 'pago'], ['suc', 'sucursal'], ['trans', 'trans'], ['fuel', 'combustible']].forEach(([k, n]) => st[k].length && p.set(n, st[k].join(',')));
    [['pmin', 'pmin'], ['pmax', 'pmax'], ['ymin', 'ymin'], ['ymax', 'ymax']].forEach(([k, n]) => st[k] && p.set(n, st[k]));
    if (st.hideSep) p.set('separados', 'ocultar'); if (st.sort !== 'recientes') p.set('orden', st.sort); if (st.page > 1) p.set('pagina', st.page);
    try { history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : '')) } catch {}
  }
  function render() {
    const list = all.filter(c => match(c)).sort(SORTS[st.sort] || SORTS.recientes), pages = Math.max(1, Math.ceil(list.length / PER));
    st.page = Math.min(st.page, pages);
    $('#count').textContent = `${list.length} ${list.length === 1 ? 'auto disponible' : 'autos disponibles'}`;
    $('#results').innerHTML = list.slice((st.page - 1) * PER, st.page * PER).map(L.card).join('');
    $('#empty').hidden = !!list.length;
    $('#pager').innerHTML = pages > 1 ? `<button type="button" data-page="${st.page - 1}" ${st.page === 1 ? 'disabled' : ''} aria-label="Página anterior">‹</button>` + Array.from({length: pages}, (_, i) => `<button type="button" data-page="${i + 1}" ${i + 1 === st.page ? 'aria-current="page"' : ''}>${i + 1}</button>`).join('') + `<button type="button" data-page="${st.page + 1}" ${st.page === pages ? 'disabled' : ''} aria-label="Página siguiente">›</button>` : '';
    $('#applyFilters').textContent = `Ver ${list.length} ${list.length === 1 ? 'auto' : 'autos'}`;
    chips(); counts(); heading(); url(); L.syncFavs();
  }
  $('#pager').onclick = e => { const b = e.target.closest('[data-page]'); if (!b || b.disabled) return; st.page = +b.dataset.page; render(); $('#count').scrollIntoView({behavior: 'smooth', block: 'start'}) };
  $('#filterForm').addEventListener('input', e => { if (e.target.id !== 'brandQ') readForm(e) });
  $('#filterForm').addEventListener('submit', e => e.preventDefault());
  $('#sort').onchange = e => { st.sort = e.target.value; st.page = 1; render() };
  $('#hideSep').onchange = e => { st.hideSep = e.target.checked; st.page = 1; render() };
  $('#invSearch').onsubmit = e => { e.preventDefault(); st.q = $('#q').value.trim(); st.page = 1; render(); $('#count').scrollIntoView({behavior: 'smooth'}) };
  const panel = $('#filters'), toggle = open => { panel.classList.toggle('open', open); $('#openFilters').setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : '' };
  $('#openFilters').onclick = () => toggle(true); $('#closeFilters').onclick = $('#applyFilters').onclick = () => toggle(false);
  $('#clearAll').onclick = $('#emptyClear').onclick = clearAll;
  const saveSearch = () => { const label = $$('#chips button:not(.clear)').map(b => b.textContent.replace(' ×', '')).join(', ') || 'Todo el inventario'; const r = L.addAlert({kind: 'busqueda', label, query: location.search}); if (r === 'ok') L.toast('Alerta guardada. La verás en Mi cuenta.') };
  $('#saveSearch').onclick = $('#saveSearch2').onclick = saveSearch;
  $('#legal').innerHTML = L.cardsLegal();
  document.addEventListener('lomeli:inventory', () => { all = L.publicCars(); render() });
  buildForm(); syncForm(); render();
})();
