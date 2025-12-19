/**
 * Script de Testing Automático - Modo Claro
 * Valida que todos los colores tengan contraste adecuado
 */

// Colores esperados en MODO CLARO
const expectedLightModeColors = {
  // Tokens CSS
  tokens: {
    background: '0 0% 98%',      // Gris muy claro
    foreground: '0 0% 8%',       // Negro profundo
    card: '0 0% 100%',           // Blanco puro
    cardForeground: '0 0% 8%',   // Negro profundo
    border: '0 0% 70%',          // Gris medio
    mutedForeground: '0 0% 50%', // Gris medio
    primary: '260 19% 18%',      // Púrpura oscuro
    accent: '323 100% 38%',      // Magenta oscuro
  },

  // FeatureCard - Cyan
  cyan: {
    badge: {
      bg: 'bg-cyan-100',
      text: 'text-cyan-800',
      border: 'border-cyan-300',
    },
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-700',
    arrow: 'text-cyan-700',
  },

  // FeatureCard - Purple
  purple: {
    badge: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-300',
    },
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-700',
    arrow: 'text-purple-700',
  },

  // FeatureCard - Green
  green: {
    badge: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
    },
    iconBg: 'bg-green-100',
    iconColor: 'text-green-700',
    arrow: 'text-green-700',
  },

  // FeatureCard - Orange
  orange: {
    badge: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-300',
    },
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-700',
    arrow: 'text-orange-700',
  },
};

// Ratios de contraste mínimos WCAG
const WCAG_RATIOS = {
  AA_NORMAL: 4.5,     // Texto normal tamaño regular
  AA_LARGE: 3.0,      // Texto grande (18pt+ o 14pt+ bold)
  AAA_NORMAL: 7.0,    // Texto normal nivel AAA
  AAA_LARGE: 4.5,     // Texto grande nivel AAA
  NON_TEXT: 3.0,      // Elementos no-texto (bordes, iconos)
};

/**
 * Cálculo de luminancia relativa (WCAG)
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Cálculo de ratio de contraste (WCAG)
 */
function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(...rgb1);
  const l2 = getLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convierte HSL a RGB
 */
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255].map(Math.round);
}

/**
 * Convierte Tailwind color a RGB aproximado
 */
function tailwindToRgb(tailwindClass) {
  // Aproximaciones (valores Tailwind CSS v3)
  const colors = {
    // Grays
    'gray-50': [249, 250, 251],
    'gray-100': [243, 244, 246],
    'gray-200': [229, 231, 235],
    'gray-300': [209, 213, 219],
    'gray-400': [156, 163, 175],
    'gray-500': [107, 114, 128],
    'gray-600': [75, 85, 99],
    'gray-700': [55, 65, 81],
    'gray-800': [31, 41, 55],
    'gray-900': [17, 24, 39],

    // Cyan
    'cyan-100': [207, 250, 254],
    'cyan-200': [165, 243, 252],
    'cyan-300': [103, 232, 249],
    'cyan-600': [8, 145, 178],
    'cyan-700': [14, 116, 144],
    'cyan-800': [21, 94, 117],

    // Purple
    'purple-100': [243, 232, 255],
    'purple-200': [233, 213, 255],
    'purple-300': [216, 180, 254],
    'purple-600': [147, 51, 234],
    'purple-700': [126, 34, 206],
    'purple-800': [107, 33, 168],

    // Green
    'green-100': [220, 252, 231],
    'green-200': [187, 247, 208],
    'green-300': [134, 239, 172],
    'green-600': [22, 163, 74],
    'green-700': [21, 128, 61],
    'green-800': [22, 101, 52],

    // Orange
    'orange-100': [255, 237, 213],
    'orange-200': [254, 215, 170],
    'orange-300': [253, 186, 116],
    'orange-600': [234, 88, 12],
    'orange-700': [194, 65, 12],
    'orange-800': [154, 52, 18],

    // White/Black
    'white': [255, 255, 255],
    'black': [0, 0, 0],
  };

  // Extraer el nombre del color de la clase Tailwind
  const match = tailwindClass.match(/(?:bg-|text-|border-)([a-z]+-\d+|white|black)/);
  if (match && colors[match[1]]) {
    return colors[match[1]];
  }

  return [128, 128, 128]; // Gris por defecto si no se encuentra
}

/**
 * Validación principal
 */
