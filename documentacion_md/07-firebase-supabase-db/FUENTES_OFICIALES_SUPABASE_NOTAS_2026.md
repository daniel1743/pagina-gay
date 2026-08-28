# Fuentes oficiales consultadas

## Supabase Auth
Fuente: https://supabase.com/docs/guides/auth

La documentación oficial indica que Supabase Auth autentica y autoriza usuarios, usa JWT y se integra con Postgres/RLS. Los clientes SDK envían el token de Auth junto con las solicitudes, y las políticas RLS determinan el acceso por fila. Auth guarda la información de usuarios en un esquema especial y puede conectarse con tablas propias mediante triggers y referencias.

## Row Level Security
Fuente: https://supabase.com/docs/guides/database/postgres/row-level-security

La documentación advierte que una tabla en un esquema expuesto sin RLS puede quedar legible y escribible para roles con grants. Activar policies no revoca grants existentes; hay que configurar ambos. La guía recomienda habilitar RLS, revocar grants de anon/authenticated que no se necesiten, conceder solo operaciones necesarias y crear pruebas pgTAP por tabla. También advierte que service_role evita RLS y debe permanecer en servidor.

## Storage Access Control
Fuente: https://supabase.com/docs/guides/storage/security/access-control

Storage se controla con RLS en storage.objects. Por defecto no permite uploads sin policies. Para upload basta INSERT, pero upsert requiere también SELECT y UPDATE. Un bucket privado debe servirse con políticas y URLs firmadas; una service key bypassa RLS y no debe exponerse públicamente.

## Realtime Postgres Changes
Fuente: https://supabase.com/docs/guides/realtime/postgres-changes

Postgres Changes escucha eventos INSERT, UPDATE y DELETE mediante canales. Las tablas deben añadirse a la publicación supabase_realtime desde Dashboard o SQL. Realtime y RLS deben revisarse juntos: la publicación no reemplaza las policies de acceso.

Estas notas respaldan el informe, pero no constituyen evidencia de que las migraciones de Chactivo hayan sido ejecutadas o validadas en el proyecto remoto.
