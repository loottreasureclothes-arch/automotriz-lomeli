/* Completa tu perfil (2 pasos) y perfilamiento bancario. Se usa en Mi cuenta antes de la solicitud de crédito.
   Todo se guarda en el perfil de la cuenta en este navegador (L.saveProfile). */
window.LomeliPerfil = (() => {
  const {$, $$, esc} = L;
  const OPT = {
    op: ['Comprar un auto', 'Vender o cambiar mi auto'],
    pago: ['De contado', 'A crédito'],
    asesor: ['No', 'Sí'],
    ingresos: ['Nómina', 'Honorarios', 'Dividendos o acciones', 'Pensión', 'Actividad empresarial'],
    genero: ['Femenino', 'Masculino', 'Prefiero no decir'],
    civil: ['Soltero(a)', 'Casado(a)', 'Viudo(a)', 'Unión libre', 'Divorciado(a)'],
    nomina: ['Scotiabank', 'BBVA', 'Banorte', 'Banregio', 'Afirme', 'Hey Banco', 'Otro banco'],
    historial: ['Excelente', 'Bueno', 'Regular', 'Malo', 'Sin historial'],
    atrasos: ['Ninguno', 'Sí, pero ya me puse al corriente', 'Más de 1 mes', 'Varios pagos sin regularizar'],
    enganche: ['Menos del 20%', '20%', '25% a 30%', '35% o más']
  };
  const Q = [['nomina', '¿En qué banco recibes tu nómina?'], ['historial', '¿Cómo calificas tu historial de crédito?'], ['atrasos', '¿Te has atrasado en algún pago en los últimos 12 meses?'], ['enganche', '¿Cuánto enganche piensas dar?']];

  /* Puntaje de compatibilidad (0–99) por banco. REGLAS PROVISIONALES, solo para ordenar sugerencias mientras Lomelí
     confirma con qué bancos trabaja y qué pide cada uno:
     - Todos parten de 50 puntos.
     - +25 al banco donde recibe su nómina (ese banco ya conoce sus ingresos).
     - Historial: Excelente +20 · Bueno +12 · Regular +4 · Sin historial 0 · Malo −20 (igual para todos).
     - Atrasos 12 meses: Ninguno +10 · Regularizado +3 · Más de 1 mes −10 · Varios sin regularizar −25 (igual para todos).
     - Enganche: menos de 20% −5 · 20% +3 · 25–30% +8 · 35% o más +12 (igual para todos).
     - Ajuste por tipo de banco: con historial Regular o Sin historial, Banregio y Afirme +6 (bancos regionales);
       con historial Excelente o enganche de 35% o más, BBVA y Banorte +5.
     - Empates: se respeta el orden de D.banks. El resultado se limita a 5–99. */
  function score(a) {
    const base = {Excelente: 20, Bueno: 12, Regular: 4, 'Sin historial': 0, Malo: -20}[a.historial] ?? 0;
    const late = {Ninguno: 10, 'Sí, pero ya me puse al corriente': 3, 'Más de 1 mes': -10, 'Varios pagos sin regularizar': -25}[a.atrasos] ?? 0;
    const eng = {'Menos del 20%': -5, '20%': 3, '25% a 30%': 8, '35% o más': 12}[a.enganche] ?? 0;
    const list = L.D.banks.map((bank, i) => {
      let n = 50 + base + late + eng + (a.nomina === bank ? 25 : 0);
      if (['Regular', 'Sin historial'].includes(a.historial) && ['Banregio', 'Afirme'].includes(bank)) n += 6;
      if ((a.historial === 'Excelente' || a.enganche === '35% o más') && ['BBVA', 'Banorte'].includes(bank)) n += 5;
      return {bank, score: Math.max(5, Math.min(99, n)), i};
    }).sort((x, y) => y.score - x.score || x.i - y.i);
    return {best: list[0].bank, bestScore: list[0].score, second: list[1].bank, secondScore: list[1].score, at: new Date().toISOString()};
  }

  const chips = (name, label, opts, val, help = '') => `<fieldset class="btnGroup" data-field="${name}"><legend>${label}</legend>${help ? `<p class="subtle">${help}</p>` : ''}<div class="chipRow">${opts.map(o => `<label class="chipChoice"><input type="radio" name="${name}" value="${esc(o)}" ${val === o ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div><small class="fieldError" role="alert"></small></fieldset>`;
  const field = (name, label, html) => `<label data-field="${name}">${label}${html}<small class="fieldError" role="alert"></small></label>`;
  function errors(form, list) {
    $$('.fieldError', form).forEach(e => e.textContent = ''); $$('[aria-invalid]', form).forEach(e => e.removeAttribute('aria-invalid'));
    list.forEach(([n, t]) => { const box = $(`[data-field="${n}"]`, form); if (!box) return; $('.fieldError', box).textContent = t; $$('input,select', box).forEach(i => i.setAttribute('aria-invalid', 'true')) });
    $('.formError', form).textContent = list.length ? 'Completa los campos marcados para continuar.' : '';
    if (list.length) $(`[data-field="${list[0][0]}"]`, form)?.scrollIntoView({behavior: 'smooth', block: 'center'});
    return !list.length;
  }
  const age = d => d ? (Date.now() - new Date(d + 'T12:00').getTime()) / 31557600000 : 0;

  /* Completa tu perfil: 1 Contacto · 2 Personal. El avance se guarda al pasar de paso. */
  function wizard(root, done, start) {
    const s = L.session(), saved = L.me().perfil || {};
    let step = start ?? (saved.step || 0);
    const names = String(s.name || '').trim().split(/\s+/), guess = {nombre: names.slice(0, names.length > 2 ? -2 : 1).join(' '), paterno: names.length > 1 ? names[names.length > 2 ? names.length - 2 : 1] : '', materno: names.length > 2 ? names[names.length - 1] : ''};
    const v = {...guess, ...saved};
    function draw() {
      root.innerHTML = `<div class="formCard profileCard"><a class="textLink" href="cuenta.html" data-later>← Lo completo después</a><div class="demoNotice compact"><strong>Te damos la bienvenida.</strong> Completa tu perfil para seguir con tu solicitud de crédito. Son dos pasos.</div><ol class="verifySteps"><li class="${step === 0 ? 'active' : 'done'}">1 Contacto</li><li class="${step === 1 ? 'active' : ''}">2 Personal</li></ol>
      <form id="profileWizard" novalidate>${step === 0 ? `<h2>Contacto</h2><h3 class="subHead">Tu asesor</h3>${chips('op', '¿Qué quieres hacer con Lomelí?', OPT.op, v.op)}${chips('pago', '¿Piensas pagar de contado o a crédito?', OPT.pago, v.pago)}${chips('asesor', '¿Ya te atendió un asesor de Lomelí?', OPT.asesor, v.asesor, 'Si no, un asesor te dará seguimiento cuando termines tu perfil.')}
        <h3 class="subHead">Cómo te contactamos</h3><div class="formGrid"><label>Teléfono<input value="${esc(s.phone || '')}" disabled><span class="okPill">✓ Verificado</span></label>${field('compania', 'Compañía telefónica', `<select name="compania"><option value="">Selecciona…</option>${L.PHONE_COS.map(o => `<option ${v.compania === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`)}</div><label>Correo<input value="${esc(s.email)}" disabled><small>Es el correo de tu cuenta; no se puede cambiar aquí.</small></label>
        <h3 class="subHead">Tus ingresos</h3>${chips('ingresos', '¿Cómo recibes tus ingresos?', OPT.ingresos, v.ingresos, 'Opcional. Si no estás seguro, déjalo en blanco.')}`
      : `<h2>Personal</h2><p class="subtle">Escribe tu nombre como aparece en tu identificación oficial.</p><div class="formGrid three">${field('nombre', 'Nombre(s)', `<input name="nombre" maxlength="60" autocomplete="given-name" value="${esc(v.nombre || '')}">`)}${field('paterno', 'Apellido paterno', `<input name="paterno" maxlength="60" autocomplete="family-name" value="${esc(v.paterno || '')}">`)}${field('materno', 'Apellido materno <small>(si aplica)</small>', `<input name="materno" maxlength="60" value="${esc(v.materno || '')}">`)}</div>${field('nacimiento', 'Fecha de nacimiento <small>(debes ser mayor de edad)</small>', `<input name="nacimiento" type="date" min="1930-01-01" value="${esc(v.nacimiento || '')}">`)}${chips('genero', 'Género', OPT.genero, v.genero)}${chips('civil', 'Estado civil', OPT.civil, v.civil)}`}
      <p class="subtle">Tu avance se guarda al pasar de paso.</p><p class="formError" role="alert"></p><div class="applicationActions"><span></span><div>${step ? '<button type="button" id="pwBack">Anterior</button>' : ''}<button class="btn">${step ? 'Guardar y continuar' : 'Siguiente'}</button></div></div></form></div>`;
      const f = $('#profileWizard');
      $('#pwBack')?.addEventListener('click', () => { step = 0; draw() });
      f.onsubmit = e => {
        e.preventDefault(); const d = Object.fromEntries(new FormData(f)); Object.keys(d).forEach(k => d[k] = String(d[k]).trim());
        const err = [];
        if (step === 0) {
          if (!d.op) err.push(['op', 'Elige una opción.']); if (!d.pago) err.push(['pago', 'Elige una opción.']); if (!d.asesor) err.push(['asesor', 'Elige una opción.']); if (!d.compania) err.push(['compania', 'Elige tu compañía telefónica.']);
        } else {
          if (d.nombre.length < 2) err.push(['nombre', 'Escribe tu nombre.']); if (d.paterno.length < 2) err.push(['paterno', 'Escribe tu apellido paterno (mínimo 2 letras).']); if (d.materno && d.materno.length < 2) err.push(['materno', 'Mínimo 2 letras, o déjalo vacío.']);
          if (!d.nacimiento) err.push(['nacimiento', 'Escribe tu fecha de nacimiento.']); else if (age(d.nacimiento) < 18) err.push(['nacimiento', 'Tienes que ser mayor de edad.']);
          if (!d.genero) err.push(['genero', 'Elige una opción.']); if (!d.civil) err.push(['civil', 'Elige tu estado civil.']);
        }
        if (!errors(f, err)) return;
        Object.assign(v, d, {ingresos: d.ingresos || (step === 0 ? '' : v.ingresos)});
        if (step === 0) { L.saveProfile(s.email, {perfil: {...v, step: 1}}); step = 1; draw(); root.scrollIntoView({block: 'start'}); return }
        const full = [v.nombre, v.paterno, v.materno].filter(Boolean).join(' ');
        L.saveProfile(s.email, {name: full, perfil: {...v, step: 1, done: true, at: new Date().toISOString()}}); L.setSession({...s, name: full});
        root.innerHTML = `<div class="formCard profileCard center"><span class="successMark">✓</span><h2>¡Listo! Tu perfil está completo</h2><p>Ahora unas preguntas rápidas para sugerirte el banco con más posibilidades de aprobar tu crédito.</p><button type="button" class="btn wide" id="goBanca">Continuar ahora</button></div>`;
        $('#goBanca').onclick = () => done?.();
      };
    }
    draw();
  }

  /* Perfilamiento bancario: 4 preguntas → banco sugerido (mejor y segunda opción) */
  function banca(root, done, edit) {
    const s = L.session(), prev = L.me().banca || {};
    if (prev.best && !edit) return result(root, done);
    root.innerHTML = `<div class="formCard profileCard"><p class="eyebrow">PERFILAMIENTO BANCARIO</p><h2>¿Qué banco te conviene?</h2><div class="demoNotice compact"><strong>¿Para qué es esto?</strong> Con tus respuestas sugerimos a qué banco conviene enviar tu solicitud, para ahorrarte tiempo y mejorar tus posibilidades.</div><form id="bancaForm" novalidate>${Q.map(([k, t]) => chips(k, t, OPT[k], prev[k])).join('')}<p class="subtle">Tus respuestas solo se usan para sugerirte un banco. No consultamos tu buró de crédito.</p><p class="formError" role="alert"></p><button class="btn wide">Ver mi banco sugerido</button></form></div>`;
    const f = $('#bancaForm');
    f.onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(f)); if (!errors(f, Q.filter(([k]) => !d[k]).map(([k]) => [k, 'Elige una opción.']))) return; L.saveProfile(s.email, {banca: {...d, ...score(d)}}); result(root, done) };
  }
  function result(root, done) {
    const b = L.me().banca;
    const hard = b.historial === 'Malo' || b.atrasos === 'Varios pagos sin regularizar';
    root.innerHTML = `<div class="formCard profileCard"><p class="eyebrow">TU BANCO SUGERIDO</p><div class="bankCards"><article class="best"><span class="badge">Mejor opción</span><strong>${esc(b.best)}</strong><p>Es el banco con más compatibilidad con lo que contestaste.</p></article><article><span class="badge soft">Segunda opción</span><strong>${esc(b.second)}</strong><p>Compatibilidad ${b.secondScore} de 100.</p></article></div>
      <div class="scoreRow"><span class="scoreCircle">${b.bestScore}</span><span>Compatibilidad con <b>${esc(b.best)}</b></span></div>
      ${hard ? '<div class="demoNotice compact">Con atrasos o historial complicado puede costar más trabajo la aprobación. Un asesor te orienta, y el autofinanciamiento Lomelí también es una opción.</div>' : ''}
      <h3 class="subHead">Lo que contestaste</h3><p class="subtle">Si algo cambió, corrígelo y volvemos a calcular.</p><dl class="reviewGrid">${Q.map(([k, t]) => `<div><dt>${esc(t)}</dt><dd>${esc(b[k])}</dd></div>`).join('')}</dl>
      <p class="legal">Esto no es una aprobación ni un compromiso: es una sugerencia con reglas sencillas. La lista de bancos está pendiente de confirmar con Lomelí y el banco final depende de tu perfil completo.</p>
      <div class="ctaStack"><button type="button" class="btn" id="bancaGo">Continuar con mi solicitud</button><button type="button" id="bancaEdit">Corregir mis respuestas</button></div></div>`;
    $('#bancaEdit').onclick = () => banca(root, done, true);
    $('#bancaGo').onclick = () => done?.();
  }
  /* Resumen para la solicitud y el panel */
  function summary(perfil = {}, b = {}) {
    const rows = [['Próxima operación', perfil.op], ['Forma de pago', perfil.pago], ['¿Ya lo atendió un asesor?', perfil.asesor], ['Cómo recibe sus ingresos', perfil.ingresos || 'No lo indicó'], ...Q.map(([k, t]) => [t, b[k]]), ['Banco sugerido', b.best ? `${b.best} (${b.bestScore}) · segunda opción ${b.second} (${b.secondScore})` : '']];
    return `<dl class="reviewGrid">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v ? esc(v) : '<span class="pend">Pendiente</span>'}</dd></div>`).join('')}</dl>`;
  }
  return {wizard, banca, result, score, summary, OPT};
})();
