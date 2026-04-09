# PLAN P5: Panel Admin de Riesgo de Contacto

**Fecha:** 2026-04-08  
**Objetivo:** exponer en admin los usuarios con mayor `contactSafety.riskScore` sin abrir listeners caros ni barrer colecciones completas.

---

## Alcance

- agregar suscripcion admin a usuarios con `contactSafety.riskScore >= 3`
- limitar la consulta a `top 20`
- mostrar:
  - `riskScore`
  - bloqueos en `OPIN`
  - bloqueos en `privado`
  - ultimo evento
  - ultima superficie
  - fecha del ultimo evento
- permitir marcar el riesgo como `revisado`

---

## Decisiones de costo

- no se usa listener global sobre `contactSafetyEvents`
- no se hace `getDocs` completo de `users`
- se usa una sola query:
  - `where('contactSafety.riskScore', '>=', 3)`
  - `orderBy('contactSafety.riskScore', 'desc')`
  - `limit(20)`

Esto mantiene el panel en modo ahorrador y evita disparar lecturas por volumen total de usuarios.

---

## Archivos

- `src/services/moderationService.js`
- `src/components/admin/ModerationAlerts.jsx`
- `src/components/chat/PrivateChatWindowV2.jsx`

---

## Ajuste adicional de ahorro

En paralelo se optimizo el chat privado:

- se elimino el listener vivo a `private_chats/{chatId}`
- ahora la metadata del share se carga:
  - al abrir el chat
  - al accionar compartir / aceptar / revocar
  - al entrar un mensaje de sistema relevante
- el `phone` compartido ya no se vuelve a leer cada minuto si ya esta cacheado en memoria del componente

---

## Resultado esperado

- admin detecta reincidencia real por fuga de contacto
- el panel sigue siendo realtime solo donde aporta valor
- no se dispara el costo base de Firestore por dejar listeners innecesarios abiertos
