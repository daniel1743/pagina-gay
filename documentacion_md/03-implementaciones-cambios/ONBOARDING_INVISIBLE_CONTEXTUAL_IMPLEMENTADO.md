# ONBOARDING_INVISIBLE_CONTEXTUAL_IMPLEMENTADO

Fecha: 2026-02-22  
Proyecto: Chactivo  
Objetivo: Aumentar envío de primer mensaje sin bloquear acceso a sala (sin modal obligatorio)

## 1) Resumen
Se implementó un onboarding opcional y contextual en el chat principal, sin bloquear lectura ni escritura.  
El flujo ahora ayuda a romper el hielo antes del primer mensaje con chips de contexto, prompts de texto y un nudge suave.

## 2) Cambios implementados

### 2.1 Chips opcionales sobre el input (O1)
- Archivo: `src/components/chat/ChatInput.jsx`
- Se agregaron chips:
  - `Soy Activo`
  - `Soy Pasivo`
  - `Soy Versátil`
  - `Agregar comuna` (selector inline, no modal)
- Reglas aplicadas:
  - No obligatorios.
  - Si el usuario escribe o presiona `Omitir`, se ocultan en esa sesión.
  - Persistencia local:
    - `chactivo:role`
    - `chactivo:comuna`

### 2.2 Prompts rápidos de primer mensaje (O2)
- Archivo: `src/components/chat/ChatInput.jsx`
- Se agregaron sugerencias rápidas:
  - `¿Quién de Santiago Centro?`
  - `Activo buscando pasivo 👀`
  - `¿Alguien despierto a esta hora?`
  - `¿Quién tiene lugar?`
- Comportamiento:
  - Click rellena el input.
  - No envía automáticamente.
  - Desaparecen tras el primer mensaje de la sesión.

### 2.3 Micro-nudge al focus del input (O3)
- Archivo: `src/components/chat/ChatInput.jsx`
- Mensaje:
  - `Tip: Si indicas tu comuna o rol, te responden más rápido.`
- Reglas:
  - Aparece solo 1 vez por sesión.
  - Se oculta automáticamente en 4 segundos.
  - No bloquea escritura.

### 2.4 Header de actividad real (O4)
- Archivo: `src/pages/ChatPage.jsx`
- Se cambió el texto de actividad para incluir:
  - Activos en últimos 5 minutos (real)
  - Mensajes en últimos 10 minutos (real)
- Regla:
  - Si algún contador está en 0, ese dato no se muestra.

### 2.5 Eliminación del comportamiento viejo que autoenviaba
- Archivo: `src/pages/ChatPage.jsx`
- Se eliminó el bloque de chips rápidos del `ChatPage` que enviaba mensaje directo al click.
- El onboarding queda centralizado en `ChatInput` con comportamiento no invasivo.

### 2.6 Persistencia de rol/comuna en mensajes futuros
- Archivos:
  - `src/pages/ChatPage.jsx`
  - `src/services/chatService.js`
  - `src/components/chat/ChatMessages.jsx`
- Se agregó:
  - `roleBadge`
  - `comuna`
- Resultado:
  - `roleBadge` se guarda y se renderiza junto al nombre en chat.
  - `comuna` queda persistida en payload/documento para uso posterior.

## 3) Claves de storage usadas

### localStorage
- `chactivo:role`
- `chactivo:comuna`

### sessionStorage
- `chactivo:onboarding:dismissed`
- `chactivo:onboarding:first_message_sent`
- `chactivo:onboarding:focus_nudge_shown`

## 4) Archivos modificados
- `src/components/chat/ChatInput.jsx`
- `src/pages/ChatPage.jsx`
- `src/components/chat/ChatMessages.jsx`
- `src/services/chatService.js`

## 5) QA rápido recomendado
1. Entrar a `/chat/principal` con sesión nueva (incógnito).
2. Verificar que aparecen chips + prompts arriba del input.
3. Click en prompt: debe rellenar input, no enviar.
4. Focus por primera vez: mostrar tip 4s y desaparecer.
5. Enviar primer mensaje: onboarding debe ocultarse.
6. Recargar:
   - Rol/comuna deben mantenerse (localStorage).
7. Confirmar en chat:
   - Badge de rol visible junto al nombre.
8. Revisar header:
   - Mostrar activos (5 min) y mensajes (10 min) cuando haya datos reales > 0.

## 6) Estado de compilación
- Build validado correctamente con `npm run build`.

