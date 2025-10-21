# 🔍 LOGS QUE DEBES VER EN LA CONSOLA

## ✅ Si todo funciona correctamente, verás:

### Al cargar la página:
```
🎬 Iniciando sistema de bots...
🚀 Inicializando bots para sala conversas-libres
👥 Usuarios reales: 0
🤖 Bots a activar: 1
✅ 1 bots iniciados en sala conversas-libres
🎭 Conversaciones programadas cada 2 minutos
📅 Programando conversaciones cada 2 minutos
📋 Bots activos: Carlos, Mateo, Alejandro, David (o los que sean)
⏰ Primera conversación en 10 segundos...
🎬 Iniciando simulador de entradas de bots...
```

### Después de 10 segundos:
```
🚀 Ejecutando primera conversación ahora!
🎭 Iniciando nueva conversación programada...
💬 Carlos inició conversación: "Alguien para gym? Necesito motivación jaja"
💬 Mateo respondió: "Yo voy todas las mañanas! ¿De dónde eres?"
💬 David respondió: "El gym es amor jaja, ¿qué rutina haces?"
```

### Cuando escribes un mensaje:
```
👤 Usuario escribió: "Hola a todos"
🎲 Probabilidad de respuesta: SÍ (40%)
🤖 Carlos responderá en unos segundos...
💬 Carlos enviando respuesta ahora...
🤖 Carlos envió: "Hola! Bienvenido, ¿cómo estás? 😎"
```

---

## ❌ Si NO ves estos logs, hay un problema

### Problema 1: No aparece "📅 Programando conversaciones"
**Significa**: El orquestador NO se está ejecutando
**Causa posible**: Error en la importación o en botCoordinator.js

### Problema 2: Aparece "⚠️ No hay suficientes bots para conversaciones"
**Significa**: Solo hay 1 bot activo (se necesitan mínimo 2)
**Solución**: Verificar la lógica de activación de bots

### Problema 3: Nunca aparece "🚀 Ejecutando primera conversación ahora!"
**Significa**: El setTimeout no se está ejecutando
**Causa posible**: Error de JavaScript que detiene la ejecución

### Problema 4: No aparece nada cuando escribes
**Significa**: triggerBotResponse no se está llamando
**Causa posible**: Problema en ChatPage.jsx

---

## 📋 CHECKLIST

Por favor verifica y márcame:

- [ ] Reinicié el servidor con `npm run dev`
- [ ] Abrí la consola del navegador (F12)
- [ ] Veo "🎭 Conversaciones programadas cada 2 minutos"
- [ ] Veo "⏰ Primera conversación en 10 segundos..."
- [ ] Después de 10 segundos veo "🚀 Ejecutando primera conversación ahora!"
- [ ] Veo los mensajes de los bots en el chat
- [ ] Cuando escribo, veo "👤 Usuario escribió: ..."
- [ ] (A veces) veo "🎲 Probabilidad de respuesta: SÍ"

---

## 📝 QUÉ HACER AHORA

1. Reinicia el servidor
2. Abre la aplicación
3. Abre consola (F12)
4. Espera 15 segundos
5. Escribe 5 mensajes diferentes
6. COPIA TODO lo que aparezca en la consola
7. Pégalo en el archivo DIAGNOSTICO_URGENTE.txt

Con esos logs podré ver EXACTAMENTE qué está fallando.
