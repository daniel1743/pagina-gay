/**
 * 🧹 SCRIPT DE EMERGENCIA: LIMPIAR TODOS LOS BANS
 *
 * Este script elimina TODOS los bans temporales de la base de datos
 * para permitir que usuarios expulsados injustamente puedan volver a chatear
 *
 * INSTRUCCIONES:
 * 1. Abre la aplicación en el navegador
 * 2. Abre la consola (F12)
 * 3. Copia y pega TODO este código
 * 4. Presiona Enter
 * 5. Espera a que termine (mostrará "✅ COMPLETADO")
 */

console.log('🧹 INICIANDO LIMPIEZA DE BANS...\\n');

async function limpiarTodosBans() {
  try {
    // Verificar si Firebase está disponible
    if (typeof db === 'undefined') {
      console.error('❌ Firebase no está disponible en esta consola.');
      console.log('   Asegúrate de estar en la página del chat (no en esta pestaña)\\n');
      return;
    }

    const { collection, getDocs, deleteDoc } = await import('firebase/firestore');

    // 1. Limpiar temp_bans
    console.log('1️⃣ Limpiando temp_bans (expulsiones temporales)...');
    try {
      const tempBansRef = collection(db, 'temp_bans');
      const tempBansSnapshot = await getDocs(tempBansRef);
      console.log(`  📊 Encontrados ${tempBansSnapshot.size} bans temporales`);

      for (const doc of tempBansSnapshot.docs) {
        await deleteDoc(doc.ref);
        console.log(`  ❌ Ban eliminado: ${doc.id}`);
      }
      console.log(`  ✅ ${tempBansSnapshot.size} bans temporales eliminados\\n`);
    } catch (error) {
      console.warn('  ⚠️ Error limpiando temp_bans:', error.message);
      console.log('  Continúa de todas formas...\\n');
    }

    // 2. Limpiar muted_users
    console.log('2️⃣ Limpiando muted_users (usuarios silenciados)...');
    try {
      const mutedUsersRef = collection(db, 'muted_users');
      const mutedUsersSnapshot = await getDocs(mutedUsersRef);
      console.log(`  📊 Encontrados ${mutedUsersSnapshot.size} usuarios silenciados`);

      for (const doc of mutedUsersSnapshot.docs) {
        await deleteDoc(doc.ref);
        console.log(`  ❌ Silencio eliminado: ${doc.id}`);
      }
      console.log(`  ✅ ${mutedUsersSnapshot.size} silencios eliminados\\n`);
    } catch (error) {
      console.warn('  ⚠️ Error limpiando muted_users:', error.message);
      console.log('  Continúa de todas formas...\\n');
    }

    // 3. Limpiar spam_warnings
    console.log('3️⃣ Limpiando spam_warnings (advertencias de spam)...');
    try {
      const spamWarningsRef = collection(db, 'spam_warnings');
      const spamWarningsSnapshot = await getDocs(spamWarningsRef);
      console.log(`  📊 Encontradas ${spamWarningsSnapshot.size} advertencias`);

      for (const doc of spamWarningsSnapshot.docs) {
        await deleteDoc(doc.ref);
        console.log(`  ❌ Advertencia eliminada: ${doc.id}`);
      }
      console.log(`  ✅ ${spamWarningsSnapshot.size} advertencias eliminadas\\n`);
    } catch (error) {
      console.warn('  ⚠️ Error limpiando spam_warnings:', error.message);
      console.log('  Continúa de todas formas...\\n');
    }

    // 4. Limpiar localStorage
    console.log('4️⃣ Limpiando localStorage (caché local)...');
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

    console.log(`  ✅ ${keysToRemove.length} claves eliminadas de localStorage\\n`);

    // 5. Limpiar sessionStorage
    console.log('5️⃣ Limpiando sessionStorage...');
    sessionStorage.clear();
    console.log('  ✅ sessionStorage limpiado\\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ LIMPIEZA COMPLETADA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\\n🔄 RECARGA LA PÁGINA AHORA: Ctrl + Shift + R');
    console.log('📝 Todos los bans han sido eliminados');
    console.log('📝 Los usuarios pueden volver a chatear\\n');

  } catch (error) {
    console.error('❌ ERROR en limpieza:', error);
    console.log('\\n⚠️ Intenta recargar la página: Ctrl + Shift + R');
  }
}

// Ejecutar limpieza
limpiarTodosBans();
