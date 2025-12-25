/**
 * DEBUGGER DE PERMISOS DE TICKETS
 * 
 * Este script intercepta errores de permisos al leer tickets
 * y muestra información detallada para diagnosticar problemas
 */

import { auth, db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Intercepta errores de Firestore y muestra información detallada
 */
export const setupTicketPermissionInterceptor = () => {
  // Interceptar errores de Firestore
  const originalOnError = console.error;
  
  console.error = function(...args) {
    const errorMessage = args[0]?.message || args[0] || '';
    const errorCode = args[0]?.code || '';
    
    // Detectar errores relacionados con tickets y permisos
    if (
      (typeof errorMessage === 'string' && errorMessage.includes('permission')) ||
      errorCode === 'permission-denied' ||
      (typeof errorMessage === 'string' && errorMessage.includes('ticket'))
    ) {
      console.group('🚨 ERROR DE PERMISOS DE TICKETS DETECTADO');
      console.error('Error original:', ...args);
      
      // Obtener información del usuario actual
      getCurrentUserInfo().then(userInfo => {
        console.log('📋 INFORMACIÓN DEL USUARIO ACTUAL:', userInfo);
        validateTicketPermissions(userInfo);
      });
      
      console.groupEnd();
    }
    
    // Llamar al console.error original
    originalOnError.apply(console, args);
  };
  
  return () => {
    console.error = originalOnError;
  };
};

/**
 * Obtiene información del usuario actual
 */
const getCurrentUserInfo = async () => {
  const user = auth.currentUser;
  
  if (!user) {
    return {
      authenticated: false,
      uid: null,
      email: null,
      error: 'Usuario no autenticado'
    };
  }
  
  try {
    // Obtener datos del usuario de Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return {
        authenticated: true,
        uid: user.uid,
        email: user.email,
        firestoreDoc: 'NO EXISTE',
        role: null,
        error: 'Documento de usuario no existe en Firestore'
      };
    }
    
    const userData = userDoc.data();
    
    return {
      authenticated: true,
      uid: user.uid,
      email: user.email,
      firestoreDoc: 'EXISTE',
      role: userData.role || 'NO DEFINIDO',
      username: userData.username,
      isAdmin: userData.role === 'admin' || userData.role === 'administrator',
      isSupport: userData.role === 'support',
      isAdminOrSupport: ['admin', 'administrator', 'support'].includes(userData.role),
      userData: userData
    };
  } catch (error) {
    return {
      authenticated: true,
      uid: user.uid,
      email: user.email,
      error: `Error al obtener datos: ${error.message}`
    };
  }
};

/**
 * Valida los permisos del usuario para tickets
 */
const validateTicketPermissions = async (userInfo) => {
  console.group('🔍 VALIDACIÓN DE PERMISOS');
  
  // Verificación 1: Autenticación
  if (!userInfo.authenticated) {
    console.error('❌ Usuario NO autenticado');
    console.log('SOLUCIÓN: Debes iniciar sesión primero');
    console.groupEnd();
    return;
  }
  
  console.log('✅ Usuario autenticado:', userInfo.email);
  
  // Verificación 2: Documento en Firestore
  if (userInfo.firestoreDoc === 'NO EXISTE') {
    console.error('❌ Documento de usuario NO existe en Firestore');
    console.log('SOLUCIÓN: Crea el documento en users/' + userInfo.uid);
    console.log('Agrega el campo: { "role": "admin" }');
    console.groupEnd();
    return;
  }
  
  console.log('✅ Documento de usuario existe en Firestore');
  
  // Verificación 3: Campo role
  if (!userInfo.role || userInfo.role === 'NO DEFINIDO') {
    console.error('❌ Campo "role" NO está definido');
    console.log('SOLUCIÓN: Agrega el campo "role" a tu documento de usuario');
    console.log('Valores válidos: "admin", "administrator", "support"');
    console.groupEnd();
    return;
  }
  
  console.log('✅ Campo "role" definido:', userInfo.role);
  
  // Verificación 4: Rol válido para tickets
  if (!userInfo.isAdminOrSupport) {
    console.error('❌ Rol NO permite acceso a tickets');
    console.log('Rol actual:', userInfo.role);
    console.log('SOLUCIÓN: Cambia tu rol a "admin", "administrator" o "support"');
    console.groupEnd();
    return;
  }
  
  console.log('✅ Rol válido para acceso a tickets:', userInfo.role);
  
  // Verificación 5: Super Admin (email)
  const isSuperAdmin = userInfo.email === 'caribenosvenezolanos@gmail.com';
  if (isSuperAdmin) {
    console.log('✅ Eres SUPER ADMIN (por email)');
  }
  
  // Resumen
  console.group('📊 RESUMEN DE PERMISOS');
  console.log('Autenticado:', userInfo.authenticated ? '✅' : '❌');
  console.log('Documento existe:', userInfo.firestoreDoc === 'EXISTE' ? '✅' : '❌');
  console.log('Role definido:', userInfo.role ? '✅' : '❌');
  console.log('Role válido:', userInfo.isAdminOrSupport ? '✅' : '❌');
  console.log('Super Admin:', isSuperAdmin ? '✅' : '❌');
  console.log('Puede leer tickets:', (userInfo.isAdminOrSupport || isSuperAdmin) ? '✅ SÍ' : '❌ NO');
  console.groupEnd();
  
  console.groupEnd();
};

