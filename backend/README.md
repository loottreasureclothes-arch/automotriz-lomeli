# Automotriz Lomelí — lo que falta para el sistema real

El sitio publicado es estático. No recibe información en un servidor, no autentica clientes y no envía correos. Todo lo que capturan los visitantes (favoritos, alertas, citas, preofertas, prospectos y solicitudes de crédito) se guarda solo en su navegador con `localStorage`. Los archivos de la solicitud nunca se leen ni se suben; solo se conserva el nombre. El cotizador usa una tasa ilustrativa del 15% anual sin seguros ni comisiones.

## Qué está implementado (en el navegador)
| Función | Archivo | Clave local |
|---|---|---|
| Inventario de ejemplo (24 autos) y edición desde el panel con fotos | `data.js`, `admin.js` | `lomeli-inventory-v2` |
| Favoritos | `common.js` | `lomeli-favorites-v1` |
| Sesión de cliente (código mostrado en pantalla) | `cuenta.js` | `lomeli-account-v1` |
| Citas con folio `CITA-0001` | `common.js` (agenda) | `lomeli-citas-v1` |
| Preofertas de venta `VTA-0001` | `vender.js` | `lomeli-preofertas-v1` |
| Prospectos de crédito `CRE-0001` | `credito.js` | `lomeli-leads-v1` |
| Alertas de precio y búsquedas guardadas | `common.js`, `cuenta.js` | `lomeli-alerts-v1` |
| Solicitud de crédito en 4 pasos `SOL-0001` | `portal.js` | `lomeli-credit-demo-v1` |
| Preferencia de cookies | `common.js` | `lomeli-cookies-v1` |
| Acceso administrativo (usuario visible en LEEME) | `admin.js` | `sessionStorage` |

## Para habilitar el sistema real
1. Crear cuentas de infraestructura a nombre de Lomelí: dominio, correo remitente y proyecto de Supabase (u otro backend).
2. **Inventario:** crear las tablas `vehicles` y `vehicle_photos` (ver `schema.sql`), un bucket público de fotos y que `data.js` se sustituya por una lectura de la API. El panel debe escribir en el servidor, no en el navegador. Opcional: importar desde Mercado Libre.
3. **Autenticación:** Supabase Auth con código por correo (OTP), Google OAuth y Facebook Login, con direcciones de retorno del dominio final. Hoy esos botones dicen "Pendiente de conexión".
4. **Citas, preofertas y prospectos:** tablas `appointments`, `trade_in_offers` y `credit_leads`; insertar desde un endpoint del servidor con validación y límite de envíos (anti-spam / captcha). Avisar al equipo por correo o WhatsApp Business API.
5. **Favoritos y alertas:** tablas `favorites` y `alerts` ligadas al usuario; tarea programada que compare precios y nuevos ingresos y envíe el aviso.
6. **Solicitud de crédito:** revisar y adaptar `credit_applications` y `application_documents`; almacenamiento privado con URLs firmadas temporales, límites de tamaño/tipo, antivirus y política de conservación.
7. **Preoferta:** reemplazar la estimación ilustrativa de `vender.js` por la tabla o servicio de valuación que use Lomelí.
8. **Datos de negocio pendientes:** financieras con las que trabaja, tasa/CAT reales, garantías y su cobertura, valores del kit, horarios, dirección de la Sucursal Norte, requisitos para comprar autos, reseñas reales de Google, aviso de privacidad (razón social, domicilio, correo ARCO).
9. **Seguridad del panel:** sustituir TODA la autenticación administrativa de ejemplo; roles por usuario; nunca usar las credenciales visibles en producción ni exponer `service_role` o secretos OAuth en JS estático.
10. Pruebas de extremo a extremo: accesos, archivos, recuperación de cuentas, envíos, respaldos y vista móvil.

La aprobación bancaria, firma electrónica, WhatsApp Business API e IA requieren integración y configuración independientes. No están activadas.
