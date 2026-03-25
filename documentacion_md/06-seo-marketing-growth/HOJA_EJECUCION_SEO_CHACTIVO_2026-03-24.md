# Hoja De Ejecucion SEO Chactivo (24-03-2026)

## Objetivo
Convertir el plan SEO estratégico en una hoja de trabajo ejecutable, con foco en:

- URLs concretas
- prioridad real
- riesgo SEO
- acción exacta
- criterio de decisión

Este documento no reemplaza al plan estratégico.
Lo aterriza.

Documento base:
- [PLAN_SEO_REALISTA_CHACTIVO_2026-03-24.md](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\documentacion_md\06-seo-marketing-growth\PLAN_SEO_REALISTA_CHACTIVO_2026-03-24.md)

---

## Regla madre
Primero consolidar y exprimir lo que ya rankea.
Después expandir.

No se aprueba ninguna expansión SEO nueva si antes no se completa:

1. consolidación `www` vs sin `www`
2. limpieza de residuos indexados
3. mejora de snippets en URLs con impresiones reales
4. revisión del riesgo doorway en landings auto-redirigidas

---

## Regla dura de snippets
No optimizar snippets prometiendo más de lo que la experiencia inicial sostiene.

Eso significa:

- no prometer “activos ahora” si la percepción de actividad no lo sostiene
- no prometer “cerca de ti” si la entrada no refleja cercanía
- no prometer “sin fricción” si el onboarding rompe expectativa
- no vender una landing como destino fuerte si en realidad solo redirige casi instantáneo

Beneficio:
- mejor coherencia entre SERP y producto
- menor rebote por expectativa rota
- mejor retorno real del SEO

---

## Regla dura de landings nuevas
No se crea ninguna landing nueva salvo que cumpla las 4 condiciones:

1. keyword con intención distinguible
2. contenido visible propio suficiente
3. diferencia real frente a otra URL existente
4. destino coherente sin redirect inmediato agresivo

Si falla una sola, no se crea.

---

## Prioridades de trabajo

### Prioridad alta
- arregla señal técnica
- evita dispersión SEO
- mejora clics en superficies ya visibles
- limpia residuos del índice

### Prioridad media
- mejora estructura y legitimidad de landings SEO existentes
- reduce riesgo doorway

### Prioridad baja
- expansión de nuevas URLs
- experimentos SEO no validados

---

## Matriz operativa por URL

## 1. Host canónico

| Superficie | Datos visibles | Estado actual | Riesgo | Decisión | Prioridad |
|---|---:|---|---|---|---|
| `https://chactivo.com/` | 8.598 clics / 243.995 impresiones | Home principal activa | Medio | Mantener y optimizar snippet | Alta |
| `https://www.chactivo.com/` | 1.391 clics / 33.473 impresiones | Señal duplicada del host | Alto | Consolidar con redirección real 301 al host principal | Alta |

### Por qué esta decisión
- Hoy la autoridad y el tráfico están partidos entre dos hosts.
- Aunque exista script en cliente en [index.html](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\index.html), eso no sustituye una redirección real.

### Qué obtiene Chactivo
- una sola versión fuerte del dominio
- menos confusión en Search Console
- mejor lectura de resultados

### Qué puede generar
- consolidación de señales
- menos dispersión de clics
- mejor base para optimizar CTR

### Acción exacta
- validar en infraestructura/hosting cómo está resuelto el dominio `www`
- configurar redirección real `301` de `www.chactivo.com` a `https://chactivo.com`
- mantener `canonical` apuntando a sin `www`
- confirmar luego en Search Console inspeccionando ambos hosts

### Validación
- abrir `https://www.chactivo.com/` y confirmar redirección HTTP, no solo JS
- inspeccionar respuesta y cadena de redirección
- revisar que Google consolide al host final

---

## 2. URLs con decisión inmediata

