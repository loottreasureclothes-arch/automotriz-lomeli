# Entrega — sitio completo Automotriz Lomelí

Fecha: 11 oct 2026. Sitio estático (HTML/CSS/JS sin frameworks ni build). Abre con doble clic en `index.html` o súbelo tal cual a GitHub Pages.

## Páginas (8)
| Página | Qué tiene |
|---|---|
| `index.html` | Hero original con buscador y chips (Sedanes, SUVs, Pick Ups, sucursales), 4 beneficios, En tendencia, carrocerías y marcas con conteos, kit de 7 beneficios con valor de ejemplo, recomendados, calculadora original, reseñas de ejemplo, redes y video, servicios, FAQ, sucursales con horario, blog (4 notas de ejemplo en ventana), formulario de cotización por WhatsApp y CTA final. |
| `inventario.html` | Filtros (carrocería, precio desde/hasta, marca con buscador, año, enganche, transmisión, combustible, garantía, sucursal), orden, chips de filtros activos, "ocultar separados", contador, paginación de 9 en 9, guardar búsqueda como alerta. Acepta `?tipo=`, `?marca=`, `?sucursal=`, `?q=` y la URL se actualiza al filtrar. En móvil los filtros abren en panel completo. |
| `auto.html?id=` | Migas, galería con contador 1/4, flechas, miniaturas y deslizar; precio y "desde $X/mes"; comprar a crédito, agendar visita, WhatsApp; guardar, alerta de precio, compartir; calculadora de enganche 20–80% y plazo 36/48/60; lo que incluye; ficha técnica; descripción; 3 pasos; agenda de visita; "usa tu auto como enganche"; reseñas; autos parecidos; anterior/siguiente; barra fija de compra en móvil. |
| `vender.html` | Preoferta en 2 pasos con resultado (rango de ejemplo), requisitos de ejemplo, por qué vender, 3 pasos, FAQ, sucursales, CTA WhatsApp. Si llega desde un auto (`?para=`), la preoferta se liga a ese auto. |
| `credito.html` | Formulario corto (nombre, correo, teléfono, auto, mayor de edad + privacidad) que crea la cuenta y abre la solicitud completa; financieras pendientes; 3 pasos; autos para financiar; reseñas; FAQ. |
| `cita.html` | Sucursal, forma de pago, auto opcional, 14 días próximos (sin domingos), horarios (los ocupados se bloquean), datos, folio `CITA-0001` y botón para mandarla por WhatsApp al 449 907 8817. |
| `cuenta.html` | Acceso con correo y código de 6 dígitos (se muestra en pantalla); Google y Facebook "Pendiente de conexión". Escritorio con solicitud de crédito (reusa `portal.js`), favoritos, citas (confirmar por WhatsApp / cancelar), alertas (precio y búsquedas con coincidencias), preofertas y perfil con "borrar mis datos". |
| `privacidad.html` | Aviso de privacidad en borrador con los datos faltantes marcados. |

Común a todas: encabezado con menú móvil y corazón de favoritos con contador, pie con 5 columnas (acceso rápido, financiamiento, carrocerías, contacto) y aviso de privacidad, banner de cookies sencillo, botón flotante de WhatsApp, panel administrativo.

**Panel administrativo** (usuario `admin lomeli`, contraseña entregada por separado): pestañas Inventario, Solicitudes, Citas, Preofertas y Prospectos de crédito. El vehículo ahora tiene folio, versión, carrocería, transmisión, combustible, cilindros, dueños, llaves, sucursal, etiquetas (recién llegado, alta demanda), separado, días de garantía, color de ilustración y hasta 8 fotos (se reducen solas para que quepan). Citas, preofertas y prospectos tienen cambio de estado, WhatsApp al cliente y eliminar.

## Qué se probó
- Las 8 páginas cargan sin errores de consola (escritorio 1280 px y móvil 375 px, sin desbordamiento horizontal).
- Abre con `file://` (sin servidor) en Chrome: encabezado, inventario y filtros funcionan.
- Recorridos completos: filtros + orden + chips + paginación + URL; galería y calculadora (la mensualidad coincide con `lomeliPayment` de `finance.js`); cita desde la ficha y desde `cita.html` con folio y enlace de WhatsApp; preoferta; prospecto de crédito → solicitud de 4 pasos → folio `SOL-0001`; acceso a cuenta con código; favoritos, alertas y citas en la cuenta; panel: editar auto con 2 fotos, cambiar estado de cita, ver preofertas, prospectos y solicitudes.
- El navegador de pruebas quedó limpio (sin datos guardados).

