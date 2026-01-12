/**
 * SISTEMA DE DEBUGGING PARA PANEL ADMIN
 *
 * Características:
 * - Detecta automáticamente si el usuario es admin
 * - Intercepta TODOS los errores del panel admin
 * - Identifica la fuente del error
 * - Sugiere soluciones basadas en el contexto
 * - Log visual en consola con colores
 */

// ⚡ FIX CRÍTICO: Usar instancias singleton exportadas de firebase.js
// NO crear nuevas instancias con getAuth()/getFirestore()
import { auth, db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';

// ============================
// CONFIGURACIÓN
// ============================

const DEBUG_CONFIG = {
  enabled: true,
  logToConsole: true,
  logToUI: true,
  autoCheck: true,
  verboseMode: true
};

// ============================
// ESTILOS PARA CONSOLA
// ============================

const CONSOLE_STYLES = {
  title: 'background: #8B5CF6; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold;',
  success: 'background: #10B981; color: white; padding: 2px 6px; border-radius: 3px;',
  error: 'background: #EF4444; color: white; padding: 2px 6px; border-radius: 3px;',
  warning: 'background: #F59E0B; color: white; padding: 2px 6px; border-radius: 3px;',
  info: 'background: #3B82F6; color: white; padding: 2px 6px; border-radius: 3px;',
  code: 'background: #1F2937; color: #10B981; padding: 2px 6px; border-radius: 3px; font-family: monospace;',
  divider: 'color: #6B7280; font-weight: bold;'
};

// ============================
// VERIFICACIÓN DE ROL ADMIN
// ============================

export const checkAdminStatus = async () => {
  // ⚡ Usar instancias singleton importadas (auth, db ya están disponibles)

  console.log('%c🔍 ADMIN DEBUGGER - Verificación de Permisos', CONSOLE_STYLES.title);
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', CONSOLE_STYLES.divider);

  // 1. Verificar autenticación
  if (!auth.currentUser) {
    console.log('%c❌ NO AUTENTICADO', CONSOLE_STYLES.error);
    console.log('   → Debes iniciar sesión primero');
    return {
      isAdmin: false,
      error: 'not_authenticated',
      message: 'Usuario no autenticado'
    };
  }

  console.log('%c✅ AUTENTICADO', CONSOLE_STYLES.success);
  console.log('   Email:', auth.currentUser.email);
  console.log('   UID:', auth.currentUser.uid);

  // 2. Verificar email de super admin
  const isSuperAdmin = auth.currentUser.email === 'caribenosvenezolanos@gmail.com';

  if (isSuperAdmin) {
    console.log('%c👑 SUPER ADMIN DETECTADO', CONSOLE_STYLES.success);
    console.log('   → Acceso prioritario garantizado por email');
  }

  // 3. Verificar rol en Firestore
  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('%c❌ DOCUMENTO DE USUARIO NO EXISTE', CONSOLE_STYLES.error);
      console.log('   → Ruta:', `users/${auth.currentUser.uid}`);
      console.log('   → El usuario debe tener un documento en Firestore');

      return {
        isAdmin: isSuperAdmin,
        isSuperAdmin,
        error: 'user_doc_missing',
        message: 'Documento de usuario no existe en Firestore'
      };
    }

    const userData = userDoc.data();
    const role = userData.role;

    console.log('%c📋 DATOS DEL USUARIO', CONSOLE_STYLES.info);
    console.log('   Username:', userData.username || 'N/A');
    console.log('   Email:', userData.email || 'N/A');
    console.log('   Role:', role || '❌ NO TIENE CAMPO ROLE');
    console.log('   Premium:', userData.isPremium ? 'Sí' : 'No');

    // Verificar rol válido
    const validRoles = ['admin', 'administrator', 'support'];
    const hasValidRole = role && validRoles.includes(role);

    if (hasValidRole) {
      console.log('%c✅ ROL VÁLIDO DETECTADO', CONSOLE_STYLES.success);
      console.log('   → Rol:', role.toUpperCase());
      console.log('   → Permisos de admin/support activos');
    } else {
      console.log('%c❌ ROL NO VÁLIDO', CONSOLE_STYLES.error);
      console.log('   → Rol actual:', role || 'undefined');
      console.log('   → Roles válidos:', validRoles.join(', '));

      if (isSuperAdmin) {
        console.log('%c⚠️  ADVERTENCIA', CONSOLE_STYLES.warning);
        console.log('   → Aunque no tienes rol válido, eres SUPER ADMIN');
        console.log('   → Deberías tener acceso de todas formas');
      }
    }

    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', CONSOLE_STYLES.divider);

    // Resultado final
    const isAdmin = hasValidRole || isSuperAdmin;

    if (isAdmin) {
      console.log('%c🎉 RESULTADO: ACCESO DE ADMIN CONFIRMADO', CONSOLE_STYLES.success);
      console.log('   Motivo:', hasValidRole ? `Rol: ${role}` : 'Super Admin por email');
    } else {
      console.log('%c❌ RESULTADO: SIN ACCESO DE ADMIN', CONSOLE_STYLES.error);
      console.log('%c🔧 SOLUCIÓN:', CONSOLE_STYLES.warning);
      console.log('   1. Ve a Firebase Console → Firestore');
      console.log('   2. Busca: users/' + auth.currentUser.uid);
      console.log('   3. Agrega campo: role = "admin"');
      console.log('   4. Cierra sesión y vuelve a entrar');
    }

    return {
      isAdmin,
      isSuperAdmin,
      hasValidRole,
      role,
      userData,
      uid: auth.currentUser.uid,
      email: auth.currentUser.email
    };

  } catch (error) {
    console.log('%c❌ ERROR AL VERIFICAR ROL', CONSOLE_STYLES.error);
    console.error('   Error:', error.message);
    console.log('   Code:', error.code);

    console.log('%c🔧 POSIBLES CAUSAS:', CONSOLE_STYLES.warning);
    console.log('   1. Firestore Rules no permiten leer /users');
    console.log('   2. No tienes conexión a internet');
    console.log('   3. Firestore Rules no están desplegadas');

    console.log('%c💡 SOLUCIÓN SUGERIDA:', CONSOLE_STYLES.info);
    console.log('   Ejecuta: firebase deploy --only firestore:rules');

    return {
      isAdmin: isSuperAdmin,
      isSuperAdmin,
      error: error.code || 'unknown',
      message: error.message,
      suggestion: 'Desplegar Firestore Rules'
    };
  }
};

