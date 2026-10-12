/* Datos del sitio. Inventario tomado del catálogo de WhatsApp Business de Automotriz Lomelí (11 oct 2026).
   Solo se capturó lo que trae el catálogo: título, precio, foto, marca, año y carrocería. Kilometraje, transmisión,
   color, sucursal y demás datos se agregan desde el panel cuando Lomelí los confirme. */
window.LOMELI_DATA = (() => {
  /* fin: 'bancario' = crédito bancario + autofinanciamiento · 'autofin' = solo autofinanciamiento · 'remate' = precio de remate de contado */
  const v = (n, title, marca, modelo, version, year, price, tipo, fin, extra = {}) => ({
    id: (marca + '-' + modelo + '-' + year + '-' + String(n).padStart(2, '0')).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-'),
    title, marca, modelo, version, year, price, tipo, fin,
    listPrice: extra.listPrice || 0, trans: extra.trans || '', km: extra.km ?? null, fuel: extra.fuel || '', sucursal: '', folio: '',
    tags: [], separado: false, state: 'Disponible', photos: ['assets/catalogo/cat-' + String(n).padStart(2, '0') + '.jpg'], description: '', order: n
  });
  const A = {trans: 'Automática'}, S = {trans: 'Estándar'};
  const vehicles = [
    v(0, 'VOLKSWAGEN JETTA 2023 COMFORTLINE AUTOMÁTICO', 'Volkswagen', 'Jetta', 'Comfortline', 2023, 339000, 'Sedán', 'bancario', A),
    v(1, 'SUZUKI IGNIS 2022 GLX AUTOMÁTICO', 'Suzuki', 'Ignis', 'GLX', 2022, 225000, 'Hatchback', 'bancario', A),
    v(2, 'CUPRA FORMENTOR 2023 VZ PINTURA MATE 310 HP', 'Cupra', 'Formentor', 'VZ', 2023, 595000, 'SUV', 'bancario'),
    v(3, 'NISSAN KICKS 2023 PLATINUM BI-TONO', 'Nissan', 'Kicks', 'Platinum Bi-Tono', 2023, 339000, 'SUV', 'bancario'),
    v(4, 'TOYOTA HIGHLANDER 2022 XLE', 'Toyota', 'Highlander', 'XLE', 2022, 549000, 'SUV', 'remate', {listPrice: 589000}),
    v(5, 'TOYOTA HILUX 2021 SR DOBLE CAB. STANDARD', 'Toyota', 'Hilux', 'SR Doble Cabina', 2021, 409000, 'Pick Up', 'bancario', S),
    v(6, 'RAM 700 2024 SLT STANDARD', 'RAM', '700', 'SLT', 2024, 279000, 'Pick Up', 'bancario', S),
    v(7, 'CHEVROLET TORNADO 2019 STANDARD', 'Chevrolet', 'Tornado', '', 2019, 195000, 'Pick Up', 'autofin', S),
    v(8, 'VOLKSWAGEN TIGUAN 2020 COMFORTLINE PLUS', 'Volkswagen', 'Tiguan', 'Comfortline Plus', 2020, 355000, 'SUV', 'bancario'),
    v(9, 'KIA SOUL 2019 SX TURBO', 'Kia', 'Soul', 'SX Turbo', 2019, 255000, 'Hatchback', 'autofin'),
    v(10, 'CHEVROLET BEAT 2018 HATCHBACK STANDARD', 'Chevrolet', 'Beat', 'Hatchback', 2018, 149000, 'Hatchback', 'autofin', S),
    v(11, 'VOLKSWAGEN POLO 2021 STANDARD', 'Volkswagen', 'Polo', '', 2021, 215000, 'Hatchback', 'bancario', S),
    v(12, 'VOLKSWAGEN JETTA 2019 HIGHLINE', 'Volkswagen', 'Jetta', 'Highline', 2019, 289000, 'Sedán', 'autofin'),
    v(13, 'BMW X3 2024 xDrive30e HIBRIDA ENCHUFABLE', 'BMW', 'X3', 'xDrive30e', 2024, 829000, 'SUV', 'bancario', {fuel: 'Híbrido enchufable'}),
    v(14, 'VOLKSWAGEN 2018 HIGHLINE AUTOMÁTICO', 'Volkswagen', 'Golf', 'Highline', 2018, 289000, 'Hatchback', 'autofin', A),
    v(15, 'MERCEDES-BENZ A200 2016 CGI SPORT AUTOMÁTICO', 'Mercedes-Benz', 'A200', 'CGI Sport', 2016, 199000, 'Sedán', 'autofin', A),
    v(16, 'CUPRA FORMENTOR 2023 VZ', 'Cupra', 'Formentor', 'VZ', 2023, 595000, 'SUV', 'bancario'),
    v(17, 'SUZUKI SWIFT 2023 GLX STANDARD', 'Suzuki', 'Swift', 'GLX', 2023, 255000, 'Hatchback', 'bancario', S),
    v(18, 'HONDA HR-V 2018 AUTOMÁTICA', 'Honda', 'HR-V', '', 2018, 249000, 'SUV', 'autofin', A),
    v(19, 'SEAT IBIZA 2016 COUPE STANDARD', 'SEAT', 'Ibiza', 'Coupé', 2016, 175000, 'Hatchback', 'autofin', S),
    v(20, 'NISSAN X-TRAIL 2025 EPOWER EXCLUSIVE 13MIL KM', 'Nissan', 'X-Trail', 'e-Power Exclusive', 2025, 559000, 'SUV', 'remate', {listPrice: 589000, km: 13000}),
    v(21, 'BMW X5 2016 XDRIVE35I M SPORT', 'BMW', 'X5', 'xDrive35i M Sport', 2016, 339000, 'SUV', 'autofin'),
    v(22, 'NISSAN X-TRAIL 2019 ADVANCE', 'Nissan', 'X-Trail', 'Advance', 2019, 265000, 'SUV', 'autofin'),
    v(23, 'TOYOTA CAMRY 2025 XSE HIBRIDO', 'Toyota', 'Camry', 'XSE', 2025, 595000, 'Sedán', 'bancario', {fuel: 'Híbrido'})
  ];

  /* Condiciones de pago tal como vienen en el catálogo de WhatsApp de Lomelí */
  const terms = {
    bank: 'Desde 0% de enganche en crédito bancario (sujeto a aprobación) hasta 60 mensualidades. Nosotros tramitamos tu crédito.',
    autofin: 'Autofinanciamiento con el 70% de enganche y el resto hasta en 12 mensualidades (solo para personas con domicilio en Aguascalientes).',
    remate: 'Precio de remate únicamente de contado.'
  };
  /* Bancos "por mientras" (los que muestra TREFA). Pendiente de confirmar con Lomelí. */
  const banks = ['BBVA', 'Banregio', 'Banorte', 'Afirme', 'Scotiabank', 'Hey Banco'];

  const branches = [
    {id: 'Sur', name: 'Sucursal Sur', address: 'Av. Aguascalientes Sur, esquina 30 de Septiembre, Fracc. Casa Blanca, Aguascalientes.', confirmed: true,
      hours: 'Lunes a viernes 9:00 a 19:00 · Sábado 9:00 a 14:00', img: 'assets/sur.webp',
      map: 'https://www.google.com/maps/search/?api=1&query=Automotriz+Lomeli+30+de+Septiembre+Aguascalientes'},
    {id: 'Norte', name: 'Sucursal Norte', address: 'Aguascalientes, zona norte. Dirección exacta pendiente de confirmar.', confirmed: false,
      hours: 'Lunes a viernes 9:00 a 19:00 · Sábado 9:00 a 14:00', img: 'assets/norte.webp', map: ''}
  ];

  const kit = [
    ['Garantía mecánica', 'Cobertura de motor y transmisión por el plazo indicado en cada auto.', 15000],
    ['Revisión mecánica integral', 'Inspección de frenos, suspensión, motor y sistema eléctrico antes de la entrega.', 3500],
    ['Historial verificado', 'Consulta de no reporte de robo y revisión de documentos.', 600],
    ['Trámite de cambio de propietario', 'Te acompañamos con los papeles para que el auto quede a tu nombre.', 2500],
    ['Primer servicio de mantenimiento', 'Cambio de aceite y filtros después de tu compra.', 3800],
    ['Detallado de entrega', 'Lavado completo de interiores y exteriores.', 1200],
    ['Asesoría de financiamiento', 'Te ayudamos a comparar opciones de crédito y armar tu expediente.', 2000]
  ];

  const reviews = [
    ['Mariana G.', 5, 'Me explicaron todo con calma y el auto estaba tal como en las fotos. El trámite fue rápido.'],
    ['Luis R.', 5, 'Dejé mi carro a cuenta y salí con una camioneta el mismo fin de semana. Muy buena atención.'],
    ['Fernanda T.', 4, 'Buena variedad de autos. Me ayudaron a encontrar una mensualidad que sí me alcanzaba.'],
    ['Carlos M.', 5, 'Agendé la visita por WhatsApp y ya tenían el auto listo para manejarlo.'],
    ['Daniela S.', 5, 'Vendí mi auto sin complicaciones. Me dieron una oferta clara y me pagaron como acordamos.'],
    ['Jorge A.', 4, 'Trato honesto y sin presión. Recomiendo preguntar por la revisión mecánica, la hacen completa.']
  ];

  const faq = [
    ['¿Los autos tienen garantía?', 'Pregunta por la garantía del auto que te interesa con un asesor por WhatsApp. Plazos y coberturas pendientes de confirmar con Lomelí.'],
    ['¿Puedo comprar a crédito?', 'Sí. Con crédito bancario desde 0% de enganche (sujeto a aprobación) y hasta 60 mensualidades; nosotros tramitamos tu crédito. Haz tu solicitud completa en línea desde tu cuenta. La tasa que usa el simulador es ilustrativa.'],
    ['¿Cuánto necesito de enganche?', 'En crédito bancario, desde 0% (sujeto a aprobación del banco). En autofinanciamiento, 70% de enganche y el resto hasta en 12 mensualidades, solo para personas con domicilio en Aguascalientes.'],
    ['¿Reciben mi auto a cuenta?', 'Sí. Mándanos los datos de tu auto desde Vender mi auto y te hacemos la oferta por WhatsApp.'],
    ['¿Puedo apartar un auto?', 'Pregunta a un asesor por WhatsApp. Los autos marcados como "Separado" ya están apartados por otro cliente.'],
    ['¿Qué documentos necesito para comprar?', 'Identificación oficial vigente y comprobante de domicilio. Para crédito se piden además comprobantes de ingresos.'],
    ['¿Qué significa "precio de remate"?', 'Es un precio especial que aplica únicamente pagando de contado. Si lo quieres con autofinanciamiento o dando tu auto a cuenta, aplica el precio de lista.'],
    ['¿Puedo manejar el auto antes de comprarlo?', 'Sí, agenda tu visita en la sucursal donde está el auto y lo tendremos listo para ti.']
  ];

  const sellFaq = [
    ['¿Cómo me dan la oferta?', 'Llenas el formulario con los datos de tu auto y se abre WhatsApp con el mensaje listo. Un asesor de Lomelí revisa la información y te manda la oferta por ese mismo chat.'],
    ['¿El sitio calcula un precio automático?', 'No. Preferimos que una persona revise tu auto y te dé una oferta real por WhatsApp.'],
    ['¿Cómo me pagan?', 'La forma y el plazo de pago se acuerdan contigo al aceptar la oferta.'],
    ['¿Puedo usar mi auto como enganche?', 'Sí. El valor acordado se puede aplicar al enganche de un auto de nuestro inventario.']
  ];

  const creditFaq = [
    ['¿Qué opciones de financiamiento hay?', 'Crédito bancario desde 0% de enganche (sujeto a aprobación) y hasta 60 mensualidades, que nosotros tramitamos; y autofinanciamiento Lomelí con 70% de enganche y el resto hasta en 12 mensualidades, solo para personas con domicilio en Aguascalientes. Algunos autos solo tienen autofinanciamiento.'],
    ['¿Tengo que ir a la agencia?', 'No para empezar. Llenas tu solicitud completa en línea desde tu cuenta, la firmas en pantalla y la revisamos. Solo vienes a la sucursal para ver el auto y firmar la entrega.'],
    ['¿Qué documentos necesito?', 'Identificación oficial, comprobante de domicilio y comprobantes de ingresos. Un asesor te dice cuáles pide el banco.'],
    ['¿La mensualidad del sitio es la definitiva?', 'No. Es una simulación con tasa ilustrativa del 15% anual, sin seguros ni comisiones. La tasa real la da el banco al aprobar tu crédito.']
  ];

  const blog = [
    {id: 'revisar-seminuevo', title: 'Cinco cosas que revisar antes de comprar un seminuevo', tag: 'Compra', minutes: 4,
      body: ['Empieza por los papeles: que la factura coincida con el número de serie del auto y que no tenga reporte de robo. Con eso descartas la mayoría de los problemas.', 'Después revisa llantas, frenos y el desgaste del volante y los pedales; dicen mucho de cómo se usó el auto. Pide ver el historial de servicios si existe.', 'Por último, maneja: en ciudad y, si puedes, en una vía rápida. Escucha ruidos al frenar y al pasar topes, y fíjate que la transmisión cambie sin jalones.']},
    {id: 'contado-o-credito', title: '¿Contado o crédito? Lo que conviene saber', tag: 'Financiamiento', minutes: 3,
      body: ['Pagar de contado te ahorra intereses, pero deja tu dinero inmovilizado. Un crédito te permite conservar liquidez a cambio de un costo.', 'Compara siempre el costo total, no solo la mensualidad. Un plazo más largo baja el pago mensual pero aumenta lo que pagas al final.', 'Un enganche mayor reduce el monto financiado y suele mejorar las condiciones. Simula varias combinaciones antes de decidir.']},
    {id: 'documentos-vender', title: 'Documentos para vender tu auto en Aguascalientes', tag: 'Venta', minutes: 3,
      body: ['Ten a la mano la factura original (o la cadena de facturas), tu identificación oficial y las tarjetas de circulación.', 'Revisa que no tenga adeudos de tenencia o refrendo. Los comprobantes de pago agilizan mucho el trámite.', 'Si el auto tiene crédito vigente, pide a tu financiera la carta de adeudo para saber cuánto falta por liquidar.']},
    {id: 'cuanto-enganche', title: 'Cuánto enganche dar: guía rápida', tag: 'Financiamiento', minutes: 2,
      body: ['En Lomelí el crédito bancario arranca desde 0% de enganche, sujeto a aprobación del banco. Aun así, dar algo de enganche baja tu mensualidad.', 'Una regla práctica: que la mensualidad no pase de una tercera parte de tus ingresos libres. Usa la calculadora de cada auto para encontrar tu número.', 'Si tienes un auto, puedes usarlo como parte del enganche y reducir el dinero que necesitas en efectivo.']}
  ];

  return {vehicles, terms, banks, branches, kit, reviews, faq, sellFaq, creditFaq, blog,
    whatsapp: '524499078817', phone: '449 907 8817', types: ['SUV', 'Sedán', 'Pick Up', 'Hatchback']};
})();
