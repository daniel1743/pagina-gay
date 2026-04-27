# Baul Pausado Y Restauracion 2026-04-19

## Estado actual

`Baul` fue pausado temporalmente porque hoy no esta aportando suficiente valor al flujo principal y agrega dispersion de atencion.

Objetivo de esta pausa:

- reducir ruido de producto,
- evitar empujar a una seccion que hoy no mejora la retencion del chat,
- concentrar la experiencia en `Chat`, `Conecta` y `OPIN`.

La pausa se hizo sin borrar el codigo de Baul.

---

## Bandera usada

Archivo:

- `src/config/featureFlags.js`

Valor actual:

```js
export const ENABLE_BAUL = false;
```

Con esa bandera en `false`, Baul queda desactivado en superficies visibles y su ruta redirige al chat principal.

---

## Archivos afectados por la pausa

- `src/config/featureFlags.js`
- `src/App.jsx`
- `src/components/layout/Header.jsx`
- `src/components/chat/ChatBottomNav.jsx`
- `src/components/chat/ChatSidebar.jsx`
- `src/pages/LobbyPage.jsx`
- `src/hooks/useEngagementNudge.js`
- `src/pages/ChatPage.jsx`

---

## Que quedo apagado

- item `Baul` en header.
- item `Baul` en barra inferior movil.
- accesos a `Baul` desde sidebar desktop y mobile.
- card de `Baul` en lobby.
- nudge de descubrimiento hacia `Baul`.
- ruta `/baul` visible como destino activo.

---

## Que NO se elimino

- `src/pages/BaulPage.jsx`
- `src/components/baul/*`
- `src/services/tarjetaService.js`
- integraciones internas de perfil publico / tarjeta / OPIN que no se tocaron en esta pausa

Es decir:

`Baul` sigue existiendo en el repo y se puede restaurar rapido.

---

## Como restaurarlo

### Restauracion rapida

1. Cambiar en `src/config/featureFlags.js`:

```js
export const ENABLE_BAUL = true;
```

2. Ejecutar:

```bash
npm run build
```

3. Revisar visualmente:

- header
- lobby
- barra inferior movil
- sidebar
- acceso directo `/baul`

### Restauracion controlada

Si se quiere volver con menos friccion, restaurar por fases:

1. activar solo la ruta `/baul`
2. activar solo el card del lobby
3. activar luego header o bottom nav
4. dejar `useEngagementNudge` al final, no al principio

---

## Criterio para volver a activarlo

No reactivar Baul solo porque existe.

Reactivarlo cuando cumpla al menos una de estas:

- mejora apertura de privados,
- mejora respuesta real a usuarios ignorados,
- mejora conversion a registro,
- aporta valor claro distinto de `Conecta` y `OPIN`.

Si no cumple eso, vuelve a meter friccion y dispersion.
