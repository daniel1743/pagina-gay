# Configuración segura de Vercel Preview

Esta guía separa **Preview** de **Production**. No contiene URLs privadas, claves ni contraseñas. Los valores reales deben pegarse únicamente en el panel de Vercel o en un `.env` local ignorado.

## Variables públicas del cliente

En **Vercel → Project Settings → Environment Variables**, crea las variables solo para **Preview**. No copies valores reales a GitHub ni a documentos.

```text
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=<URL_PUBLICA_DEL_PROYECTO>
VITE_SUPABASE_ANON_KEY=<ANON_KEY_PUBLICA>
VITE_DATA_BACKEND=firebase
VITE_USE_SUPABASE_AUTH=false
VITE_USE_SUPABASE_CHAT=false
VITE_USE_SUPABASE_OPIN=false
VITE_ENABLE_EXACT_GEOLOCATION=false
```

Con esta primera configuración, la aplicación conoce el proyecto Supabase pero continúa usando Firebase para la experiencia actual. No se debe activar Chat u Opin Supabase mientras Auth Supabase permanezca apagado.

## Secuencia de Preview

### Paso A: probar Auth

Después de crear un usuario de prueba o usar una sesión anónima autorizada, cambia **solo en Preview**:

```text
VITE_USE_SUPABASE_AUTH=true
VITE_USE_SUPABASE_CHAT=false
VITE_USE_SUPABASE_OPIN=false
VITE_DATA_BACKEND=firebase
```

Comprueba inicio/cierre de sesión, creación automática de `profiles`, lectura de perfil propio y aislamiento de `profile_private_settings`. Si falla, revierte `VITE_USE_SUPABASE_AUTH=false`.

### Paso B: probar Chat y presencia

Cuando Auth Supabase pase, activa en una nueva Preview:

```text
VITE_USE_SUPABASE_AUTH=true
VITE_USE_SUPABASE_CHAT=true
VITE_USE_SUPABASE_OPIN=false
VITE_DATA_BACKEND=supabase
```

Prueba historial, envío entre dos cuentas autorizadas, reacciones, recibos, presencia, salida de sala y bloqueo. No uses mensajes sembrados ni cuentas que simulen personas.

### Paso C: probar Muro de Intenciones

Solo después de validar Chat, activa Opin:

```text
VITE_USE_SUPABASE_AUTH=true
VITE_USE_SUPABASE_CHAT=true
VITE_USE_SUPABASE_OPIN=true
VITE_DATA_BACKEND=supabase
```

Prueba publicación real, comentario, like, reacción, seguimiento, guardado y reportes con cuentas de prueba claramente identificadas. Verifica que los perfiles y publicaciones UGC mantengan `noindex`.

## Variables que nunca deben publicarse

No agregues `service_role`, contraseña de base de datos, Firebase Admin SDK, claves privadas de proveedores ni contraseñas de usuarios. No pongas claves AI privadas en variables `VITE_*`: todo lo que comienza con `VITE_` puede terminar en el navegador.

Las claves web de Firebase pueden ser identificadores públicos de cliente, pero deben tener restricciones de dominio y API. La clave anónima de Supabase solo debe usarse con RLS correctamente configurado y nunca sustituye una clave administrativa.

## Rollback

Si Preview presenta un error, vuelve temporalmente a:

```text
VITE_DATA_BACKEND=firebase
VITE_USE_SUPABASE_AUTH=false
VITE_USE_SUPABASE_CHAT=false
VITE_USE_SUPABASE_OPIN=false
```

No cambies Production como parte de una prueba. Guarda capturas o logs sin incluir tokens, correos ni datos personales.

> Esta guía no autoriza un deploy, cambio de Production ni migración de usuarios. Es únicamente una secuencia de configuración y comprobación para Preview.