## Funciona solo en modo de ejemplo
- Todo se guarda en el navegador del visitante; Lomelí no recibe nada salvo lo que el cliente mande por WhatsApp.
- No hay correos reales (el código de acceso se muestra en pantalla) ni Google/Facebook.
- El acceso administrativo es de ejemplo y sus cambios solo se ven en ese navegador.
- La preoferta es una estimación ilustrativa a partir del inventario de ejemplo.
- Las fotos de 21 de los 24 autos son ilustraciones generadas con su carrocería y color ("Foto pendiente"); solo Cupra, Audi y Tacoma usan fotos de `assets/`.

## Pendiente de datos reales de Lomelí
- Inventario real (hoy está en Mercado Libre): marcas, versiones, precios, km, fotos, folios, sucursal de cada auto.
- Garantías: días y cobertura por auto; conceptos y valores del kit de 7 beneficios.
- Financieras con las que trabaja, tasa, CAT, plazos y enganche mínimo reales (hoy 15% anual ilustrativo).
- Horarios de las sucursales y dirección exacta de la Sucursal Norte.
- Requisitos para comprar autos (año mínimo, km por año, documentos) y forma de pago al vendedor.
- Reseñas reales de Google y calificación promedio.
- Aviso de privacidad: razón social, domicilio fiscal, correo ARCO, fecha.
- Notas reales para el blog (las 4 actuales son de ejemplo).
- Conexión del sistema real: ver `backend/README.md` y la ampliación de `backend/schema.sql`.

## Segunda ronda 11 oct 2026
Cambios pedidos por Aarón (audios y capturas del 11 oct) más el catálogo real de WhatsApp Business de Lomelí. Versión de archivos: `?v=9`.

