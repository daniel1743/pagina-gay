# Reporte de limpieza local de seguridad

Esta copia de trabajo fue saneada sin hacer push ni cambios en GitHub. Se eliminaron módulos y documentos heredados de bots/siembra para impedir actividad que simule personas. También se sustituyeron valores concretos de claves privadas encontrados en texto por marcadores; no se imprimen los valores originales.

## Archivos eliminados


## Archivos con valores reemplazados

- `.env.example`
- `documentacion_md/00-core/DEPLOY_VERCEL_GUIDE.md`
- `documentacion_md/00-core/MIGRATION_GUIDE.md`
- `documentacion_md/00-core/README.md`
- `documentacion_md/01-auditorias-diagnosticos/AUDITORIA_CRITICA_PRE_PRODUCCION.md`
- `documentacion_md/01-auditorias-diagnosticos/diagnostico-localhost-produccion.md`
- `documentacion_md/04-auth-usuarios/fix-login-cors-errors.md`
- `documentacion_md/07-firebase-supabase-db/VARIABLES-ENTORNO-SUPABASE.md`
- `documentacion_md/07-firebase-supabase-db/supabase-setup.md`

Cantidad de sustituciones de patrones de clave: 0.

## Nota sobre Firebase web

La configuración web de Firebase puede contener un identificador cliente que no equivale a una service_role. Debe quedar restringido por API y dominio, y debe rotarse si el propietario decide invalidarlo. Nunca debe añadirse una service_role, contraseña de base de datos o credencial Admin SDK al frontend.

## Cambios funcionales adicionales

Además de la eliminación de archivos heredados, se ajustaron estos archivos de producto en la copia local:

- `src/App.jsx`: se retiró la ruta `/seed-conversaciones`.
- `src/pages/ChatPage.jsx`: se retiraron importaciones y efectos NICO; el chat conserva la actividad de personas reales o sesiones anónimas autenticadas.
- `src/pages/AdminPage.jsx`: se retiraron las pestañas y paneles de bots/siembra.
- `src/pages/AnonymousForumPage.jsx`: se eliminó la carga de hilos sembrados; ahora consulta `forumService`.
- `src/pages/ThreadDetailPage.jsx`: se eliminó el fallback de hilo sembrado; ahora consulta hilo y respuestas reales.
- `src/services/chatService.js`: el envío bot/IA/seed se rechaza permanentemente en sala principal y secundaria.
- `src/config/scheduledEvents.js`: se conservaron eventos legítimos, retirando moderadores bot.
- `vite-plugin-generate-version.js`: se silenció el aviso esperado cuando la copia no contiene `.git`.

## Estado de publicación

Todos estos cambios permanecen únicamente en esta copia local saneada. No se ejecutó `git push`, no se hizo deploy y no se modificaron claves ni configuraciones de proveedores. El propietario debe revisar el ZIP, rotar sus propias claves y publicar solo después de confirmar el contenido.
