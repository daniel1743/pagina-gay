# Auditoría visual local de media y OPIN — 2026-08-27

## Evidencia observada

La build local con valores Firebase ficticios montó la SPA interactiva sin crear cuentas ni escribir datos. En `/opin` se observó una cabecera nueva con el rótulo **Tablón de intención**, subtítulo explicativo, fondo navy con acentos cyan/fuchsia, filtros con estado accesible y el modo **Más recientes**. Al activar ese filtro apareció la leyenda **Orden actual: publicaciones más recientes primero**. No hubo tarjetas porque el backend ficticio no contiene posts; el estado vacío fue honesto y no inventó actividad.

La build local en `/chat/principal` mostró el control de imagen con etiqueta accesible **Subir imagen al chat**. Al probarlo como visitante sin sesión, el control no fingió disponibilidad: mostró el toast **Debes iniciar sesión para subir fotos.** El chat además mostró estado de sincronización por la ausencia de Firebase real. Esta prueba demuestra el comportamiento anónimo del frontend, no demuestra que un usuario registrado pueda subir a Firebase Storage real.

## Límites de esta evidencia

La prueba no conectó a Firebase real, no subió bytes, no escribió mensajes, no consultó perfiles privados y no creó cuentas. La subida autenticada requiere comprobar el bucket y las reglas desplegadas con una cuenta de prueba autorizada o Emulator Suite. El archivo local `firestore.rules` quedó alineado con la ruta generada por ChatInput, pero todavía no se desplegó.

## Segunda comprobación visual

Después del build final, `/opin?audit=final` volvió a montar la SPA con la misma cabecera rediseñada y los controles visibles: `Para ti`, `Más recientes`, `Actividad nueva`, `Seguidos` y las categorías Hugeicons. El estado de carga fue visible mientras se consultaba el proyecto ficticio. En la prueba anterior, tras esperar, el estado se convirtió en **OPIN está vacío** y no en actividad inventada. La activación de **Más recientes** cambió la leyenda a orden cronológico, lo que prueba el control a nivel UI.
