/**
 * Tests de seguridad para Firestore Rules
 * Ejecutar con: npm run test:firestore
 *
 * IMPORTANTE: Requiere Firebase Emulators instalados
 * Instalación: npm install -g firebase-tools
 * Iniciar emuladores: firebase emulators:start
 */

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { setDoc, doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';

let testEnv;

// Setup antes de todos los tests
beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'chactivo-test',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
});

// Cleanup después de cada test
afterEach(async () => {
  await testEnv.clearFirestore();
});

// Cleanup después de todos los tests
afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore Security Rules - Users', () => {
  test('Usuarios no autenticados NO pueden leer perfiles', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const userDoc = doc(unauthedDb, 'users/testuser');

    await assertFails(getDoc(userDoc));
  });

  test('Usuarios autenticados PUEDEN leer cualquier perfil', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();

    // Crear perfil de Bob primero
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/bob'), {
        username: 'Bob',
        email: 'bob@test.com',
        isPremium: false,
        verified: false,
        createdAt: new Date(),
      });
    });

    // Alice puede leer perfil de Bob
    const bobProfile = doc(aliceDb, 'users/bob');
    await assertSucceeds(getDoc(bobProfile));
  });

  test('Usuario puede crear su propio perfil con datos válidos', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const aliceProfile = doc(aliceDb, 'users/alice');

    await assertSucceeds(
      setDoc(aliceProfile, {
        username: 'Alice',
        email: 'alice@test.com',
        age: 25,
        isPremium: false,
        verified: false,
        createdAt: new Date(),
      })
    );
  });

  test('Usuario NO puede crear perfil con edad menor de 18', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const aliceProfile = doc(aliceDb, 'users/alice');

    await assertFails(
      setDoc(aliceProfile, {
        username: 'Alice',
        email: 'alice@test.com',
        age: 16, // ❌ Menor de edad
        isPremium: false,
        verified: false,
        createdAt: new Date(),
      })
    );
  });

  test('Usuario NO puede auto-promocionarse a premium al crear cuenta', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const aliceProfile = doc(aliceDb, 'users/alice');

    await assertFails(
      setDoc(aliceProfile, {
        username: 'Alice',
        email: 'alice@test.com',
        age: 25,
        isPremium: true, // ❌ Intentando hacerse premium
        verified: false,
        createdAt: new Date(),
      })
    );
  });

  test('Usuario solo puede actualizar su propio perfil', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const bobDb = testEnv.authenticatedContext('bob').firestore();

    // Crear perfil de Alice
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/alice'), {
        id: 'alice',
        username: 'Alice',
        email: 'alice@test.com',
        isPremium: false,
        verified: false,
      });
    });

    // Alice puede actualizar su propio perfil
    await assertSucceeds(
      updateDoc(doc(aliceDb, 'users/alice'), {
        username: 'AliceUpdated',
      })
    );

    // Bob NO puede actualizar el perfil de Alice
    await assertFails(
      updateDoc(doc(bobDb, 'users/alice'), {
        username: 'BobHacking',
      })
    );
  });

  test('Usuario NO puede cambiar su email al actualizar', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();

    // Crear perfil de Alice
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/alice'), {
        id: 'alice',
        username: 'Alice',
        email: 'alice@test.com',
        isPremium: false,
        verified: false,
      });
    });

    // Alice NO puede cambiar su email
    await assertFails(
      updateDoc(doc(aliceDb, 'users/alice'), {
        email: 'newemail@test.com', // ❌ Cambio de email no permitido
      })
    );
  });
});