| URL | Clics | Impresiones | CTR | Posición media | Intención | Estado actual | Decisión | Prioridad |
|---|---:|---:|---:|---|---|---|---|---|
| `/` | 8.598 | 243.995 | 3,52% | Pendiente exportar GSC | Entrada general chat gay Chile | Ruta activa fuerte | Optimizar snippet | Alta |
| `/gay` | Pendiente | Pendiente | Pendiente | Pendiente | Alias gay explícito | Misma superficie lógica que `/` | Revisar canibalización y decidir si se diferencia o se consolida | Alta |
| `/chat-gay-chile` | Pendiente | Pendiente | Pendiente | Pendiente | Intención SEO fuerte chat gay Chile | Usa `SEOLandingChile` y redirige | Mantener temporalmente, revisar doorway, mejorar coherencia | Alta |
| `/chat-gay-santiago-centro` | Pendiente | Pendiente | Pendiente | Pendiente | Intención local Santiago | `SEOLandingSantiagoCentro` con redirect | Revisar si merece convertirse en landing real | Alta |
| `/auth` | 27 | 808 | 3,34% | Pendiente exportar GSC | Login / registro | Ya está `noindex` en runtime | Verificar, no priorizar rework | Alta |
| `/anonymous-forum` | 97 | 897 | 10,81% | Pendiente exportar GSC | Residuo histórico | Redirige a `/chat/principal` | Limpiar de índice, no potenciar | Alta |
| `/ar` | 34 | 564 | 6,03% | Pendiente exportar GSC | País / Argentina | Landing SEO con redirect | Decidir si se convierte en landing real o se depura | Alta |
| `/mx` | Pendiente | Pendiente | Pendiente | Pendiente | País / México | Landing SEO con redirect | Igual que `/ar` | Media |
| `/es` | Pendiente | Pendiente | Pendiente | Pendiente | País / España | Landing SEO con redirect | Igual que `/ar` | Media |
| `/br` | Pendiente | Pendiente | Pendiente | Pendiente | País / Brasil | Landing SEO con redirect | Igual que `/ar` | Media |

Nota:
- La posición media no está en el repositorio. Debe exportarse desde Search Console antes de cerrar decisiones finas de CTR.

---

## Decisión operativa por URL

## `/`

### Decisión
Mantener y optimizar.

### Por qué
- es la superficie con más clics
- cualquier mejora aquí tiene el mejor retorno relativo

### Riesgo si no se trabaja
- seguir perdiendo clics potenciales en la URL más importante del proyecto

### Acción exacta
- proponer 2 o 3 variantes de `title`
- proponer 2 o 3 variantes de `meta description`
- elegir una sola versión por ciclo
- medir impacto antes de tocar otras 10 cosas

### Qué no hacer
- no meter títulos inflados
- no meter claims de actividad que la entrada no sostenga

---

## `/gay`

### Decisión
Auditar relación con `/`.

### Por qué
- hoy `/` y `/gay` parecen competir por la misma intención
- si no tienen diferenciación real, pueden estar duplicando esfuerzo

### Riesgo
- canibalización interna
- dos URLs intentando capturar la misma consulta

### Acción exacta
- revisar en GSC si `/gay` recibe queries distintas de `/`
- si no se diferencia:
  - mantener una sola página principal fuerte
  - dejar la otra como soporte controlado o consolidarla
- si sí se diferencia:
  - reforzar un ángulo explícito de intención

### Qué no hacer
- no dejar `/` y `/gay` con promesas casi idénticas indefinidamente

---

## `/chat-gay-chile`

### Decisión
Mantener temporalmente pero revisar riesgo doorway.

### Por qué
- es una URL de intención fuerte
- pero hoy usa patrón de landing que redirige rápido

### Riesgo
- parecer SEO-shell más que destino útil

### Acción exacta
- revisar queries reales que activan esta URL
- decidir si se transforma en landing más sólida
- si se mantiene, reducir sensación de doorway

### Qué obtiene Chactivo si se mejora
- más legitimidad de la página
- mejor ajuste entre query y experiencia