### Qué se hizo
- **A. Inventario real.** `data.js` trae los 24 autos del catálogo de WhatsApp (`catalogo/CATALOGO.md`) con su foto real (`assets/catalogo/cat-00.jpg` … `cat-23.jpg`), precio real, título tal cual, marca, año y carrocería. Solo se muestra lo que existe: transmisión cuando el título dice AUTOMÁTICO/AUTOMÁTICA (Automática) o STANDARD (Estándar), kilometraje solo en el X-Trail 2025 (13,000 km) y combustible solo en Camry (Híbrido) y X3 (Híbrido enchufable). Sin folios, sin sucursal, sin garantía por auto, sin "Foto pendiente" ni ilustraciones (un auto sin foto muestra el logo de su marca). El inventario guardado en el navegador cambió de clave (`lomeli-inventory-v3`), así que nadie ve los autos de ejemplo viejos.
- **B. Condiciones reales** en hero, sección "Formas de pago" de inicio, tarjetas, ficha, crédito y calculadoras: crédito bancario desde 0% de enganche (sujeto a aprobación) hasta 60 mensualidades, y autofinanciamiento con 70% de enganche y el resto hasta 12 mensualidades (solo domicilio en Aguascalientes). Los 10 autos [solo autofin] muestran solo autofinanciamiento y no tienen botón de crédito bancario. Los 2 [remate] (Highlander 2022 y X-Trail 2025) muestran precio de lista tachado y "Precio de remate únicamente de contado"; su autofinanciamiento se calcula sobre el precio de lista. Calculadoras: enganche 0–80%, plazos 12/24/36/48/60, leyenda de tasa ilustrativa de 15%. Nuevo filtro "Forma de pago" en inventario (`?pago=bancario|autofin|remate`).
- **C. Logos de marca** dibujados como SVG sencillos (no son los logotipos oficiales): sección "Explorar por marca" con conteo y logo en cada tarjeta y en cada ficha. Las 12 marcas: Volkswagen, Suzuki, Cupra, Nissan, Toyota, RAM, Chevrolet, Kia, BMW, Mercedes-Benz, Honda, SEAT.
- **D. Vender mi auto** sin precio ni preoferta: marca, modelo, año, versión, km, estado general, nombre, teléfono y fotos opcionales (hasta 6, se guardan reducidas). Abre WhatsApp al 449 907 8817 con el mensaje armado y muestra "Te mandamos la oferta por WhatsApp". Copia local para el panel (pestaña "Venta de autos").
- **E. Cuenta.** Registro con nombre, teléfono, correo y aviso de privacidad → código por correo → código por SMS (6 dígitos). Ambos códigos se muestran en pantalla con la nota "Código simulado: pendiente de conectar el correo real / el envío de SMS". "Ya tengo cuenta" entra con código por correo. Google y Facebook siguen "Pendiente de conexión". Cambiar el teléfono en el perfil pide verificar otra vez por SMS. La solicitud de crédito exige cuenta verificada.
- **F. Solicitud de crédito** reescrita (`portal.js`) en 7 pasos numerados que se pueden tocar para editar: 1 Auto y financiamiento (auto, crédito bancario o autofinanciamiento, enganche, plazo, mensualidad estimada, monto a financiar) · 2 Datos personales (nombre y apellidos, correo, teléfono + compañía, RFC con homoclave con el inicio calculado, fecha de nacimiento, estado civil, género, domicilio completo) · 3 Datos laborales (clasificación fiscal, empresa, puesto, antigüedad, dirección y teléfono de la empresa, jefe inmediato, ingreso bruto mensual) · 4 Historial complementario (botones) · 5 Referencias laboral, de amistad y familiar · 6 Declaraciones (7 cláusulas redactadas para Lomelí + casilla + firma dibujada en pantalla) · 7 Revisa tu solicitud (bloques con "Editar", banco sugerido, homoclave si falta) → Enviar con folio `SOL-0001`. Se guarda como borrador al avanzar y se puede seguir después desde Mi cuenta. Bancos por mientras: BBVA, Banregio, Banorte, Afirme, Scotiabank, Hey Banco ("pendiente de confirmar con Lomelí"). Textos propios, nada copiado literal de TREFA.
- **G. Ficha técnica básica** sin guiones ni campos vacíos: solo marca, modelo, versión, año, carrocería y lo que exista (transmisión, km, combustible, sucursal, folio), con liga para pedir la ficha completa por WhatsApp.
- **H. Panel administrativo** (usuario `lomeli` o `admin lomeli`, contraseña entregada por separado): pestaña Solicitudes de crédito con filtro por estado, cambio de estado en la lista o dentro de la solicitud completa (recibida / en revisión / enviada al banco / aprobada / rechazada) con historial de cambios, firma, WhatsApp al cliente y descarga del resumen; pestaña Venta de autos con datos, fotos y botón de WhatsApp al cliente; el editor de autos ahora maneja título, forma de pago, precio de lista (remate), transmisión/km/sucursal opcionales. "Restaurar catálogo" regresa a los 24 autos de `data.js`.
- Textos actualizados: preguntas frecuentes (crédito, enganche, remate, venta), aviso de privacidad (nuevos datos que se piden: RFC, referencias, firma, fotos del auto).

### Qué se probó
- Las 8 páginas + panel sin errores de consola, a 375 px (sin desbordamiento horizontal) y a 1280 px; `index.html` y la ficha también abriendo con `file://` (doble clic).
- Recorridos: filtros de inventario (forma de pago, marca + transmisión, búsqueda); fichas bancario / solo autofinanciamiento / remate y sus calculadoras (mensualidad igual a `lomeliPayment`); registro → código de correo → código SMS → solicitud de 7 pasos con firma dibujada → homoclave → banco → editar desde la revisión → envío `SOL-0001`; entrar con cuenta existente y con correo sin cuenta; crédito desde `credito.html` con auto de solo autofinanciamiento; vender mi auto → mensaje de WhatsApp; panel: cambio de estado, historial, venta de autos con WhatsApp, editar un auto (km y transmisión aparecen en la ficha).
- El navegador de pruebas quedó limpio.

