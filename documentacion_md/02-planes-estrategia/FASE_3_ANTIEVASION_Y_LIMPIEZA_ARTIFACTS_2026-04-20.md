# Fase 3 Antievacion y Limpieza Artifacts 2026-04-20

## Objetivo

Hacer dos ajustes finales sin subir costo:

- bajar falsos positivos del motor,
- y dejar activa limpieza automatica de artifacts de Functions para evitar basura de deploy.

---

## Lo aplicado

### 1. Terminos ambiguos ya no pesan igual

Archivos:

- `src/services/antiSpamService.js`
- `functions/index.js`

Cambio:

- terminos ambiguos como `tele`, `afuera` y `fuera` dejaron de contar como señal fuerte por si solos,
- ahora solo pesan cuando vienen acompañados de otras señales reales.

Impacto:

- menos bloqueos injustos por palabras demasiado abiertas,
- misma dureza contra contacto externo cuando el contexto realmente apunta a extraccion.

---

### 2. Numeros inocentes filtran mejor

Archivos:

- `src/services/antiSpamService.js`
- `functions/index.js`

Cambio:

- horas, medidas y otros contextos numericos comunes ahora se tratan como benignos,
- ejemplos:
  - `9:41`
  - `2/4`
  - `18 cm`
  - `60 min`

Impacto:

- baja falsos positivos por mensajes normales,
- evita que varias cifras pequenas se interpreten automaticamente como telefono.

---

### 3. Backend ya no inspecciona por cualquier digito corto

Archivo:

- `functions/index.js`

Cambio:

- la revision contextual backend ahora solo se dispara si el mensaje trae sospecha mas solida,
- ya no entra por cualquier mensaje corto o por cualquier digito aislado.

Impacto:

- menos consultas innecesarias,
- menor costo de Firestore,
- menos riesgo de sobrerreaccion.

---

### 4. Politica automatica de limpieza de artifacts

Accion aplicada:

- se activo cleanup policy real en `Artifact Registry` para `us-central1`,
- retencion configurada: `1 dia`.

Comando aplicado:

```bash
firebase functions:artifacts:setpolicy --location us-central1 --days 1 --force
```

Resultado:

- limpieza automatica activa para `projects/chat-gay-3016f/locations/us-central1/repositories/gcf-artifacts`,
- las imagenes viejas de Functions se eliminaran automaticamente cuando superen `1 dia`.

Nota:

- esto reduce basura tecnica y riesgo de costo residual en el repositorio vigente de artifacts,
- el warning puntual de `us.gcr.io` puede seguir apareciendo porque la CLI intenta limpiar un repo legacy inexistente,
- ese warning no invalida la politica nueva ni significa que se haya creado una carga nueva de Firestore.

---

## Criterio de ahorro mantenido

- cero listeners nuevos,
- cero tiempo real nuevo,
- cero colecciones nuevas,
- cero docs de estado extra por usuario,
- menos inspecciones backend innecesarias que en fase 2.

---

## Estado despues de fase 3

Queda mas fuerte:

- contacto fragmentado,
- menor + contacto,
- menor + salida,
- reincidencia corta.

Queda mas fino:

- menos sensibilidad a palabras ambiguas,
- menos sensibilidad a numeros inocentes,
- menos consultas backend disparadas por ruido.

---

## Despliegue realizado

Deploy aplicado en produccion:

```bash
firebase deploy --only "hosting,functions:enforceCriticalRoomSafety,functions:enforceCriticalPrivateChatSafety"
```

Estado:

- `hosting` actualizado,
- `enforceCriticalRoomSafety` actualizado,
- `enforceCriticalPrivateChatSafety` actualizado,
- URL activa: `https://chat-gay-3016f.web.app`

Validaciones ejecutadas antes del deploy:

- `node --check functions/index.js`
- `npm run build`
