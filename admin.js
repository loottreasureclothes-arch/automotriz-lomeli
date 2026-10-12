/* Panel administrativo. Acceso y cambios solo en este navegador; sustituir por autenticación real antes de publicar. */
window.LomeliAdmin = (() => {
  const {$, $$, esc, money, num, D} = L, SKEY = 'lomeli-admin-session';
  let signed = false; try { signed = sessionStorage.getItem(SKEY) === '1' } catch {}
  let tab = 'inventario', photoDraft = [];
  /* La contraseña no se guarda en el código: solo su huella SHA-256. Se entrega por separado a Lomelí. */
  const PASS_HASH = '92b113da00ee4656726f3969acb07a92b103bb574fac0b61087df74c667191ad';
  async function sha256(t) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(t || ''))); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('') }
  const STATUS = {citas: ['Pendiente', 'Confirmada', 'Atendida', 'Cancelada'], pre: ['Nueva', 'Contactado', 'Oferta enviada', 'Revisión agendada', 'Comprado', 'Descartado'], leads: ['Nuevo', 'Contactado', 'Solicitud iniciada', 'Cerrado']};
  const sel = (n, opts, v) => `<select name="${n}">${opts.map(o => `<option ${String(o) === String(v) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  document.body.insertAdjacentHTML('beforeend', `<dialog id="login"><button class="close" data-admin-close="login" aria-label="Cerrar">×</button><p class="eyebrow">AUTOMOTRIZ LOMELÍ</p><h2>Acceso administrativo</h2><p>Los cambios se guardan únicamente en este navegador.</p><form id="loginForm"><label>Usuario<input name="usuario" autocomplete="username" required></label><label>Contraseña<input name="password" type="password" autocomplete="current-password" required></label><p id="loginError" role="alert"></p><button class="btn">Entrar</button></form></dialog>
  <dialog id="panel"><button class="close" data-admin-close="panel" aria-label="Cerrar">×</button><p class="eyebrow">PANEL ADMINISTRATIVO</p><h2>Administra tu sitio</h2><p class="subtle">Cambios locales en este navegador; no se publican para otros visitantes.</p><div class="adminTabs" role="tablist">${[['inventario', 'Inventario'], ['solicitudes', 'Solicitudes de crédito'], ['pre', 'Venta de autos'], ['citas', 'Citas'], ['leads', 'Prospectos']].map(([k, v]) => `<button type="button" role="tab" data-tab="${k}">${v} <span data-count="${k}"></span></button>`).join('')}</div>
  <section data-pane="inventario"><div class="actions"><button class="btn" id="newCar" type="button">Agregar vehículo</button><button id="restore" type="button">Restaurar catálogo</button><button id="logout" type="button">Cerrar sesión</button></div><form id="editForm" hidden></form><div id="adminList"></div></section>
  <section data-pane="solicitudes" hidden><p class="subtle">Solicitudes guardadas en este navegador. Abre cada una para revisarla completa y cambiar su estado.</p><div class="statusFilter" id="reqFilter"></div><div id="requestList"></div></section>
  <section data-pane="citas" hidden><div class="recList" id="list-citas"></div></section>
  <section data-pane="pre" hidden><p class="subtle">Clientes que mandaron los datos de su auto para recibir oferta por WhatsApp.</p><div class="recList" id="list-pre"></div></section>
  <section data-pane="leads" hidden><div class="recList" id="list-leads"></div></section></dialog>`);
  $$('[data-admin-close]').forEach(b => b.onclick = () => $('#' + b.dataset.adminClose).close());
  function open() { if (!signed) return $('#login').showModal(); render(); $('#panel').showModal() }
  $('#adminOpen').onclick = open;
  $('#loginForm').onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target); if (['lomeli', 'admin lomeli'].includes(f.get('usuario').trim().toLowerCase()) && await sha256(f.get('password')) === PASS_HASH) { signed = true; try { sessionStorage.setItem(SKEY, '1') } catch {} $('#login').close(); e.target.reset(); $('#loginError').textContent = ''; open() } else $('#loginError').textContent = 'Usuario o contraseña incorrectos.' };
  $('#logout').onclick = () => { signed = false; try { sessionStorage.removeItem(SKEY) } catch {} $('#panel').close(); $('#editForm').hidden = true };
  $('.adminTabs').onclick = e => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; render() } };

  function render() {
    $$('[data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tab));
    $$('[data-pane]').forEach(p => p.hidden = p.dataset.pane !== tab);
    const counts = {inventario: L.cars().length, solicitudes: LomeliPortal.requests().length, citas: L.list('citas').length, pre: L.list('pre').length, leads: L.list('leads').length};
    $$('[data-count]').forEach(s => s.textContent = counts[s.dataset.count] ? '(' + counts[s.dataset.count] + ')' : '');
    const FIN = {bancario: 'Crédito bancario', autofin: 'Solo autofinanciamiento', remate: 'Remate de contado'};
    $('#adminList').innerHTML = L.cars().map(c => `<div class="adminRow"><img src="${esc(L.cover(c).src)}" alt=""><div><strong>${esc(L.fullName(c))}</strong><br><span class="subtle">${money(c.price)}${c.listPrice ? ' (lista ' + money(c.listPrice) + ')' : ''} · ${esc(FIN[c.fin] || FIN.bancario)} · ${esc(c.state)}${c.separado ? ' · Separado' : ''}${c.sucursal ? ' · Sucursal ' + esc(c.sucursal) : ''} · ${(c.photos || []).length} foto(s)</span></div><div class="actions"><a href="auto.html?id=${encodeURIComponent(c.id)}" target="_blank">Ver</a><button type="button" data-edit="${esc(c.id)}">Editar</button><button type="button" data-sep="${esc(c.id)}">${c.separado ? 'Liberar' : 'Separar'}</button><button type="button" data-state="${esc(c.id)}">${c.state === 'Vendido' ? 'Disponible' : 'Vendido'}</button><button type="button" data-hide="${esc(c.id)}">${c.state === 'Oculto' ? 'Mostrar' : 'Ocultar'}</button><button type="button" data-delete="${esc(c.id)}">Eliminar</button></div></div>`).join('');
    requestsList();
    records('citas', r => [`${esc(r.name)} · ${esc(r.phone)}`, `${esc(r.branch)} · ${esc(L.fmtDay(r.date, {weekday: 'short', day: 'numeric', month: 'short'}))} ${esc(r.time)}`, `${esc(r.pay)}${r.carName ? ' · ' + esc(r.carName) : ''}`], r => `Hola ${r.name}, te escribimos de Automotriz Lomelí sobre tu cita ${r.folio}.`, 'Aún no hay citas. Se registran desde Agendar cita o desde la ficha de cada auto.');
    records('pre', r => [`${esc(r.name)} · ${esc(r.phone)}`, `${esc(r.marca)} ${esc(r.modelo)} ${esc(r.version || '')} ${esc(r.year)} · ${num(r.km)} km · Estado ${esc(String(r.estado || 'sin dato').toLowerCase())}`, r.paraName ? 'Lo quiere dar a cuenta del ' + esc(r.paraName) : 'Venta directa', (r.photos || []).length ? `<span class="recPhotos">${r.photos.map((p, i) => `<a href="${esc(p)}" target="_blank" rel="noopener"><img src="${esc(p)}" alt="Foto ${i + 1}"></a>`).join('')}</span>` : esc(r.photosNote || 'Sin fotos en el formulario (pueden llegar por WhatsApp)')], r => `Hola ${r.name}, te escribimos de Automotriz Lomelí sobre tu ${r.marca} ${r.modelo} ${r.year} (folio ${r.folio}). Te compartimos nuestra oferta:`, 'Aún no hay autos para comprar. Se registran desde Vender mi auto.');
    records('leads', r => [`${esc(r.name)} · ${esc(r.phone)}`, esc(r.email), r.carName ? 'Interés: ' + esc(r.carName) : 'Sin auto elegido'], r => `Hola ${r.name}, te escribimos de Automotriz Lomelí sobre tu solicitud de crédito ${r.folio}.`, 'Aún no hay prospectos. Se registran desde la página de Crédito.');
  }
  let reqFilter = '';
  function requestsList() {
    const all = LomeliPortal.requests(), items = reqFilter ? all.filter(r => r.status === reqFilter) : all;
    $('#reqFilter').innerHTML = ['', ...LomeliPortal.STATUS].map(s => `<button type="button" data-rf="${esc(s)}" aria-pressed="${s === reqFilter}">${s || 'Todas'} (${s ? all.filter(r => r.status === s).length : all.length})</button>`).join('');
    $('#requestList').innerHTML = items.length ? items.map(r => { const v = r.quote || {}, p = r.p || {}; return `<article class="requestCard recCard"><div><span class="tag">${esc(r.folio)} · ${esc(new Date(r.createdAt).toLocaleDateString('es-MX'))}</span><h3>${esc(LomeliPortal.fullName(p))}</h3><p>${esc(v.carName)} · ${esc(LomeliPortal.modeName(v.mode))}</p><p>${money(v.payment || 0)}/mes · ${v.months} meses · enganche ${money(v.down || 0)} · ingreso ${money(+(r.w || {}).ingreso || 0)}</p><p>${esc(p.tel || '')} · ${esc(p.correo || '')}${r.bank ? ' · Banco sugerido: ' + esc(r.bank) : ''}</p></div><div class="recActions"><label>Estado<select data-reqstatus="${esc(r.id)}">${LomeliPortal.STATUS.map(s => `<option ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label><button type="button" class="btn" data-admin-request="${esc(r.id)}">Revisar solicitud completa</button><a class="textLink" target="_blank" rel="noopener" href="https://wa.me/52${esc(p.tel || '')}?text=${encodeURIComponent(`Hola ${p.nombre || ''}, te escribimos de Automotriz Lomelí sobre tu solicitud ${r.folio}.`)}">WhatsApp al cliente</a></div></article>` }).join('') : `<p class="subtle">${all.length ? 'No hay solicitudes con ese estado.' : 'Aún no hay solicitudes. Se envían desde Mi cuenta o desde la ficha de cada auto.'}</p>`;
  }
  function records(key, lines, msg, empty) {
    const items = L.list(key);
    $('#list-' + key).innerHTML = items.length ? items.map(r => `<article class="requestCard recCard"><div><span class="tag">${esc(r.folio)} · ${esc(new Date(r.createdAt).toLocaleDateString('es-MX'))}</span>${lines(r).map((l, i) => i ? `<p>${l}</p>` : `<h3>${l}</h3>`).join('')}</div><div class="recActions"><label>Estado${sel('status', STATUS[key], r.status).replace('<select', `<select data-rec="${key}" data-id="${esc(r.id)}"`)}</label><a class="textLink" target="_blank" rel="noopener" href="https://wa.me/52${esc(r.phone)}?text=${encodeURIComponent(msg(r))}">WhatsApp al cliente</a><button type="button" data-recdel="${key}" data-id="${esc(r.id)}">Eliminar</button></div></article>`).join('') : `<p class="subtle">${empty}</p>`;
  }
  $('#panel').addEventListener('change', e => { if (!signed) return; const s = e.target.closest('[data-rec]'); if (s) { L.update(s.dataset.rec, s.dataset.id, {status: s.value}); L.toast('Estado actualizado.') } const r = e.target.closest('[data-reqstatus]'); if (r) { LomeliPortal.setStatus(r.dataset.reqstatus, r.value); L.toast('Estado de la solicitud: ' + r.value); render() } });
  $('#panel').addEventListener('click', e => {
    if (!signed) return;
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.rf !== undefined) { reqFilter = b.dataset.rf; return requestsList() }
    if (b.dataset.recdel) { if (confirm('¿Eliminar este registro?')) { L.remove(b.dataset.recdel, b.dataset.id); render() } return }
    const id = b.dataset.edit || b.dataset.state || b.dataset.hide || b.dataset.delete || b.dataset.sep, c = id && L.find(id);
    if (!c) return;
    if (b.dataset.edit) return edit(id);
    if (b.dataset.delete) { if (confirm('¿Eliminar ' + L.fullName(c) + '?')) L.saveCars(L.cars().filter(x => x.id !== id)) }
    else L.saveCars(L.cars().map(x => x.id !== id ? x : b.dataset.sep ? {...x, separado: !x.separado} : {...x, state: b.dataset.hide ? (c.state === 'Oculto' ? 'Disponible' : 'Oculto') : (c.state === 'Vendido' ? 'Disponible' : 'Vendido')}));
    render();
  });
  $('#newCar').onclick = () => edit();
  $('#restore').onclick = () => { if (signed && confirm('¿Restaurar el inventario del catálogo de WhatsApp? Se perderán los cambios locales del inventario.')) { L.resetCars(); $('#editForm').hidden = true; render() } };

  function edit(id) {
    if (!signed) return;
    const c = id ? L.find(id) : null, f = $('#editForm'), v = c || {title: '', marca: '', modelo: '', version: '', year: 2022, km: null, price: 0, listPrice: 0, fin: 'bancario', tipo: 'SUV', trans: '', fuel: '', sucursal: '', folio: '', state: 'Disponible', separado: false, tags: ['nuevo'], description: '', photos: []};
    photoDraft = [...(v.photos || [])];
    const opts = (n, list, val) => `<select name="${n}">${list.map(([k, t]) => `<option value="${esc(k)}" ${String(k) === String(val ?? '') ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
    f.innerHTML = `<h3>${c ? 'Editar vehículo' : 'Agregar vehículo'}</h3><input type="hidden" name="id" value="${esc(c?.id || '')}"><label>Título (como en el catálogo)<input name="title" maxlength="90" value="${esc(v.title || '')}" placeholder="Ej. NISSAN KICKS 2023 PLATINUM"></label><div class="formGrid three"><label>Marca<input name="marca" required maxlength="40" value="${esc(v.marca)}"></label><label>Modelo<input name="modelo" required maxlength="60" value="${esc(v.modelo)}"></label><label>Versión<input name="version" maxlength="60" value="${esc(v.version)}"></label><label>Año<input name="year" type="number" min="1990" max="2027" required value="${v.year}"></label><label>Precio MXN<input name="price" type="number" min="1" required value="${v.price || ''}"></label><label>Forma de pago${opts('fin', [['bancario', 'Crédito bancario + autofinanciamiento'], ['autofin', 'Solo autofinanciamiento'], ['remate', 'Remate de contado']], v.fin)}</label><label>Precio de lista <small>(solo remate)</small><input name="listPrice" type="number" min="0" value="${v.listPrice || ''}"></label><label>Carrocería${sel('tipo', D.types, v.tipo)}</label><label>Transmisión${opts('trans', [['', 'Sin dato'], ['Automática', 'Automática'], ['Estándar', 'Estándar']], v.trans)}</label><label>Kilometraje <small>(vacío = sin dato)</small><input name="km" type="number" min="0" value="${Number.isFinite(v.km) && v.km !== null ? v.km : ''}"></label><label>Combustible <small>(opcional)</small><input name="fuel" maxlength="30" value="${esc(v.fuel || '')}"></label><label>Sucursal${opts('sucursal', [['', 'Sin dato'], ...D.branches.map(b => [b.id, b.name])], v.sucursal)}</label><label>Folio <small>(opcional)</small><input name="folio" maxlength="20" value="${esc(v.folio || '')}"></label><label>Estado${sel('state', ['Disponible', 'Vendido', 'Oculto'], v.state)}</label></div><div class="chipRow"><label class="chipChoice"><input type="checkbox" name="nuevo" ${(v.tags || []).includes('nuevo') ? 'checked' : ''}><span>Recién llegado</span></label><label class="chipChoice"><input type="checkbox" name="demanda" ${(v.tags || []).includes('demanda') ? 'checked' : ''}><span>Alta demanda</span></label><label class="chipChoice"><input type="checkbox" name="separado" ${v.separado ? 'checked' : ''}><span>Separado</span></label></div><label>Fotos (hasta 8; se reducen automáticamente)<input name="files" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><div class="photoEdit" id="photoEdit"></div><label>Descripción <small>(opcional)</small><textarea name="description" maxlength="1500">${esc(v.description || '')}</textarea></label><p id="saveError" role="alert"></p><div class="actions"><button class="btn">Guardar vehículo</button><button type="button" id="cancelEdit">Cancelar</button></div>`;
    f.hidden = false; drawPhotos();
    $('#cancelEdit').onclick = () => f.hidden = true;
    f.elements.files.onchange = async e => {
      const files = [...e.target.files]; e.target.value = '';
      for (const file of files) {
        if (photoDraft.length >= 8) { $('#saveError').textContent = 'Máximo 8 fotos por vehículo.'; break }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) { $('#saveError').textContent = 'Usa imágenes JPG, PNG o WebP de hasta 15 MB.'; continue }
        try { photoDraft.push(await shrink(file)) } catch { $('#saveError').textContent = 'No se pudo leer una imagen.' }
      }
      drawPhotos();
    };
    $('#photoEdit').onclick = e => { const b = e.target.closest('button'); if (!b) return; const i = Number(b.dataset.i); if (b.dataset.act === 'del') photoDraft.splice(i, 1); else photoDraft.unshift(...photoDraft.splice(i, 1)); drawPhotos() };
    f.onsubmit = e => {
      e.preventDefault(); if (!signed) return;
      const d = new FormData(f), nid = d.get('id') || (String(d.get('marca') + '-' + d.get('modelo') + '-' + d.get('year')).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).slice(2, 6));
      const old = L.find(nid), n = k => Number(d.get(k));
      const car = {...(old || {}), id: nid, title: d.get('title').trim(), marca: d.get('marca').trim(), modelo: d.get('modelo').trim(), version: d.get('version').trim(), year: n('year'), km: d.get('km') === '' ? null : n('km'), price: n('price'), listPrice: n('listPrice') || 0, fin: d.get('fin'), folio: d.get('folio').trim(), tipo: d.get('tipo'), trans: d.get('trans'), fuel: d.get('fuel').trim(), sucursal: d.get('sucursal'), state: d.get('state'), separado: d.get('separado') === 'on', tags: ['nuevo', 'demanda'].filter(t => d.get(t) === 'on'), photos: photoDraft.filter(L.okPhoto), description: d.get('description').trim(), added: old?.added || new Date().toISOString().slice(0, 10)};
      if (!(car.price > 0)) return $('#saveError').textContent = 'Escribe un precio válido.';
      if (car.fin === 'remate' && !(car.listPrice > car.price)) return $('#saveError').textContent = 'Para remate, escribe el precio de lista (mayor al precio de remate).';
      if (L.saveCars(old ? L.cars().map(x => x.id === nid ? car : x) : [car, ...L.cars()])) { f.hidden = true; render(); L.toast('Vehículo guardado.') }
      else $('#saveError').textContent = 'No cupo en el almacenamiento del navegador. Quita algunas fotos.';
    };
    f.scrollIntoView({behavior: 'smooth', block: 'start'});
  }
  function drawPhotos() { $('#photoEdit').innerHTML = photoDraft.length ? photoDraft.map((p, i) => `<figure><img src="${esc(p)}" alt="Foto ${i + 1}"><figcaption>${i ? `<button type="button" data-act="main" data-i="${i}">Principal</button>` : '<b>Principal</b>'}<button type="button" data-act="del" data-i="${i}">Quitar</button></figcaption></figure>`).join('') : '<p class="subtle">Sin fotos: se mostrará el logo de la marca hasta que subas una.</p>' }
  function shrink(file) {
    return new Promise((res, rej) => { const img = new Image(), url = URL.createObjectURL(file); img.onload = () => { const s = Math.min(1, 1280 / img.width), cv = document.createElement('canvas'); cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); res(cv.toDataURL('image/jpeg', 0.78)) }; img.onerror = () => { URL.revokeObjectURL(url); rej() }; img.src = url });
  }
  document.addEventListener('lomeli:inventory', () => { if ($('#panel').open) render() });
  return {signed: () => signed, open, render: () => { if ($('#panel').open) render() }};
})();
