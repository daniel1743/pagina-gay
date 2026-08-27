import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const featureFlags = read('../src/config/featureFlags.js');
const app = read('../src/App.jsx');
const baulPage = read('../src/pages/BaulPage.jsx');
const baulSection = read('../src/components/baul/BaulSection.jsx');
const tarjetaService = read('../src/services/tarjetaService.js');
const tarjetaEditor = read('../src/components/baul/TarjetaEditor.jsx');
const tarjetaUser = read('../src/components/baul/TarjetaUsuario.jsx');
const functions = read('../functions/index.js');
const firestoreRules = read('../firestore.rules');
const authContext = read('../src/contexts/AuthContext.jsx');
const storageRules = read('../storage.rules');
const specification = read('../documentacion_md/07-firebase-supabase-db/ESPECIFICACION_REESTRUCTURACION_BAUL_2026.md');

describe('contrato local del servicio Baúl de tarjetas', () => {
  it('mantiene la activación cerrada y muestra un estado honesto', () => {
    expect(featureFlags).toContain('ENABLE_BAUL = false');
    expect(app).toContain('<Route path="/baul" element={<MainLayout><BaulPage /></MainLayout>} />');
    expect(baulPage).toContain('Servicio pausado');
    expect(baulPage).toContain('Las tarjetas, likes y matches están temporalmente desactivados');
  });

  it('no consulta ni crea datos automáticamente mientras la flag está apagada', () => {
    expect(tarjetaService).toContain("if (!isBaulRuntimeEnabled()) return [];");
    expect(baulSection).toContain('obtenerTarjetasRecientes(odIdUsuari, 50)');
    expect(authContext).toContain('if (!ENABLE_BAUL) return;');
  });

  it('define las acciones reales de la callable y conserva la activación gradual', () => {
    expect(tarjetaService).toContain("httpsCallable(functions, 'recordTarjetaInteraction')");
    expect(functions).toContain('const TARJETA_INTERACTIONS_ENABLED = false;');
    expect(functions).toContain('exports.recordTarjetaInteraction = onCall');
    expect(functions).toContain('assertRegisteredCallableRequest(request)');
    expect(functions).toContain('isBlockedBetweenUsers(actor.uid, target.id)');
    expect(functions).toContain('runTransaction');
    expect(functions).toContain('toggle_like');
    expect(functions).toContain('leave_footprint');
    expect(functions).toContain('record_visit');
    expect(functions).toContain('record_impression');
    expect(functions).toContain('send_message');
    expect(functions).toContain('createUserNotificationRecord');
  });

  it('mantiene la presencia en backend y no la escribe directamente desde el cliente', () => {
    expect(tarjetaService).toContain("httpsCallable(functions, 'updateTarjetaPresence')");
    expect(tarjetaService).toContain('updateTarjetaPresenceCallable({ online: Boolean(estaOnline) })');
    expect(functions).toContain('exports.updateTarjetaPresence = onCall');
    expect(functions).toContain('Synced card avatar userId=${userId}');
    expect(functions).toContain("db.collection('tarjetas').doc(userId).set");
    expect(functions).toContain('estaOnline: online');
    expect(functions).toContain('ultimaConexion: FieldValue.serverTimestamp()');
  });

  it('protege las reglas: matches solo desde Functions y métricas fuera del cliente', () => {
    expect(firestoreRules).toContain('match /tarjetas/{odIdUsuari}');
    expect(firestoreRules).toContain('allow read: if isAuthenticated();');
    expect(firestoreRules).toContain('request.resource.data.keys().hasOnly');
    expect(firestoreRules).toContain("'intencionExpiracion'");
    expect(firestoreRules).toContain("request.resource.data.diff(resource.data).affectedKeys().hasOnly(['unreadByA', 'unreadByB'])");
    expect(firestoreRules).toContain('allow create: if false;');
    expect(firestoreRules).toContain('match /matches/{matchId}');
    expect(storageRules).toContain('match /tarjeta_photos/{userId}/{allPaths=**}');
  });

  it('expone el contrato de intención temporal y ordenamiento sin GPS exacto', () => {
    expect(tarjetaService).toContain('INTENCIONES_BAUL');
    expect(tarjetaService).toContain('isTarjetaIntentActive');
    expect(tarjetaService).toContain('sortTarjetasByDiscoveryMode');
    expect(tarjetaService).toContain('tarjeta.comuna || tarjeta.ubicacionTexto');
    expect(tarjetaEditor).toContain('Tu intención en Baúl');
    expect(tarjetaEditor).toContain('intencionExpiracion');
    expect(tarjetaEditor).toContain('Comuna aproximada');
    expect(specification).toContain('Firebase-first');
    expect(specification).toContain('No se expondrán coordenadas exactas');
  });

  it('protege la visualización de fotos de tarjeta contra URLs rotas', () => {
    expect(tarjetaUser).toContain('getSafeAvatarSrc(photo)');
    expect(tarjetaUser).toContain('onError={handleAvatarImageError}');
    expect(tarjetaEditor).toContain("ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])");
    expect(tarjetaEditor).toContain('accept="image/jpeg,image/png,image/webp"');
  });
});
