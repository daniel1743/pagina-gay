# Preparacion Supabase Para Cutover 2026-04-24

## Estado real

La app sigue corriendo sobre Firebase.

Supabase existe solo como base parcial:

- `src/config/supabase.js`
- `src/services/supabaseAuthService.js`
- `src/services/supabaseChatService.js`

Pero no esta conectado al producto real.

Hallazgos duros:

- `71` archivos siguen acoplados a Firebase.
- Solo `2` servicios usan Supabase y ningun componente o pagina real los consume.
- El `.env` local ya tiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- `VITE_ENABLE_SUPABASE` no esta activo.
- No existe carpeta operativa versionada de migraciones SQL en uso real.

Conclusion:

> No hay migracion activa. Hay preparacion parcial.

---

## Lo que ya deje organizado

### 1. Script de verificacion local

Archivo:

- `scripts/verify-supabase-env.mjs`

Comando:

```bash
npm run supabase:verify
```

Valida:

- `VITE_ENABLE_SUPABASE`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- y muestra estado enmascarado sin exponer secretos completos.

### 2. Carpeta formal para migraciones

Creada:

- `supabase/migrations/`

Objetivo:

- dejar un lugar canonico para SQL versionado,
- evitar que la migracion quede solo en documentacion manual.

### 3. Diagnostico de verdad operativa

La migracion real exige cubrir como minimo:

- auth
- chat publico
- privados
- presencia
- inbox
- notificaciones
- moderacion
- storage
- funciones backend equivalentes

Hoy solo hay base parcial de:

- auth
- chat publico simple

---

## Lo manual que debes pasarme

Para que yo termine la configuracion y haga deploy por consola despues, necesito que me pases:

1. El proyecto Supabase correcto
   - URL final
   - anon key final

2. El esquema o SQL real
   - tablas
   - indices
   - RLS policies
   - triggers o funciones SQL si existen

3. La estrategia exacta
   - `Firebase off total`
   - o `cutover gradual`
   - o `solo chat publico primero`

4. Si usaras:
   - Supabase Auth anonimo
   - email/password
   - buckets de Storage
   - Realtime Postgres
   - Edge Functions

5. Que parte quieres migrar primero
   - auth
   - chat principal
   - privados
   - presencia
   - admin

---

## Lo que puedo hacer yo cuando me pases eso

### Sin que lo hagas manualmente

- activar el flag correcto en entorno
- conectar servicios reales a pantallas
- crear adapters para evitar romper componentes
- preparar fallback seguro
- ejecutar build
- probar integracion
- desplegar por consola

### Todavia no conviene hacer

- activar `VITE_ENABLE_SUPABASE=true` ahora
- cambiar imports productivos a ciegas
- deploy con Supabase medio conectado

Motivo:

Eso dejaria una app en estado hibrido incoherente.

---

## Recomendacion tecnica

No hagamos “migracion total” de una.

La secuencia correcta es:

1. definir esquema real y RLS
2. conectar auth
3. conectar chat publico
4. conectar presencia o reemplazarla por una version mas barata
5. conectar privados
6. cortar Firebase solo al final

---

## Veredicto

Ya estoy listo para organizar el cutover.

Pero todavia no para activarlo en produccion.

Lo que faltaba de preparacion local ya quedo encaminado.

Cuando me pases el codigo o la configuracion real de Supabase, sigo con:

- integracion,
- pruebas,
- y deploy por consola.