// ============================
// DIAGNÓSTICO DE PERMISOS
// ============================

export const diagnosePermissions = async () => {
  // ⚡ Usar instancias singleton importadas (auth, db ya están disponibles)

  console.log('%c🔬 DIAGNÓSTICO COMPLETO DE PERMISOS', CONSOLE_STYLES.title);
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', CONSOLE_STYLES.divider);

  const tests = [];

  // Test 1: Leer colección de usuarios
  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await getDoc(userRef);
    tests.push({
      name: 'Leer /users/{uid}',
      status: 'success',
      message: 'Puede leer su documento de usuario'
    });
  } catch (error) {
    tests.push({
      name: 'Leer /users/{uid}',
      status: 'error',
      message: error.message,
      code: error.code,
      solution: 'Verificar Firestore Rules para /users'
    });
  }

  // Test 2: Leer colección de tickets
  try {
    const { collection, query, limit, getDocs } = await import('firebase/firestore');
    const ticketsRef = collection(db, 'tickets');
    const q = query(ticketsRef, limit(1));
    const snapshot = await getDocs(q);

    tests.push({
      name: 'Leer /tickets (colección)',
      status: 'success',
      message: `Puede leer tickets (${snapshot.size} encontrados)`
    });
  } catch (error) {
    tests.push({
      name: 'Leer /tickets (colección)',
      status: 'error',
      message: error.message,
      code: error.code,
      solution: 'Verificar que tienes rol de admin/support en Firestore'
    });
  }

  // Test 3: Verificar token de autenticación
  try {
    const token = await auth.currentUser.getIdTokenResult();
    tests.push({
      name: 'Token de autenticación',
      status: 'success',
      message: 'Token válido',
      details: {
        email: token.claims.email,
        signInProvider: token.signInProvider
      }
    });
  } catch (error) {
    tests.push({
      name: 'Token de autenticación',
      status: 'error',
      message: error.message,
      solution: 'Cerrar sesión y volver a iniciar sesión'
    });
  }

  // Mostrar resultados
  console.log('\n📊 RESULTADOS DE LAS PRUEBAS:\n');

  tests.forEach((test, index) => {
    const icon = test.status === 'success' ? '✅' : '❌';
    const style = test.status === 'success' ? CONSOLE_STYLES.success : CONSOLE_STYLES.error;

    console.log(`%c${icon} Test ${index + 1}: ${test.name}`, style);
    console.log('   →', test.message);

    if (test.code) {
      console.log('   Código:', test.code);
    }

    if (test.details) {
      console.log('   Detalles:', test.details);
    }

    if (test.solution) {
      console.log('%c   💡 Solución:', CONSOLE_STYLES.warning, test.solution);
    }

    console.log('');
  });

  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', CONSOLE_STYLES.divider);

  const successCount = tests.filter(t => t.status === 'success').length;
  const totalCount = tests.length;

  if (successCount === totalCount) {
    console.log('%c🎉 TODOS LOS TESTS PASARON', CONSOLE_STYLES.success);
    console.log('   → El sistema está funcionando correctamente');
  } else {
    console.log('%c⚠️  ALGUNOS TESTS FALLARON', CONSOLE_STYLES.warning);
    console.log(`   → ${successCount}/${totalCount} tests pasaron`);
    console.log('   → Revisa las soluciones sugeridas arriba');
  }

  return tests;
};

