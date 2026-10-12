/* Funciones compartidas: datos locales, encabezado, pie, cookies, favoritos, tarjetas y agenda. */
window.L = (() => {
  const D = window.LOMELI_DATA;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const money = n => new Intl.NumberFormat('es-MX', {style: 'currency', currency: 'MXN', maximumFractionDigits: 0}).format(n);
  const num = n => Number(n || 0).toLocaleString('es-MX');
  const wa = m => 'https://wa.me/' + D.whatsapp + '?text=' + encodeURIComponent(m);
  const params = () => new URLSearchParams(location.search);
  const KEYS = {inv: 'lomeli-inventory-v3', fav: 'lomeli-favorites-v1', acc: 'lomeli-account-v1', citas: 'lomeli-citas-v1', pre: 'lomeli-ventas-v1', leads: 'lomeli-leads-v1', alerts: 'lomeli-alerts-v1', cookies: 'lomeli-cookies-v1'};
  function get(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback } catch { return fallback } }
  function put(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { alert('No se pudo guardar. El almacenamiento del navegador está lleno o no está disponible.'); return false } }
  const LEGAL = 'Mensualidad estimada con tasa ilustrativa fija de 15% anual. No incluye IVA, seguros ni comisiones. Crédito bancario sujeto a aprobación; tasa, CAT y requisitos los define el banco. Cálculo informativo: no constituye oferta ni aprobación de crédito.';

  /* Inventario */
  const valid = c => c && typeof c.id === 'string' && c.marca && c.modelo && Number.isFinite(c.price);
  let inventory = (() => { const s = get(KEYS.inv, null); return Array.isArray(s) && s.length && s.every(valid) ? s : structuredClone(D.vehicles) })();
  const cars = () => inventory;
  const publicCars = () => inventory.filter(c => c.state === 'Disponible');
  const find = id => inventory.find(c => c.id === id);
  function saveCars(list) { if (!put(KEYS.inv, list)) return false; inventory = list; document.dispatchEvent(new Event('lomeli:inventory')); return true }
  function resetCars() { try { localStorage.removeItem(KEYS.inv) } catch {} inventory = structuredClone(D.vehicles); document.dispatchEvent(new Event('lomeli:inventory')) }
  const name = c => `${c.marca} ${c.modelo}`.trim();
  /* Nombre completo del auto: el título tal cual viene en el catálogo; si no hay, se arma con marca, modelo, versión y año. */
  const fullName = c => (c.title || `${c.marca} ${c.modelo} ${c.version || ''} ${c.year || ''}`).replace(/\s+/g, ' ').trim();
  const isDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '');

  /* Siluetas para los iconos de carrocería */
  const SIL = {
    'Sedán': {b: 'M70 272L70 238Q74 216 108 211L205 200Q245 150 300 146L405 146Q452 150 492 200L560 210Q588 216 588 244L588 272Z', x: [178, 478]},
    'SUV': {b: 'M68 274L68 216Q70 194 100 190L168 184L218 124Q228 114 250 114L470 114Q492 114 506 134L542 184L572 191Q592 197 592 226L592 274Z', x: [170, 480]},
    'Pick Up': {b: 'M58 274L58 194L330 194L346 130Q350 119 366 119L462 119Q478 119 488 134L518 184L578 191Q598 196 598 226L598 274Z', x: [152, 500]},
    'Hatchback': {b: 'M84 272L84 162Q86 134 114 132L380 132Q402 132 416 148L466 190L552 198Q580 203 580 233L580 272Z', x: [180, 470]}
  };
  /* Logos de marca: logotipos oficiales en assets/marcas/ (Simple Icons; Cupra de Wikimedia Commons), monocromos en negro.
     Sobre fondo oscuro se muestran en blanco con la clase .inv. Una marca sin archivo se muestra como monograma. */
  const BRANDS = ['Volkswagen', 'Suzuki', 'Cupra', 'Nissan', 'Toyota', 'RAM', 'Chevrolet', 'Kia', 'BMW', 'Mercedes-Benz', 'Honda', 'SEAT'];
  const brandFile = marca => { const key = BRANDS.find(k => k.toLowerCase() === String(marca || '').trim().toLowerCase()); return key ? 'assets/marcas/' + key.toLowerCase() + '.svg' : '' };
  function logo(marca, cls = '') {
    const src = brandFile(marca);
    const inner = src ? `<img src="${src}" alt="${esc(marca)}" loading="lazy">` : `<b aria-label="${esc(marca)}">${esc(String(marca || '?').replace(/[^A-Za-zÁÉÍÓÚÑ]/g, '').slice(0, 2).toUpperCase())}</b>`;
    return `<span class="brandLogo ${cls}">${inner}</span>`;
  }

  /* Imágenes: fotos reales de assets/ o subidas en el panel. Si un auto aún no tiene foto, se muestra el logo de su marca. */
  function placeholder(c) {
    const src = brandFile(c.marca);
    if (src) return src;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="400" fill="#eef0f3"/><text x="320" y="225" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="64" font-weight="900" fill="#9aa1ab">${esc(String(c.marca || '').toUpperCase())}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  const okPhoto = p => /^(assets\/(catalogo\/)?[\w.-]+\.(webp|png|jpe?g)|data:image\/(jpeg|png|webp);base64,)/.test(p || '');
  function photos(c) {
    const real = (c.photos || []).filter(okPhoto).map(src => ({src, real: true}));
    return real.length ? real : [{src: placeholder(c), real: false}];
  }
  const cover = c => photos(c)[0];

  /* Formas de pago de cada auto (catálogo de WhatsApp): crédito bancario, autofinanciamiento o remate de contado. */
  function plan(c) {
    const fin = c.fin || 'bancario', remate = fin === 'remate', base = remate && c.listPrice > c.price ? c.listPrice : c.price;
    return {bank: fin === 'bancario', autofin: true, remate, cash: c.price, list: base, autoDown: base * 0.7, autoRest: base * 0.3};
  }
  const AUTO_PCT = 70, AUTO_MAX = 12, BANK_TERMS = [12, 24, 36, 48, 60];

  /* Mensualidad con la fórmula de finance.js */
  const quote = (c, pct = 0, months = 60) => lomeliPayment(c.price, pct, months);
  const monthly = (c, pct = 0, months = 60) => quote(c, pct, months).payment;

  /* Favoritos */
  const favs = () => { const f = get(KEYS.fav, []); return Array.isArray(f) ? f.filter(x => typeof x === 'string') : [] };
  const isFav = id => favs().includes(id);
  function toggleFav(id) { const f = favs(), next = f.includes(id) ? f.filter(x => x !== id) : [...f, id]; put(KEYS.fav, next); syncFavs(); return next.includes(id) }
  function syncFavs() {
    const f = favs();
    $$('[data-fav]').forEach(b => { const on = f.includes(b.dataset.fav); b.setAttribute('aria-pressed', on); b.classList.toggle('on', on); const t = b.querySelector('.favText'); if (t) t.textContent = on ? 'Guardado' : 'Guardar' });
    $$('.favCount').forEach(s => { s.textContent = f.length || ''; s.hidden = !f.length });
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-fav]'); if (!b) return; e.preventDefault(); const on = toggleFav(b.dataset.fav); toast(on ? 'Guardado en tus favoritos.' : 'Quitado de tus favoritos.') });

  /* Cuenta local */
  const account = () => get(KEYS.acc, {}) || {};
  const session = () => { const s = account().session; return s && s.email && s.phoneVerified ? s : null };
  function setSession(s) { const a = account(); a.session = s; return put(KEYS.acc, a) }

  /* Registros locales (citas, preofertas, prospectos y alertas) */
  const list = key => { const v = get(KEYS[key], []); return Array.isArray(v) ? v : [] };
  function folio(prefix, items) { const n = items.reduce((m, x) => Math.max(m, Number(String(x.folio || '').split('-').pop()) || 0), 0) + 1; return prefix + '-' + String(n).padStart(4, '0') }
  function add(key, prefix, item) { const items = list(key), rec = {id: crypto.randomUUID(), folio: folio(prefix, items), createdAt: new Date().toISOString(), ...item}; return put(KEYS[key], [rec, ...items]) ? rec : null }
  function update(key, id, patch) { const items = list(key).map(x => x.id === id ? {...x, ...patch} : x); return put(KEYS[key], items) }
  function remove(key, id) { return put(KEYS[key], list(key).filter(x => x.id !== id)) }

  /* Avisos breves */
  let toastTimer;
  function toast(msg) {
    let t = $('#toast'); if (!t) { document.body.insertAdjacentHTML('beforeend', '<div id="toast" role="status" aria-live="polite"></div>'); t = $('#toast') }
    t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* Piezas de interfaz */
  const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.4 2.5.9-1.4 2.4-2.5 4.4-2.5 3.7 0 5.9 3.9 4.3 7.3C19.5 16.4 12 21 12 21Z"/></svg>';
  const waIcon = '<svg class="waIcon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.52 3.48A11.87 11.87 0 0 0 12.05 0C5.47 0 .11 5.35.1 11.93c0 2.1.55 4.16 1.6 5.98L0 24l6.25-1.64a11.9 11.9 0 0 0 5.8 1.48h.01c6.58 0 11.93-5.35 11.94-11.93a11.88 11.88 0 0 0-3.48-8.43ZM12.06 21.83a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.72.98.99-3.63-.23-.37a9.86 9.86 0 0 1-1.51-5.29c0-5.47 4.45-9.92 9.92-9.92 2.65 0 5.14 1.04 7.02 2.91a9.86 9.86 0 0 1 2.9 7.02c0 5.47-4.45 9.91-9.98 9.89Zm5.44-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.46-.88-.78-1.48-1.74-1.65-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.26.3-1.03 1.02-1.03 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.48 1.69.62.7.22 1.34.19 1.85.11.56-.08 1.76-.72 2.01-1.42.25-.69.25-1.29.18-1.41-.08-.13-.28-.2-.58-.35Z"/></svg>';
  function tags(c) {
    const t = [];
    if (c.separado) t.push('<span class="vtag sep">Separado</span>');
    if ((c.tags || []).includes('nuevo')) t.push('<span class="vtag new">Recién llegado</span>');
    if ((c.tags || []).includes('demanda')) t.push('<span class="vtag hot">Alta demanda</span>');
    return t.join('');
  }
  function priceBlock(c, small) {
    const p = plan(c);
    if (p.remate) return `<div class="vprice"><s>${money(p.list)}</s><strong>${money(c.price)}</strong><span class="vterm remate">Precio de remate únicamente de contado</span></div>`;
    if (p.bank) return `<div class="vprice"><strong>${money(c.price)}</strong><span>0% de enganche: <b>${money(monthly(c))}</b>/mes a 60 meses*</span><span class="vterm">Crédito bancario o autofinanciamiento</span></div>`;
    return `<div class="vprice"><strong>${money(c.price)}</strong><span class="vterm auto">Solo autofinanciamiento: 70% de enganche (${money(p.autoDown)}) y el resto hasta en 12 meses</span></div>`;
  }
  const specsLine = c => [c.year, c.tipo, c.trans, Number.isFinite(c.km) && c.km !== null ? num(c.km) + ' km' : '', c.fuel].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join('');
  function card(c) {
    const p = cover(c), url = 'auto.html?id=' + encodeURIComponent(c.id), on = isFav(c.id), pl = plan(c);
    return `<article class="vcard"><a class="vcardImg${p.real ? ' real' : ''}" href="${url}" tabindex="-1" aria-hidden="true"><img src="${esc(p.src)}" alt="" loading="lazy"><span class="vtags">${pl.remate ? '<span class="vtag hot">Remate</span>' : ''}${tags(c)}</span></a><button class="favBtn${on ? ' on' : ''}" data-fav="${esc(c.id)}" aria-pressed="${on}" aria-label="Guardar ${esc(fullName(c))} en favoritos">${heart}</button><div class="vcardBody"><div class="vbrand">${logo(c.marca)}<span>${esc(c.marca)}</span></div><h3><a href="${url}">${esc(fullName(c))}</a></h3><p class="vspecs">${specsLine(c)}</p>${priceBlock(c)}</div></article>`;
  }
  const cardsLegal = () => `<p class="legal">* Simulación de crédito bancario con 0% de enganche a 60 meses, sujeta a aprobación. ${LEGAL} Kilometraje, color y demás datos de cada auto: pregúntalos por WhatsApp.</p>`;
  const stars = n => '<span class="stars" aria-label="' + n + ' de 5 estrellas">' + '★'.repeat(n) + '<i>' + '★'.repeat(5 - n) + '</i></span>';
  const reviewsHTML = (n = 6) => `<div class="reviewWall">${D.reviews.slice(0, n).map(([who, s, txt]) => `<figure class="review"><div class="reviewTop"><span class="avatar" aria-hidden="true">${esc(who[0])}</span><div><strong>${esc(who)}</strong>${stars(s)}</div></div><blockquote>${esc(txt)}</blockquote><figcaption>Reseña de ejemplo</figcaption></figure>`).join('')}</div><p class="subtle">Reseñas ilustrativas. Se sustituirán por las reseñas reales de Google de Automotriz Lomelí.</p>`;
  const faqHTML = items => `<div class="faq">${items.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  const branchesHTML = () => `<div class="branches">${D.branches.map(b => `<article><img src="${esc(b.img)}" alt="Fachada de referencia de la ${esc(b.name)}" loading="lazy"><div><h3>${esc(b.name)}</h3><p>${esc(b.address)}</p><p class="hours"><b>Horario:</b> ${esc(b.hours)} <span class="pend">Pendiente de confirmar</span></p><div class="actions">${b.map ? `<a class="textLink" target="_blank" rel="noopener" href="${esc(b.map)}">Cómo llegar</a>` : `<a class="textLink" target="_blank" rel="noopener" href="${esc(wa('¿Me comparten la ubicación de la ' + b.name + '?'))}">Solicitar ubicación</a>`}<a class="textLink" href="cita.html?sucursal=${esc(b.id)}">Agendar visita</a></div></div></article>`).join('')}</div>`;
  const kitHTML = () => { const total = D.kit.reduce((s, k) => s + k[2], 0); return `<div class="kit">${D.kit.map(([t, d, val], i) => `<article><b>${String(i + 1).padStart(2, '0')}</b><h3>${esc(t)}</h3><p>${esc(d)}</p><span class="kitValue">Valor de ejemplo ${money(val)}</span></article>`).join('')}<article class="kitTotal"><p class="eyebrow">VALOR TOTAL DE EJEMPLO</p><strong>${money(total)}</strong><p>Beneficios y montos ilustrativos, pendientes de confirmar con Automotriz Lomelí antes de publicarse.</p><a class="btn" href="inventario.html">Ver autos</a></article></div>` };
  const typeIcon = t => ({'SUV': SIL['SUV'], 'Sedán': SIL['Sedán'], 'Pick Up': SIL['Pick Up'], 'Hatchback': SIL['Hatchback']}[t]);
  /* Fotos de sección por carrocería (assets/secciones/) */
  const TYPE_PHOTO = {'Sedán': 'sedan', 'SUV': 'suv', 'Pick Up': 'pickup', 'Hatchback': 'hatchback'};
  const typePhoto = t => TYPE_PHOTO[t] ? 'assets/secciones/' + TYPE_PHOTO[t] + '.jpg' : '';
  const typeSVG = t => { const s = typeIcon(t); return `<svg viewBox="40 100 580 220" aria-hidden="true"><path d="${s.b}" fill="currentColor"/>${s.x.map(x => `<circle cx="${x}" cy="274" r="36" fill="#10141b"/><circle cx="${x}" cy="274" r="14" fill="#fff"/>`).join('')}</svg>` };

  /* Encabezado, pie, WhatsApp flotante y cookies */
  function chrome() {
    const page = location.pathname.split('/').pop() || 'index.html';
    const link = (href, label) => `<a href="${href}"${page === href ? ' aria-current="page"' : ''}>${label}</a>`;
    document.body.insertAdjacentHTML('afterbegin', `<a class="skip" href="#main">Saltar al contenido</a><header class="siteHeader"><a class="brand" href="index.html"><img src="assets/logo.svg" alt="Automotriz Lomelí"></a><a class="headFav" href="cuenta.html#favoritos" aria-label="Mis favoritos">${heart}<span class="favCount" hidden></span></a><button id="menu" aria-expanded="false" aria-controls="nav">Menú</button><nav id="nav">${link('inventario.html', 'Inventario')}${link('vender.html', 'Vender mi auto')}${link('credito.html', 'Crédito')}${link('cita.html', 'Agendar cita')}<a href="index.html#sucursales">Sucursales</a><a class="navAccount" href="cuenta.html"${page === 'cuenta.html' ? ' aria-current="page"' : ''}>Mi cuenta</a><button id="adminOpen" type="button">Acceso administrativo</button></nav></header>`);
    const types = D.types.map(t => `<a href="inventario.html?tipo=${encodeURIComponent(t)}">${t}</a>`).join('');
    const main = $('main'); if (main && !main.id) main.id = 'main';
    (main || document.body.lastElementChild).insertAdjacentHTML('afterend', `<footer class="siteFooter"><div class="footGrid wrap"><div class="footBrand"><img src="assets/logo.svg" alt="Automotriz Lomelí"><p>Autos seminuevos en Aguascalientes. Compra, venta, consignación y financiamiento.</p><div class="footSocial"><a href="https://www.tiktok.com/@automotriz.lomeli" target="_blank" rel="noopener">TikTok</a><a href="https://www.facebook.com/share/12E1Avqvkmo/" target="_blank" rel="noopener">Facebook</a><a href="https://www.instagram.com/automotriz.lomeli/" target="_blank" rel="noopener">Instagram</a></div></div><div><h3>Acceso rápido</h3><a href="inventario.html">Inventario</a><a href="vender.html">Vender mi auto</a><a href="cita.html">Agendar cita</a><a href="cuenta.html">Mi cuenta</a><a href="index.html#blog">Blog</a></div><div><h3>Financiamiento</h3><a href="credito.html">Solicitar crédito</a><a href="index.html#financiamiento">Calcular mensualidad</a><a href="credito.html#preguntas">Preguntas de crédito</a><a href="index.html#garantias">Kit de beneficios</a></div><div><h3>Carrocerías</h3>${types}</div><div><h3>Contacto</h3><a href="${esc(wa('Hola, quiero información sobre sus vehículos.'))}" target="_blank" rel="noopener">WhatsApp ${D.phone}</a><a href="tel:+524499078817">Llamar al ${D.phone}</a><a href="index.html#sucursales">Sucursal Sur</a><a href="index.html#sucursales">Sucursal Norte</a></div></div><div class="footBottom wrap"><span>© 2026 Automotriz Lomelí · Aguascalientes</span><a href="privacidad.html">Aviso de privacidad</a><button type="button" id="cookiePrefs">Preferencias de cookies</button><button type="button" id="adminOpenFoot">Acceso administrativo</button></div></footer><a class="floating" href="${esc(wa('Hola, quiero información sobre sus vehículos.'))}" target="_blank" rel="noopener" aria-label="Contactar por WhatsApp">${waIcon}<span>WhatsApp</span></a>`);
    $('#menu').onclick = () => { const open = $('#nav').classList.toggle('open'); $('#menu').setAttribute('aria-expanded', open) };
    $('#nav').addEventListener('click', e => { if (e.target.closest('a')) { $('#nav').classList.remove('open'); $('#menu').setAttribute('aria-expanded', 'false') } });
    $('#adminOpenFoot').onclick = () => $('#adminOpen').click();
    $$('.wa[data-message]').forEach(a => { a.href = wa(a.dataset.message); a.target = '_blank'; a.rel = 'noopener' });
    cookies(false); $('#cookiePrefs').onclick = () => cookies(true);
    syncFavs();
  }
  function cookies(force) {
    if (!force && get(KEYS.cookies, null)) return;
    $('#cookieBar')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div id="cookieBar" class="cookieBar" role="region" aria-label="Aviso de cookies"><p>Este sitio guarda en tu navegador tus favoritos, citas y preferencias para que funcione. No usamos cookies de publicidad. <a href="privacidad.html">Aviso de privacidad</a></p><div><button type="button" data-cookie="necesarias">Solo necesarias</button><button type="button" class="btn" data-cookie="todas">Aceptar</button></div></div>`);
    $$('[data-cookie]').forEach(b => b.onclick = () => { put(KEYS.cookies, {choice: b.dataset.cookie, at: new Date().toISOString()}); $('#cookieBar').remove() });
  }

  /* Agenda compartida (cita.html y ficha del auto) */
  const pad = n => String(n).padStart(2, '0');
  const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function nextDays(n = 14) { const out = [], d = new Date(); d.setHours(12, 0, 0, 0); while (out.length < n) { if (d.getDay() !== 0) out.push(new Date(d)); d.setDate(d.getDate() + 1) } return out }
  const slotsFor = date => date.getDay() === 6 ? ['10:00', '11:00', '12:00', '13:00'] : ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  const fmtDay = (key, opts = {weekday: 'long', day: 'numeric', month: 'long'}) => { if (!isDate(key)) return 'Fecha por confirmar'; const [y, m, d] = key.split('-').map(Number); return new Intl.DateTimeFormat('es-MX', opts).format(new Date(y, m - 1, d, 12)) };
  const PAY = ['Contado', 'Crédito', 'Mi auto a cuenta', 'Aún no lo sé'];
  function booking(root, opts = {}) {
    const st = {branch: opts.branch || '', pay: '', car: opts.carId || '', date: '', time: ''};
    const cars = publicCars();
    root.innerHTML = `<form class="booking" novalidate>${opts.full ? `<fieldset><legend><b>1</b> Elige la sucursal</legend><div class="choiceGrid">${D.branches.map(b => `<label class="choice"><input type="radio" name="branch" value="${b.id}" ${st.branch === b.id ? 'checked' : ''} required><span><strong>${esc(b.name)}</strong><small>${esc(b.address)}</small></span></label>`).join('')}</div></fieldset><fieldset><legend><b>2</b> ¿Cómo piensas pagar?</legend><div class="chipRow">${PAY.map(p => `<label class="chipChoice"><input type="radio" name="pay" value="${p}" ${opts.pay === p ? 'checked' : ''} required><span>${p}</span></label>`).join('')}</div><label>Auto de interés <small>(opcional)</small><select name="car"><option value="">Todavía no elijo</option>${cars.map(c => `<option value="${esc(c.id)}" ${st.car === c.id ? 'selected' : ''}>${esc(fullName(c))}</option>`).join('')}</select></label></fieldset>` : `${st.branch ? `<input type="hidden" name="branch" value="${esc(st.branch)}">` : `<label>Sucursal<select name="branch">${D.branches.map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select></label>`}<label>¿Cómo piensas pagar?<select name="pay">${PAY.map(p => `<option ${opts.pay === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>`}<fieldset><legend>${opts.full ? '<b>3</b> ' : ''}Elige el día</legend><div class="dayRow" role="group" aria-label="Días disponibles">${nextDays().map(d => `<button type="button" class="dayBtn" data-day="${dayKey(d)}" aria-pressed="false"><small>${new Intl.DateTimeFormat('es-MX', {weekday: 'short'}).format(d)}</small><b>${d.getDate()}</b><small>${new Intl.DateTimeFormat('es-MX', {month: 'short'}).format(d)}</small></button>`).join('')}</div></fieldset><fieldset><legend>${opts.full ? '<b>4</b> ' : ''}Elige la hora</legend><div class="timeRow" role="group" aria-label="Horarios"><p class="subtle">Primero elige un día.</p></div><p class="subtle">Horario de ejemplo, pendiente de confirmar con la sucursal.</p></fieldset><fieldset><legend>${opts.full ? '<b>5</b> ' : ''}Tus datos</legend><div class="formGrid"><label>Nombre<input name="name" required maxlength="80" autocomplete="name"></label><label>Teléfono (10 dígitos)<input name="phone" type="tel" inputmode="numeric" pattern="[0-9]{10}" maxlength="10" required autocomplete="tel"></label></div><label>Correo <small>(opcional)</small><input name="email" type="email" maxlength="120" autocomplete="email"></label><label class="checkLabel"><input type="checkbox" name="ok" required> <span>Acepto el <a href="privacidad.html" target="_blank">aviso de privacidad</a>.</span></label></fieldset><p class="formError" role="alert"></p><button class="btn wide">Confirmar cita</button></form><div class="bookingDone" hidden></div>`;
    const f = $('form', root), err = $('.formError', root);
    const s = session(); if (s) { f.elements.name.value = s.name || ''; f.elements.email.value = s.email || '' }
    function drawTimes() {
      const box = $('.timeRow', root); if (!st.date) return;
      const [y, m, d] = st.date.split('-').map(Number), date = new Date(y, m - 1, d, 12), now = new Date();
      const branch = f.elements.branch.value || st.branch;
      const taken = list('citas').filter(x => x.status !== 'Cancelada' && x.date === st.date && x.branch === branch).map(x => x.time);
      box.innerHTML = slotsFor(date).map(t => { const [h, mi] = t.split(':').map(Number), past = dayKey(now) === st.date && (h < now.getHours() + 1 || (h === now.getHours() + 1 && mi < now.getMinutes())), off = past || taken.includes(t); return `<button type="button" class="timeBtn" data-time="${t}" aria-pressed="${st.time === t}" ${off ? 'disabled' : ''}>${t}${taken.includes(t) ? '<small>Ocupado</small>' : ''}</button>` }).join('');
      if ($('.timeBtn[aria-pressed=true]:disabled', root)) st.time = '';
    }
    root.addEventListener('click', e => {
      const day = e.target.closest('[data-day]'), time = e.target.closest('[data-time]');
      if (day) { st.date = day.dataset.day; st.time = ''; $$('[data-day]', root).forEach(b => b.setAttribute('aria-pressed', b === day)); drawTimes() }
      if (time && !time.disabled) { st.time = time.dataset.time; $$('[data-time]', root).forEach(b => b.setAttribute('aria-pressed', b === time)) }
    });
    f.addEventListener('change', e => { if (e.target.name === 'branch') drawTimes() });
    f.onsubmit = e => {
      e.preventDefault(); err.textContent = '';
      const el = f.elements, branch = el.branch.value || st.branch, pay = el.pay.value;
      if (!branch) return err.textContent = 'Elige una sucursal.';
      if (!pay) return err.textContent = 'Indica cómo piensas pagar.';
      if (!st.date) return err.textContent = 'Elige un día para tu visita.';
      if (!st.time) return err.textContent = 'Elige una hora disponible.';
      if (!el.name.value.trim()) return err.textContent = 'Escribe tu nombre.';
      if (!/^\d{10}$/.test(el.phone.value)) return err.textContent = 'El teléfono debe tener 10 dígitos.';
      if (el.email.value && !el.email.checkValidity()) return err.textContent = 'Revisa tu correo.';
      if (!el.ok.checked) return err.textContent = 'Acepta el aviso de privacidad para continuar.';
      const carId = (el.car && el.car.value) || st.car, c = find(carId);
      const rec = add('citas', 'CITA', {branch, pay, carId: c ? c.id : '', carName: c ? fullName(c) : '', date: st.date, time: st.time, name: el.name.value.trim(), phone: el.phone.value, email: el.email.value.trim(), status: 'Pendiente'});
      if (!rec) return;
      const msg = `Hola, quiero confirmar mi cita en Automotriz Lomelí.\nFolio: ${rec.folio}\nSucursal: ${branch}\nFecha: ${fmtDay(rec.date)} a las ${rec.time}\nForma de pago: ${pay}${rec.carName ? '\nAuto: ' + rec.carName : ''}\nNombre: ${rec.name}\nTeléfono: ${rec.phone}`;
      f.hidden = true; const done = $('.bookingDone', root); done.hidden = false;
      done.innerHTML = `<span class="successMark">✓</span><p class="eyebrow">CITA REGISTRADA</p><h3>Folio ${esc(rec.folio)}</h3><dl class="reviewGrid"><div><dt>Sucursal</dt><dd>${esc(branch)}</dd></div><div><dt>Fecha</dt><dd>${esc(fmtDay(rec.date))}, ${esc(rec.time)}</dd></div><div><dt>Forma de pago</dt><dd>${esc(pay)}</dd></div><div><dt>Auto</dt><dd>${esc(rec.carName || 'Por elegir')}</dd></div></dl><div class="demoNotice compact">Tu cita quedó guardada en este navegador. Envíala por WhatsApp para que el equipo de Lomelí la confirme.</div><div class="actions"><a class="btn waBtn" target="_blank" rel="noopener" href="${esc(wa(msg))}">${waIcon} Enviar por WhatsApp</a><a class="textLink" href="cuenta.html#citas">Ver mis citas</a><button type="button" class="textLink again">Agendar otra</button></div>`;
      $('.again', done).onclick = () => booking(root, opts);
      done.scrollIntoView({behavior: 'smooth', block: 'center'});
      opts.onDone?.(rec);
    };
  }

  /* Alertas */
  function addAlert(a) { const items = list('alerts'); if (a.carId && items.some(x => x.carId === a.carId)) return 'existe'; return put(KEYS.alerts, [{id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...a}, ...items]) ? 'ok' : 'error' }

  /* Verificación de cuenta: código por correo y código por SMS. Ambos simulados: se muestran en pantalla
     hasta conectar un servicio real de correo y de SMS. */
  const PHONE_COS = ['Telcel', 'AT&T', 'Movistar', 'Bait', 'Otra'];
  /* Perfil del cliente (Completa tu perfil + perfilamiento bancario) guardado junto a su cuenta */
  const me = () => { const s = session(); return s ? profile(s.email) || {} : {} };
  const profileReady = () => { const m = me(); return !!(m.perfil?.done && m.banca?.best) };
  const profile = email => (account().profiles || {})[String(email || '').toLowerCase()] || null;
  function saveProfile(email, data) { const a = account(); a.profiles = {...(a.profiles || {}), [email.toLowerCase()]: {...(a.profiles?.[email.toLowerCase()] || {}), ...data}}; return put(KEYS.acc, a) }
  const newCode = () => String(Math.floor(100000 + Math.random() * 900000));
  function verify(root, who, done) {
    const st = {email: newCode(), sms: newCode(), step: who.skipEmail ? 'sms' : 'email'};
    const tel = String(who.phone || '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    function draw() {
      const isMail = st.step === 'email';
      root.innerHTML = `<div class="verifyBox"><ol class="verifySteps"><li class="${isMail ? 'active' : 'done'}">Correo</li><li class="${isMail ? '' : 'active'}">Teléfono (SMS)</li></ol><h3>${isMail ? 'Verifica tu correo' : 'Verifica tu teléfono'}</h3><p class="subtle">${isMail ? `Te enviamos un código de 6 dígitos a <strong>${esc(who.email)}</strong>.` : `Te enviamos un SMS con un código de 6 dígitos al <strong>${esc(tel)}</strong>.`}</p><div class="codeNote">Tu código es <b>${isMail ? st.email : st.sms}</b><small>${isMail ? 'Código simulado: pendiente de conectar el correo real.' : 'Código simulado: pendiente de conectar el envío de SMS.'}</small></div><form class="verifyForm" novalidate><label>Código de 6 dígitos<input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autocomplete="one-time-code"></label><p class="formError" role="alert"></p><button class="btn wide">${isMail ? 'Verificar correo' : 'Verificar teléfono'}</button><button type="button" class="textLink resend">Reenviar código</button></form></div>`;
      const f = $('.verifyForm', root); f.elements.code.focus({preventScroll: true});
      $('.resend', root).onclick = () => { st[st.step] = newCode(); draw(); toast('Te mandamos un código nuevo.') };
      f.onsubmit = e => {
        e.preventDefault();
        if (f.elements.code.value.trim() !== st[st.step]) return $('.formError', f).textContent = 'El código no coincide. Revisa e intenta de nuevo.';
        if (isMail) { st.step = 'sms'; return draw() }
        const now = new Date().toISOString(), em = who.email.toLowerCase();
        saveProfile(em, {name: who.name, phone: who.phone, emailVerified: profile(em)?.emailVerified || now, phoneVerified: now, privacyAt: who.privacyAt || now});
        setSession({email: em, name: who.name, phone: who.phone, method: 'correo', emailVerified: true, phoneVerified: true, since: now});
        done?.();
      };
    }
    draw();
  }

  chrome();
  return {me, profileReady, logo, plan, priceBlock, specsLine, AUTO_PCT, AUTO_MAX, BANK_TERMS, verify, profile, saveProfile, newCode, PHONE_COS, D, $, $$, esc, money, num, wa, params, KEYS, get, put, LEGAL, cars, publicCars, find, saveCars, resetCars, name, fullName, photos, cover, okPhoto, quote, monthly,
    typePhoto, favs, isFav, toggleFav, syncFavs, account, session, setSession, list, add, update, remove, folio, toast, heart, waIcon, tags, card, cardsLegal, reviewsHTML, faqHTML, branchesHTML, kitHTML, typeSVG,
    booking, fmtDay, addAlert, isDate};
})();