/**
 * Función helper para probar acceso a tickets manualmente
 */
export const testTicketAccess = async () => {
  console.group('🧪 PRUEBA DE ACCESO A TICKETS');
  
  const userInfo = await getCurrentUserInfo();
  console.log('Información del usuario:', userInfo);
  
  if (!userInfo.authenticated) {
    console.error('❌ No puedes probar acceso: usuario no autenticado');
    console.groupEnd();
    return false;
  }
  
  if (userInfo.firestoreDoc !== 'EXISTE') {
    console.error('❌ No puedes probar acceso: documento de usuario no existe');
    console.groupEnd();
    return false;
  }
  
  if (!userInfo.isAdminOrSupport && userInfo.email !== 'caribenosvenezolanos@gmail.com') {
    console.error('❌ No puedes probar acceso: rol no válido');
    console.log('Tu rol actual:', userInfo.role);
    console.log('Roles válidos: admin, administrator, support');
    console.groupEnd();
    return false;
  }
  
  try {
    // Intentar leer un ticket de prueba
    const { collection, query, getDocs, limit } = await import('firebase/firestore');
    const ticketsRef = collection(db, 'tickets');
    const q = query(ticketsRef, limit(1));
    const snapshot = await getDocs(q);
    
    console.log('✅ ACCESO EXITOSO - Puedes leer tickets');
    console.log('Tickets encontrados:', snapshot.size);
    console.groupEnd();
    return true;
  } catch (error) {
    console.error('❌ ERROR AL INTENTAR LEER TICKETS:', error);
    console.log('Código de error:', error.code);
    console.log('Mensaje:', error.message);
    validateTicketPermissions(userInfo);
    console.groupEnd();
    return false;
  }
};

/**
 * Función para mostrar instrucciones de solución
 */
export const showFixInstructions = () => {
  console.group('📖 INSTRUCCIONES PARA SOLUCIONAR PROBLEMA DE PERMISOS');
  console.log(`
PASOS PARA DAR ACCESO DE ADMIN:

1. Ve a Firebase Console:
   https://console.firebase.google.com/project/chat-gay-3016f/firestore

2. Navega a la colección "users"

3. Busca tu documento (tu UID)

4. Si NO existe, créalo con estos campos:
   {
     "id": "tu-uid-aqui",
     "username": "TuUsername",
     "email": "tu@email.com",
     "role": "admin"
   }

5. Si YA existe, agrega o modifica el campo:
   "role": "admin"
   
   (Valores válidos: "admin", "administrator", "support")

6. Cierra sesión y vuelve a iniciar sesión

7. Recarga la página

VERIFICACIÓN RÁPIDA:
- Ejecuta en consola: testTicketAccess()
  `);
  console.groupEnd();
};