// ============================
// INTERCEPTOR DE ERRORES
// ============================

export const setupErrorInterceptor = () => {
  // Guardar handlers originales
  const originalError = console.error;
  const originalWarn = console.warn;

  // Interceptar console.error
  console.error = (...args) => {
    originalError.apply(console, args);
    analyzeError(args);
  };

  // Interceptar console.warn
  console.warn = (...args) => {
    originalWarn.apply(console, args);
    analyzeWarning(args);
  };

  // Interceptar errores no capturados
  window.addEventListener('error', (event) => {
    console.log('%c🚨 ERROR NO CAPTURADO DETECTADO', CONSOLE_STYLES.error);
    console.log('   Mensaje:', event.message);
    console.log('   Archivo:', event.filename);
    console.log('   Línea:', event.lineno);
    console.log('   Columna:', event.colno);

    analyzeError([event.message, event.error]);
  });

  // Interceptar promesas rechazadas
  window.addEventListener('unhandledrejection', (event) => {
    console.log('%c🚨 PROMESA RECHAZADA NO MANEJADA', CONSOLE_STYLES.error);
    console.log('   Razón:', event.reason);

    analyzeError([event.reason]);
  });

  console.log('%c✅ Interceptor de errores activado', CONSOLE_STYLES.success);

  // Retornar función de cleanup
  return () => {
    console.error = originalError;
    console.warn = originalWarn;
  };
};

// ============================
// ANÁLISIS INTELIGENTE DE ERRORES
// ============================

const analyzeError = (errorArgs) => {
  const errorText = errorArgs.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');

  console.log('%c🔍 ANÁLISIS AUTOMÁTICO DEL ERROR', CONSOLE_STYLES.title);
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', CONSOLE_STYLES.divider);

  // Detectar tipo de error
  const errorType = detectErrorType(errorText);

  console.log('%c📝 TIPO DE ERROR:', CONSOLE_STYLES.info, errorType.type);
  console.log('%c📍 ORIGEN:', CONSOLE_STYLES.info, errorType.source);
  console.log('%c❓ CAUSA PROBABLE:', CONSOLE_STYLES.warning);
  errorType.causes.forEach(cause => console.log(`   • ${cause}`));

  console.log('%c🔧 SOLUCIONES SUGERIDAS:', CONSOLE_STYLES.success);
  errorType.solutions.forEach((solution, index) => {
    console.log(`   ${index + 1}. ${solution}`);
  });

  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', CONSOLE_STYLES.divider);
};

const analyzeWarning = (warningArgs) => {
  const warningText = warningArgs.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');

  // Solo analizar advertencias importantes
  if (warningText.includes('Index missing') ||
      warningText.includes('permission') ||
      warningText.includes('Firestore')) {

    console.log('%c⚠️  ADVERTENCIA IMPORTANTE DETECTADA', CONSOLE_STYLES.warning);
    console.log('   Mensaje:', warningText);

    if (warningText.includes('Index missing')) {
      console.log('%c💡 SOLUCIÓN:', CONSOLE_STYLES.info);
      console.log('   → Esto es normal, Firestore usa queries de respaldo');
      console.log('   → Puedes crear el índice para mejor rendimiento');
      console.log('   → No afecta la funcionalidad');
    }
  }
};

// ============================
// DETECTOR DE TIPO DE ERROR
// ============================

