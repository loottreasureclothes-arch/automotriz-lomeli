/* Solicitud de crédito en línea: 7 pasos numerados y editables + envío con folio.
   Todo se guarda en este navegador (borrador y solicitudes) y se ve en el panel administrativo.
   Pendiente: guardarlo en un servidor y avisar al equipo por correo cuando llegue una solicitud. */
window.LomeliPortal = (() => {
  const q = s => document.querySelector(s), qa = (s, r = document) => [...r.querySelectorAll(s)];
  const {esc, money, D} = L, KEY = 'lomeli-credito-v3';
  const STEPS = ['Auto y financiamiento', 'Datos personales', 'Datos laborales', 'Historial complementario', 'Referencias', 'Declaraciones', 'Revisa tu solicitud'];
  const STATUS = ['Recibida', 'En revisión', 'Enviada al banco', 'Aprobada', 'Rechazada'];
  const AUTO_TERMS = [3, 6, 9, 12];
  const OPT = {
    civil: ['Soltero(a)', 'Casado(a)', 'Unión libre', 'Divorciado(a)', 'Viudo(a)'],
    genero: ['Femenino', 'Masculino', 'Prefiero no decir'],
    fiscal: ['Empleado del sector privado', 'Persona física con actividad empresarial', 'Empleado del sector público', 'Pensionado'],
    antig: ['Menos de 1 año', '1 año', '2 años', '3 años', '4 años', '5 años', '6 años', '7 a 10 años', 'Más de 10 años'],
    estados: ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'],
    tiempo: ['Menos de 1 año', '1 a 2 años', '3 a 5 años', '6 a 10 años', 'Más de 10 años'],
    vivienda: ['Propia', 'Rentada', 'De un familiar'],
    dependientes: ['0', '1', '2', '3', '4 o más'],
    estudios: ['Primaria', 'Secundaria', 'Preparatoria', 'Licenciatura', 'Posgrado'],
    relLab: ['Compañero(a) de trabajo', 'Jefe(a)', 'Cliente', 'Proveedor', 'Otra'],
    relAmi: ['Amigo(a)', 'Vecino(a)', 'Conocido(a)', 'Otra'],
    parentesco: ['Padre o madre', 'Hermano(a)', 'Hijo(a)', 'Cónyuge o pareja', 'Abuelo(a)', 'Tío(a)', 'Primo(a)', 'Otro']
  };
  const ENG_FILTERS = [0, 50000, 100000, 150000, 250000];
  /* Declaraciones redactadas para Automotriz Lomelí */
  const CLAUSES = [
    'Los datos que escribí en esta solicitud son verdaderos y están completos.',
    'Autorizo a Automotriz Lomelí a presentar mi solicitud ante los bancos o financieras que considere adecuados para conseguirme un crédito.',
    'Sé que el banco o la financiera revisará mi historial crediticio para decidir sobre mi solicitud.',
    'Acepto que Automotriz Lomelí me llame, me escriba por WhatsApp o me mande correos para dar seguimiento a este trámite.',
    'Leí el Aviso de Privacidad de Automotriz Lomelí y estoy de acuerdo con el uso de mis datos para este trámite.',
    'Entiendo que enviar esta solicitud no significa que mi crédito esté aprobado; la decisión final es del banco o de la financiera.',
    'Soy mayor de edad y tengo capacidad legal para pedir este crédito.'
  ];
  let draft = null, requests = [], step = 0, pending = null, sig = null;
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d?.version === 3) { draft = d.draft || null; requests = Array.isArray(d.requests) ? d.requests : [] } } catch {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify({version: 3, draft, requests})); return true } catch { msg('No se pudo guardar. El almacenamiento del navegador está lleno.'); return false } }

  /* Cálculo del plan */
  function quote(d) {
    const c = L.find(d.carId); if (!c) return null;
    const pl = L.plan(c), mode = d.mode === 'bancario' && pl.bank ? 'bancario' : 'autofin';
    /* Enganche: Mínimo (0% bancario / 70% autofinanciamiento) · Recomendado (20%, solo bancario) · Otra cantidad */
    const base = mode === 'bancario' ? c.price : pl.list, minPct = mode === 'bancario' ? 0 : 70, maxPct = mode === 'bancario' ? 80 : 95;
    const opt = d.eng === 'rec' && mode === 'bancario' ? 'rec' : d.eng === 'otra' ? 'otra' : 'min';
    const pct = opt === 'rec' ? 20 : opt === 'otra' ? Math.min(maxPct, Math.max(minPct, (Number(d.engAmount) || 0) / base * 100)) : minPct;
    const r1 = n => Math.round(n * 10) / 10;
    if (mode === 'bancario') { const months = L.BANK_TERMS.includes(+d.months) ? +d.months : 60, v = lomeliPayment(c.price, pct, months); return {...v, percent: r1(pct), eng: opt, mode, carId: c.id, carName: L.fullName(c), price: c.price, minDown: 0, maxDown: base * maxPct / 100} }
    const months = AUTO_TERMS.includes(+d.months) ? +d.months : 12, down = base * pct / 100;
    return {mode, eng: opt, carId: c.id, carName: L.fullName(c), price: base, percent: r1(pct), down, principal: base - down, months, payment: (base - down) / months, remate: pl.remate, minDown: base * minPct / 100, maxDown: base * maxPct / 100};
  }
  const minDownOf = c => { const pl = L.plan(c); return pl.bank ? 0 : pl.autoDown };
  const modeName = m => m === 'bancario' ? 'Crédito bancario' : 'Autofinanciamiento Lomelí';
  const get = (o, path) => path.split('.').reduce((a, k) => a?.[k], o);
  const set = (o, path, v) => { const ks = path.split('.'), last = ks.pop(); ks.reduce((a, k) => a[k] ??= {}, o)[last] = v };
  const fullName = p => [p.nombre, p.paterno, p.materno].filter(Boolean).join(' ');
  function rfcBase(p) {
    const clean = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z ]/g, '').trim();
    const pat = clean(p.paterno), mat = clean(p.materno); let names = clean(p.nombre).split(/\s+/).filter(Boolean);
    if (names.length > 1 && ['JOSE', 'MARIA', 'MA', 'J'].includes(names[0])) names = names.slice(1);
    if (!pat || !names.length || !/^\d{4}-\d{2}-\d{2}$/.test(p.nacimiento || '')) return '';
    const vowel = (pat.slice(1).match(/[AEIOU]/) || ['X'])[0], [y, m, d] = p.nacimiento.split('-');
    return pat[0] + vowel + (mat[0] || 'X') + names[0][0] + y.slice(2) + m + d;
  }
  const rfcOk = r => /^[A-ZÑ&]{4}\d{6}[A-Z\d]{3}$/.test(String(r || '').toUpperCase());

  /* Piezas de formulario */
  const fe = '<small class="fieldError" role="alert"></small>';
  const input = (name, label, attrs = '', help = '') => `<label data-field="${name}">${label}<input name="${name}" ${attrs}>${help ? `<small>${help}</small>` : ''}${fe}</label>`;
  const select = (name, label, opts) => `<label data-field="${name}">${label}<select name="${name}"><option value="">Selecciona…</option>${opts.map(o => `<option>${esc(o)}</option>`).join('')}</select>${fe}</label>`;
  const chips = (name, label, opts, help = '') => `<fieldset class="btnGroup" data-field="${name}"><legend>${label}</legend>${help ? `<p class="subtle">${help}</p>` : ''}<div class="chipRow">${opts.map(o => `<label class="chipChoice"><input type="radio" name="${name}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join('')}</div>${fe}</fieldset>`;
  const ref = (k, title, relName, relLabel, opts) => `<div class="refBox"><h4>${title}</h4><div class="formGrid three">${input(`r.${k}.nombre`, 'Nombre completo', 'maxlength="100" autocomplete="off"')}${input(`r.${k}.tel`, 'Teléfono (10 dígitos)', 'type="tel" inputmode="numeric" maxlength="10" autocomplete="off"')}${select(`r.${k}.${relName}`, relLabel, opts)}</div></div>`;

  document.body.insertAdjacentHTML('beforeend', `<dialog id="customerLogin" class="portalDialog"><button class="close" data-portal-close="customerLogin" aria-label="Cerrar">×</button><p class="eyebrow">MI CUENTA</p><h2>Primero crea tu cuenta.</h2><p>Tu solicitud se guarda en tu cuenta para que la llenes con calma y la revises cuando quieras. Te pedimos verificar tu correo y tu teléfono.</p><a class="btn wide" id="portalRegister" href="cuenta.html">Crear mi cuenta</a><a class="providerButton" id="portalLoginLink" href="cuenta.html">Ya tengo cuenta: entrar</a></dialog>
  <dialog id="application" class="applicationDialog"><button class="close" data-portal-close="application" aria-label="Cerrar">×</button><div class="applicationHeader"><p class="eyebrow">SOLICITUD DE CRÉDITO EN LÍNEA</p><h2 id="appTitle"></h2><p class="subtle" id="appLead"></p></div><ol class="stepper seven" id="appSteps">${STEPS.map((s, i) => `<li><button type="button" data-goto="${i}"><b>${i + 1}</b><span>${s}</span></button></li>`).join('')}</ol>
  <form id="applicationForm" novalidate>
   <fieldset data-step="0"><div id="stepCar"></div></fieldset>
   <fieldset data-step="1" hidden><h4 class="subHead">Tus datos registrados</h4><div id="regData"></div><p class="subtle">¿Algo no está bien? Corrígelo desde <a class="textLink" href="cuenta.html#perfil">tu perfil</a>.</p>
    <div class="revBlock rfcBox" data-field="p.homo"><h4 class="subHead">Tu RFC</h4><p class="subtle" id="rfcHint"></p><label>Homoclave <small>(3 últimos caracteres; también puedes pegar tu RFC completo)</small><input name="p.homo" maxlength="13" placeholder="Ej. AB1" autocomplete="off" style="text-transform:uppercase"><small>Viene en tu Constancia de Situación Fiscal, en tu recibo de nómina o en una factura a tu nombre.</small></label>${fe}<div class="signTools"><span class="tag" id="homoState"></span><button type="button" id="noHomo">No la tengo a la mano</button></div></div>
    <h4 class="subHead">Domicilio actual</h4><div class="formGrid">${input('p.calle', 'Calle y número', 'maxlength="120" autocomplete="address-line1" placeholder="Ej. Av. Las Américas 120, int. 4"')}${input('p.colonia', 'Colonia', 'maxlength="80"')}${input('p.ciudad', 'Ciudad o municipio', 'maxlength="60" autocomplete="address-level2"')}${select('p.estado', 'Estado', OPT.estados)}</div>${input('p.cp', 'Código postal', 'inputmode="numeric" maxlength="5" autocomplete="postal-code"')}</fieldset>
   <fieldset data-step="2" hidden>${chips('w.fiscal', 'Clasificación fiscal', OPT.fiscal)}<div class="formGrid">${input('w.empresa', 'Nombre de la empresa o negocio', 'maxlength="100" placeholder="Ej. Comercializadora del Centro"')}${input('w.tel', 'Teléfono de la empresa (10 dígitos)', 'type="tel" inputmode="numeric" maxlength="10"')}${input('w.jefe', 'Jefe inmediato <small>(opcional)</small>', 'maxlength="100" placeholder="Nombre completo"')}${input('w.web', 'Sitio web <small>(opcional)</small>', 'maxlength="100" placeholder="www.empresa.com"')}</div>${input('w.dir', 'Dirección de la empresa', 'maxlength="160" placeholder="Calle, número, colonia, ciudad, estado"')}<div class="formGrid">${input('w.sector', 'Sector o industria', 'maxlength="60" placeholder="Ej. Automotriz, Comercio, Salud"')}${input('w.puesto', 'Puesto', 'maxlength="80" placeholder="Ej. Supervisor, Analista"')}${select('w.antig', 'Antigüedad en el puesto', OPT.antig)}${input('w.ingreso', 'Ingreso mensual bruto (antes de impuestos)', 'type="number" inputmode="numeric" min="1" max="10000000" placeholder="25000"')}</div></fieldset>
   <fieldset data-step="3" hidden><p class="subtle">Unos datos más para completar tu perfil.</p>${chips('h.tiempo', 'Tiempo viviendo en tu domicilio actual', OPT.tiempo)}${chips('h.vivienda', 'Tipo de vivienda', OPT.vivienda)}${chips('h.dependientes', 'Dependientes económicos', OPT.dependientes, 'Personas que dependen de tu ingreso.')}${chips('h.estudios', 'Último grado de estudios terminado', OPT.estudios)}</fieldset>
   <fieldset data-step="4" hidden><p class="subtle">Tres personas que te conozcan y que no vivan contigo. Solo las contactamos si hace falta para tu trámite.</p>${ref('lab', 'Referencia laboral', 'rel', 'Relación', OPT.relLab)}${ref('ami', 'Referencia de amistad', 'rel', 'Relación', OPT.relAmi)}${ref('fam', 'Referencia familiar', 'rel', 'Parentesco', OPT.parentesco)}</fieldset>
   <fieldset data-step="5" hidden><p>Antes de enviar, lee y acepta lo siguiente:</p><ol class="clauses">${CLAUSES.map((t, i) => `<li><b>${String(i + 1).padStart(2, '0')}</b><span>${esc(t).replace('Aviso de Privacidad', '<a href="privacidad.html" target="_blank">Aviso de Privacidad</a>')}</span></li>`).join('')}</ol><label class="checkLabel" data-field="decl.terms"><input type="checkbox" name="decl.terms"> <span>Leí y acepto las declaraciones anteriores y el <a href="privacidad.html" target="_blank">aviso de privacidad</a>.</span></label>${fe}<label class="checkLabel"><input type="checkbox" name="decl.encuestas"> <span>Opcional: acepto que Automotriz Lomelí me contacte por correo, SMS o WhatsApp con encuestas breves para mejorar el servicio.</span></label><div class="signBox" data-field="firma"><h4>Firma tu solicitud</h4><p class="subtle">Tu firma confirma las declaraciones. Procura que se parezca a la de tu identificación oficial.</p><p class="subtle">Llenar esta solicitud no consulta tu buró de crédito; el banco o la financiera lo consulta cuando evalúa tu solicitud.</p><div class="signPad"><canvas id="signCanvas" aria-label="Recuadro para dibujar tu firma con el dedo o el mouse"></canvas><span class="signHint" id="signHint">Dibuja tu firma aquí</span></div><div class="signTools"><span id="signState" class="tag">Pendiente</span><button type="button" id="signClear">Borrar firma</button></div>${fe}</div></fieldset>
   <fieldset data-step="6" hidden><div id="reviewBox"></div></fieldset>
   <p id="applicationMessage" role="status" aria-live="polite"></p>
   <div class="applicationActions"><button type="button" id="saveDraft">Guardar y salir</button><div><button type="button" id="previousStep">Anterior</button><button type="submit" class="btn" id="nextStep">Siguiente</button></div></div>
  </form></dialog>
  <dialog id="requestDetail" class="applicationDialog"><button class="close" data-portal-close="requestDetail" aria-label="Cerrar">×</button><div id="requestDetailContent"></div></dialog>
  <dialog id="requestSuccess" class="portalDialog"><button class="close" data-portal-close="requestSuccess" aria-label="Cerrar">×</button><span class="successMark">✓</span><p class="eyebrow">SOLICITUD ENVIADA</p><h2>Recibimos tu<br>solicitud.</h2><p id="successFolio"></p><p>Un asesor de Lomelí la revisa y te contacta por WhatsApp o por teléfono. Puedes ver su estado en tu cuenta.</p><a class="btn waBtn wide" id="successWa" target="_blank" rel="noopener">Avisar por WhatsApp</a><a href="cuenta.html#solicitud" class="btn ghost wide" style="margin-top:10px">Ver mis solicitudes</a></dialog>`);
  qa('[data-portal-close]').forEach(b => b.onclick = () => q('#' + b.dataset.portalClose).close());
  const form = q('#applicationForm');
  function msg(s) { q('#applicationMessage').textContent = s || '' }

  /* Paso 1: auto (con filtro por enganche disponible), tipo de financiamiento, enganche y plazo */
  function drawCar() {
    const all = L.publicCars().filter(c => c.state === 'Disponible'), lim = +draft.engFilter || 0;
    const cars = all.filter(c => !lim || minDownOf(c) <= lim || c.id === draft.carId);
    const c = L.find(draft.carId), pl = c ? L.plan(c) : null;
    if (pl && !pl.bank) draft.mode = 'autofin';
    const v = quote(draft), bank = draft.mode === 'bancario', terms = bank ? L.BANK_TERMS : AUTO_TERMS;
    if (!v) { q('#stepCar').innerHTML = '<p>No hay autos disponibles.</p>'; return }
    draft.months = v.months;
    const at = m => quote({...draft, months: m}).payment;
    q('#stepCar').innerHTML = `<p class="subtle">Filtra por el enganche que tienes disponible: es lo que más mueve la mensualidad.</p><div class="chipRow" role="group" aria-label="Enganche disponible">${ENG_FILTERS.map(x => `<button type="button" class="engChip" data-engf="${x}" aria-pressed="${x === lim}">${x ? 'Hasta ' + money(x) : 'Cualquier enganche'} (${all.filter(k => !x || minDownOf(k) <= x).length})</button>`).join('')}</div>
     <label data-field="carId">Auto<select name="carId">${cars.map(x => `<option value="${esc(x.id)}" ${x.id === draft.carId ? 'selected' : ''}>${esc(L.fullName(x))} · ${money(x.price)} · enganche desde ${money(minDownOf(x))}</option>`).join('')}</select></label>
     <fieldset class="btnGroup"><legend>Tipo de financiamiento</legend><div class="choiceGrid">${pl?.bank ? `<label class="choice"><input type="radio" name="mode" value="bancario" ${bank ? 'checked' : ''}><span><strong>Crédito bancario</strong><small>${esc(D.terms.bank)}</small></span></label>` : ''}<label class="choice"><input type="radio" name="mode" value="autofin" ${!bank ? 'checked' : ''}><span><strong>Autofinanciamiento Lomelí</strong><small>${esc(D.terms.autofin)}</small></span></label></div>${pl && !pl.bank ? `<p class="subtle">${pl.remate ? 'Este auto es de remate: el precio de remate es solo de contado; el autofinanciamiento aplica sobre el precio de lista.' : 'Este auto solo tiene autofinanciamiento.'}</p>` : ''}</fieldset>
     <h4 class="subHead">Tu financiamiento</h4><p class="subtle">Elige tu enganche y tu plazo; la mensualidad se calcula sola.</p>
     <fieldset class="btnGroup" data-field="engAmount"><legend>Enganche <small>· lo que pagas al firmar: entre ${money(v.minDown)} y ${money(v.maxDown)}</small></legend><div class="engOpts">
      <label class="choice"><input type="radio" name="eng" value="min" ${v.eng === 'min' ? 'checked' : ''}><span><strong>Mínimo</strong><small>${money(v.minDown)} · ${bank ? '0' : '70'}%</small></span></label>
      ${bank ? `<label class="choice"><input type="radio" name="eng" value="rec" ${v.eng === 'rec' ? 'checked' : ''}><span><strong>Recomendado</strong><small>${money(c.price * .2)} · 20%</small></span></label>` : ''}
      <label class="choice"><input type="radio" name="eng" value="otra" ${v.eng === 'otra' ? 'checked' : ''}><span><strong>Otra cantidad</strong><small>Escribe tu monto</small></span></label></div>
      ${v.eng === 'otra' ? `<label>Monto de enganche<input name="engAmount" type="number" inputmode="numeric" min="${Math.round(v.minDown)}" max="${Math.round(v.maxDown)}" step="1000" value="${Math.round(Number(draft.engAmount) || v.down)}"></label>` : ''}<small class="fieldError" role="alert"></small></fieldset>
     <fieldset class="btnGroup"><legend>Plazo <small>· con más meses pagas menos cada mes; este auto llega hasta ${terms[terms.length - 1]} meses</small></legend><div class="termPick ${bank ? 'five' : 'four'}">${terms.map(m => `<button type="button" data-term="${m}" aria-pressed="${m === v.months}"><b>${m} meses</b><span>${money(at(m))} al mes</span></button>`).join('')}</div></fieldset>
     <dl class="quoteGrid"><div><dt>Precio${v.remate ? ' de lista' : ''}</dt><dd>${money(v.price)}</dd></div><div><dt>Enganche (−)</dt><dd>${money(v.down)} <small>${v.percent}%</small></dd></div><div><dt>A financiar</dt><dd>${money(v.principal)}</dd></div><div class="hl"><dt>${bank ? 'Mensualidad estimada' : 'Mensualidad de referencia'}</dt><dd>${money(v.payment)} <small>a ${v.months} meses</small></dd></div></dl>
     <p class="legal">${bank ? 'Calculada con una tasa ilustrativa de 15% anual, sin seguros ni comisiones. La tasa final la define el banco según tu perfil. Crédito sujeto a aprobación.' : 'Mensualidad de referencia sin intereses: el costo del autofinanciamiento está pendiente de confirmar con Lomelí.'}</p>`;
  }
  q('#stepCar').addEventListener('change', e => {
    const t = e.target;
    if (t.name === 'carId') { draft.carId = t.value; draft.eng = 'min'; draft.engAmount = '' }
    if (t.name === 'mode') { draft.mode = t.value; draft.months = t.value === 'bancario' ? 60 : 12; draft.eng = 'min'; draft.engAmount = '' }
    if (t.name === 'eng') { draft.eng = t.value; if (t.value === 'otra' && !draft.engAmount) draft.engAmount = Math.round(quote({...draft, eng: 'rec'}).down) }
    if (t.name === 'engAmount') draft.engAmount = +t.value || 0;
    if (['carId', 'mode', 'eng', 'engAmount'].includes(t.name)) { drawCar(); if (t.name === 'eng' && t.value === 'otra') q('[name=engAmount]')?.focus() }
  });
  q('#stepCar').addEventListener('click', e => { const b = e.target.closest('[data-term]'); if (b) { draft.months = +b.dataset.term; drawCar() } const f = e.target.closest('[data-engf]'); if (f) { draft.engFilter = +f.dataset.engf; const lim = draft.engFilter, cur = L.find(draft.carId); if (lim && cur && minDownOf(cur) > lim) { const first = L.publicCars().find(c => minDownOf(c) <= lim); if (first) { draft.carId = first.id; draft.eng = 'min' } } drawCar() } });

  /* Paso 2: datos del perfil (solo lectura) + homoclave + domicilio */
  function syncProfile() {
    const m = L.me(), pf = m.perfil || {}, s = L.session() || {};
    Object.assign(draft.p ??= {}, {nombre: pf.nombre || '', paterno: pf.paterno || '', materno: pf.materno || '', nacimiento: pf.nacimiento || '', genero: pf.genero || '', civil: pf.civil || '', compania: pf.compania || '', correo: s.email || '', tel: s.phone || m.phone || ''});
    draft.p.rfc = rfcFrom(draft.p);
  }
  function rfcFrom(p) { const h = String(p.homo || '').toUpperCase().replace(/[^A-ZÑ&\d]/g, ''); if (h.length === 13) return h; const b = rfcBase(p); return b && h.length === 3 ? b + h : '' }
  function drawPersonal() {
    syncProfile(); const p = draft.p, b = rfcBase(p);
    q('#regData').innerHTML = `<dl class="reviewGrid">${[['Nombre completo', fullName(p)], ['Fecha de nacimiento', p.nacimiento ? L.fmtDay(p.nacimiento, {day: 'numeric', month: 'long', year: 'numeric'}) : ''], ['Teléfono', p.tel ? `${p.tel}${p.compania ? ' · ' + p.compania : ''}` : ''], ['Correo', p.correo], ['Estado civil', p.civil], ['Género', p.genero], ['RFC', p.rfc || (b ? b + '···' : '')]].map(([k, v]) => `<div><dt>${k}</dt><dd>${v ? esc(v) : '<span class="pend">Pendiente</span>'}</dd></div>`).join('')}</dl>`;
    q('#rfcHint').innerHTML = b ? `El banco lo necesita para revisar tu solicitud. Por tu nombre y fecha de nacimiento, tu RFC empieza con <b>${esc(b)}</b>; solo faltan los 3 últimos caracteres: tu homoclave. Si no la tienes a la mano, sigue llenando y te la pedimos antes de enviar.` : 'Completa tu nombre y fecha de nacimiento en tu perfil para calcular el inicio de tu RFC.';
    q('#homoState').textContent = p.rfc ? 'RFC completo: ' + p.rfc : draft.p.sinHomo ? 'Te la pediremos antes de enviar' : '';
  }
  q('#noHomo').onclick = () => { draft.p.sinHomo = true; form.elements['p.homo'].value = ''; draft.p.homo = ''; drawPersonal(); fieldErrors([]); msg('Sigue llenando; te pediremos la homoclave antes de enviar.') };

  /* Firma dibujada */
  function setupSign() {
    const cv = q('#signCanvas'), box = cv.parentElement, r = window.devicePixelRatio || 1, w = box.clientWidth || 320, h = 170;
    cv.width = w * r; cv.height = h * r; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const ctx = cv.getContext('2d'); ctx.scale(r, r); ctx.lineWidth = 2.2; ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = '#10141b';
    sig = {cv, ctx, drawing: false};
    if (draft.firma) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, w, h); img.src = draft.firma }
    signState();
  }
  function signState() { const on = !!draft?.firma; q('#signState').textContent = on ? 'Firmada' : 'Pendiente'; q('#signState').classList.toggle('ok', on); q('#signHint').hidden = on }
  const pt = e => { const b = sig.cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top] };
  const cvs = q('#signCanvas');
  cvs.addEventListener('pointerdown', e => { if (!sig) return; e.preventDefault(); cvs.setPointerCapture(e.pointerId); sig.drawing = true; const [x, y] = pt(e); sig.ctx.beginPath(); sig.ctx.moveTo(x, y); sig.ctx.lineTo(x + .1, y + .1); sig.ctx.stroke(); q('#signHint').hidden = true });
  cvs.addEventListener('pointermove', e => { if (!sig?.drawing) return; const [x, y] = pt(e); sig.ctx.lineTo(x, y); sig.ctx.stroke() });
  const endSign = () => { if (!sig?.drawing) return; sig.drawing = false; draft.firma = sig.cv.toDataURL('image/png'); signState() };
  cvs.addEventListener('pointerup', endSign); cvs.addEventListener('pointercancel', endSign);
  q('#signClear').onclick = () => { if (!sig) return; sig.ctx.clearRect(0, 0, sig.cv.width, sig.cv.height); draft.firma = ''; signState() };

  /* Lectura y llenado del formulario */
  function collect() {
    if (!draft) return;
    qa('[name*="."]', form).forEach(el => { if (el.type === 'radio') { if (el.checked) set(draft, el.name, el.value) } else if (el.type === 'checkbox') set(draft, el.name, el.checked); else set(draft, el.name, el.name === 'p.rfc' ? el.value.trim().toUpperCase() : el.value.trim()) });
    if (draft.p) { draft.p.rfc = rfcFrom(draft.p); if (draft.p.homo) draft.p.sinHomo = false }
    draft.updatedAt = new Date().toISOString();
  }
  function fill() { qa('[name*="."]', form).forEach(el => { const v = get(draft, el.name); if (el.type === 'radio') el.checked = v === el.value; else if (el.type === 'checkbox') el.checked = !!v; else el.value = v ?? '' }) }

  /* Validación por paso: regresa la lista de errores [campo, mensaje] */
  const tel10 = v => /^\d{10}$/.test(v || '');
  const blank = v => v === undefined || v === null || String(v).trim() === '';
  function check(i, d = draft) {
    const p = d.p || {}, w = d.w || {}, h = d.h || {}, r = d.r || {}, e = [], req = (v, n, t = 'Este campo es obligatorio.') => { if (blank(v)) e.push([n, t]) };
    if (i === 0) { const v = quote(d); if (!v) e.push(['carId', 'Elige un auto disponible.']); else if (v.eng === 'otra' && ((+d.engAmount || 0) < v.minDown - 1 || (+d.engAmount || 0) > v.maxDown + 1)) e.push(['engAmount', `Escribe un enganche entre ${money(v.minDown)} y ${money(v.maxDown)}.`]) }
    if (i === 1) {
      if (!fullName(p) || !p.nacimiento) e.push(['p.homo', 'Completa tu perfil (nombre y fecha de nacimiento) antes de seguir.']);
      const hm = String(p.homo || '').trim(); if (hm && !rfcFrom(p)) e.push(['p.homo', 'Escribe los 3 caracteres de tu homoclave o tu RFC completo de 13.']); else if (!hm && !p.sinHomo) e.push(['p.homo', 'Escribe tu homoclave, o toca «No la tengo a la mano» para seguir sin ella.']);
      req(p.calle, 'p.calle', 'Escribe tu calle y número.'); req(p.colonia, 'p.colonia', 'Escribe tu colonia.'); req(p.ciudad, 'p.ciudad', 'Escribe tu ciudad o municipio.'); req(p.estado, 'p.estado', 'Elige tu estado.');
      if (!/^\d{5}$/.test(p.cp || '')) e.push(['p.cp', 'El código postal debe tener 5 dígitos.']);
    }
    if (i === 2) {
      req(w.fiscal, 'w.fiscal', 'Elige tu clasificación fiscal.'); if (String(w.empresa || '').trim().length < 2) e.push(['w.empresa', 'Escribe el nombre completo de tu empresa o negocio.']);
      if (!tel10(w.tel)) e.push(['w.tel', 'Escribe el teléfono de tu empresa a 10 dígitos.']); req(w.dir, 'w.dir', 'Escribe la dirección de la empresa.');
      req(w.sector, 'w.sector', 'Indica a qué sector o industria pertenece tu empresa.'); req(w.puesto, 'w.puesto', 'Escribe tu puesto.'); req(w.antig, 'w.antig', 'Elige tu antigüedad en el puesto.');
      if (!(+w.ingreso > 0)) e.push(['w.ingreso', 'Escribe tu ingreso mensual bruto.']);
    }
    if (i === 3) { req(h.tiempo, 'h.tiempo', 'Elige una opción.'); req(h.vivienda, 'h.vivienda', 'Elige una opción.'); req(h.dependientes, 'h.dependientes', 'Elige una opción.'); req(h.estudios, 'h.estudios', 'Elige una opción.') }
    if (i === 4) for (const k of ['lab', 'ami', 'fam']) { const x = r[k] || {}; req(x.nombre, `r.${k}.nombre`, 'Escribe el nombre completo.'); if (!tel10(x.tel)) e.push([`r.${k}.tel`, 'Teléfono a 10 dígitos.']); req(x.rel, `r.${k}.rel`, k === 'fam' ? 'Elige el parentesco.' : 'Elige la relación.') }
    if (i === 5) { if (!d.decl?.terms) e.push(['decl.terms', 'Acepta las declaraciones para continuar.']); if (!d.firma) e.push(['firma', 'Dibuja tu firma en el recuadro.']) }
    return e;
  }
  function fieldErrors(list) {
    qa('.fieldError', form).forEach(x => x.textContent = ''); qa('[aria-invalid]', form).forEach(x => x.removeAttribute('aria-invalid'));
    list.forEach(([n, t]) => { const box = form.querySelector(`[data-field="${n}"]`); if (!box) return; const fe = box.querySelector('.fieldError') || box.parentElement.querySelector('.fieldError'); if (fe) fe.textContent = t; box.querySelectorAll('input,select').forEach(x => x.setAttribute('aria-invalid', 'true')) });
    if (list.length) form.querySelector(`[data-field="${list[0][0]}"]`)?.scrollIntoView({behavior: 'smooth', block: 'center'});
  }
  function stepError(i) { const e = check(i); fieldErrors(e); if (e.length) msg(e.length > 1 ? 'Por favor, completa los campos marcados antes de continuar.' : e[0][1]); return e.length }

  /* Resumen por bloques (revisión del cliente, detalle en cuenta y en el panel) */
  function blocks(d, edit) {
    const v = quote(d) || d.quote || {}, p = d.p || {}, w = d.w || {}, h = d.h || {}, r = d.r || {};
    const dl = rows => `<dl class="reviewGrid">${rows.filter(Boolean).map(([k, val]) => `<div><dt>${esc(k)}</dt><dd>${val ? esc(val) : '<span class="pend">Pendiente</span>'}</dd></div>`).join('')}</dl>`;
    const blk = (i, title, body) => `<section class="revBlock"><header><h3>${title}</h3>${edit ? `<button type="button" class="textLink" data-goto="${i}">Editar</button>` : ''}</header>${body}</section>`;
    const addr = [p.calle, p.colonia, p.cp && 'C.P. ' + p.cp, p.ciudad, p.estado].filter(Boolean).join(', ');
    const bdate = p.nacimiento ? L.fmtDay(p.nacimiento, {day: 'numeric', month: 'long', year: 'numeric'}) : '';
    return blk(0, 'Auto y financiamiento', dl([['Auto', v.carName], ['Tipo', modeName(v.mode)], [v.remate ? 'Precio de lista' : 'Precio', v.price ? money(v.price) : ''], ['Plazo', v.months ? v.months + ' meses' : ''], ['Enganche', v.down !== undefined ? `${money(v.down)} (${v.percent}%)` : ''], [v.mode === 'bancario' ? 'Mensualidad estimada' : 'Mensualidad de referencia', v.payment ? money(v.payment) : ''], ['Monto a financiar', v.principal !== undefined ? money(v.principal) : '']]) + (edit ? '<p class="subtle">¿Quieres cambiar el plazo o el enganche? Regresa al paso 1.</p>' : ''))
      + blk(1, 'Datos personales', dl([['Nombre', fullName(p)], ['Correo', p.correo], ['Teléfono', p.tel ? `${p.tel}${p.compania ? ' · ' + p.compania : ''}` : ''], ['RFC', p.rfc], ['Fecha de nacimiento', bdate], ['Estado civil', p.civil], ['Género', p.genero], ['Domicilio', addr]]))
      + blk(2, 'Datos laborales', dl([['Clasificación fiscal', w.fiscal], ['Empresa', w.empresa], ['Puesto', w.puesto], ['Antigüedad', w.antig], ['Dirección de la empresa', w.dir], ['Teléfono de la empresa', w.tel], ['Sector o industria', w.sector], w.web ? ['Sitio web', w.web] : null, ['Jefe inmediato', w.jefe || 'No lo indicó'], ['Ingreso mensual bruto', +w.ingreso ? money(+w.ingreso) : '']]))
      + blk(3, 'Historial complementario', dl([['Tiempo en el domicilio', h.tiempo], ['Tipo de vivienda', h.vivienda], ['Dependientes económicos', h.dependientes], ['Grado de estudios', h.estudios]]))
      + blk(4, 'Referencias', dl([['lab', 'Laboral'], ['ami', 'Amistad'], ['fam', 'Familiar']].map(([k, t]) => { const x = r[k] || {}; return [`Referencia ${t.toLowerCase()}`, x.nombre ? `${x.nombre} · ${x.tel || ''} · ${x.rel || ''}` : ''] })))
      + (d.perfil || !edit ? `<section class="revBlock"><header><h3>Perfil y perfilamiento bancario</h3>${edit ? '<a class="textLink" href="cuenta.html#perfil">Editar</a>' : ''}</header>${window.LomeliPerfil ? LomeliPerfil.summary(d.perfil || {}, d.banca || {}) : ''}</section>` : '')
      + blk(5, 'Declaraciones y firma', `<p>${d.decl?.terms ? '✓ Aceptó las 7 declaraciones y el aviso de privacidad.' : '<span class="pend">Declaraciones pendientes</span>'}</p><p>Encuestas para mejorar el servicio: ${d.decl?.encuestas ? 'sí acepta' : 'no'}</p>${d.firma ? `<img class="signImg" src="${esc(d.firma)}" alt="Firma del solicitante">` : '<p><span class="pend">Firma pendiente</span></p>'}`);
  }
  function drawReview() {
    const p = draft.p || {}, v = quote(draft), base = rfcBase(p), missingHomo = !rfcOk(p.rfc), bc = L.me().banca || {};
    draft.perfil = L.me().perfil; draft.banca = bc;
    if (draft.bank === undefined || draft.bank === '') draft.bank = bc.best || '';
    q('#reviewBox').innerHTML = `<p>Revisa que todo esté correcto. Toca <b>Editar</b> o el número de cualquier paso para cambiar algo, y al final pulsa <b>Enviar solicitud</b>.</p>
      ${v.mode === 'bancario' ? `<section class="revBlock bankPick"><header><h3>Banco sugerido</h3></header>${bc.best ? `<p>Según tu perfilamiento: <b>${esc(bc.best)}</b> (compatibilidad ${bc.bestScore}) · segunda opción ${esc(bc.second)}. <a class="textLink" href="cuenta.html#perfil">Corregir respuestas</a></p>` : ''}<label>Banco con el que quieres tramitarlo<select name="bank"><option value="">Que Lomelí me recomiende</option>${D.banks.map(b => `<option ${draft.bank === b ? 'selected' : ''}>${b}</option>`).join('')}</select></label><p class="subtle">Lista de bancos por mientras: <span class="pend">pendiente de confirmar con Lomelí</span>. El banco final depende de tu perfil y de la aprobación.</p></section>` : `<section class="revBlock"><header><h3>Financiamiento</h3></header><p>Autofinanciamiento directo con Automotriz Lomelí. ${esc(D.terms.autofin)}</p></section>`}
      ${missingHomo ? `<section class="revBlock rfcBox"><header><h3>Tu RFC</h3></header><p>Es lo único que falta para que el banco pueda revisar tu solicitud.${base ? ` Por tu nombre y fecha de nacimiento, tu RFC empieza con <b>${esc(base)}</b>; solo faltan los 3 últimos caracteres: la homoclave.` : ''}</p><div class="formGrid"><label>Homoclave o RFC completo<input id="homoInput" maxlength="13" placeholder="Ej. AB1" style="text-transform:uppercase" autocomplete="off"><small>Viene en tu Constancia de Situación Fiscal, en tu recibo de nómina o en una factura a tu nombre.</small></label><div><button type="button" class="btn" id="homoSave" style="margin-top:24px">Guardar mi RFC</button></div></div><p class="subtle">Si de verdad no la tienes, puedes enviar así; un asesor te la pedirá.</p></section>` : ''}
      ${blocks(draft, true)}
      <div class="demoNotice compact"><strong>Importante.</strong> Al pulsar «Enviar solicitud» confirmas que la información es verdadera, que aceptas las declaraciones y que tu firma dibujada vale como tu firma en este trámite.</div>`;
    q('#homoSave')?.addEventListener('click', () => {
      const val = q('#homoInput').value.trim().toUpperCase().replace(/[^A-ZÑ&\d]/g, '');
      const full = val.length === 13 ? val : val.length === 3 ? (String(p.rfc || '').slice(0, 10).length === 10 ? String(p.rfc).slice(0, 10) : base) + val : '';
      if (!rfcOk(full)) return msg('Escribe los 3 caracteres de tu homoclave o tu RFC completo de 13 caracteres.');
      draft.p.homo = full; draft.p.rfc = full; draft.p.sinHomo = false; form.elements['p.homo'].value = full; save(); drawReview(); msg('RFC guardado.');
    });
  }

  /* Navegación entre pasos */
  function show(i) {
    step = Math.max(0, Math.min(6, i)); draft.step = step; draft.max = Math.max(draft.max || 0, step);
    qa('[data-step]', form).forEach(f => f.hidden = +f.dataset.step !== step);
    qa('#appSteps li').forEach((li, k) => { li.classList.toggle('active', k === step); li.classList.toggle('done', k !== step && k < 6 && k <= (draft.max || 0) && !check(k).length); li.querySelector('button').toggleAttribute('aria-current', k === step) });
    q('#appTitle').textContent = `${step + 1}. ${STEPS[step]}`;
    q('#appLead').textContent = `Paso ${step + 1} de 7. Se guarda solo en tu cuenta; puedes salir y continuar después.`;
    q('#previousStep').hidden = step === 0; q('#nextStep').textContent = step === 6 ? 'Enviar solicitud' : 'Siguiente';
    if (step === 0) drawCar();
    if (step === 5) requestAnimationFrame(setupSign);
    if (step === 6) drawReview();
    if (step === 1) drawPersonal();
    fieldErrors([]); msg(''); q('#application').scrollTop = 0; qa('#appSteps li')[step]?.scrollIntoView({block: 'nearest', inline: 'center'});
  }
  form.addEventListener('input', e => { if (e.target.name === 'p.homo') { collect(); drawPersonal() } const box = e.target.closest('[data-field]'); if (box) { const fe = box.querySelector('.fieldError'); if (fe) fe.textContent = ''; box.querySelectorAll('[aria-invalid]').forEach(x => x.removeAttribute('aria-invalid')) } });
  form.addEventListener('change', e => { if (e.target.name === 'bank') { draft.bank = e.target.value; save() } });
  q('#application').addEventListener('click', e => { const b = e.target.closest('[data-goto]'); if (!b) return; collect(); save(); show(+b.dataset.goto) });
  /* Ligas a "tu perfil" dentro de la solicitud: guardan el avance y cierran la ventana antes de ir */
  q('#application').addEventListener('click', e => { const a = e.target.closest('a[href^="cuenta.html"]'); if (!a) return; collect(); save(); q('#application').close() });
  q('#previousStep').onclick = () => { collect(); save(); show(step - 1) };
  q('#saveDraft').onclick = () => { collect(); if (save()) { q('#application').close(); L.toast('Tu solicitud quedó guardada. Continúa cuando quieras desde Mi cuenta.'); document.dispatchEvent(new Event('lomeli:requests')) } };
  form.onsubmit = e => {
    e.preventDefault(); collect();
    if (step < 6) { if (stepError(step)) return; save(); return show(step + 1) }
    for (let i = 0; i < 6; i++) { if (check(i).length) { show(i); stepError(i); return } }
    /* La homoclave se pide otra vez antes de enviar (una vez); si aún no la tiene, se envía con RFC pendiente. */
    if (!rfcOk(draft.p.rfc) && !draft.homoAsked) { draft.homoAsked = true; save(); msg('Antes de enviar: escribe tu homoclave arriba y toca «Guardar mi RFC». Si no la tienes, vuelve a tocar «Enviar solicitud».'); q('#reviewBox .rfcBox')?.scrollIntoView({behavior: 'smooth', block: 'center'}); return }
    const now = new Date().toISOString(), s = L.session(), me = L.me();
    const r = {...structuredClone(draft), perfil: me.perfil || null, banca: me.banca || null, quote: quote(draft), folio: L.folio('SOL', requests), status: 'Recibida', history: [{status: 'Recibida', at: now}], createdAt: now, account: s?.email || draft.p.correo};
    requests.unshift(r); draft = null;
    if (!save()) { requests.shift(); draft = r; return }
    q('#application').close();
    q('#successFolio').innerHTML = `Folio <b>${esc(r.folio)}</b> · ${esc(r.quote.carName)}`;
    q('#successWa').href = L.wa(`Hola, acabo de enviar mi solicitud de ${modeName(r.quote.mode).toLowerCase()} en su sitio.\nFolio: ${r.folio}\nAuto: ${r.quote.carName}\nNombre: ${fullName(r.p)}`);
    q('#successWa').innerHTML = `${L.waIcon} Avisar por WhatsApp`;
    window.LomeliAdmin?.render?.(); document.dispatchEvent(new Event('lomeli:requests')); q('#requestSuccess').showModal();
  };

  function begin(o = {}) {
    const s = L.session();
    if (!s) {
      pending = o; const p = new URLSearchParams({next: 'solicitud'}); if (o.carId) { p.set('id', o.carId); p.set('modo', o.mode || 'bancario'); p.set('pct', o.percent ?? 0); p.set('m', o.months || 60) }
      q('#portalRegister').href = 'cuenta.html?' + p + '&registro=1'; q('#portalLoginLink').href = 'cuenta.html?' + p; q('#customerLogin').showModal(); return;
    }
    if (!L.profileReady()) {
      const p = new URLSearchParams({next: 'solicitud'}); if (o.carId) { p.set('id', o.carId); p.set('modo', o.mode || 'bancario'); p.set('pct', o.percent ?? 0); p.set('m', o.months || 60) }
      location.href = 'cuenta.html?' + p; return;
    }
    if (o.resume && !draft) o.resume = false;
    if (!o.resume && draft && o.carId && draft.carId !== o.carId && !confirm('Ya tienes una solicitud sin terminar. ¿Empezar una nueva con este auto? (Tus datos personales se conservan.)')) { o = {resume: true} }
    if (!o.resume) {
      let carId = o.carId && L.find(o.carId) ? o.carId : draft?.carId || L.publicCars().find(c => L.plan(c).bank)?.id;
      const c = L.find(carId); if (!c) { L.toast('Elige un auto disponible para hacer tu solicitud.'); return }
      const mode = o.mode === 'autofin' || !L.plan(c).bank ? 'autofin' : 'bancario';
      const keep = draft ? {p: draft.p, w: draft.w, h: draft.h, r: draft.r} : {p: {estado: 'Aguascalientes'}, w: {}, h: {}, r: {}};
      const pct = Number(o.percent) || 0, eng = mode !== 'bancario' || pct === 0 ? 'min' : pct === 20 ? 'rec' : 'otra';
      draft = {id: crypto.randomUUID(), carId, mode, eng, engAmount: eng === 'otra' ? Math.round(c.price * pct / 100) : '', months: Number(o.months) || (mode === 'bancario' ? 60 : 12), step: 0, max: 0, ...keep, decl: {}, firma: '', createdAt: new Date().toISOString()};
      syncProfile(); save();
    }
    syncProfile(); form.reset(); fill(); q('#application').showModal(); show(o.resume ? draft.step || 0 : 0);
  }

  /* Detalle para el cliente (cuenta) y para el panel */
  function detail(id, admin) {
    const r = requests.find(x => x.id === id); if (!r) return;
    const box = q('#requestDetailContent');
    box.innerHTML = `<p class="eyebrow">SOLICITUD ${esc(r.folio)} · ${esc(new Date(r.createdAt).toLocaleDateString('es-MX'))}</p><h2>${esc(fullName(r.p || {}))}</h2><p><span class="statusPill" data-s="${esc(r.status)}">${esc(r.status)}</span>${r.bank ? ` · Banco elegido: <b>${esc(r.bank)}</b>` : r.quote?.mode === 'bancario' ? ' · Banco: que Lomelí recomiende' : ''}${r.banca?.best ? ` · Perfilamiento: <b>${esc(r.banca.best)}</b> (${r.banca.bestScore})` : ''}</p>
      ${admin ? `<div class="adminStatus"><label>Cambiar estado<select id="requestState">${STATUS.map(s => `<option ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label><a class="btn waBtn" target="_blank" rel="noopener" href="${esc('https://wa.me/52' + (r.p?.tel || '') + '?text=' + encodeURIComponent(`Hola ${r.p?.nombre || ''}, te escribimos de Automotriz Lomelí sobre tu solicitud ${r.folio}.`))}">${L.waIcon} WhatsApp al cliente</a></div><p class="subtle">Historial: ${(r.history || []).map(h => `${esc(h.status)} (${esc(new Date(h.at).toLocaleString('es-MX', {dateStyle: 'short', timeStyle: 'short'}))})`).join(' → ')}</p>` : ''}
      ${blocks(r, false)}<div class="actions"><button type="button" id="downloadRequest" class="btn ghost">Descargar resumen</button></div>`;
    if (admin) q('#requestState').onchange = e => { const old = r.status; r.status = e.target.value; r.history = [...(r.history || []), {status: r.status, at: new Date().toISOString()}]; if (!save()) { r.status = old; e.target.value = old; return } L.toast('Estado actualizado: ' + r.status); detail(id, true); window.LomeliAdmin?.render?.(); document.dispatchEvent(new Event('lomeli:requests')) };
    q('#downloadRequest').onclick = () => {
      const v = r.quote || {}, p = r.p || {}, w = r.w || {}, h = r.h || {}, rf = r.r || {};
      const lines = [`AUTOMOTRIZ LOMELÍ — SOLICITUD ${r.folio}`, `Fecha: ${new Date(r.createdAt).toLocaleString('es-MX')}`, `Estado: ${r.status}`, '', '1. AUTO Y FINANCIAMIENTO', `Auto: ${v.carName}`, `Tipo: ${modeName(v.mode)}`, `Precio: ${money(v.price)}`, `Enganche: ${money(v.down)} (${v.percent}%)`, `Plazo: ${v.months} meses`, `Monto a financiar: ${money(v.principal)}`, `Mensualidad estimada: ${money(v.payment)}`, `Banco elegido: ${r.bank || 'Que Lomelí recomiende'}`, '', 'PERFIL Y PERFILAMIENTO', `Próxima operación: ${r.perfil?.op || ''}`, `Forma de pago: ${r.perfil?.pago || ''}`, `Atendido por asesor: ${r.perfil?.asesor || ''}`, `Ingresos: ${r.perfil?.ingresos || 'No lo indicó'}`, `Banco de nómina: ${r.banca?.nomina || ''}`, `Historial: ${r.banca?.historial || ''}`, `Atrasos 12 meses: ${r.banca?.atrasos || ''}`, `Enganche planeado: ${r.banca?.enganche || ''}`, `Sugerencia: ${r.banca?.best || ''} (${r.banca?.bestScore || ''}) / ${r.banca?.second || ''} (${r.banca?.secondScore || ''})`, '', '2. DATOS PERSONALES', `Nombre: ${fullName(p)}`, `Correo: ${p.correo}`, `Teléfono: ${p.tel} (${p.compania})`, `RFC: ${p.rfc || 'Pendiente'}`, `Nacimiento: ${p.nacimiento}`, `Estado civil: ${p.civil}`, `Género: ${p.genero}`, `Domicilio: ${p.calle}, ${p.colonia}, C.P. ${p.cp}, ${p.ciudad}, ${p.estado}`, '', '3. DATOS LABORALES', `Clasificación fiscal: ${w.fiscal}`, `Empresa: ${w.empresa}`, `Sector: ${w.sector}`, `Sitio web: ${w.web || '—'}`, `Puesto: ${w.puesto}`, `Antigüedad: ${w.antig}`, `Dirección: ${w.dir}`, `Teléfono: ${w.tel}`, `Jefe inmediato: ${w.jefe || 'No lo indicó'}`, `Ingreso mensual bruto: ${money(+w.ingreso || 0)}`, '', '4. HISTORIAL COMPLEMENTARIO', `Tiempo en domicilio: ${h.tiempo}`, `Vivienda: ${h.vivienda}`, `Dependientes: ${h.dependientes}`, `Estudios: ${h.estudios}`, '', '5. REFERENCIAS', ...[['lab', 'Laboral'], ['ami', 'Amistad'], ['fam', 'Familiar']].map(([k, t]) => `${t}: ${rf[k]?.nombre} · ${rf[k]?.tel} · ${rf[k]?.rel}`), '', '6. DECLARACIONES', ...CLAUSES.map((t, i) => `${i + 1}. ${t}`), `Aceptadas: ${r.decl?.terms ? 'Sí' : 'No'} · Firma dibujada: ${r.firma ? 'Sí' : 'No'} · Encuestas: ${r.decl?.encuestas ? 'Sí' : 'No'}`];
      const url = URL.createObjectURL(new Blob([lines.join('\n')], {type: 'text/plain;charset=utf-8'})); const a = document.createElement('a'); a.href = url; a.download = r.folio + '.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    q('#requestDetail').showModal();
  }
  function setStatus(id, status) { const r = requests.find(x => x.id === id); if (!r || r.status === status) return; r.status = status; r.history = [...(r.history || []), {status, at: new Date().toISOString()}]; save(); document.dispatchEvent(new Event('lomeli:requests')) }
  document.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.viewRequest) detail(b.dataset.viewRequest, false); if (b.dataset.adminRequest && window.LomeliAdmin?.signed()) detail(b.dataset.adminRequest, true); if (b.hasAttribute('data-resume')) begin({resume: true}) });
  function clear() { draft = null; requests = []; try { localStorage.removeItem(KEY) } catch {} }
  return {begin, detail, clear, setStatus, STATUS, quote, modeName, fullName: fullName, requests: () => requests, draft: () => draft, steps: STEPS};
})();
