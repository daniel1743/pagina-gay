# Auditoria Landing Page (Chactivo)

## Critico
- No hay gateo de edad en la landing; se permite entrar al flujo de invitado sin confirmar 18+ (riesgo legal). Implementar modal de verificacion de edad antes de CTA de chat y bloquear si <18 (igual que en ChatPage).
- Contadores de usuarios inflados artificialmente (`calculateDisplayUserCount` en `src/pages/LobbyPage.jsx`) sin aclaracion; esto puede considerarse practicas engañosas. Mostrar conteo real o, como minimo, etiquetar como estimado/online ahora y limitar el boost.
- Accesibilidad: marquee de noticias sin controles pausar/reanudar; usuarios con motion sensitivity no tienen forma de detener animaciones en la landing. Añadir boton "Pausar animacion" y respetar `prefers-reduced-motion`.
- Copy y tags de SEO principales estan en `index.html` con caracteres corruptos (????) y keyword stuffing; afecta CTR y calidad. Reescribir title/description legibles y coherentes por ruta.
- Ausencia de aviso visible de uso de IA y tratamiento de datos en landing; es obligatorio para anuncios y compliance. Añadir banner/section explicita.

## Alto
- Hero y CTA no explican beneficio ni prueba social (solo boton "Chatear Gratis"); faltan diferenciadores, testimonios y seguridad/moderacion visible. Añadir testimonios breves, badges de seguridad y comparativa rapida.
- No hay formulario light de captura (email/push) en landing; dependencia total del chat para retener. Agregar micro-form (CTA doble: chat inmediato + "Recibir alertas").
- Animaciones y framer-motion en multiples componentes sin lazy mount; riesgo de TBT en moviles. Evaluar `motion` condicionada a viewport y reducir blur/glassmorphism.
- News ticker y videos usan contenidos "Pronto" sin CTA claros; generan friccion. Reemplazar con 3 bullets de valor real o remover hasta estar listo.
- Schema.org ausente (Organization/WebSite + FAQ) y canonical depende del hook; si falla, se duplican URLs. Añadir fallback canonical en index y schema estatico.
- Varios iconos y emojis en textos clave (news, videos) degradan lectura y SEO. Usar texto plano y alt adecuado.

## Medio
- Formularios modales (registro requerido, guest username) sin atencion a accesibilidad: falta focus trap consistente y descripciones ARIA. Revisar `Dialog` usages.
- Boton flotante movil superpuesto puede tapar contenido/teclado. Añadir safe-area y esconder en scroll down.
- Seccion de features no destaca salas principales ni segmentacion geografica; reorganizar cards para flujos principales (Global, +30, Santiago) con CTA directos.
- Falta evidencia de moderacion/seguridad (anti-spam, reporte, verificacion) en la landing; incluir bullet con procesos claros.
- PWA banner permanente puede aparecer junto a modales, generando stacking de overlays. Controlar prioridad y cierre unico por sesion.

## Bajo
- Paleta con gradientes magenta/cyan consistente pero sin version alto contraste o modo claro; añadir toggle o reforzar contraste en botones secundarios.
- No se muestran tiempos de carga ni placeholders arriba de la linea de flotacion; usar skeletons ligeros o LCP optimizado (hero img/gradient).
- Falta microcopia de privacidad/cookies en el footer de landing. Añadir enlace a politicas y contacto.
- Marquee custom sin `aria-live` ni `role` adecuado; ajustar roles y ocultar animacion a lectores de pantalla.
- Repeticion de emojis con caracteres corruptos en textos pregrabados; limpiar y normalizar encoding en assets estaticos.

## Oportunidades rapidas (prioridad)
1) Gateo 18+ en landing + disclosure IA y privacidad visibles.  
2) Reescribir hero: beneficio claro, CTA dual (Entrar ya / Ver salas), prueba social real (conteo real + moderacion).  
3) Corregir title/description/canonical y añadir schema basico.  
4) Sustituir contadores inflados por reales o etiqueta "usuarios conectados ahora (estimado)" con limite de boost <=20%.  
5) Añadir testimonios/ratings y seccion de seguridad (moderacion 24/7, reportes, anti-spam).  
6) Optimizar accesibilidad: control de animaciones, foco en modales, aria en ticker.  
7) Lazy motion/animaciones solo cuando visible; reducir glass blur para mejorar rendimiento movil.