const detectErrorType = (errorText) => {
  const errorTextLower = errorText.toLowerCase();

  // Error de permisos de Firestore
  if (errorTextLower.includes('permission') ||
      errorTextLower.includes('missing or insufficient permissions') ||
      errorTextLower.includes('firestore permission')) {
    return {
      type: 'Permisos de Firestore',
      source: 'Firestore Security Rules',
      causes: [
        'Las Firestore Rules no permiten esta operación',
        'El usuario no tiene el rol necesario (admin/support)',
        'Las rules no están desplegadas',
        'El campo "role" no existe en el documento del usuario'
      ],
      solutions: [
        'Ejecutar: firebase deploy --only firestore:rules',
        'Verificar que tienes role: "admin" en /users/{tu-uid}',
        'Cerrar sesión y volver a iniciar sesión',
        'Ejecutar: window.checkAdminStatus() en consola para diagnosticar'
      ]
    };
  }

  // Error de red/conexión
  if (errorTextLower.includes('network') ||
      errorTextLower.includes('failed to fetch') ||
      errorTextLower.includes('aborterror')) {
    return {
      type: 'Error de red',
      source: 'Conexión a Firebase',
      causes: [
        'Problemas de conexión a internet',
        'Firebase está temporalmente inaccesible',
        'Request fue cancelado (hot reload de Vite)',
        'Firewall o proxy bloqueando la conexión'
      ],
      solutions: [
        'Verificar conexión a internet',
        'Recargar la página (Ctrl + R)',
        'Si es por hot reload, ignorar (es normal durante desarrollo)',
        'Verificar configuración de Firebase en firebase.js'
      ]
    };
  }

  // Error de autenticación
  if (errorTextLower.includes('auth') ||
      errorTextLower.includes('unauthenticated') ||
      errorTextLower.includes('not authenticated')) {
    return {
      type: 'Error de autenticación',
      source: 'Firebase Auth',
      causes: [
        'Usuario no está autenticado',
        'Sesión expirada',
        'Token de autenticación inválido'
      ],
      solutions: [
        'Iniciar sesión nuevamente',
        'Verificar que el usuario está autenticado',
        'Cerrar todas las pestañas y volver a abrir'
      ]
    };
  }

  // Error de documento no encontrado
  if (errorTextLower.includes('not found') ||
      errorTextLower.includes('does not exist') ||
      errorTextLower.includes('document') && errorTextLower.includes('missing')) {
    return {
      type: 'Documento no encontrado',
      source: 'Firestore Database',
      causes: [
        'El documento solicitado no existe en Firestore',
        'La ruta del documento es incorrecta',
        'El ID es inválido'
      ],
      solutions: [
        'Verificar que el documento existe en Firebase Console',
        'Revisar la ruta del documento',
        'Crear el documento si es necesario'
      ]
    };
  }

  // Error de React/componente
  if (errorTextLower.includes('react') ||
      errorTextLower.includes('component') ||
      errorTextLower.includes('hook')) {
    return {
      type: 'Error de React',
      source: 'Componente de React',
      causes: [
        'Error en un componente de React',
        'Hook usado incorrectamente',
        'Estado no inicializado correctamente'
      ],
      solutions: [
        'Revisar la consola para el stack trace completo',
        'Verificar que los hooks estén dentro de componentes funcionales',
        'Recargar la página'
      ]
    };
  }

  // Error genérico
  return {
    type: 'Error desconocido',
    source: 'Desconocido',
    causes: [
      'No se pudo determinar la causa exacta',
      'Revisa el mensaje de error completo arriba'
    ],
    solutions: [
      'Revisar el mensaje de error completo en la consola',
      'Recargar la página',
      'Revisar la documentación',
      'Contactar soporte si el problema persiste'
    ]
  };
};

// ============================
// FUNCIONES GLOBALES
// ============================

export const exposeGlobalDebugFunctions = () => {
  if (typeof window !== 'undefined') {
    window.checkAdminStatus = checkAdminStatus;
    window.diagnosePermissions = diagnosePermissions;
    window.adminDebugConfig = DEBUG_CONFIG;

    console.log('%c🛠️  FUNCIONES DE DEBUG DISPONIBLES', CONSOLE_STYLES.title);
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', CONSOLE_STYLES.divider);
    console.log('%ccheckAdminStatus()', CONSOLE_STYLES.code, '- Verificar si eres admin');
    console.log('%cdiagnosePermissions()', CONSOLE_STYLES.code, '- Diagnóstico completo de permisos');
    console.log('%cadminDebugConfig', CONSOLE_STYLES.code, '- Configuración del debugger');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', CONSOLE_STYLES.divider);
  }
};

// ============================
// INICIALIZACIÓN AUTOMÁTICA
// ============================

export const initializeAdminDebugger = () => {
  console.log('%c🚀 ADMIN DEBUGGER INICIALIZADO', CONSOLE_STYLES.title);

  // Exponer funciones globales
  exposeGlobalDebugFunctions();

  // Setup interceptor de errores
  const cleanup = setupErrorInterceptor();

  // Auto-verificar status si está configurado
  if (DEBUG_CONFIG.autoCheck) {
    setTimeout(() => {
      checkAdminStatus();
    }, 1000);
  }

  return cleanup;
};

export default {
  checkAdminStatus,
  diagnosePermissions,
  setupErrorInterceptor,
  initializeAdminDebugger,
  exposeGlobalDebugFunctions
};
