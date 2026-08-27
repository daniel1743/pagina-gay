# Limpieza del historial público después de rotar claves

Esta guía debe ejecutarse **después** de que el propietario haya revocado y reemplazado las claves en cada proveedor. La copia saneada de trabajo no hace `push` ni reescribe el repositorio remoto automáticamente.

## Por qué es necesario

Borrar una clave del archivo actual no la elimina de los commits anteriores. Como el repositorio es público, cualquier valor histórico debe tratarse como comprometido y la rotación del proveedor es obligatoria antes de limpiar el historial.

## Preparación

Clona una copia nueva del repositorio y trabaja sobre una rama de respaldo. No uses `.env` real dentro del repositorio. Mantén fuera del control de versiones cualquier `service_role`, contraseña de base de datos, Firebase Admin SDK, clave privada o clave de proveedor.

```bash
git clone https://github.com/daniel1743/pagina-gay.git pagina-gay-historial
cd pagina-gay-historial
git fetch --all --tags

git branch respaldo-antes-de-limpiar
```

Instala `git-filter-repo` desde una fuente confiable si aún no está instalado. Antes de ejecutarlo, reemplaza en una copia de trabajo las rutas históricas que contienen credenciales por versiones saneadas; no pegues los valores de las claves en comandos ni en esta guía.

## Reescritura recomendada

Para eliminar archivos históricos que nunca deben permanecer en un repositorio público, ejecuta `git filter-repo` con una lista de rutas revisada. Revisa primero la lista: no elimines migraciones SQL, código de producto o documentación útil por accidente.

```bash
git filter-repo --force \
  --path INICIO_RAPIDO_BOTS.txt \
  --path seed-conversaciones-reales.js \
  --path cleanup-all-bots-spam.js \
  --path cleanup-bot-messages.js \
  --path cleanup-bot-presence.js \
  --path documentacion_md/08-bots-ia \
  --invert-paths
```

Para archivos que deben conservarse pero contenían valores concretos, sanea su contenido en la copia de trabajo y usa un reemplazo de texto revisado. No incluyas claves reales en un archivo de reemplazos que pueda quedar en el disco o en el historial.

## Verificación antes del push forzado

```bash
git grep -n -I -E 'sk-[A-Za-z0-9_-]{20,}|SUPABASE_SERVICE_ROLE|FIREBASE_ADMIN|BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY' $(git rev-list --all) -- . ':!package-lock.json' || true
git log --all --oneline --decorate -10
git status
```

La búsqueda debe quedar sin valores privados. Las claves web de Firebase pueden ser identificadores de cliente, pero deben estar restringidas por dominio y API; nunca deben confundirse con `service_role` o credenciales Admin SDK.

## Publicación

La reescritura cambia los hashes de los commits y requiere coordinar a cualquier colaborador. Solo después de revisar la verificación y confirmar que las claves fueron rotadas, publica con un push forzado protegido:

```bash
git push --force-with-lease origin main
```

Después revisa el repositorio público en una ventana privada y confirma que los archivos saneados ya no aparecen. No hagas deploy de Vercel/Production durante este proceso. Primero verifica el build y las variables de entorno de Preview; Production debe continuar con Firebase mientras la activación Supabase se valida paso a paso.

> Esta guía no autoriza por sí sola una reescritura ni un `push`. El propietario debe revisar los cambios y confirmar explícitamente antes de publicar.
