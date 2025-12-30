# Informe rápido: redirecciones forzadas a `/chat/global`

## Síntomas
- Al intentar ir al inicio (`/`) o a cualquier landing, la app termina enviando al chat global incluso siendo usuario autenticado que debería poder navegar.

## Evidencia
- En el bundle desplegado (`dist/assets/index-5477bcd3.js`) aún existe un efecto que redirige a usuarios logueados a `/chat/global`:
  - Fragmento minificado: `useEffect(()=>{ user && !user.isGuest && !user.isAnonymous && navigate("/chat/global", { replace: true }) }, [user, navigate])`.
- En el código fuente actual (`src/pages/GlobalLandingPage.jsx`) esa redirección ya está comentada, por lo que el bundle publicado está desactualizado respecto al código fuente.
- Además, las rutas SEO específicas (`/global`, `/gaming`, `/mas-30`, `/santiago`) usan `LandingRoute` que, por diseño, redirige a usuarios autenticados a sus salas `/chat/...`. Esto es esperado, pero si quieres ver la landing aun logueado habrá que ajustar esa lógica.

## Causa raíz
- Se desplegó un build antiguo con la redirección automática activa. El código fuente ya la eliminó, pero el `dist` en producción sigue con la versión previa.

## Recomendaciones
1) Generar un nuevo build y desplegarlo (Vercel/Firebase) para alinear el `dist` con la versión de código sin auto-redirect.
   - `npm run build` y luego `firebase deploy --only hosting` (o el flujo que uses).
2) Si quieres permitir que usuarios logueados vean las landings `/global`, `/gaming`, etc., elimina o ajusta el `LandingRoute` que hace `Navigate` a `/chat/...`.
3) Tras desplegar, verificar manualmente en producción que:
   - `/` no redirija a `/chat/global` al estar autenticado.
   - `/global` y las otras landings respeten la navegación deseada (o se apliquen nuevas reglas).

