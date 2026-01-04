/**
 * 🐛 DEBUG: Verificar por qué no aparece el botón "Cambiar a Usuario Genérico"
 *
 * INSTRUCCIONES:
 * 1. Abre el panel admin en tu navegador
 * 2. Abre la consola de desarrollo (F12)
 * 3. Copia y pega TODO este código en la consola
 * 4. Presiona Enter
 * 5. Lee los resultados
 */

console.log('🔍 INICIANDO DEBUG DEL BOTÓN DE IDENTIDAD ADMIN...\n');

// 1. Verificar que estamos en la página correcta
console.log('📍 UBICACIÓN:');
console.log('  URL actual:', window.location.href);
console.log('  Path:', window.location.pathname);
console.log('  ¿Es admin page?', window.location.pathname.includes('admin'));
console.log('');

// 2. Verificar usuario en localStorage
console.log('👤 USUARIO EN LOCALSTORAGE:');
const userDataLS = localStorage.getItem('userData');
if (userDataLS) {
  try {
    const userData = JSON.parse(userDataLS);
    console.log('  Usuario:', userData.username);
    console.log('  ID:', userData.id);
    console.log('  Es Admin:', userData.isAdmin);
    console.log('  Usando identidad genérica:', userData._isUsingGenericIdentity);
  } catch (e) {
    console.log('  ❌ Error parseando userData:', e);
  }
} else {
  console.log('  ⚠️ No hay userData en localStorage');
}
console.log('');

// 3. Verificar identidad original guardada
console.log('💾 IDENTIDAD ORIGINAL GUARDADA:');
const originalIdentity = localStorage.getItem('admin_original_identity');
if (originalIdentity) {
  try {
    const original = JSON.parse(originalIdentity);
    console.log('  ✅ Identidad original guardada:', original);
  } catch (e) {
    console.log('  ❌ Error parseando identidad original:', e);
  }
} else {
  console.log('  ℹ️ No hay identidad original guardada (esto es normal si no has cambiado de identidad)');
}
console.log('');

// 4. Verificar identidad genérica
console.log('🎭 IDENTIDAD GENÉRICA:');
const genericIdentity = localStorage.getItem('admin_generic_identity');
if (genericIdentity) {
  try {
    const generic = JSON.parse(genericIdentity);
    console.log('  ✅ Identidad genérica guardada:', generic);
  } catch (e) {
    console.log('  ❌ Error parseando identidad genérica:', e);
  }
} else {
  console.log('  ℹ️ No hay identidad genérica (esto es normal si no has cambiado de identidad)');
}
console.log('');

// 5. Buscar el botón en el DOM
console.log('🔎 BOTÓN EN EL DOM:');
const buttons = document.querySelectorAll('button');
console.log('  Total de botones en la página:', buttons.length);

let foundButton = false;
buttons.forEach((btn, index) => {
  const text = btn.textContent || '';
  if (text.includes('Cambiar a Usuario Genérico') || text.includes('Usuario Genérico') || text.includes('Genérico')) {
    console.log(`  ✅ ENCONTRADO en botón #${index}:`, btn);
    console.log('    Texto:', text);
    console.log('    Visible:', btn.offsetParent !== null);
    console.log('    Display:', window.getComputedStyle(btn).display);
    console.log('    Opacity:', window.getComputedStyle(btn).opacity);
    foundButton = true;
  }
});

if (!foundButton) {
  console.log('  ❌ NO se encontró el botón "Cambiar a Usuario Genérico"');
  console.log('  Esto significa que:');
  console.log('    1. El código no se compiló correctamente, O');
  console.log('    2. El navegador no recargó los cambios, O');
  console.log('    3. La condición !user?._isUsingGenericIdentity está bloqueándolo');
}
console.log('');

// 6. Buscar el botón de restaurar identidad (flotante)
console.log('🛡️ BOTÓN FLOTANTE (Restaurar Identidad):');
const restoreButtons = Array.from(buttons).filter(btn =>
  (btn.textContent || '').includes('Volver a') ||
  (btn.textContent || '').includes('Identidad Admin')
);

if (restoreButtons.length > 0) {
  console.log('  ✅ Botón flotante encontrado:', restoreButtons[0]);
  console.log('    Visible:', restoreButtons[0].offsetParent !== null);
  console.log('    Esto significa que ESTÁS usando identidad genérica');
} else {
  console.log('  ℹ️ Botón flotante NO encontrado');
  console.log('    Esto es NORMAL si NO estás usando identidad genérica');
}
console.log('');

// 7. Verificar imports y componentes de React
console.log('⚛️ COMPONENTES REACT:');
console.log('  Para verificar si los componentes están cargados, revisa la pestaña "Components" en React DevTools');
console.log('');

// 8. RESUMEN Y RECOMENDACIONES
console.log('📋 RESUMEN:');
console.log('─────────────────────────────────────────────────');

if (!userDataLS) {
  console.log('❌ PROBLEMA: No hay usuario en localStorage');
  console.log('   SOLUCIÓN: Inicia sesión como admin');
} else if (!foundButton && !restoreButtons.length) {
  console.log('❌ PROBLEMA: Ningún botón de identidad encontrado');
  console.log('   POSIBLES CAUSAS:');
  console.log('   1. El navegador no ha recargado los cambios');
  console.log('      SOLUCIÓN: Presiona Ctrl+Shift+R (recarga forzada)');
  console.log('');
  console.log('   2. El servidor de desarrollo no se ha reiniciado');
  console.log('      SOLUCIÓN: Detén el servidor (Ctrl+C) y ejecuta: npm run dev');
  console.log('');
  console.log('   3. Error de compilación');
  console.log('      SOLUCIÓN: Revisa la terminal donde corre npm run dev');
} else if (restoreButtons.length > 0) {
  console.log('✅ ESTÁS usando identidad genérica');
  console.log('   El botón "Volver a Identidad Admin" está visible');
  console.log('   Haz click en él para restaurar tu identidad admin');
} else if (foundButton) {
  console.log('✅ El botón "Cambiar a Usuario Genérico" está disponible');
  console.log('   Debería estar visible en la parte superior derecha del panel admin');
}

console.log('─────────────────────────────────────────────────');
console.log('\n✅ DEBUG COMPLETADO\n');