function validateLightMode() {
  console.log('🎨 VALIDACIÓN DE MODO CLARO - CONTRASTE\n');
  console.log('═'.repeat(60));

  let allPassed = true;
  const results = [];

  // 1. Validar Badges
  console.log('\n📛 BADGES:');
  console.log('─'.repeat(60));

  ['cyan', 'purple', 'green', 'orange'].forEach(color => {
    const badge = expectedLightModeColors[color].badge;
    const bgRgb = tailwindToRgb(badge.bg);
    const textRgb = tailwindToRgb(badge.text);
    const ratio = getContrastRatio(bgRgb, textRgb);

    const passed = ratio >= WCAG_RATIOS.AA_NORMAL;
    const status = passed ? '✅' : '❌';

    console.log(`${status} ${color.toUpperCase()} Badge:`);
    console.log(`   BG: ${badge.bg} → RGB${JSON.stringify(bgRgb)}`);
    console.log(`   Text: ${badge.text} → RGB${JSON.stringify(textRgb)}`);
    console.log(`   Ratio: ${ratio.toFixed(2)}:1 (${passed ? 'PASS' : 'FAIL'} - Min 4.5:1)`);

    if (!passed) allPassed = false;
    results.push({ element: `${color} badge`, ratio, passed, standard: 'WCAG AA' });
  });

  // 2. Validar Iconos
  console.log('\n🎨 ICONOS:');
  console.log('─'.repeat(60));

  const whiteRgb = [255, 255, 255]; // Fondo de card (blanco)

  ['cyan', 'purple', 'green', 'orange'].forEach(color => {
    const iconColor = expectedLightModeColors[color].iconColor;
    const iconRgb = tailwindToRgb(iconColor);
    const ratio = getContrastRatio(whiteRgb, iconRgb);

    const passed = ratio >= WCAG_RATIOS.NON_TEXT;
    const status = passed ? '✅' : '❌';

    console.log(`${status} ${color.toUpperCase()} Icon:`);
    console.log(`   Color: ${iconColor} → RGB${JSON.stringify(iconRgb)}`);
    console.log(`   Ratio: ${ratio.toFixed(2)}:1 (${passed ? 'PASS' : 'FAIL'} - Min 3:1)`);

    if (!passed) allPassed = false;
    results.push({ element: `${color} icon`, ratio, passed, standard: 'WCAG AA Non-Text' });
  });

  // 3. Validar Texto de Cards
  console.log('\n📝 TEXTO DE CARDS:');
  console.log('─'.repeat(60));

  const textTests = [
    { name: 'Título (gray-900)', color: 'gray-900', minRatio: WCAG_RATIOS.AAA_NORMAL },
    { name: 'Descripción (gray-600)', color: 'gray-600', minRatio: WCAG_RATIOS.AA_NORMAL },
    { name: 'Stats (gray-500)', color: 'gray-500', minRatio: WCAG_RATIOS.AA_NORMAL },
  ];

  textTests.forEach(test => {
    const textRgb = tailwindToRgb(`text-${test.color}`);
    const ratio = getContrastRatio(whiteRgb, textRgb);

    const passed = ratio >= test.minRatio;
    const status = passed ? '✅' : '❌';

    console.log(`${status} ${test.name}:`);
    console.log(`   Color: text-${test.color} → RGB${JSON.stringify(textRgb)}`);
    console.log(`   Ratio: ${ratio.toFixed(2)}:1 (${passed ? 'PASS' : 'FAIL'} - Min ${test.minRatio}:1)`);

    if (!passed) allPassed = false;
    results.push({ element: test.name, ratio, passed, standard: test.minRatio >= 7 ? 'WCAG AAA' : 'WCAG AA' });
  });

  // 4. Validar Bordes
  console.log('\n🔲 BORDES:');
  console.log('─'.repeat(60));

  const borderRgb = tailwindToRgb('border-gray-300');
  const borderRatio = getContrastRatio(whiteRgb, borderRgb);
  const borderPassed = borderRatio >= WCAG_RATIOS.NON_TEXT;

  console.log(`${borderPassed ? '✅' : '❌'} Borde de Card (gray-300):`);
  console.log(`   Color: border-gray-300 → RGB${JSON.stringify(borderRgb)}`);
  console.log(`   Ratio: ${borderRatio.toFixed(2)}:1 (${borderPassed ? 'PASS' : 'FAIL'} - Min 3:1)`);

  if (!borderPassed) allPassed = false;
  results.push({ element: 'Card border', ratio: borderRatio, passed: borderPassed, standard: 'WCAG AA Non-Text' });

  // Resumen final
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 RESUMEN:');
  console.log('═'.repeat(60));

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  console.log(`Total de pruebas: ${totalTests}`);
  console.log(`✅ Aprobadas: ${passedTests} (${(passedTests/totalTests*100).toFixed(1)}%)`);
  console.log(`❌ Fallidas: ${failedTests}`);
  console.log('');

  if (allPassed) {
    console.log('🎉 ¡TODAS LAS PRUEBAS PASARON!');
    console.log('✅ Modo claro cumple con WCAG AA/AAA');
  } else {
    console.log('⚠️  ALGUNAS PRUEBAS FALLARON');
    console.log('❌ Revisar colores que no cumplen con WCAG');
    console.log('\nElementos fallidos:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.element}: ${r.ratio.toFixed(2)}:1 (requiere mínimo según ${r.standard})`);
    });
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📝 Próximo paso: Verificar visualmente en http://localhost:3001');
  console.log('═'.repeat(60) + '\n');

  return { passed: allPassed, results, passRate: (passedTests/totalTests*100).toFixed(1) };
}

// Ejecutar validación
const testResults = validateLightMode();

// Exportar para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateLightMode, testResults };
}
