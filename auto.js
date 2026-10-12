/* Ficha del auto (auto.html?id=): galería, formas de pago, calculadora, ficha técnica básica, agenda, parecidos y navegación. */
(() => {
  const {$, $$, esc, money, num, D} = L;
  const id = L.params().get('id');
  const c = L.find(id);
  if (!c || c.state === 'Oculto') {
    document.body.classList.remove('hasSticky');
    $('#carRoot').innerHTML = `<div class="emptyBox"><h1 style="font-size:30px">No encontramos este auto.</h1><p class="subtle">Puede que ya se haya vendido o que el enlace esté incompleto.</p><div class="actions" style="justify-content:center"><a class="btn" href="inventario.html">Ver inventario</a><a class="btn ghost" href="${esc(L.wa('Hola, busco un auto que vi en su sitio.'))}" target="_blank" rel="noopener">Preguntar por WhatsApp</a></div></div>`;
    return;
  }
  const sold = c.state === 'Vendido', pics = L.photos(c), pl = L.plan(c), title = L.fullName(c);
  const PL = {'SUV': 'SUVs', 'Sedán': 'Sedanes', 'Pick Up': 'Pick Ups', 'Hatchback': 'Hatchbacks'};
  const AUTO_TERMS = [3, 6, 9, 12];
  let gi = 0, mode = pl.bank ? 'bancario' : 'autofin', pct = 0, months = 60, autoMonths = 12;
  document.title = `${title} en Aguascalientes | Automotriz Lomelí`;
  $('#crumbs').insertAdjacentHTML('beforeend', `<span><a href="inventario.html?tipo=${encodeURIComponent(c.tipo)}">${esc(PL[c.tipo] || c.tipo)}</a></span><span>${esc(L.name(c))}</span>`);
  const waMsg = `Hola, me interesa el ${title} (${money(c.price)}) que vi en su sitio. ¿Sigue disponible?`;
  const base = pl.bank ? L.quote(c, 0, 60) : null;
  const ordered = L.publicCars(), pos = ordered.findIndex(x => x.id === c.id);
  const prev = pos > 0 ? ordered[pos - 1] : ordered[ordered.length - 1], next = pos >= 0 && pos < ordered.length - 1 ? ordered[pos + 1] : ordered[0];
  const similar = L.publicCars().filter(x => x.id !== c.id).sort((a, b) => (a.tipo !== c.tipo) - (b.tipo !== c.tipo) || Math.abs(a.price - c.price) - Math.abs(b.price - c.price)).slice(0, 3);
  const hasKm = Number.isFinite(c.km) && c.km !== null;
  /* Ficha técnica básica: solo los datos que existen (sin guiones ni campos vacíos). */
  const specs = [['Marca', c.marca], ['Modelo', c.modelo], ['Versión', c.version], ['Año', c.year], ['Carrocería', c.tipo], ['Transmisión', c.trans], ['Kilometraje', hasKm ? num(c.km) + ' km' : ''], ['Combustible', c.fuel], ['Sucursal', c.sucursal ? 'Sucursal ' + c.sucursal : ''], ['Folio', c.folio]].filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== 0);
  const missing = [!hasKm && 'kilometraje', !c.trans && 'transmisión', 'color', !c.sucursal && 'sucursal'].filter(Boolean);

  const priceHTML = pl.remate
    ? `<p class="carPrice"><s>${money(pl.list)}</s> ${money(c.price)}</p><p class="remateNote">Precio de remate únicamente de contado.</p><p class="fromLine">Con autofinanciamiento o dejando tu auto a cuenta aplica el precio de lista de <b>${money(pl.list)}</b>.</p>`
    : `<p class="carPrice">${money(c.price)}</p>${pl.bank ? `<p class="fromLine">Con 0% de enganche: <b>${money(base.payment)}/mes</b> a 60 meses*</p>` : `<p class="fromLine">Solo autofinanciamiento: enganche de <b>${money(pl.autoDown)}</b> (70%) y el resto hasta en 12 meses.</p>`}`;
  const ways = [
    pl.remate ? ['Contado (remate)', D.terms.remate] : ['Contado', 'Paga el precio publicado en una sola exhibición.'],
    pl.bank ? ['Crédito bancario', D.terms.bank] : null,
    ['Autofinanciamiento Lomelí', D.terms.autofin + (pl.remate ? ` Aplica sobre el precio de lista (${money(pl.list)}).` : '')]
  ].filter(Boolean);
  const ctas = sold ? '' : `${pl.bank ? '<button type="button" class="btn" id="buyCredit">Solicitar crédito bancario</button>' : ''}<button type="button" class="btn ${pl.bank ? 'ghost' : ''}" id="buyAuto">Solicitar autofinanciamiento</button>`;

  $('#carRoot').innerHTML = `<div class="carTop">
   <div><div class="gallery${pics.length < 2 ? ' single' : ''}" id="gallery" tabindex="0" aria-roledescription="carrusel" aria-label="Fotos del auto"><img class="gMain" id="gMain" alt=""><span class="gCount" id="gCount" aria-live="polite"></span><button type="button" class="gNav gPrev" aria-label="Foto anterior">‹</button><button type="button" class="gNav gNext" aria-label="Foto siguiente">›</button><button class="favBtn" data-fav="${esc(c.id)}" aria-label="Guardar en favoritos">${L.heart}</button></div>${pics.length > 1 ? `<div class="thumbs" id="thumbs">${pics.map((p, i) => `<button type="button" data-i="${i}" aria-label="Ver foto ${i + 1}"><img src="${esc(p.src)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}<p class="subtle">¿Quieres ver más fotos o un video? <a class="textLink" href="${esc(L.wa(`Hola, ¿me pueden mandar más fotos del ${title}?`))}" target="_blank" rel="noopener">Pídelas por WhatsApp</a>.</p></div>
   <div class="carInfo"><div class="vbrand big">${L.logo(c.marca)}<span>${esc(c.marca)}</span></div><div class="vtags" style="position:static;margin:8px 0">${pl.remate ? '<span class="vtag hot">Remate</span>' : ''}${L.tags(c)}</div><h1>${esc(title)}</h1><p class="vspecs">${L.specsLine(c)}</p>
   ${sold ? '<div class="demoNotice compact"><strong>Este auto ya se vendió.</strong> Te mostramos opciones parecidas abajo.</div>' : c.separado ? '<div class="demoNotice compact"><strong>Este auto está separado.</strong> Puedes agendar para verlo o pedir que te avisemos si se libera.</div>' : ''}
   ${priceHTML}
   <div class="ctaStack">${ctas}<a class="btn ghost" href="#agenda">Agendar visita</a><a class="btn waBtn" href="${esc(L.wa(waMsg))}" target="_blank" rel="noopener">${L.waIcon} Preguntar por WhatsApp</a></div>
   <div class="miniActions"><button type="button" data-fav="${esc(c.id)}">${L.heart}<span class="favText">Guardar</span></button><button type="button" id="priceAlert">Avisarme si baja de precio</button><button type="button" id="share">Compartir</button></div>
   ${pl.bank ? `<p class="legal">* Crédito bancario con 0% de enganche a 60 meses, sujeto a aprobación. ${esc(L.LEGAL)}</p>` : ''}</div></div>

   <div class="carGrid"><div style="display:grid;gap:22px">
    <section class="box"><p class="eyebrow">FORMAS DE PAGO</p><h2>Cómo puedes comprarlo</h2><ul class="payList">${ways.map(([t, d]) => `<li><strong>${esc(t)}</strong><span>${esc(d)}</span></li>`).join('')}</ul></section>
    ${sold ? '' : `<section class="box calc" id="calculadora"><p class="eyebrow">CALCULADORA</p><h2>Arma tu plan de pago</h2>${pl.bank ? `<div class="modeTabs" role="tablist"><button type="button" role="tab" data-mode="bancario">Crédito bancario</button><button type="button" role="tab" data-mode="autofin">Autofinanciamiento</button></div>` : ''}<div id="calcBody"></div></section>`}
    <section class="box"><h2>Ficha técnica básica</h2><dl class="specs">${specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><p class="subtle">${missing.length ? `Datos como ${missing.length > 1 ? missing.slice(0, -1).join(', ') + ' y ' + missing[missing.length - 1] : missing[0]} están pendientes de confirmar. ` : ''}<a class="textLink" href="${esc(L.wa(`Hola, ¿me pasan la ficha completa del ${title}?`))}" target="_blank" rel="noopener">Pide la ficha completa por WhatsApp</a></p></section>
    ${c.description ? `<section class="box"><h2>Descripción</h2><p>${esc(c.description)}</p></section>` : ''}
    <section class="box"><h2>Así financias este auto</h2><ol class="steps3"><li><div><strong>Crea tu cuenta</strong><p>Regístrate y verifica tu correo y tu teléfono.</p></div></li><li><div><strong>Llena tu solicitud en línea</strong><p>Siete pasos, con firma en pantalla. No tienes que venir a la agencia.</p></div></li><li><div><strong>Nosotros la tramitamos</strong><p>Te avisamos la respuesta y agendamos la entrega.</p></div></li></ol></section>
   </div>
   <section class="box" id="agenda"><p class="eyebrow">AGENDA TU VISITA</p><h2>Ven a conocerlo</h2><p class="subtle">${c.sucursal ? `Lo tendremos listo en la Sucursal ${esc(c.sucursal)} para verlo y manejarlo.` : 'Elige la sucursal; te confirmamos por WhatsApp dónde está el auto.'}</p><div id="bookingBox"></div></section></div>

   <section class="tradeIn" style="margin-top:26px"><div><h2>¿Tienes auto? Úsalo como enganche.</h2><p>Mándanos los datos de tu auto y te hacemos la oferta por WhatsApp.</p></div><a class="btn" href="vender.html?para=${encodeURIComponent(c.id)}">Vender mi auto</a></section>
   <section style="margin-top:40px"><p class="eyebrow">CLIENTES LOMELÍ</p><h2>LO QUE <em>OPINAN</em></h2>${L.reviewsHTML(3)}</section>
   <section style="margin-top:30px"><div class="sectionHead"><div><p class="eyebrow">TAMBIÉN TE PUEDEN GUSTAR</p><h2>AUTOS <em>PARECIDOS</em></h2></div><a class="textLink" href="inventario.html?tipo=${encodeURIComponent(c.tipo)}">Ver más ${esc(PL[c.tipo] || c.tipo)} →</a></div><div class="vgrid">${similar.map(L.card).join('')}</div>${L.cardsLegal()}</section>
   ${ordered.length > 1 ? `<nav class="prevNext" aria-label="Otros autos"><a href="auto.html?id=${encodeURIComponent(prev.id)}"><small>‹ Auto anterior</small>${esc(L.fullName(prev))}</a><a href="auto.html?id=${encodeURIComponent(next.id)}"><small>Auto siguiente ›</small>${esc(L.fullName(next))}</a></nav>` : ''}
   <div class="stickyBuy"><div><strong>${money(c.price)}</strong><small>${pl.remate ? 'Remate de contado' : pl.bank ? `0% enganche: ${money(base.payment)}/mes*` : 'Autofinanciamiento 70% + 12 meses'}</small></div>${sold ? '' : pl.remate ? `<a class="btn" href="${esc(L.wa(waMsg))}" target="_blank" rel="noopener">Apartar</a>` : `<button type="button" class="btn" id="buyCredit2">${pl.bank ? 'Solicitar crédito' : 'Autofinanciamiento'}</button>`}</div>`;

  /* Galería */
  function show(i) { gi = (i + pics.length) % pics.length; const p = pics[gi]; $('#gMain').src = p.src; $('#gMain').alt = `${title}, foto ${gi + 1} de ${pics.length}`; $('#gallery').classList.toggle('real', p.real); $('#gCount').textContent = `${gi + 1}/${pics.length}`; $$('#thumbs button').forEach((b, k) => k === gi ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')) }
  $('.gPrev').onclick = () => show(gi - 1); $('.gNext').onclick = () => show(gi + 1);
  $('#thumbs')?.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) show(+b.dataset.i) });
  $('#gallery').onkeydown = e => { if (e.key === 'ArrowLeft') show(gi - 1); if (e.key === 'ArrowRight') show(gi + 1) };
  let x0 = null; $('#gallery').addEventListener('touchstart', e => x0 = e.touches[0].clientX, {passive: true}); $('#gallery').addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(gi + (dx < 0 ? 1 : -1)); x0 = null });
  show(0);

  /* Calculadora: crédito bancario (0–80% de enganche, 12 a 60 meses) o autofinanciamiento (70% de enganche, hasta 12 meses) */
  function calc() {
    const box = $('#calcBody'); if (!box) return;
    $$('[data-mode]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
    if (mode === 'bancario') {
      const v = L.quote(c, pct, months);
      box.innerHTML = `<div class="calcLine"><span>Precio</span><strong>${money(c.price)}</strong></div><div class="calcLine"><label for="down" style="margin:0">Enganche</label><strong><span id="downAmt">${money(v.down)}</span> <small id="downPct">${pct}%</small></strong></div><input id="down" type="range" min="0" max="80" step="5" value="${pct}" aria-valuetext="${money(v.down)} de enganche"><div class="rangeLabels"><span>0%</span><span>80%</span></div><div class="calcLine"><span>Monto a financiar</span><strong id="principal">${money(v.principal)}</strong></div><label style="margin-top:14px">Plazo</label><div class="termButtons five" role="group" aria-label="Plazo">${L.BANK_TERMS.map(m => `<button type="button" data-months="${m}" aria-pressed="${m === months}">${m} meses</button>`).join('')}</div><div class="paymentBox"><span>Mensualidad estimada<br><small>a ${months} meses</small></span><strong aria-live="polite" id="pay">${money(v.payment)}</strong></div><button type="button" class="btn wide" id="applyPlan">Solicitar crédito con este plan</button><p class="legal">${esc(D.terms.bank)} ${esc(L.LEGAL)}</p>`;
      $('#down').oninput = e => { pct = +e.target.value; const q = L.quote(c, pct, months); $('#downAmt').textContent = money(q.down); $('#downPct').textContent = pct + '%'; $('#principal').textContent = money(q.principal); $('#pay').textContent = money(q.payment); e.target.setAttribute('aria-valuetext', money(q.down) + ' de enganche') };
      $$('[data-months]', box).forEach(b => b.onclick = () => { months = +b.dataset.months; calc() });
      $('#applyPlan').onclick = () => LomeliPortal.begin({carId: c.id, mode: 'bancario', percent: pct, months});
    } else {
      const each = pl.autoRest / autoMonths;
      box.innerHTML = `${pl.remate ? `<p class="subtle">Sobre el precio de lista de ${money(pl.list)} (el precio de remate es solo de contado).</p>` : ''}<div class="calcLine"><span>Precio</span><strong>${money(pl.list)}</strong></div><div class="calcLine"><span>Enganche (70%)</span><strong>${money(pl.autoDown)}</strong></div><div class="calcLine"><span>Resto a pagar</span><strong>${money(pl.autoRest)}</strong></div><label style="margin-top:14px">Plazo</label><div class="termButtons four" role="group" aria-label="Plazo">${AUTO_TERMS.map(m => `<button type="button" data-amonths="${m}" aria-pressed="${m === autoMonths}">${m} meses</button>`).join('')}</div><div class="paymentBox"><span>Mensualidad de referencia<br><small>sin intereses, a ${autoMonths} meses</small></span><strong aria-live="polite">${money(each)}</strong></div><button type="button" class="btn wide" id="applyAuto">Solicitar autofinanciamiento</button><p class="legal">${esc(D.terms.autofin)} El costo financiero del autofinanciamiento está pendiente de confirmar con Lomelí; la mensualidad mostrada solo divide el resto entre los meses.</p>`;
      $$('[data-amonths]', box).forEach(b => b.onclick = () => { autoMonths = +b.dataset.amonths; calc() });
      $('#applyAuto').onclick = () => LomeliPortal.begin({carId: c.id, mode: 'autofin', months: autoMonths});
    }
  }
  $$('[data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; calc() });
  calc();
  $('#buyCredit')?.addEventListener('click', () => LomeliPortal.begin({carId: c.id, mode: 'bancario', percent: pct, months}));
  $('#buyAuto')?.addEventListener('click', () => LomeliPortal.begin({carId: c.id, mode: 'autofin', months: autoMonths}));
  $('#buyCredit2')?.addEventListener('click', () => LomeliPortal.begin({carId: c.id, mode: pl.bank ? 'bancario' : 'autofin', percent: pct, months: pl.bank ? months : autoMonths}));

  /* Alertas y compartir */
  $('#priceAlert').onclick = () => { const r = L.addAlert({kind: 'precio', carId: c.id, label: title, price: c.price}); L.toast(r === 'existe' ? 'Ya tienes una alerta para este auto.' : 'Te avisaremos si baja de precio. Revisa tus alertas en Mi cuenta.') };
  $('#share').onclick = async () => { const data = {title, text: `Mira este ${title} en Automotriz Lomelí`, url: location.href}; try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(location.href); L.toast('Enlace copiado.') } } catch {} };

  /* Agenda */
  L.booking($('#bookingBox'), {carId: c.id, branch: c.sucursal || ''});
  L.syncFavs();
})();
