/* Página de inicio: tendencia, carrocerías, marcas, kit, recomendados, calculadora, reseñas, FAQ, sucursales y blog. */
(() => {
  const {$, $$, esc, money, D} = L;
  let term = 60;
  function draw() {
    const list = L.publicCars();
    const newest = [...list].sort((a, b) => String(b.added).localeCompare(String(a.added)));
    const trend = [...list.filter(c => (c.tags || []).includes('demanda')), ...newest.filter(c => !(c.tags || []).includes('demanda'))].slice(0, 8);
    $('#trend').innerHTML = trend.map(L.card).join('');
    $('#recommended').innerHTML = newest.filter(c => !trend.includes(c)).slice(0, 6).map(L.card).join('');
    $('#cardsLegal').innerHTML = L.cardsLegal();
    $('#totalCars').textContent = list.length;
    $('#types').innerHTML = D.types.map(t => { const n = list.filter(c => c.tipo === t).length; const ph = L.typePhoto(t); return `<a class="${ph ? 'photo' : ''}" href="inventario.html?tipo=${encodeURIComponent(t)}">${ph ? `<img src="${ph}" alt="" loading="lazy">` : L.typeSVG(t)}<strong>${t === 'Sedán' ? 'Sedanes' : t === 'Pick Up' ? 'Pick Ups' : t + 's'}</strong><span>${n} ${n === 1 ? 'auto' : 'autos'}</span></a>` }).join('');
    const brands = {}; list.forEach(c => brands[c.marca] = (brands[c.marca] || 0) + 1);
    $('#brands').innerHTML = Object.entries(brands).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([b, n]) => `<a href="inventario.html?marca=${encodeURIComponent(b)}">${L.logo(b, 'big')}<strong>${esc(b)}</strong><small>${n} ${n === 1 ? 'auto' : 'autos'}</small></a>`).join('');
    calculator(); L.syncFavs();
  }
  $('#kit').innerHTML = L.kitHTML();
  $('#reviews').innerHTML = L.reviewsHTML(6);
  $('#faqList').innerHTML = L.faqHTML(D.faq);
  $('#branchList').innerHTML = L.branchesHTML();
  $('#blogGrid').innerHTML = D.blog.map(b => `<button type="button" class="blogCard" data-article="${b.id}"><span class="blogArt" aria-hidden="true"></span><span class="tag">${esc(b.tag)} · Ejemplo</span><h3>${esc(b.title)}</h3><small>Lectura de ${b.minutes} min</small></button>`).join('');
  $('#blogGrid').onclick = e => { const b = e.target.closest('[data-article]'); if (!b) return; const a = D.blog.find(x => x.id === b.dataset.article); $('#articleBody').innerHTML = `<p class="eyebrow">${esc(a.tag.toUpperCase())} · NOTA DE EJEMPLO</p><h2>${esc(a.title)}</h2>${a.body.map(p => `<p>${esc(p)}</p>`).join('')}<div class="actions"><a class="btn" href="inventario.html">Ver autos</a><a class="btn ghost" href="credito.html">Calcular crédito</a></div>`; $('#article').showModal() };
  $('[data-close-article]').onclick = () => $('#article').close();

  /* Calculadora de la sección Financiamiento (misma fórmula de finance.js) */
  function calculator() { const list = L.publicCars().filter(c => L.plan(c).bank), sel = $('#financeCar'), old = sel.value; sel.innerHTML = list.map(c => `<option value="${esc(c.id)}">${esc(L.fullName(c))} · ${money(c.price)}</option>`).join(''); if (list.some(c => c.id === old)) sel.value = old; $('#startRequest').disabled = !list.length; update() }
  function update() { const c = L.find($('#financeCar').value), pct = Number($('#downPayment').value), v = c ? L.quote(c, pct, term) : null; $('#financePrice').textContent = c ? money(c.price) : 'Sin vehículos disponibles'; $('#downAmount').textContent = v ? money(v.down) : '—'; $('#downPercent').textContent = pct + '%'; $('#monthlyPayment').textContent = v ? money(v.payment) : '—'; $('#termCaption').textContent = 'a ' + term + ' meses'; $('#downPayment').setAttribute('aria-valuetext', (v ? money(v.down) : '') + ' de enganche') }
  $('#financeCar').onchange = update; $('#downPayment').oninput = update;
  $('#termBtns').innerHTML = L.BANK_TERMS.map(m => `<button type="button" data-months="${m}" aria-pressed="${m === term}">${m} meses</button>`).join('');
  $$('[data-months]').forEach(b => b.onclick = () => { term = Number(b.dataset.months); $$('[data-months]').forEach(t => t.setAttribute('aria-pressed', String(t === b))); update() });
  $$('[data-term]').forEach(p => p.textContent = D.terms[p.dataset.term]);
  $('#startRequest').onclick = () => LomeliPortal.begin({carId: $('#financeCar').value, percent: Number($('#downPayment').value), months: term});
  $('#resumeRequest').onclick = () => LomeliPortal.draft() ? LomeliPortal.begin({resume: true}) : location.href = 'cuenta.html#solicitud';
  $$('[data-legal]').forEach(p => p.textContent = L.LEGAL);

  /* Formulario de cotización por WhatsApp */
  $('#quote').onsubmit = e => { e.preventDefault(); const d = new FormData(e.target), m = `Hola, soy ${d.get('nombre')}. Busco un vehículo.\nMarca: ${d.get('marca') || 'Por definir'}\nModelo: ${d.get('modelo') || 'Por definir'}\nAño: ${d.get('anio') || 'Por definir'}\nPresupuesto: ${d.get('presupuesto') ? money(Number(d.get('presupuesto'))) : 'Por definir'}\n${d.get('comentarios') || ''}`; window.open(L.wa(m), '_blank', 'noopener') };

  document.addEventListener('lomeli:inventory', draw);
  draw();

  /* Movimiento sutil de la imagen principal */
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const visual = $('.heroVisual');
    visual.addEventListener('pointermove', e => { const r = visual.getBoundingClientRect(); visual.style.setProperty('--tilt-x', ((e.clientY - r.top) / r.height - .5) * -3 + 'deg'); visual.style.setProperty('--tilt-y', ((e.clientX - r.left) / r.width - .5) * 4 + 'deg') });
    visual.addEventListener('pointerleave', () => { visual.style.setProperty('--tilt-x', '0deg'); visual.style.setProperty('--tilt-y', '0deg') });
  }
})();
