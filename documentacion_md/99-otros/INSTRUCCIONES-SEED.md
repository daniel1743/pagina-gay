# 🌱 INSTRUCCIONES: Sembrar Conversaciones Reales

## Método 1: Desde la Aplicación Web (RECOMENDADO)

### Paso 1: Inicia tu aplicación
```bash
cd "C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat"
npm run dev
```

### Paso 2: Abre el navegador
```
http://localhost:5173/seed-conversaciones
```

### Paso 3: Inicia sesión
- Inicia sesión con tu cuenta (Danin)

### Paso 4: Haz clic en "Sembrar Conversaciones"
- Verás el progreso en tiempo real
- En ~30 segundos tendrás todas las conversaciones

---

## Método 2: Desde la Consola del Navegador (RÁPIDO)

### Paso 1: Abre tu aplicación y ve a la sala principal
```
http://localhost:5173/chat/principal
```

### Paso 2: Abre la consola del navegador
- Presiona `F12`
- Ve a la pestaña "Console"

### Paso 3: Copia y pega este código:

```javascript
// 🌱 SCRIPT DE SEED - Ejecutar desde consola del navegador
(async function() {
  const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

  const USUARIOS_REALES = [
    { id: 'user_matias_real', username: 'Matías', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Matias' },
    { id: 'user_diego_real', username: 'Diego', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diego' },
    { id: 'user_lucas_real', username: 'Lucas', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas' },
    { id: 'user_seba_real', username: 'Seba', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Seba' },
    { id: 'user_nico_real', username: 'Nico', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nico' },
    { id: 'user_franco_real', username: 'Franco', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Franco' },
    { id: 'user_martin_real', username: 'Martín', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Martin' },
    { id: 'user_pablo_real', username: 'Pablo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pablo' },
    { id: 'user_ale_real', username: 'Ale', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ale' },
    { id: 'user_tomi_real', username: 'Tomi', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tomi' }
  ];

  const CONVERSACIONES = [
    {
      tema: "Gym y encuentro",
      mensajes: [
        { user: 0, text: "wena cabros, recién saliendo del gym 💪" },
        { user: 1, text: "uff q rico, yo toy recién llegando a la casa" },
        { user: 0, text: "jaja toy re sudado todavia" },
        { user: 2, text: "y solo? 👀" },
        { user: 0, text: "sip jaja, toy re caliente después de entrenar" },
        { user: 1, text: "te creo wn, el gym me deja re horny" },
        { user: 2, text: "deberíamos juntarnos algún dia después del gym jaja" },
        { user: 0, text: "me tinca! cuando quieran" },
        { user: 1, text: "mañana voy al gym a las 7, si quieren nos juntamos despues 😏" },
        { user: 2, text: "dale! yo puedo" },
        { user: 0, text: "perfecto, mañana nos vemos entonces" }
      ]
    },
    {
      tema: "Apps de ligue",
      mensajes: [
        { user: 3, text: "alguien usa grindr aca?" },
        { user: 4, text: "si wn, pero puro ghosting" },
        { user: 3, text: "jaja te creo, yo igual" },
        { user: 5, text: "es verdad, hablas con alguien y desaparece" },
        { user: 4, text: "yo prefiero tinder, es menos directo" },
        { user: 3, text: "tinder ta bueno pero hay poco match gay" },
        { user: 5, text: "prueben scruff, ahi hay mas onda" },
        { user: 4, text: "scruff es bueno si te gustan los osos jaja" },
        { user: 3, text: "me gustan de todo tipo la verdad 😅" },
        { user: 5, text: "same! versatil en todo sentido jaja" },
        { user: 4, text: "jajaja lo mejor es ser abierto" }
      ]
    },
    {
      tema: "Primera vez",
      mensajes: [
        { user: 6, text: "cabros, recuerdan su primera vez?" },
        { user: 7, text: "jaja si, fue re awkward" },
        { user: 6, text: "cuenta po!" },
        { user: 7, text: "fue con un amigo de la u, los dos re nerviosos" },
        { user: 8, text: "jaja esas son las mejores, sin presión" },
        { user: 7, text: "si wn, pero no caché nada jaja" },
        { user: 6, text: "bueno pero lo pasaron bien?" },
        { user: 7, text: "sii, después repetimos varias veces mas 😏" },
        { user: 8, text: "jaja esa es la actitud" },
        { user: 6, text: "yo la mía fue con alguien de grindr" },
        { user: 7, text: "y como te fue?" },
        { user: 6, text: "bien! el wn sabia lo q hacia, me enseñó caleta" },
        { user: 8, text: "que buena experiencia entonces" }
      ]
    },
    {
      tema: "Finde de carrete",
      mensajes: [
        { user: 1, text: "q planes para el finde?" },
        { user: 2, text: "nose, pensaba ir a boliche" },
        { user: 3, text: "cual? fausto?" },
        { user: 2, text: "sipi, fausto o bunker" },
        { user: 1, text: "bunker ta bueno, harta gente linda" },
        { user: 3, text: "jaja toy viendo, me tinca" },
        { user: 2, text: "vamos los 3 entonces?" },
        { user: 1, text: "dale! el sábado?" },
        { user: 3, text: "perfecto, nos juntamos antes a tomarnos algo" },
        { user: 2, text: "sii, pre en mi depa" },
        { user: 1, text: "va, llevo ron 🍹" }
      ]
    },
    {
      tema: "Post-noche caliente",
      mensajes: [
        { user: 4, text: "wn me desperté recién" },
        { user: 5, text: "jaja q hora te acostaste?" },
        { user: 4, text: "como a las 5am, llegué con alguien del bunker" },
        { user: 5, text: "uhhh q rico! y como estuvo?" },
        { user: 4, text: "la raja wn, el cabro sabia 😏" },
        { user: 6, text: "jaja cuentanos mas" },
        { user: 4, text: "jaja nah privado eso" },
        { user: 5, text: "al menos la pasaste bien entonces" },
        { user: 4, text: "sii, re bien jaja" },
        { user: 6, text: "yo toy en la misma, llegue re tarde" },
        { user: 5, text: "parece q todos tuvieron buena noche jaja" }
      ]
    }
  ];

  console.log('🌱 Iniciando seed de conversaciones...');

  let baseTime = Date.now() - (24 * 60 * 60 * 1000);
  let total = 0;

  for (let convIndex = 0; convIndex < CONVERSACIONES.length; convIndex++) {
    const conv = CONVERSACIONES[convIndex];
    console.log(`📝 Sembrando: "${conv.tema}"`);

    for (let msgIndex = 0; msgIndex < conv.mensajes.length; msgIndex++) {
      const msg = conv.mensajes[msgIndex];
      const usuario = USUARIOS_REALES[msg.user];

      // Usar la referencia de db que ya existe en tu aplicación
      const messagesRef = collection(window.db || db, 'rooms', 'principal', 'messages');

      await addDoc(messagesRef, {
        userId: usuario.id,
        username: usuario.username,
        avatar: usuario.avatar,
        content: msg.text,
        timestamp: new Date(baseTime + ((convIndex * 2 * 60 * 60 * 1000) + (msgIndex * 45000))),
        type: 'text',
        isPremium: false,
        reactions: {}
      });

      total++;
      await new Promise(r => setTimeout(r, 50));
    }

    console.log(`   ✅ Completado "${conv.tema}"`);
  }

  console.log(`✅ SEED COMPLETADO: ${total} mensajes en ${CONVERSACIONES.length} conversaciones`);
  alert(`✅ Conversaciones sembradas exitosamente!\n\n${total} mensajes en la sala principal`);
})();
```

### Paso 4: Presiona Enter
- El script se ejecutará automáticamente
- Verás el progreso en la consola
- Al finalizar aparecerá un alert de confirmación

---

## ⚠️ Si tienes errores de permisos

Ve a Firebase Console → Firestore → Reglas y cambia temporalmente a:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId}/messages/{messageId} {
      allow read: if true;
      allow write: if request.auth != null; // Solo usuarios autenticados
    }
    match /{document=**} {
      allow read: if true;
    }
  }
}
```

---

## 📊 Resultado Esperado

Después de ejecutar el seed, verás en la sala "principal":

- ✅ 5 conversaciones coherentes
- ✅ ~50+ mensajes
- ✅ Conversaciones morbosas pero naturales
- ✅ Diferentes temas (gym, apps, sexo, carrete)
- ✅ Usuarios que parecen REALES

---

## 🎯 ¿Qué hacer después?

1. Ve a la sala "principal": `http://localhost:5173/chat/principal`
2. Verás el historial de conversaciones
3. Las personas que entren pensarán: "Aquí hubo gente real!"
4. ¡Listo! Tu sala tiene vida

---

¿Problemas? Contáctame y te ayudo.