describe('Firestore Security Rules - Messages', () => {
  test('Usuarios no autenticados NO pueden leer mensajes', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const messagesRef = collection(unauthedDb, 'rooms/test-room/messages');

    await assertFails(getDoc(doc(messagesRef, 'msg1')));
  });

  test('Usuarios autenticados PUEDEN leer mensajes', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();

    // Crear mensaje primero
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'rooms/test-room/messages/msg1'), {
        userId: 'bob',
        username: 'Bob',
        content: 'Hola!',
        type: 'text',
        timestamp: new Date(),
      });
    });

    // Alice puede leer el mensaje
    const message = doc(aliceDb, 'rooms/test-room/messages/msg1');
    await assertSucceeds(getDoc(message));
  });

  test('Usuario puede enviar mensaje válido', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const messagesRef = collection(aliceDb, 'rooms/test-room/messages');

    await assertSucceeds(
      addDoc(messagesRef, {
        userId: 'alice',
        username: 'Alice',
        content: 'Hola a todos!',
        type: 'text',
        timestamp: serverTimestamp(),
      })
    );
  });

  test('Usuario NO puede enviar mensaje con contenido vacío', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const messagesRef = collection(aliceDb, 'rooms/test-room/messages');

    await assertFails(
      addDoc(messagesRef, {
        userId: 'alice',
        username: 'Alice',
        content: '', // ❌ Contenido vacío
        type: 'text',
        timestamp: serverTimestamp(),
      })
    );
  });

  test('Usuario NO puede enviar mensaje muy largo (>1000 caracteres)', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const messagesRef = collection(aliceDb, 'rooms/test-room/messages');

    await assertFails(
      addDoc(messagesRef, {
        userId: 'alice',
        username: 'Alice',
        content: 'a'.repeat(1001), // ❌ Muy largo
        type: 'text',
        timestamp: serverTimestamp(),
      })
    );
  });

  test('Usuario NO puede suplantar a otro usuario en mensaje', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const messagesRef = collection(aliceDb, 'rooms/test-room/messages');

    await assertFails(
      addDoc(messagesRef, {
        userId: 'bob', // ❌ Alice intentando hacerse pasar por Bob
        username: 'Bob',
        content: 'Soy Bob (impostor)',
        type: 'text',
        timestamp: serverTimestamp(),
      })
    );
  });

  test('Usuario NO puede editar contenido de un mensaje (solo reacciones)', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();

    // Crear mensaje de Alice
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'rooms/test-room/messages/msg1'), {
        userId: 'alice',
        username: 'Alice',
        content: 'Mensaje original',
        type: 'text',
        timestamp: new Date(),
        reactions: { like: 0 },
      });
    });

    // Alice NO puede editar el contenido
    await assertFails(
      updateDoc(doc(aliceDb, 'rooms/test-room/messages/msg1'), {
        content: 'Mensaje editado', // ❌ No se puede editar contenido
      })
    );
  });

  test('Usuario PUEDE añadir reacciones a mensajes', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();

    // Crear mensaje
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'rooms/test-room/messages/msg1'), {
        userId: 'bob',
        username: 'Bob',
        content: 'Hola!',
        type: 'text',
        timestamp: new Date(),
        reactions: { like: 0 },
      });
    });

    // Alice puede añadir reacción
    await assertSucceeds(
      updateDoc(doc(aliceDb, 'rooms/test-room/messages/msg1'), {
        reactions: { like: 1 },
      })
    );
  });

  test('Solo el autor puede eliminar su mensaje', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const bobDb = testEnv.authenticatedContext('bob').firestore();

    // Crear mensaje de Alice
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'rooms/test-room/messages/msg1'), {
        userId: 'alice',
        username: 'Alice',
        content: 'Mi mensaje',
        type: 'text',
        timestamp: new Date(),
      });
    });

    // Bob NO puede eliminar mensaje de Alice
    await assertFails(doc(bobDb, 'rooms/test-room/messages/msg1').delete());

    // Alice SÍ puede eliminar su propio mensaje
    await assertSucceeds(doc(aliceDb, 'rooms/test-room/messages/msg1').delete());
  });
});

describe('Firestore Security Rules - Reports', () => {
  test('Usuario autenticado puede crear un reporte', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const reportsRef = collection(aliceDb, 'reports');

    await assertSucceeds(
      addDoc(reportsRef, {
        reporterId: 'alice',
        targetId: 'bob',
        reason: 'Comportamiento inapropiado en el chat',
        timestamp: serverTimestamp(),
      })
    );
  });

  test('Reporte debe tener razón descriptiva (>10 caracteres)', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const reportsRef = collection(aliceDb, 'reports');

    await assertFails(
      addDoc(reportsRef, {
        reporterId: 'alice',
        targetId: 'bob',
        reason: 'Spam', // ❌ Muy corto
        timestamp: serverTimestamp(),
      })
    );
  });

  test('Usuario NO puede leer reportes (solo admins)', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'reports/report1'), {
        reporterId: 'bob',
        targetId: 'charlie',
        reason: 'Comportamiento sospechoso',
        timestamp: new Date(),
      });
    });

    await assertFails(getDoc(doc(aliceDb, 'reports/report1')));
  });
});