---

## `/chat-gay-santiago-centro`

### Decisión
Revisión prioritaria para convertirla en landing real o bajarle ambición.

### Por qué
- tiene una intención local más clara que otras superficies
- si la ciudad pesa en búsquedas, esta URL puede volverse estratégica

### Riesgo
- si sigue como shell auto-redirigida, pierde fuerza real

### Acción exacta
- revisar si tiene suficiente demanda en GSC
- si la demanda existe:
  - convertirla en landing más real
  - incluir contexto local visible y coherente
- si no existe demanda suficiente:
  - mantener simple y no expandir modelo

---

## `/auth`

### Decisión
No re-trabajar, solo verificar.

### Por qué
- ya está en `noindex`
- no es donde hoy está el mayor retorno

### Riesgo real
- solo si Google no puede leer el `noindex`

### Acción exacta
- verificar que `/auth` no esté bloqueada por `robots.txt`
- confirmar en inspección de URL que Google pueda ver `noindex`
- confirmar que no esté en sitemap

### Qué no hacer
- no meter esfuerzo creativo aquí

---

## `/anonymous-forum`

### Decisión
Limpiar, no potenciar.

### Por qué
- ya redirige a `/chat/principal`
- su valor actual es residual

### Riesgo
- seguir acumulando impresiones en una URL sin futuro real

### Acción exacta
- confirmar que no esté en sitemap
- confirmar que no tenga enlaces internos relevantes
- inspeccionar en GSC
- dejar que Google consolide la redirección

---

## `/ar`, `/mx`, `/es`, `/br`

### Decisión
No expandirlas todavía. Primero clasificar cada una como:

- landing real a fortalecer
- shell temporal a corregir
- superficie a simplificar

### Por qué
- hoy responden a patrón similar de landing SEO auto-redirigida
- no conviene multiplicar ese modelo sin validar calidad

### Riesgo
- doorway pattern
- thin content
- expansión internacional con poca base real

### Acción exacta
- exportar métricas por URL desde GSC
- revisar queries
- revisar permanencia y rendimiento
- decidir una por una

---

## Propuesta de snippets por URL prioritaria

## 1. Home `/`

### Objetivo del snippet
Vender:
- actividad real
- acceso rápido
- baja fricción
- utilidad inmediata

No vender:
- promesas infladas de volumen si la percepción no acompaña
- claims demasiado marketineros

### Propuesta A
Title:
- `Chat Gay Chile En Vivo | Entra Gratis y Habla al Instante | Chactivo`

Meta:
- `Conecta con gente real de Chile en segundos. Entra gratis, sin registro obligatorio y conversa al instante desde tu navegador.`

### Propuesta B
Title:
- `Chat Gay Chile Gratis | Conversa Ahora Sin Registro | Chactivo`

Meta:
- `Usuarios entrando todos los días para hablar, conocer gente y pasar directo al chat. Sin descargas y con acceso inmediato.`

### Propuesta C
Title:
- `Chat Gay Chile Activo | Habla Con Gente Real Ahora | Chactivo`

Meta:
- `Entra al chat gay de Chile sin perder tiempo. Acceso rápido, sin fricción innecesaria y con gente real conectándose a diario.`

Recomendación:
- testear primero A o B
- evitar palabras demasiado agresivas si no están reflejadas con claridad en la entrada

---

## 2. `/chat-gay-chile`

### Objetivo del snippet
Capturar intención explícita de búsqueda “chat gay Chile”.

### Propuesta A
Title:
- `Chat Gay Chile | Entra Gratis y Conversa Ahora | Chactivo`

Meta:
- `Una entrada rápida para hablar con gente real de Chile. Sin registro obligatorio, sin descargas y con acceso inmediato al chat.`

### Propuesta B
Title:
- `Chat Gay Chile En Vivo | Sin Registro y Sin Esperas | Chactivo`

Meta:
- `Si buscas entrar rápido, esta es la entrada más directa al chat gay de Chile. Habla al instante desde tu navegador.`

