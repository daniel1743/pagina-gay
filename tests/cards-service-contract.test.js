import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const featureFlags = read('../src/config/featureFlags.js');
const app = read('../src/App.jsx');
const baulPage = read('../src/pages/BaulPage.jsx');
const baulSection = read('../src/components/baul/BaulSection.jsx');
const tarjetaService = read('../src/services/tarjetaService.js');
const tarjetaUser = read('../src/components/baul/TarjetaUsuario.jsx');
const functions = read('../functions/index.js');
const firestoreRules = read('../firestore.rules');
const authContext = read('../src/contexts/AuthContext.jsx');
const storageRules = read('../storage.rules');

describe('contrato local del servicio Baúl de tarjetas', () => {
  it('confirma que el estado actual es pausado y no una pantalla vacía', () => {
    expect(featureFlags).toContain('ENABLE_BAUL = false');
    expect(app).toContain('<Route path="/baul" element={<MainLayout><BaulPage /></MainLayout>} />');
    expect(baulPage).toContain('Servicio pausado');
    expect(baulPage).toContain('Las tarjetas, likes y matches están temporalmente desactivados');
  });

  it('confirma que el grid no consulta perfiles cuando Baúl está desactivado', () => {
    expect(tarjetaService).toContain("if (!isBaulRuntimeEnabled()) return [];");
    expect(baulSection).toContain('const ubicacion = null;');
    expect(baulSection).toContain('obtenerTarjetasRecientes(odIdUsuari, 50)');
  });

  it('evita crear tarjetas en segundo plano mientras Baúl está pausado', () => {
    expect(authContext).toContain('if (!ENABLE_BAUL) return;');
    expect(authContext).toContain("import { ENABLE_BAUL } from '@/config/featureFlags';");
  });

  it('confirma que las interacciones no tienen callable activa para encenderlas todavía', () => {
    expect(tarjetaService).toContain("httpsCallable(functions, 'recordTarjetaInteraction')");
    expect(tarjetaService).toContain("reason: 'baul_disabled'");
    expect(functions).toContain('recordTarjetaInteraction retirada de producción');
    expect(functions).not.toContain('exports.recordTarjetaInteraction =');
  });

  it('mantiene la lectura/escritura de tarjeta separada de la callable social', () => {
    expect(tarjetaService).toContain("collection(db, 'tarjetas')");
    expect(tarjetaService).toContain("doc(db, 'tarjetas', odIdUsuari)");
    expect(firestoreRules).toContain('match /tarjetas/{odIdUsuari}');
    expect(firestoreRules).toContain('allow read: if isAuthenticated();');
    expect(storageRules).toContain('match /tarjeta_photos/{userId}/{allPaths=**}');
  });

  it('protege la visualización de fotos de tarjeta contra URLs rotas', () => {
    expect(tarjetaUser).toContain('getSafeAvatarSrc(fotoMostrar)');
    expect(tarjetaUser).toContain('onError={handleAvatarImageError}');
  });
});
