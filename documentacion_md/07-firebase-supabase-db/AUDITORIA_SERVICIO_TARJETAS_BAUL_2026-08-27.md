# Auditoría del servicio de tarjetas Baúl

**Proyecto:** Chactivo  
**Fecha:** 27 de agosto de 2026  
**Alcance:** servicio de tarjetas tipo descubrimiento de perfiles, similar en intención a Tinder/Grindr.  
**Estado:** diagnóstico y correcciones locales; sin cambios en Firebase, Cloudinary, Supabase, producción ni GitHub remoto.

## Veredicto directo

El servicio de tarjetas **no está actualmente operativo**. No era un problema aislado de una foto o de un botón: Baúl está desactivado por diseño en el código.

La causa principal está confirmada en `src/config/featureFlags.js`:

```js
export const ENABLE_BAUL = false;
```

La ruta `/baul` también estaba condicionada por esa bandera. Cuando era falsa, la aplicación redirigía silenciosamente a `/chat/principal`. Además, `tarjetaService.js` devolvía `[]` inmediatamente para las consultas públicas y sus acciones sociales llamaban a una callable que ya no está exportada en `functions/index.js`.

Por tanto, **encender solamente `ENABLE_BAUL` no sería una solución**. Dejaría visibles controles de likes, huellas, mensajes y matches que intentarían invocar `recordTarjetaInteraction`, pero esa función no existe en el código actual de Functions. Eso produciría errores de función inexistente o controles aparentemente activos que no completarían la acción.

## Qué producto existe realmente

El código no implementa un sistema Tinder de swipe izquierda/derecha. Implementa un **grid de tarjetas Baúl** con estas acciones:

| Concepto | Implementación encontrada |
|---|---|
| Fuente de tarjetas | Colección Firebase Firestore `tarjetas/{uid}`. |
| Presentación | Grid responsive de 2 a 5 columnas mediante `TarjetaUsuario`. |
| Foto principal | `fotoUrl`, `fotoUrlFull`, `fotoUrlThumb` y campos legacy. |
| Segunda foto | `fotoUrl2`, visible para usuarios PRO. |
| Estado | `estaOnline`, `ultimaConexion`, estados `online`, `reciente` y `offline`. |
| Interés | Botón `Me interesa`, no gesto swipe. |
| Visita ligera | Botón `Pasé por aquí`, con límite diario. |
| Mensaje | Modal de tarjeta y eventual apertura de chat privado. |
| Match | Colección `matches`, pero la acción principal dependía de la callable retirada. |
| Proximidad | Fórmula Haversine existente en el servicio, pero Baúl pasa `const ubicacion = null`; no se usa GPS exacto en la pantalla actual. |
| Historial | El servicio obtiene una cantidad limitada de candidatos; no existe una navegación histórica paginada del grid. |
| Backend alternativo | No usa Supabase para tarjetas. |

La conclusión es que actualmente existe una **base de perfil social con grid**, no un producto Tinder completo. Si el objetivo es un swipe real, todavía habría que diseñar e implementar esa interacción y su backend; no se debe llamarla “swipe funcional” porque no existe en el código auditado.

## Causas verificadas

### 1. La bandera global apaga el servicio

`App.jsx` tenía la ruta `/baul` protegida por `ENABLE_BAUL` y redirigía al chat cuando la bandera era falsa. `ChatBottomNav`, `Header`, partes del sidebar, lobby y nudges también ocultan el acceso cuando la bandera está desactivada.

`tarjetaService.js` repite la protección en sus consultas:

```js
if (!isBaulRuntimeEnabled()) return [];
```

Esto aparece en `obtenerTarjetasCercanas` y `obtenerTarjetasRecientes`, y también en actividad, métricas y suscripción de la tarjeta propia.

### 2. La callable social fue retirada

Las funciones `darLike`, `quitarLike`, `enviarMensajeTarjeta`, `registrarVisita`, `registrarImpresion` y `dejarHuella` llaman internamente a:

```js
httpsCallable(functions, 'recordTarjetaInteraction')
```

Sin embargo, `functions/index.js` solo contiene el comentario de que `recordTarjetaInteraction` fue retirada de producción mientras Baúl siguiera apagado. Una búsqueda del símbolo en el historial local tampoco encontró una implementación completa anterior recuperable con seguridad.

No se debe reconstruir esa callable de memoria ni encender el frontend antes de definir reglas, límites, bloqueo entre usuarios, consistencia de likes/matches, idempotencia y pruebas del backend.