### Pendiente de datos reales
- Kilometraje, transmisión (cuando el título no la dice), color, versión exacta, sucursal y folio de cada auto. Se capturan desde el panel o en `data.js`. El auto 14 dice solo "VOLKSWAGEN 2018 HIGHLINE AUTOMÁTICO": se puso modelo Golf porque así se ve en la foto; confirmar.
- Más fotos por auto (hoy solo la principal del catálogo) y "el video" y "esas fotos" que mencionó Aarón y que no llegaron.
- Costo financiero del autofinanciamiento (la mensualidad que se muestra solo divide el 30% restante entre 3, 6, 9 o 12 meses, sin intereses) y si los plazos son esos.
- Que el precio de lista de los remates aplique para autofinanciamiento o auto a cuenta (viene de la nota del catálogo).
- Bancos con los que trabaja Lomelí, tasa y CAT reales (hoy 15% anual ilustrativo).
- Envío real de correos y SMS para la verificación, Google/Facebook, y un servidor para guardar cuentas y solicitudes (hoy todo vive en el navegador de cada persona; ver `backend/`).
- Logotipos oficiales de las marcas, si Lomelí quiere usarlos (hoy son emblemas simplificados hechos a mano).
- Requisitos para comprar autos (año mínimo, km), garantías, kit de beneficios, horarios, dirección de la Sucursal Norte, reseñas reales de Google, razón social y correo del aviso de privacidad.

## Tercera pasada 11 oct 2026
Con el video de Aarón (pantallas que faltaban de la solicitud, `aaron/RESUMEN.md` sección 3, partes A, B, C.1 y C.3). Todo es demo local en el navegador; textos propios para Lomelí. Versión de archivos: `?v=10`. Archivo nuevo: `perfil.js`.

### Qué se hizo
- **Completa tu perfil** (2 pasos) al entrar por primera vez a Mi cuenta, y obligatorio antes de la solicitud de crédito: (1) Contacto: qué quiere hacer (comprar / vender o cambiar), contado o crédito, si ya lo atendió un asesor, teléfono verificado (bloqueado) + compañía (Telcel, AT&T, Movistar, Bait, Otra), correo bloqueado y cómo recibe sus ingresos (opcional) · (2) Personal: nombre(s), apellidos, fecha de nacimiento (mayor de edad), género y estado civil. El avance se guarda al pasar de paso; errores por campo; "Lo completo después" lo pospone en esa sesión. Termina en "¡Listo! Tu perfil está completo" → perfilamiento bancario. Se edita desde Mi cuenta › Perfil.
- **Perfilamiento bancario**: 4 preguntas (banco de nómina, historial, atrasos en 12 meses, enganche planeado) → "Mejor opción" y "Segunda opción" con puntaje de compatibilidad, "Lo que contestaste" con "Corregir mis respuestas" y la leyenda de que no es compromiso y que los bancos están pendientes de confirmar con Lomelí. Las reglas del puntaje están escritas en el comentario de `score()` en `perfil.js`: son provisionales y hay que cambiarlas por los criterios reales. Ese banco queda preseleccionado en el paso 7.
- **Paso 1 de la solicitud**: filtro por enganche disponible (hasta $50 mil, $100 mil, $150 mil, $250 mil) en el selector de auto; enganche como Mínimo (0% en crédito bancario, 70% en autofinanciamiento), Recomendado (20%, solo crédito bancario) u Otra cantidad (con su rango); plazos 12/24/36/48/60 (autofinanciamiento: 3/6/9/12), cada uno con su "$X al mes"; resumen precio, enganche, a financiar y mensualidad estimada; leyenda "tasa ilustrativa de 15% anual; la tasa final la define el banco".
- **Paso 2**: datos del perfil en solo lectura con liga al perfil; homoclave con el inicio del RFC calculado y botón "No la tengo a la mano" (se vuelve a pedir antes de enviar); domicilio con calle y número, colonia, ciudad, estado (lista de los 32) y código postal.
- **Paso 3 Empleo**: clasificación fiscal con 4 opciones, empresa, teléfono, jefe inmediato (opcional), sitio web (opcional), dirección, sector o industria, puesto, antigüedad en lista (menos de 1 año a más de 10) e ingreso mensual bruto, con mensaje de error debajo de cada campo.
- Todos los pasos marcan ahora el error debajo de cada campo, no solo arriba.
- **Panel**: cada solicitud guarda una copia del perfil y del perfilamiento al enviarse; la solicitud completa muestra el bloque "Perfil y perfilamiento bancario" (respuestas, banco sugerido con puntaje y segunda opción) y el resumen descargable los incluye.
- Las solicitudes viejas de prueba no se mezclan: clave nueva `lomeli-credito-v3`.

