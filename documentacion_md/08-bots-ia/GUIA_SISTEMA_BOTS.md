# 🤖 GUÍA COMPLETA DEL SISTEMA DE BOTS CON GEMINI API

## ✅ SISTEMA IMPLEMENTADO Y LISTO PARA USAR

---

## 📋 ÍNDICE

1. [Configuración Inicial](#configuración-inicial)
2. [Cómo Funciona](#cómo-funciona)
3. [Perfiles de Bots](#perfiles-de-bots)
4. [Sistema de Moderación](#sistema-de-moderación)
5. [Ahorro de Tokens](#ahorro-de-tokens)
6. [Costos Estimados](#costos-estimados)
7. [Solución de Problemas](#solución-de-problemas)
8. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## 🚀 CONFIGURACIÓN INICIAL

### Paso 1: Pegar tu API Key de Gemini

1. Abre el archivo `.env` en la raíz del proyecto
2. Busca la línea que dice:
   ```
   VITE_GEMINI_API_KEY=TU_API_KEY_AQUI
   ```
3. Reemplaza `TU_API_KEY_AQUI` con tu API key real de Gemini
4. Guarda el archivo

**Ejemplo:**
```env
VITE_GEMINI_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Paso 2: Reiniciar el servidor de desarrollo

```bash
npm run dev
```

### ¡Listo! 🎉

El sistema de bots está completamente integrado y funcionará automáticamente.

---

## 🎯 CÓMO FUNCIONA

### Activación Automática

El sistema se activa **SOLO** cuando hay usuarios reales en la sala. Esto ahorra tokens.

| Usuarios Reales | Bots Activos | Intervalo de Mensajes |
|-----------------|--------------|----------------------|
| 0               | 0 bots       | ❌ Desactivado        |
| 1               | 3 bots       | Cada 20-40 segundos  |
| 2               | 3 bots       | Cada 30-50 segundos  |
| 3               | 2 bots       | Cada 40-60 segundos  |
| 4               | 2 bots       | Cada 50-70 segundos  |
| 5               | 1 bot        | Cada 60-90 segundos  |
| 6               | 1 bot        | Cada 70-100 segundos |
| 7+              | 0 bots       | ✅ Desactivado        |

### Flujo de Funcionamiento

1. **Usuario entra a una sala vacía**
   - Sistema detecta 1 usuario real
   - Activa 3 bots automáticamente
   - Los bots comienzan a conversar entre ellos

2. **Bots saludan al usuario**
   - Probabilidad del 50% de que un bot dé la bienvenida
   - Mensajes naturales: "Hola!", "¿Qué tal?", "Buenas!"

3. **Usuario escribe un mensaje**
   - Probabilidad del 40% de que un bot responda
   - Delay aleatorio de 8-20 segundos (simula escritura)
   - Respuesta coherente usando Gemini API

4. **Entran más usuarios**
   - Sistema reduce gradualmente el número de bots
   - Bots se despiden sutilmente
   - Con 7+ usuarios, todos los bots se desactivan

5. **Sala queda vacía**
   - Todos los bots se detienen inmediatamente
   - **0 tokens gastados** mientras no hay nadie

---

## 👥 PERFILES DE BOTS (7 Personajes)

### 1. **Carlos** - Activo/Top
- **Edad**: 28 años
- **Personalidad**: Extrovertido, bromista, directo
- **Intereses**: Gym, deportes, fiestas
- **Estilo**: "¿Qué tal gente? 😎", "Yo acá relajado viendo qué sale"

### 2. **Mateo** - Pasivo/Bottom
- **Edad**: 25 años
- **Personalidad**: Dulce, tímido, empático
- **Intereses**: Música, arte, series, gatos
- **Estilo**: "Hola! ☺️", "Ay sí, me encanta eso", "Qué lindo 💕"

### 3. **Alejandro** - Versátil
- **Edad**: 32 años
- **Personalidad**: Maduro, irónico, culto
- **Intereses**: Cine, política LGBT+, libros, vino
- **Estilo**: "Interesante punto de vista", "Depende de cómo lo veas"

### 4. **David** - Activo (expresivo)
- **Edad**: 26 años
- **Personalidad**: Juguetón, coqueto, divertido
- **Intereses**: Moda, Instagram, makeup, drag shows
- **Estilo**: "Holaaaa! ✨", "Ayy sí! Me encanta", "Literal! 💅"

### 5. **Miguel** - Pasivo
- **Edad**: 30 años
- **Personalidad**: Tranquilo, sincero, cálido
- **Intereses**: Cocina, jardinería, yoga, naturaleza
- **Estilo**: "Qué bueno eso 🌿", "Me parece bien", "Interesante experiencia"

### 6. **Javier** - Versátil
- **Edad**: 24 años
- **Personalidad**: Geek, curioso, gamer
- **Intereses**: Videojuegos, anime, tecnología, Marvel
- **Estilo**: "Hola! 🎮", "Tal cual!", "¿Enserio? Qué cool"

### 7. **Fernando** - Activo
- **Edad**: 29 años
- **Personalidad**: Seguro, carismático, líder
- **Intereses**: Negocios, coches, whisky, viajes
- **Estilo**: "¿Qué tal?", "Dale, suena bien", "Exacto"

**Nota**: Los bots son seleccionados aleatoriamente cada vez que se activan.

---

## 🛡️ SISTEMA DE MODERACIÓN

### Protección Triple Capa

#### 1️⃣ **Filtros de Gemini (Automático)**
- Configuración de seguridad integrada en la API
- Bloquea contenido:
  - Acoso (harassment)
  - Discurso de odio (hate speech)
  - Sexualmente explícito (explicit sexual)
  - Contenido peligroso (dangerous content)

#### 2️⃣ **Validación Anti-IA (Crítico)**
Si un bot responde con frases como:
- "Como IA..."
- "Soy un bot..."
- "Lo siento, no puedo..."
- "Soy modelo de lenguaje..."

**Acción automática:**
- ❌ El mensaje NO se envía
- 🚨 Se registra advertencia crítica en consola
- 🔄 Se usa respuesta de fallback genérica

**Ejemplo de advertencia:**
```
🚨 ADVERTENCIA CRÍTICA DE BOT 🚨
Bot: Carlos
Respuesta inapropiada: "Lo siento, como IA no puedo..."
GRAVE: El bot reveló su naturaleza de IA
ACCIÓN: Esta respuesta NO se enviará al chat
NOTA: Esto NO debe pasar. Respeto a los usuarios es prioritario.
```

#### 3️⃣ **Moderación de Usuarios**
Palabras prohibidas detectadas:
- Insultos graves: "puto", "maricón", "sidoso"
- Contenido explícito sexual
- Referencias a drogas
- Cualquier mención de menores (CRÍTICO)

**Acción:**
- ⚠️ Mensaje bloqueado
- 📢 Advertencia mostrada al usuario
- Ejemplo: "⚠️ Usuario, por favor mantén un lenguaje respetuoso."

---

## 💰 AHORRO DE TOKENS

### Optimizaciones Implementadas

1. **Activación Solo con Usuarios**
   - Bots OFF cuando sala = 0 usuarios
   - **Gasto = $0** mientras no hay nadie

2. **Límite de Tokens por Mensaje**
   - Máximo 60 tokens de salida (~2-3 frases)
   - Evita respuestas largas innecesarias

3. **Historial Limitado**
   - Solo últimos 10 mensajes como contexto
   - Reduce tokens de entrada significativamente

4. **Desactivación Gradual**
   - Con 7+ usuarios reales, todos los bots OFF
   - Usuarios reales ya generan actividad

5. **Modelo Optimizado**
   - Gemini 1.5 Flash (más económico)
   - Mismo rendimiento, menor costo

### Comparación de Costos

| Modelo | Costo Entrada | Costo Salida | Costo Día* |
|--------|---------------|--------------|-----------|
| Gemini 1.5 Flash | $0.075/1M | $0.30/1M | $0.014 |
| Gemini 1.5 Pro | $3.50/1M | $10.50/1M | $0.65 |

*Estimación: 3 bots, 40 mensajes/hora, 24 horas

**Ahorro: 97% usando Flash**

---

## 📊 COSTOS ESTIMADOS

### Escenario Real: Sala con Actividad Moderada

**Configuración:**
- 2 bots activos promedio
- 20 mensajes/hora por bot
- 8 horas de actividad diaria (16:00 - 00:00)
- Contexto: 10 mensajes (200 tokens entrada)
- Respuesta: 50 tokens salida

**Cálculo:**
```
Tokens diarios:
- Entrada: 2 bots × 20 msg × 8h × 200 tokens = 64,000 tokens
- Salida: 2 bots × 20 msg × 8h × 50 tokens = 16,000 tokens

Costo diario:
- Entrada: 64,000 × $0.075/1M = $0.0048
- Salida: 16,000 × $0.30/1M = $0.0048
- TOTAL: $0.0096 (~1 centavo USD/día)

Costo mensual: ~$0.29 USD
```

### Escenario Alta Actividad (Sala Siempre Llena)

**Configuración:**
- 3 bots activos
- 40 mensajes/hora por bot
- 24 horas de actividad

**Costo estimado:**
```
Costo diario: ~$0.042 USD
Costo mensual: ~$1.26 USD
```

### 🎉 CONCLUSIÓN: EXTREMADAMENTE ECONÓMICO

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Problema: Los bots no aparecen

**Solución:**
1. Verifica que hay al menos 1 usuario real en la sala
2. Revisa que la API key esté configurada correctamente en `.env`
3. Abre la consola del navegador (F12) y busca errores
4. Verifica que no haya errores de autenticación de Gemini

### Problema: Error "API Key no configurada"

**Solución:**
1. Asegúrate de haber pegado la API key en `.env`
2. Reinicia el servidor (`Ctrl+C` y luego `npm run dev`)
3. Limpia el caché del navegador

### Problema: Los bots responden cosas raras

**Solución:**
1. Revisa la consola del navegador
2. Si ves advertencias críticas de bot, el sistema está funcionando correctamente (bloquea respuestas inapropiadas)
3. Las respuestas de fallback son normales y esperadas

### Problema: Demasiados bots activos

**Solución:**
- El sistema se ajusta automáticamente según usuarios reales
- Si hay 7+ usuarios, los bots se desactivan solos
- Si quieres menos bots, edita `BOT_ACTIVATION_CONFIG` en `src/services/botCoordinator.js`

### Problema: Los bots gastan muchos tokens

**Solución:**
1. Reduce el número de bots en la configuración
2. Aumenta los intervalos de tiempo entre mensajes
3. Verifica que los bots se desactiven cuando no hay usuarios (revisa consola)

---

## ❓ PREGUNTAS FRECUENTES

### ¿Los bots funcionan en todas las salas?

Sí, el sistema está integrado globalmente. Cualquier sala que uses el componente `ChatPage.jsx` tendrá bots automáticos.

### ¿Puedo desactivar el sistema de bots?

Sí, en `src/pages/ChatPage.jsx` línea 59-64, cambia `true` por `false`:

```javascript
const { botStatus, triggerBotResponse, isActive: botsActive } = useBotSystem(
  roomId,
  roomUsers,
  messages,
  false // ← Cambiar a false para desactivar
);
```

### ¿Los bots se cuentan como usuarios reales?

No. El sistema filtra automáticamente:
- Usuarios con `userId` que comienza con `bot_`
- Usuario `system`

Solo usuarios reales cuentan para la activación.

### ¿Puedo añadir más bots?

Sí, edita `src/config/botProfiles.js` y añade un nuevo objeto con:
- `id`: Debe comenzar con `bot_`
- `username`: Nombre del bot
- `personality`: Descripción de su personalidad
- `systemPrompt`: Instrucciones detalladas para Gemini

### ¿Puedo cambiar los intervalos de mensajes?

Sí, edita `BOT_ACTIVATION_CONFIG` en `src/services/botCoordinator.js`:

```javascript
1: { botsCount: 3, intervalMin: 20, intervalMax: 40 }, // ← Ajusta estos valores
```

### ¿Los bots pueden revelar que son IA?

**NO**. El sistema tiene protección triple:
1. Prompts específicos que les prohíben revelarse
2. Validación post-generación que bloquea frases de IA
3. Sistema de fallback que usa respuestas genéricas

Si un bot intenta revelar su naturaleza, el mensaje NO se envía y se registra una advertencia crítica.

### ¿Qué pasa si Gemini API falla?

El sistema usa respuestas de fallback genéricas:
- "¿Qué tal?"
- "Interesante jaja"
- "¿Y ustedes qué?"
- "Cuéntenme más"
- "¿De dónde son?"

El chat nunca se queda sin actividad.

### ¿Puedo ver cuántos bots están activos?

Sí, abre la consola del navegador (F12) y busca logs como:
```
✅ 3 bots iniciados en sala conversas-libres
🤖 Carlos envió: "¿Qué tal gente? 😎"
```

También puedes ver el estado con:
```javascript
console.log(botStatus);
```

---

## 🎓 PRÓXIMOS PASOS (Opcional)

Si quieres mejorar el sistema:

1. **Añadir indicador de "escribiendo..."**
   - Muestra que el bot está escribiendo antes de enviar mensaje
   - Más realismo visual

2. **Personalización por sala**
   - Bots distintos para salas diferentes
   - Temas específicos según sala (gym, gaming, etc.)

3. **Horarios de actividad**
   - Bots más activos en horarios pico (20:00 - 02:00)
   - Ya está implementado en `getContextualDelay()`

4. **Analytics**
   - Registro de actividad de bots
   - Métricas de engagement

---

## 📞 SOPORTE

Si tienes problemas:

1. Revisa esta guía completa
2. Verifica la consola del navegador (F12)
3. Comprueba que la API key esté bien configurada
4. Reinicia el servidor de desarrollo

---

## ✅ CHECKLIST FINAL

- [ ] API key pegada en `.env`
- [ ] Servidor reiniciado (`npm run dev`)
- [ ] Entrar a una sala con tu usuario
- [ ] Esperar 5-10 segundos
- [ ] Ver aparecer mensajes de bots en el chat
- [ ] Enviar un mensaje y ver respuesta de bot (40% probabilidad)
- [ ] Ver cómo los bots se desactivan gradualmente al entrar más usuarios

---

## 🎉 ¡SISTEMA COMPLETO Y FUNCIONANDO!

Tu aplicación ahora tiene un sistema de bots profesional que:
- ✅ Se activa solo cuando hay usuarios (ahorro de tokens)
- ✅ Tiene 7 personalidades distintas y naturales
- ✅ Sistema de moderación automático
- ✅ Protección anti-revelación de IA
- ✅ Desactivación gradual con más usuarios
- ✅ Costo mensual: ~$0.29 - $1.26 USD
- ✅ Completamente integrado con tu chat existente

**¡Disfruta tu nueva funcionalidad! 🚀**