### 3. Se generaban tarjetas aunque el servicio estuviera apagado

`AuthContext.jsx` creaba o actualizaba tarjetas para usuarios registrados después de autenticarse, incluso con Baúl desactivado. Esto podía generar documentos y escrituras que el usuario no podía ver ni usar.

Se añadió una guarda `if (!ENABLE_BAUL) return;` para evitar esas escrituras mientras el servicio esté pausado. Los documentos existentes no se borran ni se modifican masivamente.

### 4. La tarjeta visual no protegía la foto rota

`TarjetaUsuario.jsx` usaba la URL de la foto directamente en un `<img>` sin `onError`. Una URL de Cloudinary antigua, eliminada o denegada podía mostrar el icono de recurso quebrado.

Se conectó la tarjeta con el helper común `getSafeAvatarSrc` y `handleAvatarImageError`. Ahora una URL inválida o que falla usa un avatar local neutral.

### 5. La ubicación no es un servicio de proximidad operativo

Aunque `tarjetaService.js` contiene cálculo de distancia, `BaulSection.jsx` establece:

```js
const ubicacion = null;
```

La consulta actual usa tarjetas recientes, no una búsqueda geográfica. Esto es coherente con la decisión previa de no pedir ni guardar GPS exacto, pero significa que no se debe anunciar “personas más cercanas por GPS” como función activa.

## Fotos de las tarjetas

El editor de tarjeta (`TarjetaEditor.jsx`) no sube actualmente las imágenes a Firebase Storage. Usa Cloudinary unsigned con el preset `tarjetas_baul` y carpetas `tarjetas/{uid}` y `tarjetas/{uid}/foto2`; posteriormente guarda la URL en Firestore mediante `actualizarTarjeta`.

Las reglas locales de Storage contienen una ruta `tarjeta_photos/{userId}`, con lectura pública y escritura autenticada de hasta 150 KB, pero esa ruta **no es la que utiliza TarjetaEditor**. Por eso esas reglas no prueban ni habilitan la subida actual de Baúl.

| Elemento | Realidad actual |
|---|---|
| Bytes de foto de tarjeta | Cloudinary unsigned desde el navegador. |
| Metadatos y URL | Firestore, documento `tarjetas/{uid}`. |
| Reglas Firebase Storage `tarjeta_photos` | Existen localmente, pero no son usadas por el editor actual. |
| Validación del editor | Acepta tipos `image/*` y entrada de hasta 10 MB; el compresor produce WebP o JPEG según soporte del navegador. |
| Verificación Cloudinary | El editor histórico no validaba de forma uniforme que `secure_url` existiera y fuera HTTPS. |
| Prueba real | No ejecutada; no se usó una cuenta ni se mutó producción. |

El servicio de foto de perfil auditado anteriormente tampoco sustituye al de Baúl: el perfil usa otro flujo Cloudinary y guarda en `users/{uid}.avatar`. No hay una tabla SQL que active cualquiera de los dos.

## Estado informativo corregido localmente

En vez de redirigir silenciosamente al chat, `/baul` ahora monta una pantalla explícita:

> **Servicio pausado — Baúl de Perfiles.** Las tarjetas, likes y matches están temporalmente desactivados mientras se completa su backend seguro. No es un problema de tu cuenta ni de tu foto.

La pantalla ofrece botones funcionales hacia **Ir al chat** e **Ir a OPIN**, no muestra tarjetas ficticias y no presenta likes o matches como si estuvieran funcionando.

La pantalla se comprobó en un build local con variables Firebase ficticias. La navegación de `/baul` mostró correctamente el estado pausado. Sin esas variables, la aplicación mostró el fallback general “La parte interactiva no pudo iniciar en este entorno”; eso confirma que la configuración Firebase es un requisito de montaje de la SPA, no que Baúl esté operativo.

## Matriz de controles