### Qué se probó (375 px, sin errores de consola)
Registro → verificación → Completa tu perfil (errores, menor de edad) → perfilamiento → resultado → paso 1 (recomendado, otra cantidad fuera de rango, plazo 48 con mensualidad igual a `lomeliPayment`) → paso 2 (errores, "No la tengo a la mano", 32 estados) → paso 3 (los 8 errores de campo) → pasos 4–6 con firma → revisión con banco del perfilamiento → la homoclave se pide otra vez → envío `SOL-0001` → panel muestra perfil y perfilamiento. También autofinanciamiento (Kia Soul: Mínimo 70%, plazos 3–12) y el filtro por enganche. Las 8 páginas cargan sin errores ni desborde horizontal; el navegador quedó limpio.

### Pendiente
- Criterios reales de cada banco para el perfilamiento y la lista definitiva de bancos.
- Rango real de tasa (TREFA muestra uno variable); aquí sigue la tasa ilustrativa de 15%.
- Lo demás de la segunda ronda sigue igual (datos por auto, costo del autofinanciamiento, correo/SMS reales, servidor).

## Publicación 12 oct 2026
- **Estado:** listo para publicar, **todavía no está en línea**. Crear el repositorio público necesita la autorización directa de Emanuel (se bloqueó al intentarlo desde una sesión secundaria).
- **Dirección prevista:** https://loottreasureclothes-arch.github.io/automotriz-lomeli/
- **Repositorio previsto:** loottreasureclothes-arch/automotriz-lomeli (público, rama `main`, GitHub Pages desde la raíz). No se suben `aaron/`, `audios/`, `catalogo/raw/`, `catalogo/fotos/`, `BRIEF-TREFA.md` ni `.claude/` (ver `.gitignore`).
- Versión de archivos: `?v=14`.

### Qué cambió
- **Logos oficiales de marca.** Los emblemas dibujados a mano se cambiaron por los logotipos vectoriales oficiales en `assets/marcas/` (Volkswagen, Suzuki, Nissan, Toyota, Chevrolet, Kia, BMW, Mercedes-Benz, Honda, SEAT y RAM de Simple Icons; Cupra de Wikimedia Commons, porque Simple Icons no lo tiene). Son monocromos: en negro sobre fondo claro (tarjetas de autos, ficha) y en blanco sobre fondo oscuro. "Explorar por marca" ahora son tarjetas oscuras con el logo grande, el nombre y el número de autos (3 columnas en celular, 6 en escritorio). `brandLogo` en `common.js` usa `<img>`; una marca nueva sin archivo se muestra como monograma, y un auto sin foto muestra el logo de su marca.
- **Fotos de sección** (`assets/secciones/`, generadas con Higgsfield): "Por carrocería" en inicio son tarjetas con la foto de fondo y el nombre encima; `inventario.html?tipo=…` usa la foto de esa carrocería en el encabezado; vender, crédito y cita tienen la foto de portada con capa oscura (más fuerte en celular) para que se lea el texto. Las fotos de SUV y pick up muestran el emblema de Honda y de Toyota en la parrilla.
- **Revisión contra lo que pidió Aarón** (`aaron/VERIFICACION.md`, punto por punto). Se completó: casilla opcional de encuestas en Declaraciones (sin premio) y aviso de que llenar la solicitud no consulta el buró; ambos aparecen en la revisión, en el panel y en el resumen descargable. Redacción de la ficha técnica ("transmisión, color y sucursal").
- Lo demás de las rondas anteriores se probó de nuevo a 375 px: registro con código por correo y por SMS, completar perfil, perfilamiento bancario, solicitud de 7 pasos con firma, envío y revisión en el panel; vender mi auto sin precio y por WhatsApp.

### Sigue pendiente
- Las fotos que mencionó Aarón ("esas fotos") y los datos por auto (km, transmisión, color, sucursal, folio).
- Bancos definitivos, criterios del perfilamiento, tasa y CAT; costo del autofinanciamiento; opciones reales de relación y parentesco en referencias.
- Envío real de correos y SMS, servidor para cuentas y solicitudes, acceso administrativo real (hoy todo vive en el navegador de cada visitante y el panel solo guarda la huella de la contraseña, no la contraseña).
