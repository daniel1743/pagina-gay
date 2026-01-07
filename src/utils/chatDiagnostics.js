/**
 * 🔍 SISTEMA DE DIAGNÓSTICO DE CHAT
 * 
 * Script para diagnosticar problemas de comunicación entre dispositivos
 * Ejecutar en consola F12: window.runChatDiagnostics()
 */

import { db, auth } from '@/config/firebase';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';

let diagnosticsActive = false;
let messageListener = null;
let errorLog = [];

/**
 * Función principal de diagnóstico
 */
export const runChatDiagnostics = async (roomId = 'principal') => {
  console.log('%c🔍 INICIANDO DIAGNÓSTICO DE CHAT', 'color: #00ff00; font-weight: bold; font-size: 16px');
  console.log('═'.repeat(60));
  
  diagnosticsActive = true;
  errorLog = [];

  // 1. Verificar autenticación
  await checkAuthentication();
  
  // 2. Verificar conexión a Firestore
  await checkFirestoreConnection();
  
  // 3. Verificar usuario actual
  await checkCurrentUser();
  
  // 4. Verificar suscripción a mensajes
  await checkMessageSubscription(roomId);
  
  // 5. Verificar permisos de Firestore
  await checkFirestorePermissions(roomId);
  
  // 6. Monitorear errores en tiempo real
  startErrorMonitoring();
  
  // 7. Monitorear mensajes en tiempo real
  await monitorMessages(roomId);
  
  console.log('%c✅ DIAGNÓSTICO ACTIVO - Monitoreando en tiempo real...', 'color: #00ff00; font-weight: bold');
  console.log('═'.repeat(60));
  console.log('💡 Usa window.stopChatDiagnostics() para detener el monitoreo');
  
  return {
    stop: () => stopDiagnostics(),
    getErrors: () => errorLog,
    clearErrors: () => { errorLog = []; }
  };
};

/**
 * 1. Verificar autenticación
 */
const checkAuthentication = async () => {
  console.log('\n%c[1] VERIFICANDO AUTENTICACIÓN', 'color: #ffaa00; font-weight: bold');
  
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('❌ NO HAY USUARIO AUTENTICADO');
      errorLog.push({ type: 'auth', error: 'No hay usuario autenticado', timestamp: Date.now() });
      return false;
    }
    
    console.log('✅ Usuario autenticado:', {
      uid: currentUser.uid,
      isAnonymous: currentUser.isAnonymous,
      email: currentUser.email || 'N/A',
      providerId: currentUser.providerId
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error verificando autenticación:', error);
    errorLog.push({ type: 'auth', error: error.message, timestamp: Date.now() });
    return false;
  }
};

/**
 * 2. Verificar conexión a Firestore
 */
const checkFirestoreConnection = async () => {
  console.log('\n%c[2] VERIFICANDO CONEXIÓN A FIRESTORE', 'color: #ffaa00; font-weight: bold');
  
  try {
    // Intentar leer una colección de prueba
    const testRef = collection(db, 'rooms');
    const snapshot = await getDocs(query(testRef, limit(1)));
    
    console.log('✅ Firestore conectado:', {
      projectId: db.app.options.projectId,
      databaseId: db.app.options.databaseId || '(default)',
      canRead: true
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a Firestore:', error);
    errorLog.push({ 
      type: 'firestore_connection', 
      error: error.message, 
      code: error.code,
      timestamp: Date.now() 
    });
    return false;
  }
};

/**
 * 3. Verificar usuario actual
 */
const checkCurrentUser = async () => {
  console.log('\n%c[3] VERIFICANDO DATOS DEL USUARIO', 'color: #ffaa00; font-weight: bold');
  
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ No hay usuario para verificar');
      return false;
    }
    
    // Verificar datos del usuario en Firestore
    const { doc, getDoc } = await import('firebase/firestore');
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    const issues = [];
    
    if (!userDoc.exists) {
      issues.push('Usuario no existe en Firestore /users');
    } else {
      const userData = userDoc.data();
      
      if (!userData.username) issues.push('Falta username');
      if (!userData.avatar) issues.push('Falta avatar');
      if (!userData.id) issues.push('Falta id');
      
      console.log('📋 Datos del usuario:', {
        exists: true,
        username: userData.username || '❌ FALTA',
        avatar: userData.avatar || '❌ FALTA',
        id: userData.id || '❌ FALTA',
        role: userData.role || 'N/A',
        isPremium: userData.isPremium || false,
        verified: userData.verified || false
      });
    }
    
    if (issues.length > 0) {
      console.warn('⚠️ Problemas encontrados:', issues);
      errorLog.push({ 
        type: 'user_data', 
        issues, 
        timestamp: Date.now() 
      });
    } else {
      console.log('✅ Datos del usuario completos');
    }
    
    return issues.length === 0;
  } catch (error) {
    console.error('❌ Error verificando usuario:', error);
    errorLog.push({ 
      type: 'user_check', 
      error: error.message, 
      timestamp: Date.now() 
    });
    return false;
  }
};