| Control o módulo | Estado actual | Razón | Dependencia para activarlo |
|---|---|---|---|
| Entrar a `/baul` | Informativo local | `ENABLE_BAUL=false`. | Definir backend y aprobar activación. |
| Grid de tarjetas | No carga perfiles | Consultas devuelven `[]` con la bandera apagada. | Activar consultas tras validar reglas y datos. |
| Crear tarjeta automática | Pausado desde AuthContext | Se evitaban escrituras inútiles mientras Baúl no era visible. | Reactivar junto con el servicio. |
| Editar tarjeta | Código existente, no accesible desde la ruta pausada | `TarjetaEditor` usa Firestore/Cloudinary, pero no se llega desde Baúl operativo. | Probar Cloudinary y reglas Firestore. |
| Subir primera foto de tarjeta | No comprobado realmente | Cloudinary directo; sin prueba autenticada. | Probar preset, URL y persistencia. |
| Subir segunda foto PRO | No comprobado realmente | Mismo Cloudinary; depende de flags PRO y Firestore. | Probar permisos, límite y cleanup. |
| Me interesa | Inerte con bandera apagada | Callable `recordTarjetaInteraction` retirada. | Implementar/desplegar callable o adapter seguro. |
| Pasé por aquí | Inerte con bandera apagada | Misma callable; el cliente no puede escribir subcolección de actividad. | Backend seguro e idempotente. |
| Enviar nota desde tarjeta | Inerte con bandera apagada | Misma callable. | Backend seguro, anti-spam y reglas. |
| Matches | Lectura/esquema parcial existente | La creación dependía de interacción social retirada. | Diseñar creación atómica y lectura autorizada. |
| Actividad y métricas | No visibles desde Baúl pausado | Lecturas protegidas y feature gateadas. | Reactivar con datos reales y reglas. |
| Distancia GPS | No activa | La pantalla envía `null` como ubicación. | Ubicación gruesa opcional, no GPS exacto por defecto. |
| Avatares en tarjeta | Fallback local añadido | Antes `<img>` no manejaba URL rota. | Frontend listo; revisar datos antiguos. |

## Pruebas realizadas

Se ejecutó `npm test` incluyendo el nuevo contrato estático de Baúl:

```text
4 test files passed
23 tests passed
```

También se ejecutó `git diff --check` sin errores y una compilación directa de Vite:

```text
✓ built in 50.02s
```

La prueba visual anónima de la build con Firebase ficticio comprobó que `/baul` muestra el aviso de servicio pausado, sin actividad inventada, y que sus botones llevan a rutas reales. No se creó ninguna cuenta, no se inspeccionaron perfiles personales y no se escribieron documentos reales.

## Qué falta para que sea realmente funcional

Para reactivar Baúl de forma responsable se necesita primero decidir si el producto será un grid de tarjetas mejorado o un sistema de swipe real. Después hay que implementar una única ruta backend para likes, huellas, visitas, notas y matches, con autenticación, validación de propietario, bloqueo mutuo, límites anti-spam, operaciones idempotentes y respuestas de error claras.

También debe comprobarse qué versión de Functions está desplegada realmente. El código local no prueba el entorno Firebase Live. Antes de activar la bandera se necesita probar en Emulator Suite y luego desplegar explícitamente Functions, Firestore Rules e índices cuando corresponda. No se debe encender `ENABLE_BAUL` en Vercel o Firebase antes de ese paso.

Para fotos de tarjeta se debe elegir una sola estrategia documentada: mantener Cloudinary y asegurar el preset, las restricciones y la validación de URL, o migrar el flujo a Firebase Storage/Supabase Storage. Si se migra a Supabase, se necesitan bucket, políticas de Storage/RLS, adapter de subida, metadatos y cleanup. **Las tablas SQL por sí solas no habilitan archivos.**

## Límites de esta auditoría

No se ejecutó SQL. No se modificaron documentos existentes. No se creó una cuenta. No se probaron likes, matches ni uploads con credenciales reales. No se desplegaron reglas, Functions, Vercel o Firebase Hosting. No se hizo push ni merge.

La rama local contiene correcciones no publicadas y la revisión debe considerar dos niveles diferentes: el código local está preparado para mostrar con honestidad que Baúl está pausado; el servicio social de tarjetas sigue pendiente de backend y prueba autenticada.

## Referencias internas

1. [`featureFlags.js`](../../src/config/featureFlags.js)
2. [`App.jsx`](../../src/App.jsx)
3. [`BaulPage.jsx`](../../src/pages/BaulPage.jsx)
4. [`BaulSection.jsx`](../../src/components/baul/BaulSection.jsx)
5. [`TarjetaUsuario.jsx`](../../src/components/baul/TarjetaUsuario.jsx)
6. [`TarjetaEditor.jsx`](../../src/components/baul/TarjetaEditor.jsx)
7. [`tarjetaService.js`](../../src/services/tarjetaService.js)
8. [`AuthContext.jsx`](../../src/contexts/AuthContext.jsx)
9. [`functions/index.js`](../../functions/index.js)
10. [`firestore.rules`](../../firestore.rules)
11. [`storage.rules`](../../storage.rules)
12. [`cards-service-contract.test.js`](../../tests/cards-service-contract.test.js)
