// ========================================
// SCRIPT DE DIAGNÓSTICO - ROL DE ADMIN
// ========================================
// Este script verifica el rol del usuario actual en Firestore
//
// CÓMO USAR:
// 1. Abre tu sitio en el navegador
// 2. Presiona F12 para abrir la consola
// 3. Copia y pega todo este código en la consola
// 4. Presiona Enter
//
// El script mostrará:
// - Tu ID de usuario
// - Tu documento completo de Firestore
// - Si tienes el campo "role" y su valor
// ========================================

import { auth } from './src/config/firebase';
import { db } from './src/config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const checkAdminRole = async () => {
  console.log('========================================');
  console.log('DIAGNÓSTICO DE ROL DE ADMIN');
  console.log('========================================\n');

  try {
    // Obtener usuario actual de Firebase Auth
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error('❌ No hay usuario autenticado');
      console.log('Por favor, inicia sesión primero');
      return;
    }

    console.log('✅ Usuario autenticado:');
    console.log('   ID:', currentUser.uid);
    console.log('   Email:', currentUser.email);
    console.log('   Anónimo:', currentUser.isAnonymous);
    console.log('');

    // Obtener documento de Firestore
    console.log('📄 Consultando Firestore...\n');
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error('❌ El documento de usuario NO existe en Firestore');
      console.log('   Ruta:', `users/${currentUser.uid}`);
      console.log('   Esto es un problema - el usuario debería tener un documento');
      return;
    }

    console.log('✅ Documento encontrado en Firestore\n');

    const userData = userSnap.data();

    // Mostrar datos completos
    console.log('📋 DATOS COMPLETOS DEL USUARIO:');
    console.log(JSON.stringify(userData, null, 2));
    console.log('');

    // Verificar campo "role"
    console.log('========================================');
    console.log('VERIFICACIÓN DEL CAMPO "role"');
    console.log('========================================\n');

    if (userData.role) {
      console.log('✅ El campo "role" EXISTE');
      console.log('   Valor actual:', userData.role);
      console.log('   Tipo:', typeof userData.role);

      if (userData.role === 'admin' || userData.role === 'administrator') {
        console.log('   ✅ El rol es ADMIN - Debería funcionar');
      } else {
        console.log('   ❌ El rol NO es admin/administrator');
        console.log('   ℹ️ Para arreglar esto, ejecuta:');
        console.log('');
        console.log('   await updateDoc(doc(db, "users", auth.currentUser.uid), { role: "admin" });');
      }
    } else {
      console.error('❌ El campo "role" NO EXISTE en el documento');
      console.log('');
      console.log('ℹ️ SOLUCIÓN:');
      console.log('Para agregar el rol de admin, ejecuta este código en la consola:');
      console.log('');
      console.log('import { doc, updateDoc } from "firebase/firestore";');
      console.log('import { db, auth } from "./src/config/firebase";');
      console.log('await updateDoc(doc(db, "users", auth.currentUser.uid), { role: "admin" });');
      console.log('');
      console.log('O usa la consola de Firebase:');
      console.log('1. Ve a Firestore Database en Firebase Console');
      console.log(`2. Busca: users/${currentUser.uid}`);
      console.log('3. Agrega campo: role = "admin"');
    }

    console.log('');
    console.log('========================================');
    console.log('DIAGNÓSTICO COMPLETADO');
    console.log('========================================');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
    console.error('Detalles:', error.message);
  }
};

// Ejecutar diagnóstico
checkAdminRole();