/**
 * 4. Verificar suscripción a mensajes
 */
const checkMessageSubscription = async (roomId) => {
  console.log('\n%c[4] VERIFICANDO SUSCRIPCIÓN A MENSAJES', 'color: #ffaa00; font-weight: bold');
  
  try {
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(5));
    
    const snapshot = await getDocs(q);
    
    console.log('✅ Suscripción verificada:', {
      roomId,
      messagesInRoom: snapshot.size,
      canRead: true
    });
    
    if (snapshot.size === 0) {
      console.warn('⚠️ No hay mensajes en la sala (puede ser normal si es nueva)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error verificando suscripción:', error);
    errorLog.push({ 
      type: 'subscription', 
      error: error.message, 
      code: error.code,
      roomId,
      timestamp: Date.now() 
    });
    return false;
  }
};

/**
 * 5. Verificar permisos de Firestore
 */
const checkFirestorePermissions = async (roomId) => {
  console.log('\n%c[5] VERIFICANDO PERMISOS DE FIRESTORE', 'color: #ffaa00; font-weight: bold');
  
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ No hay usuario para verificar permisos');
      return false;
    }
    
    // Intentar escribir un mensaje de prueba (sin guardarlo realmente)
    const testMessage = {
      userId: currentUser.uid,
      username: 'TEST_DIAGNOSTIC',
      content: 'TEST_MESSAGE',
      type: 'text',
      timestamp: new Date()
    };
    
    console.log('📝 Intentando validar permisos de escritura...');
    console.log('💡 Si ves un error de "permission-denied", las reglas de Firestore están bloqueando');
    
    // No escribimos realmente, solo verificamos que tenemos acceso
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const testQuery = query(messagesRef, limit(1));
    await getDocs(testQuery);
    
    console.log('✅ Permisos de lectura OK');
    console.log('⚠️ Permisos de escritura: No se pueden verificar sin escribir (verificar manualmente)');
    
    return true;
  } catch (error) {
    console.error('❌ Error de permisos:', error);
    
    if (error.code === 'permission-denied') {
      console.error('🚫 PERMISO DENEGADO - Verificar Firestore Rules');
      errorLog.push({ 
        type: 'permissions', 
        error: 'Permission denied', 
        code: error.code,
        suggestion: 'Verificar firestore.rules',
        timestamp: Date.now() 
      });
    } else {
      errorLog.push({ 
        type: 'permissions', 
        error: error.message, 
        code: error.code,
        timestamp: Date.now() 
      });
    }
    
    return false;
  }
};

/**
 * 6. Monitorear errores en tiempo real
 */
const startErrorMonitoring = () => {
  console.log('\n%c[6] INICIANDO MONITOREO DE ERRORES', 'color: #ffaa00; font-weight: bold');
  
  // Interceptar console.error
  const originalError = console.error;
  console.error = (...args) => {
    const errorText = args.join(' ');
    
    // Filtrar errores relevantes
    if (
      errorText.includes('Firestore') ||
      errorText.includes('permission-denied') ||
      errorText.includes('unavailable') ||
      errorText.includes('failed') ||
      errorText.includes('error') ||
      errorText.includes('Error')
    ) {
      errorLog.push({
        type: 'runtime_error',
        error: errorText,
        timestamp: Date.now(),
        stack: new Error().stack
      });
      
      console.log('%c🚨 ERROR DETECTADO:', 'color: #ff0000; font-weight: bold', errorText);
    }
    
    originalError.apply(console, args);
  };
  
  console.log('✅ Monitoreo de errores activo');
};

