/* Vender mi auto: junta los datos del auto (sin precio automático), guarda una copia para el panel y abre WhatsApp con el mensaje armado. */
(() => {
  const {$, $$, esc, num, D} = L;
  const f = $('#sellForm'), err = $('.formError', f), MAKES = ['Audi', 'BMW', 'Chevrolet', 'Chrysler', 'Cupra', 'Dodge', 'Fiat', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Jeep', 'Kia', 'Mazda', 'Mercedes-Benz', 'MG', 'Mitsubishi', 'Nissan', 'Peugeot', 'RAM', 'Renault', 'SEAT', 'Suzuki', 'Toyota', 'Volkswagen', 'Volvo', 'Otra'];
  const NOW = 2026; let step = 0, photos = [];
  const para = L.find(L.params().get('para'));
  if (para) $('#paraBox').innerHTML = `<div class="demoNotice compact">Usarás tu auto como enganche para el <strong>${esc(L.fullName(para))}</strong>.</div>`;
  f.elements.marca.innerHTML = '<option value="">Elige la marca</option>' + MAKES.map(m => `<option>${m}</option>`).join('');
  f.elements.year.innerHTML = '<option value="">Elige el año</option>' + Array.from({length: 25}, (_, i) => `<option>${NOW + 1 - i}</option>`).join('');
  const s = L.session(); if (s) { f.elements.name.value = s.name || ''; f.elements.phone.value = s.phone || '' }
  $('#sellFaq').innerHTML = L.faqHTML(D.sellFaq);
  $('#branchList').innerHTML = L.branchesHTML();

  function go(n) { step = n; $$('[data-s]', f).forEach(fs => fs.hidden = +fs.dataset.s !== step); $('#sellBack').hidden = step === 0; $('#sellNext').innerHTML = step === 1 ? `${L.waIcon} Enviar por WhatsApp` : 'Continuar'; $('#sellNext').classList.toggle('waBtn', step === 1); $$('#sellSteps li').forEach((l, i) => { l.classList.toggle('active', i === step); l.classList.toggle('done', i < step) }); err.textContent = '' }
  $('#sellBack').onclick = () => go(0);

  /* Fotos opcionales: se reducen a miniaturas para que quepan en el navegador */
  function shrink(file) { return new Promise((res, rej) => { const img = new Image(), url = URL.createObjectURL(file); img.onload = () => { const k = Math.min(1, 480 / img.width), cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); res(cv.toDataURL('image/jpeg', 0.6)) }; img.onerror = () => { URL.revokeObjectURL(url); rej() }; img.src = url }) }
  function drawPhotos() { $('#sellPhotos').innerHTML = photos.map((p, i) => `<figure><img src="${esc(p)}" alt="Foto ${i + 1} de tu auto"><figcaption><button type="button" data-del="${i}">Quitar</button></figcaption></figure>`).join('') }
  f.elements.fotos.onchange = async e => {
    for (const file of [...e.target.files]) {
      if (photos.length >= 6) { err.textContent = 'Máximo 6 fotos.'; break }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { err.textContent = 'Usa fotos JPG, PNG o WebP.'; continue }
      try { photos.push(await shrink(file)) } catch { err.textContent = 'No se pudo leer una foto.' }
    }
    e.target.value = ''; drawPhotos();
  };
  $('#sellPhotos').onclick = e => { const b = e.target.closest('[data-del]'); if (b) { photos.splice(+b.dataset.del, 1); drawPhotos() } };

  f.onsubmit = e => {
    e.preventDefault(); err.textContent = '';
    const el = f.elements;
    if (step === 0) {
      if (!el.marca.value) return err.textContent = 'Elige la marca.';
      if (!el.modelo.value.trim()) return err.textContent = 'Escribe el modelo.';
      if (!el.year.value) return err.textContent = 'Elige el año.';
      if (el.km.value === '' || +el.km.value < 0) return err.textContent = 'Escribe el kilometraje.';
      if (!el.estado.value) return err.textContent = 'Elige el estado general de tu auto.';
      return go(1);
    }
    if (!el.name.value.trim()) return err.textContent = 'Escribe tu nombre.';
    if (!/^\d{10}$/.test(el.phone.value)) return err.textContent = 'El teléfono debe tener 10 dígitos.';
    if (!el.ok.checked) return err.textContent = 'Acepta el aviso de privacidad para continuar.';
    const data = {marca: el.marca.value, modelo: el.modelo.value.trim(), version: el.version.value.trim(), year: +el.year.value, km: +el.km.value, estado: el.estado.value, name: el.name.value.trim(), phone: el.phone.value, photos: [...photos], paraId: para?.id || '', paraName: para ? L.fullName(para) : '', status: 'Nueva'};
    let rec = L.add('pre', 'VTA', data);
    if (!rec && photos.length) rec = L.add('pre', 'VTA', {...data, photos: [], photosNote: `${photos.length} foto(s) no cupieron en el navegador`});
    if (!rec) return;
    const msg = `Hola, quiero vender mi auto. Folio ${rec.folio}\nAuto: ${rec.marca} ${rec.modelo}${rec.version ? ' ' + rec.version : ''} ${rec.year}\nKilometraje: ${num(rec.km)} km\nEstado general: ${rec.estado}${rec.paraName ? '\nQuiero usarlo como enganche para: ' + rec.paraName : ''}\nNombre: ${rec.name}\nTeléfono: ${rec.phone}${photos.length ? `\nTengo ${photos.length} foto(s), se las mando por aquí.` : ''}\n¿Me pueden mandar una oferta?`;
    const link = L.wa(msg);
    window.open(link, '_blank', 'noopener');
    f.hidden = true; $$('#sellSteps li').forEach((l, i) => { l.classList.toggle('active', i === 2); l.classList.toggle('done', i < 2) });
    const box = $('#sellResult'); box.hidden = false;
    box.innerHTML = `<span class="successMark">✓</span><p class="eyebrow">FOLIO ${esc(rec.folio)}</p><h2>Te mandamos la oferta por WhatsApp</h2><p>Abrimos WhatsApp con los datos de tu ${esc(rec.marca)} ${esc(rec.modelo)} ${rec.year}. Solo pulsa enviar en el chat${photos.length ? ' y adjunta tus fotos' : ''}. Un asesor de Lomelí te responde con la oferta.</p><div class="ctaStack"><a class="btn waBtn" target="_blank" rel="noopener" href="${esc(link)}">${L.waIcon} Abrir WhatsApp otra vez</a>${para ? `<a class="btn ghost" href="auto.html?id=${encodeURIComponent(para.id)}">Volver al ${esc(L.name(para))}</a>` : '<a class="btn ghost" href="inventario.html">Ver autos para cambiar</a>'}</div><p class="subtle" style="margin-top:14px">Guardamos una copia de tus datos en este navegador.</p>`;
    box.scrollIntoView({behavior: 'smooth', block: 'center'});
  };
  go(0);
})();
