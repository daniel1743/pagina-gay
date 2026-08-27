import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

const globalLanding = read('src/pages/GlobalLandingPage.jsx');
const mas30Landing = read('src/pages/Mas30LandingPage.jsx');
const santiagoLanding = read('src/pages/SantiagoLandingPage.jsx');
const chatDemo = read('src/components/landing/ChatDemo.jsx');
const faqPage = read('src/pages/FAQPage.jsx');
const chatPage = read('src/pages/ChatPage.jsx');
const sitemap = read('public/sitemap.xml');
const terms = read('public/terminos-condiciones.html');
const privacy = read('public/politica-privacidad.html');
const legal = read('public/aviso-legal.html');
const seoLanding = read('src/components/seo/SEOLanding.jsx');
const seoGenerator = read('scripts/generate-static-seo-pages.mjs');
const lobbyPage = read('src/pages/LobbyPage.jsx');
const appSource = read('src/App.jsx');
const featureCard = read('src/components/lobby/FeatureCard.jsx');
const roomsModal = read('src/components/lobby/RoomsModal.jsx');
const eventoBanner = read('src/components/eventos/EventoBanner.jsx');
const anonymousChat = read('src/pages/AnonymousChatPage.jsx');
const premiumPage = read('src/pages/PremiumPage.jsx');
const saludMentalModal = read('src/components/lobby/SaludMentalModal.jsx');
const denunciaModal = read('src/components/lobby/DenunciaModal.jsx');
const reportService = read('src/services/reportService.js');
const createReportSource = reportService.slice(
  reportService.indexOf('export const createReport'),
  reportService.indexOf('/**\n * Obtiene todas las denuncias')
);

const hasLocation = (html, pathName) => html.includes(`href="${pathName}"`) || html.includes(`href='${pathName}'`);

