/**
 * 🚨 SCRIPT DE EMERGENCIA: DESBLOQUEAR TODOS LOS USUARIOS
 *
 * INSTRUCCIONES:
 * 1. Abre la aplicación en el navegador
 * 2. Abre la consola (F12)
 * 3. Copia y pega TODO este código
 * 4. Presiona Enter
 * 5. Espera a que termine (mostrará "✅ COMPLETADO")
 */

console.log('🚨 INICIANDO LIMPIEZA DE EMERGENCIA...\n');

async function desbloquearTodos() {
  try {
    // Limpiar localStorage (bans temporales)
    console.log('1️⃣ Limpiando localStorage...');
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('temp_ban') ||
        key.includes('mute') ||
        key.includes('spam_warning') ||
        key.includes('rate_limit')
      )) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      console.log(`  ❌ Removiendo: ${key}`);
      localStorage.removeItem(key);
    });

    console.log(`  ✅ ${keysToRemove.length} claves removidas de localStorage\n`);

    // Limpiar sessionStorage
    console.log('2️⃣ Limpiando sessionStorage...');
    sessionStorage.clear();
    console.log('  ✅ sessionStorage limpiado\n');

    // Verificar si hay acceso a Firebase
    if (typeof db === 'undefined') {
      console.warn('⚠️ Firebase no está disponible en esta consola.');
      console.log('   Pero localStorage ya fue limpiado, recarga la página (Ctrl+Shift+R)\n');
      return;
    }

    // Limpiar Firestore (si Firebase está disponible)
    console.log('3️⃣ Limpiando Firestore...');

    try {
      const { collection, getDocs, deleteDoc } = await import('firebase/firestore');

      // Limpiar temp_bans
      const tempBansRef = collection(db, 'temp_bans');
      const tempBansSnapshot = await getDocs(tempBansRef);
      console.log(`  📊 Encontrados ${tempBansSnapshot.size} bans temporales`);

      for (const doc of tempBansSnapshot.docs) {
        await deleteDoc(doc.ref);
        console.log(`  ❌ Ban removido: ${doc.id}`);
      }

      // Limpiar muted_users
      const mutedUsersRef = collection(db, 'muted_users');
      const mutedUsersSnapshot = await getDocs(mutedUsersRef);
      console.log(`  📊 Encontrados ${mutedUsersSnapshot.size} usuarios muteados`);

      for (const doc of mutedUsersSnapshot.docs) {
        await deleteDoc(doc.ref);
        console.log(`  ❌ Mute removido: ${doc.id}`);
      }

      // Limpiar spam_warnings
      const spamWarningsRef = collection(db, 'spam_warnings');
      const spamWarningsSnapshot = await getDocs(spamWarningsRef);
      console.log(`  📊 Encontradas ${spamWarningsSnapshot.size} advertencias de spam`);

      for (const doc of spamWarningsSnapshot.docs) {
        await deleteDoc(doc.ref);
        console.log(`  ❌ Advertencia removida: ${doc.id}`);
      }

      console.log('  ✅ Firestore limpiado\n');
    } catch (firestoreError) {
      console.warn('⚠️ Error limpiando Firestore:', firestoreError.message);
      console.log('   Continúa de todas formas...\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ LIMPIEZA COMPLETADA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔄 RECARGA LA PÁGINA AHORA: Ctrl + Shift + R');
    console.log('📝 Después de recargar, intenta enviar un mensaje\n');

  } catch (error) {
    console.error('❌ ERROR en limpieza:', error);
    console.log('\n⚠️ Intenta recargar la página manualmente: Ctrl + Shift + R');
  }
}

// Ejecutar limpieza
desbloquearTodos();