/**
 * 7. Monitorear mensajes en tiempo real
 */
const monitorMessages = async (roomId) => {
  console.log('\n%c[7] MONITOREANDO MENSAJES EN TIEMPO REAL', 'color: #ffaa00; font-weight: bold');
  
  try {
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));
    
    let lastMessageCount = 0;
    let lastMessageTime = Date.now();
    
    messageListener = onSnapshot(
      q,
      (snapshot) => {
        const currentCount = snapshot.size;
        const currentTime = Date.now();
        const timeSinceLastMessage = currentTime - lastMessageTime;
        
        console.log(`%c📨 Snapshot recibido:`, 'color: #00aaff; font-weight: bold', {
          mensajes: currentCount,
          nuevos: currentCount > lastMessageCount ? currentCount - lastMessageCount : 0,
          tiempoDesdeUltimo: `${timeSinceLastMessage}ms`,
          desdeCache: snapshot.metadata.fromCache ? '⚠️ CACHÉ' : '✅ TIEMPO REAL',
          tienePendientes: snapshot.metadata.hasPendingWrites
        });
        
        if (snapshot.metadata.fromCache) {
          console.warn('⚠️ DATOS DESDE CACHÉ - Puede que no estés recibiendo mensajes en tiempo real');
          errorLog.push({
            type: 'cache_warning',
            message: 'Datos desde caché, posible problema de conexión',
            timestamp: Date.now()
          });
        }
        
        if (currentCount > lastMessageCount) {
          const newMessages = snapshot.docs.slice(0, currentCount - lastMessageCount);
          newMessages.forEach((doc, index) => {
            const data = doc.data();
            console.log(`%c📬 Nuevo mensaje ${index + 1}:`, 'color: #00ff00', {
              id: doc.id.substring(0, 8),
              de: data.username,
              contenido: data.content?.substring(0, 30) + '...',
              timestamp: data.timestamp?.toDate?.() || 'N/A'
            });
          });
        }
        
        lastMessageCount = currentCount;
        lastMessageTime = currentTime;
      },
      (error) => {
        console.error('❌ Error en listener de mensajes:', error);
        errorLog.push({
          type: 'message_listener_error',
          error: error.message,
          code: error.code,
          timestamp: Date.now()
        });
      }
    );
    
    console.log('✅ Listener de mensajes activo');
  } catch (error) {
    console.error('❌ Error iniciando monitoreo:', error);
    errorLog.push({
      type: 'monitor_error',
      error: error.message,
      timestamp: Date.now()
    });
  }
};

/**
 * Detener diagnóstico
 */
const stopDiagnostics = () => {
  console.log('%c🛑 DETENIENDO DIAGNÓSTICO', 'color: #ff0000; font-weight: bold');
  
  diagnosticsActive = false;
  
  if (messageListener) {
    messageListener();
    messageListener = null;
  }
  
  console.log('✅ Diagnóstico detenido');
  console.log('📊 Errores registrados:', errorLog.length);
  
  if (errorLog.length > 0) {
    console.log('\n%c📋 RESUMEN DE ERRORES:', 'color: #ffaa00; font-weight: bold');
    errorLog.forEach((err, index) => {
      console.log(`${index + 1}. [${err.type}] ${err.error || err.message || 'Sin detalles'}`);
    });
  }
};

// Exportar para uso en consola
if (typeof window !== 'undefined') {
  window.runChatDiagnostics = runChatDiagnostics;
  window.stopChatDiagnostics = stopDiagnostics;
  window.getChatDiagnosticsErrors = () => errorLog;
  window.clearChatDiagnosticsErrors = () => { errorLog = []; };
}

export default {
  run: runChatDiagnostics,
  stop: stopDiagnostics,
  getErrors: () => errorLog,
  clearErrors: () => { errorLog = []; }
};