describe('integridad de superficies públicas', () => {
  it('mantiene válidos los documentos legales enlazados por el footer', () => {
    expect(existsSync(path.join(root, 'public/politica-privacidad.html'))).toBe(true);
    expect(existsSync(path.join(root, 'public/aviso-legal.html'))).toBe(true);
    expect(privacy).toContain('rel="canonical" href="https://chactivo.com/politica-privacidad.html"');
    expect(legal).toContain('rel="canonical" href="https://chactivo.com/aviso-legal.html"');
    expect(terms).toContain('rel="canonical" href="https://chactivo.com/terminos-condiciones.html"');
  });

  it('elimina la declaración histórica de asistentes automatizados y no crea actividad falsa', () => {
    expect(terms).not.toContain('asistentes automatizados de conversación');
    expect(terms).not.toContain('se desactivan automáticamente');
    expect(chatDemo).not.toContain('setInterval');
    expect(chatDemo).not.toContain('24 activos');
    expect(chatDemo).not.toContain('chatMessages');
    expect(globalLanding).not.toContain('modelImages');
    expect(globalLanding).not.toContain('setCurrentImageIndex');
    expect(mas30Landing).not.toContain('Testimonios Reales');
    expect(mas30Landing).not.toContain('Miles de usuarios');
    expect(mas30Landing).not.toContain('testimonio 1.jpeg');
    expect(santiagoLanding).not.toContain('Testimonios Reales');
    expect(santiagoLanding).not.toContain('Únete a cientos');
    expect(santiagoLanding).not.toContain('Muy Alto');
    expect(santiagoLanding).not.toContain('100% Anónimo');
  });

  it('conserva el handler de entrada de Mas30 y no deja un callback indefinido', () => {
    expect(mas30Landing).toContain('const handleEnterChat = () =>');
    expect(mas30Landing).toContain("navigate('/chat/principal')");
    expect(mas30Landing).not.toContain('onClick={handleChatearAhora}');
  });

  it('evita layout duplicado en FAQ y usa la home canónica en su CTA', () => {
    expect(faqPage).not.toContain("@/components/layout/Header");
    expect(faqPage).not.toContain("@/components/layout/Footer");
    expect(faqPage).toContain("navigate('/')");
  });

  it('mantiene el chat dinámico fuera del índice y fuera del sitemap', () => {
    expect(chatPage).toContain("const shouldNoindexRoom = roomId !== 'hetero-general' || !HETERO_INDEXING_ENABLED;");
    expect(sitemap).not.toContain('<loc>https://chactivo.com/chat/principal</loc>');
  });

  it('mantiene SEO humano y coherente entre runtime, HTML estático y sitemap', () => {
    expect(seoLanding).not.toContain('className="sr-only"');
    expect(seoLanding).not.toContain('metaKeywords');
    expect(seoLanding).not.toContain('captar intención');
    expect(seoLanding).not.toContain('cluster semántico');
    expect(seoLanding).toContain('autoRedirect = false');
    expect(seoLanding).toContain('indexable = true');
    expect(seoGenerator).not.toContain('dominancia semántica');
    expect(seoGenerator).not.toContain('dar a Google');
    expect(seoGenerator).toContain('indexable: false');
    expect(sitemap).not.toContain('<loc>https://chactivo.com/mx/cdmx</loc>');
    expect(sitemap).not.toContain('<loc>https://chactivo.com/ar/buenos-aires</loc>');
    expect(sitemap).not.toContain('<loc>https://chactivo.com/es/madrid</loc>');
    expect(sitemap).not.toContain('<loc>https://chactivo.com/br/sao-paulo</loc>');
  });

  it('mantiene enlaces legales y de normas desde los documentos públicos', () => {
    expect(hasLocation(terms, '/politica-privacidad.html')).toBe(true);
    expect(hasLocation(terms, '/normas-comunidad')).toBe(true);
    expect(hasLocation(privacy, '/terminos-condiciones.html')).toBe(true);
    expect(hasLocation(legal, '/politica-privacidad.html')).toBe(true);
  });

  it('protege el lobby contra actividad sintética y referencias huérfanas', () => {
    expect(lobbyPage).not.toContain('subscribeToLastActivity');
    expect(lobbyPage).not.toContain('modelImages');
    expect(lobbyPage).not.toContain('calculateTotalUsers');
    expect(lobbyPage).not.toContain('roomCounts');
    expect(lobbyPage).not.toContain('Chats 100% reales');
    expect(lobbyPage).not.toContain('Sin anuncios molestos');
    expect(lobbyPage).toContain('Conversaciones recientes');
  });

  it('mantiene tarjetas de lobby y salas con controles semánticos', () => {
    expect(featureCard).toContain('<motion.button');
    expect(featureCard).not.toContain('role="button"');
    expect(roomsModal).toContain('<motion.button');
    expect(roomsModal).not.toContain('subscribeToMultipleRoomCounts');
    expect(roomsModal).toContain('Actividad no disponible');
    expect(roomsModal).not.toContain('A reventar');
    expect(roomsModal).not.toContain('Entra ahora');
  });

  it('no reintroduce eventos programados sintéticos ni lecturas Firebase en el banner', () => {
    expect(eventoBanner).toContain('isSupabaseAuthEnabled');
    expect(eventoBanner).not.toContain("@/config/scheduledEvents");
    expect(eventoBanner).not.toContain('getCurrentScheduledEventOccurrence');
    expect(eventoBanner).not.toContain('getNextScheduledEventOccurrence');
  });

  it('mantiene honestas las superficies de apoyo y Premium', () => {
    expect(anonymousChat).not.toContain('openQuickSignup');
    expect(anonymousChat).not.toContain('Totalmente Anónimo');
    expect(anonymousChat).toContain("navigate('/auth', { state: { redirectTo: '/chat/principal' } })");
    expect(premiumPage).not.toContain('$9.990');
    expect(premiumPage).not.toContain('Actualizar Ahora');
    expect(premiumPage).toContain('checkout y las funciones de pago todavía no están habilitados');
    expect(saludMentalModal).not.toContain('foro moderado y seguro');
    expect(saludMentalModal).toContain('Foro no disponible');
  });

  it('no habilita denuncias nuevas sobre Firestore ni promete envío cuando falta Supabase', () => {
    expect(createReportSource).toContain('SUPABASE_REQUIRED_FOR_REPORTS');
    expect(createReportSource).not.toContain("collection(db, 'reports')");
    expect(denunciaModal).toContain('reportsReady');
    expect(denunciaModal).toContain('El formulario no enviará datos');
  });

  it('no suscribe recompensas históricas de Firestore en modo Supabase-first', () => {
    expect(appSource).toContain('isSupabaseAuthEnabled() || !user?.id || user?.isGuest || user?.isAnonymous');
  });
});
