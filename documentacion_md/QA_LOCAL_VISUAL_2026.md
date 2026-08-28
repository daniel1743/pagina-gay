# Evidencia de QA visual local — 2026-08-27

## Alcance

Se abrió el build local mediante el preview temporal en `http://127.0.0.1:4173/`. No se usaron cuentas de prueba, credenciales, datos privados ni servicios remotos.

## Observación de la home

El HTML público estático se mostró con el título `Chat Gay Chile | Conversa Desde Tu Navegador | Chactivo`, el encabezado `Entra y conversa con la comunidad`, el contexto de chat y OPIN, y enlaces visibles a chat principal, OPIN, Santiago, mayores de 30, FAQ y normas de comunidad. No aparecieron contadores, mensajes de muestra, testimonios ni perfiles fabricados en el shell.

El navegador informó que la parte interactiva no pudo iniciar en este entorno y mostró el fallback público de información. Esta observación no demuestra que el backend remoto esté operativo ni que la hidratación falle en producción; sí demuestra que el shell estático mantiene información y navegación básica aun cuando la capa interactiva no puede arrancar en el entorno de prueba.

## Comprobaciones HTTP complementarias

En el mismo build local, las rutas `/`, `/global`, `/santiago`, `/mas-30`, `/faq`, `/chat/principal`, `/politica-privacidad.html`, `/terminos-condiciones.html`, `/aviso-legal.html`, `/robots.txt`, `/sitemap.xml` y `/sitemap-index.xml` devolvieron HTTP 200. La comprobación se realizó por HTTP local, no contra producción.

## Limitación

No se afirma que los cambios estén visibles en `chactivo.com` hasta realizar un despliegue autorizado. Tampoco se afirma que Auth, Storage, Realtime, RLS, PostgREST o SQL remoto estén verificados.

## Rutas revisadas en navegador

`/mas-30` mostró el encabezado para mayores de 30, una promesa sobria, la explicación de disponibilidad real y el enlace al chat principal. No aparecieron testimonios, contadores o perfiles de muestra en el shell.

`/faq` mostró las preguntas sobre registro, información personal y privacidad, junto con enlaces al chat, normas y home. El componente no añadió un segundo Header/Footer visible en el shell estático; la comprobación estática adicional confirma que la página no importa esos componentes.

En ambas rutas el preview volvió a mostrar el fallback de aplicación interactiva del entorno de prueba. Por ello se registra como limitación de hidratación del sandbox, no como una afirmación de fallo de producción.