---

## 3. `/chat-gay-santiago-centro`

### Objetivo del snippet
Reflejar intención local.

### Propuesta A
Title:
- `Chat Gay Santiago Centro | Gente De La RM Conectada | Chactivo`

Meta:
- `Habla con gente de Santiago Centro y la Región Metropolitana. Entrada rápida, sin registro obligatorio y desde tu navegador.`

### Propuesta B
Title:
- `Chat Gay Santiago | Conversa Con Gente Cerca De Ti | Chactivo`

Meta:
- `Una entrada pensada para quienes buscan gente de Santiago y la RM. Accede rápido y conversa con contexto local.`

Advertencia:
- solo usar lenguaje tipo “cerca de ti” si la experiencia inicial empieza a sostener mejor esa promesa

---

## Lista dura de cosas que NO se harán

### No se hará 1
No crear de inmediato:
- `/chat-gay-rapido`
- `/chat-gay-cerca-de-mi`
- `/chat-gay-sin-registro`
- `/chat-gay-activos-ahora`

Motivo:
- alto riesgo de duplicidad y doorway

### No se hará 2
No se cambiarán títulos y metas de todas las URLs al mismo tiempo.

Motivo:
- destruye trazabilidad

### No se hará 3
No se optimizará SEO como si fuera independiente del producto.

Motivo:
- CTR sin coherencia de entrada no mejora negocio

---

## Checklist de Search Console

### Revisar esta semana
- exportar posición media de `/`, `/gay`, `/chat-gay-chile`, `/chat-gay-santiago-centro`, `/ar`, `/auth`, `/anonymous-forum`
- revisar queries principales de cada una
- revisar si `/` y `/gay` compiten por las mismas consultas
- inspeccionar `/auth` para validar lectura de `noindex`
- inspeccionar `/anonymous-forum` para validar estado de redirección/indexación
- revisar si `www` y sin `www` aparecen separados en reportes

### Qué buscar
- queries informacionales mezcladas con transaccionales
- URLs duplicadas por intención
- páginas con impresiones altas y snippet flojo
- páginas con clics decentes pero experiencia de entrada pobre

---

## Checklist técnico de infraestructura

### `www` vs sin `www`
- validar cómo está conectado `www.chactivo.com`
- implementar redirección real 301 hacia `https://chactivo.com`
- confirmar que no dependa solo del script en cliente

### Sitemap
- solo incluir URLs que realmente quieras posicionar
- excluir experimentos pausados
- excluir redirecciones residuales
- excluir páginas noindex

### Robots
- no bloquear por `robots.txt` una URL si necesitas que Google vea `noindex`

### Canonical
- revisar coherencia de `canonical` entre `/`, `/gay`, `/chat-gay-chile` y demás landings

---

## Orden real de ejecución

## Semana 1
- resolver `www` vs sin `www`
- exportar datos reales de GSC por URL
- verificar `/auth` y `/anonymous-forum`

## Semana 2
- cambiar snippet de `/`
- cambiar snippet de `/chat-gay-chile`
- medir

## Semana 3
- decidir relación entre `/` y `/gay`
- decidir si `/chat-gay-santiago-centro` pasa a landing real

## Semana 4
- clasificar `/ar`, `/mx`, `/es`, `/br`
- elegir si se fortalecen, se corrigen o se congelan

---

## Resultado esperado si se ejecuta bien
- más claridad sobre qué URLs merecen crecer
- mejor CTR en superficies ya visibles
- menor deuda SEO
- menos riesgo de seguir abriendo URLs que después haya que apagar
- base mucho más sólida para una expansión futura con bisturí

---

## Siguiente documento recomendado
Después de esta hoja, lo correcto sería un tercer documento:

- `IMPLEMENTACION_SEO_SPRINT_1_CHACTIVO.md`

Con:
- cambios exactos de código
- archivos a tocar
- checklist técnico de despliegue
- validación post-deploy

