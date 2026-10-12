/* Mi cuenta: registro con verificación por correo y SMS (simulados), acceso con código, solicitud de crédito, favoritos, citas, alertas y autos en venta. */
(() => {
  const {$, $$, esc, money, num, D} = L, root = $('#accountRoot'), P = L.params();
  const TABS = [['solicitud', 'Mi solicitud'], ['favoritos', 'Favoritos'], ['citas', 'Citas'], ['alertas', 'Alertas'], ['ventas', 'Vender mi auto'], ['perfil', 'Perfil']];
  let code = null, pendingEmail = '';
  const DEMO_MAIL = 'Código simulado: pendiente de conectar el correo real.';

  /* Acceso: crear cuenta (nombre, teléfono, correo, aviso) con verificación por correo y SMS, o entrar con código por correo. */
  function login(mode = P.get('registro') ? 'registro' : 'entrar') {
    const reg = mode === 'registro';
    root.innerHTML = `<div class="formCard authCard"><p class="eyebrow">MI CUENTA</p><h1 style="font-size:34px;font-style:italic;margin:4px 0 6px">${reg ? 'Crea tu cuenta' : 'Entra a tu cuenta'}</h1><p class="subtle">Guarda tus autos favoritos, tus citas y tu solicitud de crédito en un solo lugar.</p><div class="authTabs" role="tablist"><button type="button" role="tab" data-mode="registro" aria-selected="${reg}">Crear cuenta</button><button type="button" role="tab" data-mode="entrar" aria-selected="${!reg}">Ya tengo cuenta</button></div><div id="authBody"></div><div style="display:flex;align-items:center;gap:10px;margin:18px 0 4px;color:var(--muted);font-size:12px"><span style="flex:1;height:1px;background:var(--line)"></span>o continúa con<span style="flex:1;height:1px;background:var(--line)"></span></div><button type="button" class="providerButton" data-provider="Google"><span class="googleG">G</span> Google <small>Pendiente de conexión</small></button><button type="button" class="providerButton" data-provider="Facebook"><span style="color:#1877f2;font-weight:900">f</span> Facebook <small>Pendiente de conexión</small></button><p class="subtle" id="providerNote" role="status"></p></div>`;
    $$('.authTabs [data-mode]').forEach(b => b.onclick = () => login(b.dataset.mode));
    $$('[data-provider]').forEach(b => b.onclick = () => $('#providerNote').textContent = `El acceso con ${b.dataset.provider} está pendiente de conexión. Por ahora crea tu cuenta o entra con tu correo.`);
    reg ? register() : signIn();
  }
  function register(pre = {}) {
    const box = $('#authBody'), s = L.account().session || {};
    box.innerHTML = `<form id="regForm" novalidate><label>Nombre completo<input name="name" required maxlength="80" autocomplete="name" value="${esc(pre.name || s.name || '')}"></label><label>Teléfono celular (10 dígitos)<input name="phone" type="tel" inputmode="numeric" maxlength="10" required autocomplete="tel" value="${esc(pre.phone || s.phone || '')}"><small>Te mandamos un SMS para verificarlo.</small></label><label>Correo electrónico<input name="email" type="email" required maxlength="120" autocomplete="email" value="${esc(pre.email || s.email || '')}"><small>Te mandamos un código para verificarlo.</small></label><label class="checkLabel"><input type="checkbox" name="ok"> <span>Acepto el <a href="privacidad.html" target="_blank">aviso de privacidad</a>.</span></label><p class="formError" role="alert"></p><button class="btn wide">Crear cuenta</button></form>`;
    const f = $('#regForm');
    f.onsubmit = e => {
      e.preventDefault(); const el = f.elements, err = $('.formError', f); err.textContent = '';
      if (!el.name.value.trim()) return err.textContent = 'Escribe tu nombre completo.';
      if (!/^\d{10}$/.test(el.phone.value)) return err.textContent = 'El teléfono debe tener 10 dígitos.';
      if (!el.email.value || !el.email.checkValidity()) return err.textContent = 'Escribe un correo válido.';
      if (!el.ok.checked) return err.textContent = 'Acepta el aviso de privacidad para crear tu cuenta.';
      L.verify(box, {name: el.name.value.trim(), phone: el.phone.value, email: el.email.value.trim(), privacyAt: new Date().toISOString()}, afterLogin);
    };
  }
  function signIn() {
    const box = $('#authBody');
    box.innerHTML = `<form id="emailForm" novalidate><label>Correo<input name="email" type="email" required maxlength="120" autocomplete="email" placeholder="tucorreo@ejemplo.com"></label><p class="formError" role="alert"></p><button class="btn wide">Recibir código</button></form><form id="codeForm" hidden novalidate><div class="codeNote"></div><label>Código de 6 dígitos<input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autocomplete="one-time-code"></label><p class="formError" role="alert"></p><button class="btn wide">Entrar</button><button type="button" class="textLink" id="changeEmail" style="border:0;background:none;margin-top:10px">Usar otro correo</button></form>`;
    const ef = $('#emailForm'), cf = $('#codeForm');
    ef.onsubmit = e => { e.preventDefault(); const em = ef.elements.email; $('.formError', ef).textContent = ''; if (!em.value || !em.checkValidity()) return $('.formError', ef).textContent = 'Escribe un correo válido.'; pendingEmail = em.value.trim().toLowerCase(); code = L.newCode(); ef.hidden = true; cf.hidden = false; $('.codeNote', cf).innerHTML = `Te enviamos un código a <strong>${esc(pendingEmail)}</strong>. Tu código es <b>${code}</b><small>${DEMO_MAIL}</small>`; cf.elements.code.focus() };
    cf.onsubmit = e => {
      e.preventDefault(); $('.formError', cf).textContent = '';
      if (cf.elements.code.value.trim() !== code) return $('.formError', cf).textContent = 'El código no coincide. Revisa e intenta de nuevo.';
      const pr = L.profile(pendingEmail);
      if (pr?.phoneVerified) { L.setSession({email: pendingEmail, name: pr.name, phone: pr.phone, method: 'correo', emailVerified: true, phoneVerified: true, since: new Date().toISOString()}); return afterLogin() }
      L.saveProfile(pendingEmail, {emailVerified: new Date().toISOString()});
      login('registro'); register({email: pendingEmail, name: pr?.name, phone: pr?.phone});
      $('#authBody').insertAdjacentHTML('afterbegin', '<div class="demoNotice compact">Tu correo quedó verificado, pero aún no tienes una cuenta completa. Termina tu registro y verifica tu teléfono.</div>');
    };
    $('#changeEmail').onclick = () => { cf.hidden = true; ef.hidden = false; code = null };
  }
  /* Primera vez: Completa tu perfil (2 pasos) → perfilamiento bancario → solicitud. "Lo completo después" lo pospone en esta sesión. */
  const later = () => { try { return sessionStorage.getItem('lomeli-perfil-despues') === '1' } catch { return false } };
  document.addEventListener('click', e => { if (e.target.closest('[data-later]')) try { sessionStorage.setItem('lomeli-perfil-despues', '1') } catch {} });
  function onboarding(force) {
    const m = L.me();
    if (!m.perfil?.done && (force || !later())) { LomeliPerfil.wizard(root, () => LomeliPerfil.banca(root, startSolicitud)); return true }
    if (!m.banca?.best && (force || !later())) { LomeliPerfil.banca(root, startSolicitud); return true }
    return false;
  }
  function startSolicitud() {
    const id = P.get('next') === 'solicitud' && P.get('id');
    history.replaceState(null, '', 'cuenta.html#solicitud'); dash(true);
    if (id) LomeliPortal.begin({carId: id, mode: P.get('modo') || 'bancario', percent: +P.get('pct') || 0, months: +P.get('m') || 60});
    else LomeliPortal.begin(LomeliPortal.draft() ? {resume: true} : {});
  }
  function afterLogin() {
    L.toast('Listo, tu cuenta está verificada.');
    const next = P.get('next') === 'solicitud';
    if (onboarding(next)) return;
    if (next) return startSolicitud();
    history.replaceState(null, '', 'cuenta.html' + location.hash); dash(true);
  }

  const tab = () => { const h = location.hash.slice(1); return TABS.some(t => t[0] === h) ? h : 'solicitud' };
  function dash(skipGate) {
    const s = L.session(); if (!s) return login();
    if (!skipGate && onboarding(false)) return;
    const favCars = L.favs().map(L.find).filter(Boolean), citas = L.list('citas'), alerts = L.list('alerts'), pre = L.list('pre'), reqs = LomeliPortal.requests(), draft = LomeliPortal.draft();
    const counts = {solicitud: reqs.length + (draft ? 1 : 0), favoritos: favCars.length, citas: citas.length, alertas: alerts.length, ventas: pre.length, perfil: ''};
    const t = tab();
    root.innerHTML = `<div class="dashHead"><div><p class="eyebrow">MI CUENTA</p><h1>HOLA, <em>${esc((s.name || '').split(' ')[0].toUpperCase() || 'CLIENTE')}</em></h1><p class="subtle" style="margin:4px 0 0">${esc(s.email)}</p></div><button type="button" id="logout">Cerrar sesión</button></div>
    <div class="stat"><a href="#solicitud"><strong>${counts.solicitud}</strong><span>Solicitudes</span></a><a href="#favoritos"><strong>${counts.favoritos}</strong><span>Favoritos</span></a><a href="#citas"><strong>${counts.citas}</strong><span>Citas</span></a><a href="#alertas"><strong>${counts.alertas}</strong><span>Alertas</span></a></div>
    <nav class="dashTabs" aria-label="Secciones de mi cuenta">${TABS.map(([k, v]) => `<a href="#${k}" ${k === t ? 'aria-current="page"' : ''}>${v}${counts[k] !== '' ? ` <span>(${counts[k]})</span>` : ''}</a>`).join('')}</nav><div id="pane"></div>`;
    $('#logout').onclick = () => { L.saveProfile(s.email, {name: s.name, phone: s.phone}); const a = L.account(); delete a.session; L.put(L.KEYS.acc, a); L.toast('Cerraste sesión.'); login('entrar') };
    PANES[t](s, {favCars, citas, alerts, pre, reqs, draft});
    L.syncFavs();
  }
  const empty = (txt, href, label) => `<div class="emptyBox"><p>${txt}</p>${href ? `<a class="btn" href="${href}">${label}</a>` : ''}</div>`;
  const PANES = {
    solicitud(s, d) {
      const cars = L.publicCars(), dq = d.draft ? LomeliPortal.quote(d.draft) : null;
      $('#pane').innerHTML = `${d.draft ? `<article class="listCard"><div><span class="tag">Sin enviar · paso ${(d.draft.step || 0) + 1} de 7</span><h3>${esc(dq?.carName || 'Solicitud de crédito')}</h3><p>${dq ? `${esc(LomeliPortal.modeName(dq.mode))} · ${dq.months} meses · ${money(dq.payment)}/mes estimados` : ''}</p></div><button type="button" class="btn" data-resume>Continuar mi solicitud</button></article>` : ''}${d.reqs.map(r => `<article class="listCard"><div><span class="statusPill" data-s="${esc(r.status)}">${esc(r.status)}</span><h3>${esc(r.quote.carName)}</h3><p>${esc(r.folio)} · ${esc(LomeliPortal.modeName(r.quote.mode))} · ${money(r.quote.payment)}/mes estimados · ${r.quote.months} meses</p></div><button type="button" data-view-request="${esc(r.id)}">Ver solicitud</button></article>`).join('')}
      <div class="box" style="margin-top:18px"><h2>${d.draft || d.reqs.length ? 'Otra solicitud' : 'Solicita tu crédito en línea'}</h2><p class="subtle">Siete pasos: auto y financiamiento, datos personales, laborales, historial, referencias, declaraciones con firma y revisión. Sin ir a la agencia.</p><label>Auto<select id="newCar">${cars.map(c => `<option value="${esc(c.id)}">${esc(L.fullName(c))} · ${money(c.price)}${L.plan(c).bank ? '' : ' · solo autofinanciamiento'}</option>`).join('')}</select></label><button type="button" class="btn" id="newReq">Empezar solicitud</button><p class="legal">${esc(D.terms.bank)} ${esc(D.terms.autofin)}</p></div>`;
      $('#newReq').onclick = () => LomeliPortal.begin({carId: $('#newCar').value, mode: 'bancario', percent: 0, months: 60});
    },
    favoritos(s, d) { $('#pane').innerHTML = d.favCars.length ? `<div class="vgrid">${d.favCars.map(L.card).join('')}</div>${L.cardsLegal()}` : empty('Aún no guardas autos. Toca el corazón en cualquier auto para tenerlo aquí.', 'inventario.html', 'Ver inventario') },
    citas(s, d) {
      $('#pane').innerHTML = (d.citas.length ? d.citas.map(c => `<article class="listCard"><div><span class="tag">${esc(c.status)} · ${esc(c.folio)}</span><h3>${esc(L.fmtDay(c.date))}, ${esc(c.time)}</h3><p>Sucursal ${esc(c.branch)} · ${esc(c.pay)}${c.carName ? ' · ' + esc(c.carName) : ''}</p></div><div class="actions"><a class="btn waBtn" target="_blank" rel="noopener" href="${esc(L.wa(`Hola, quiero confirmar mi cita ${c.folio} del ${L.fmtDay(c.date)} a las ${c.time} en la Sucursal ${c.branch}.`))}">${L.waIcon} Confirmar</a>${c.status !== 'Cancelada' ? `<button type="button" data-cancel="${esc(c.id)}">Cancelar</button>` : ''}</div></article>`).join('') : empty('No tienes citas registradas en este navegador.', 'cita.html', 'Agendar cita')) + (d.citas.length ? '<a class="btn" href="cita.html" style="margin-top:10px">Agendar otra cita</a>' : '');
      $('#pane').onclick = e => { const b = e.target.closest('[data-cancel]'); if (b && confirm('¿Cancelar esta cita?')) { L.update('citas', b.dataset.cancel, {status: 'Cancelada'}); dash() } };
    },
    alertas(s, d) {
      const brands = [...new Set(L.publicCars().map(c => c.marca))].sort();
      const row = a => {
        if (a.kind === 'precio') { const c = L.find(a.carId); const now = c?.price; const diff = c ? a.price - now : 0; return `<article class="listCard"><div><span class="tag">Alerta de precio</span><h3>${esc(a.label)}</h3><p>${c ? (diff > 0 ? `<b style="color:var(--ok)">¡Bajó ${money(diff)}!</b> Ahora ${money(now)}` : `Precio al guardar ${money(a.price)} · sin cambios`) : 'Este auto ya no está publicado.'}</p></div><div class="actions">${c ? `<a class="textLink" href="auto.html?id=${encodeURIComponent(c.id)}">Ver auto</a>` : ''}<button type="button" data-del="${esc(a.id)}">Quitar</button></div></article>` }
        const n = a.query ? null : L.publicCars().filter(c => (!a.marca || c.marca === a.marca) && (!a.tipo || c.tipo === a.tipo) && (!a.max || c.price <= a.max)).length;
        const href = a.query ? 'inventario.html' + a.query : 'inventario.html?' + new URLSearchParams(Object.fromEntries([['marca', a.marca], ['tipo', a.tipo], ['pmax', a.max]].filter(x => x[1])));
        return `<article class="listCard"><div><span class="tag">Búsqueda guardada</span><h3>${esc(a.label)}</h3><p>${n === null ? 'Te avisaremos cuando lleguen autos con estos filtros.' : `${n} ${n === 1 ? 'auto coincide' : 'autos coinciden'} hoy`}</p></div><div class="actions"><a class="textLink" href="${esc(href)}">Ver resultados</a><button type="button" data-del="${esc(a.id)}">Quitar</button></div></article>`;
      };
      $('#pane').innerHTML = `<div class="box" style="margin-bottom:18px"><h2>Crear alerta</h2><form id="alertForm" class="booking"><div class="formGrid three"><label>Marca<select name="marca"><option value="">Cualquiera</option>${brands.map(b => `<option>${esc(b)}</option>`).join('')}</select></label><label>Carrocería<select name="tipo"><option value="">Cualquiera</option>${D.types.map(t => `<option>${t}</option>`).join('')}</select></label><label>Precio máximo<input name="max" type="number" min="0" step="10000" placeholder="Ej. 400000"></label></div><button class="btn">Guardar alerta</button></form><p class="subtle">El aviso por correo o WhatsApp está pendiente de conexión; por ahora las coincidencias se ven aquí.</p></div>${d.alerts.length ? d.alerts.map(row).join('') : '<p class="subtle">Aún no tienes alertas. También puedes crearlas desde la ficha de un auto o desde el inventario.</p>'}`;
      $('#alertForm').onsubmit = e => { e.preventDefault(); const f = new FormData(e.target), a = {kind: 'busqueda', marca: f.get('marca'), tipo: f.get('tipo'), max: +f.get('max') || 0}; a.label = [a.tipo, a.marca, a.max ? 'hasta ' + money(a.max) : ''].filter(Boolean).join(' · ') || 'Todo el inventario'; L.addAlert(a); dash() };
      $('#pane').onclick = e => { const b = e.target.closest('[data-del]'); if (b) { L.remove('alerts', b.dataset.del); dash() } };
    },
    ventas(s, d) { $('#pane').innerHTML = d.pre.length ? d.pre.map(r => `<article class="listCard"><div><span class="tag">${esc(r.status)} · ${esc(r.folio)}</span><h3>${esc(r.marca)} ${esc(r.modelo)} ${r.year}</h3><p>${num(r.km)} km · Estado ${esc(String(r.estado || '').toLowerCase())} · Te mandamos la oferta por WhatsApp</p></div><a class="btn waBtn" target="_blank" rel="noopener" href="${esc(L.wa(`Hola, ¿cómo va la oferta de mi ${r.marca} ${r.modelo} ${r.year}? Folio ${r.folio}`))}">${L.waIcon} Preguntar</a></article>`).join('') : empty('No has mandado datos de ningún auto para vender.', 'vender.html', 'Vender mi auto') },
    perfil(s) {
      const m = L.me(), pf = m.perfil || {};
      $('#pane').innerHTML = `<div class="box" style="margin-bottom:18px"><h2>Tu perfil para crédito</h2>${pf.done ? `<dl class="reviewGrid">${[['Nombre', [pf.nombre, pf.paterno, pf.materno].filter(Boolean).join(' ')], ['Fecha de nacimiento', pf.nacimiento ? L.fmtDay(pf.nacimiento, {day: 'numeric', month: 'long', year: 'numeric'}) : ''], ['Género', pf.genero], ['Estado civil', pf.civil], ['Compañía telefónica', pf.compania]].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v || '')}</dd></div>`).join('')}</dl>${LomeliPerfil.summary(pf, m.banca || {})}` : '<p class="subtle">Aún no completas tu perfil. Son dos pasos y luego te sugerimos un banco.</p>'}<div class="actions"><button type="button" class="btn" id="editPerfil">${pf.done ? 'Editar mi perfil' : 'Completar mi perfil'}</button>${pf.done ? `<button type="button" id="editBanca">${m.banca?.best ? 'Corregir perfilamiento bancario' : 'Hacer perfilamiento bancario'}</button>` : ''}</div></div><div class="box" style="max-width:560px"><h2>Tus datos de acceso</h2><form id="profileForm" class="booking"><label>Nombre<input name="name" maxlength="80" value="${esc(s.name || '')}"></label><label>Teléfono<input name="phone" type="tel" maxlength="10" pattern="[0-9]{10}" value="${esc(s.phone || '')}"></label><label>Correo<input value="${esc(s.email)}" disabled></label><p class="verifiedRow"><span class="okPill">✓ Correo verificado</span><span class="okPill">✓ Teléfono verificado</span></p><button class="btn">Guardar</button></form><p class="subtle">Si cambias tu teléfono te pediremos verificarlo de nuevo por SMS.</p><hr style="border:0;border-top:1px solid var(--line);margin:24px 0"><h3>Borrar mis datos</h3><p class="subtle">Elimina de este navegador tu cuenta, favoritos, alertas, citas, autos para vender y solicitudes de crédito.</p><button type="button" id="wipe">Borrar mis datos de este navegador</button></div>`;
      $('#profileForm').onsubmit = e => { e.preventDefault(); const f = e.target.elements; if (!/^\d{10}$/.test(f.phone.value)) return L.toast('El teléfono debe tener 10 dígitos.'); const name = f.name.value.trim() || s.name; if (f.phone.value !== s.phone) { const box = $('#pane .box'); return L.verify(box, {name, phone: f.phone.value, email: s.email, skipEmail: true}, () => { L.toast('Teléfono verificado.'); dash() }) } L.setSession({...s, name}); L.saveProfile(s.email, {name}); L.toast('Datos guardados.'); dash() };
      $('#editPerfil').onclick = () => LomeliPerfil.wizard(root, () => LomeliPerfil.banca(root, startSolicitud), 0);
      $('#editBanca')?.addEventListener('click', () => LomeliPerfil.banca(root, startSolicitud, true));
      $('#wipe').onclick = () => { if (!confirm('¿Borrar todos tus datos de este navegador?')) return; ['acc', 'fav', 'alerts', 'citas', 'pre', 'leads'].forEach(k => { try { localStorage.removeItem(L.KEYS[k]) } catch {} }); LomeliPortal.clear(); L.syncFavs(); L.toast('Datos borrados.'); login('registro') };
    }
  };
  addEventListener('hashchange', () => { if (L.session()) dash(true) });
  document.addEventListener('lomeli:requests', () => { if (L.session()) dash(true) });
  document.addEventListener('click', e => { if (e.target.closest('[data-fav]') && tab() === 'favoritos') setTimeout(dash, 0) });
  L.session() ? (P.get('next') === 'solicitud' ? afterLogin() : dash()) : login();
})();
