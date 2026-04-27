import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env no encontrado');
  process.exit(1);
}

const raw = fs.readFileSync(envPath, 'utf8');

const readEnv = (key) => {
  const match = raw.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
};

const mask = (value = '') => {
  if (!value) return '(faltante)';
  if (value.length <= 8) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
};

const values = {
  VITE_ENABLE_SUPABASE: readEnv('VITE_ENABLE_SUPABASE'),
  VITE_SUPABASE_URL: readEnv('VITE_SUPABASE_URL'),
  VITE_SUPABASE_ANON_KEY: readEnv('VITE_SUPABASE_ANON_KEY'),
  VITE_FIREBASE_PROJECT_ID: readEnv('VITE_FIREBASE_PROJECT_ID'),
};

const issues = [];

if (!values.VITE_SUPABASE_URL) issues.push('Falta VITE_SUPABASE_URL');
if (!values.VITE_SUPABASE_ANON_KEY) issues.push('Falta VITE_SUPABASE_ANON_KEY');
if (String(values.VITE_ENABLE_SUPABASE).toLowerCase() !== 'true') {
  issues.push('VITE_ENABLE_SUPABASE no está en true');
}

console.log('=== Supabase Readiness ===');
console.log(`VITE_ENABLE_SUPABASE: ${values.VITE_ENABLE_SUPABASE || '(faltante)'}`);
console.log(`VITE_SUPABASE_URL: ${mask(values.VITE_SUPABASE_URL)}`);
console.log(`VITE_SUPABASE_ANON_KEY: ${mask(values.VITE_SUPABASE_ANON_KEY)}`);
console.log(`VITE_FIREBASE_PROJECT_ID: ${mask(values.VITE_FIREBASE_PROJECT_ID)}`);

if (issues.length > 0) {
  console.log('\nEstado: PREPARACION INCOMPLETA');
  issues.forEach((issue) => console.log(`- ${issue}`));
  process.exit(1);
}

console.log('\nEstado: LISTO PARA PRUEBA CONTROLADA');
