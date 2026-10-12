/* Crédito: formulario corto que registra al prospecto, crea y verifica su cuenta (correo + SMS) y abre la solicitud completa (portal.js). */
(() => {
  const {$, $$, esc, money, D} = L, f = $('#leadForm'), err = $('.formError', f);
  const pre = L.params().get('id');
  f.elements.car.innerHTML = '<option value="">Todavía no elijo</option>' + L.publicCars().map(c => `<option value="${esc(c.id)}" ${c.id === pre ? 'selected' : ''}>${esc(L.fullName(c))} · ${money(c.price)}${L.plan(c).bank ? '' : ' · solo autofinanciamiento'}</option>`).join('');
  const s = L.session(); if (s) { f.elements.name.value = s.name || ''; f.elements.email.value = s.email || ''; f.elements.phone.value = s.phone || '' }
  $$('[data-term]').forEach(p => p.textContent = D.terms[p.dataset.term]);
  $('#banks').innerHTML = D.banks.map(b => `<div><strong>${esc(b)}</strong>Pendiente de confirmar</div>`).join('');
  $('#financeCars').innerHTML = L.publicCars().filter(c => !c.separado && L.plan(c).bank).sort((a, b) => a.price - b.price).slice(0, 6).map(L.card).join('');
  $('#legal').innerHTML = L.cardsLegal();
  $('#reviews').innerHTML = L.reviewsHTML(3);
  $('#faqList').innerHTML = L.faqHTML([...D.creditFaq, ...D.faq.slice(2, 3)]);
  f.onsubmit = e => {
    e.preventDefault(); err.textContent = '';
    const el = f.elements;
    if (!el.name.value.trim()) return err.textContent = 'Escribe tu nombre.';
    if (!el.email.value || !el.email.checkValidity()) return err.textContent = 'Escribe un correo válido.';
    if (!/^\d{10}$/.test(el.phone.value)) return err.textContent = 'El teléfono debe tener 10 dígitos.';
    if (!el.ok.checked) return err.textContent = 'Confirma que eres mayor de edad y aceptas el aviso de privacidad.';
    const c = L.find(el.car.value);
    const rec = L.add('leads', 'CRE', {name: el.name.value.trim(), email: el.email.value.trim().toLowerCase(), phone: el.phone.value, carId: c?.id || '', carName: c ? L.fullName(c) : '', status: 'Nuevo'});
    if (!rec) return;
    const go = () => {
      const box = $('#leadDone'); f.hidden = true; box.hidden = false;
      box.innerHTML = `<span class="successMark">✓</span><p class="eyebrow">CUENTA VERIFICADA</p><h2>¡Listo, ${esc(rec.name.split(' ')[0])}!</h2><p>Tu cuenta quedó lista con ${esc(rec.email)}. Ahora llena tu solicitud${c ? ' para el ' + esc(L.fullName(c)) : ''}: son 7 pasos y puedes guardar y seguir después.</p><div class="ctaStack"><button type="button" class="btn" id="fullApp">Llenar mi solicitud</button><a class="btn ghost" href="cuenta.html">Ir a mi cuenta</a></div>`;
      $('#fullApp').onclick = () => LomeliPortal.begin({carId: c?.id, mode: c && !L.plan(c).bank ? 'autofin' : 'bancario', percent: 0, months: c && !L.plan(c).bank ? 12 : 60});
      if (c) LomeliPortal.begin({carId: c.id, mode: L.plan(c).bank ? 'bancario' : 'autofin', percent: 0, months: L.plan(c).bank ? 60 : 12});
    };
    const cur = L.session();
    if (cur && cur.email === rec.email && cur.phone === rec.phone) return go();
    const box = $('#leadDone'); f.hidden = true; box.hidden = false;
    L.verify(box, {name: rec.name, email: rec.email, phone: rec.phone, privacyAt: new Date().toISOString()}, go);
  };
})();
