import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');

const routes = [
  {
    route: '/',
    lang: 'es',
    title: 'Chat Gay Chile En Vivo | Entra Gratis y Habla al Instante | Chactivo',
    description: 'Chat gay en vivo para Chile con gente real conectada ahora. Entra gratis, habla con hombres cercanos y empieza en segundos sin app ni registro obligatorio en Chactivo.',
    canonical: 'https://chactivo.com/',
    ogLocale: 'es_CL',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat Gay Chile: entra gratis y conversa al instante</h1>
        <p>Chactivo es una entrada rapida al chat gay de Chile. Habla con gente real, sin registro obligatorio y desde tu navegador.</p>
      </header>
      <section>
        <h2>Comunidad activa en Chile</h2>
        <p>Encuentra conversacion en vivo, una comunidad LGBT+ activa y acceso inmediato al chat principal desde movil o desktop.</p>
      </section>
      <nav aria-label="Entradas principales">
        <ul>
          <li><a href="/chat/principal">Entrar al chat principal</a></li>
          <li><a href="/santiago">Ver entrada local de Santiago</a></li>
          <li><a href="/mas-30">Ver chat gay mayores de 30</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/ar',
    lang: 'es-AR',
    title: 'Chat Gay Argentina - Chatea Gratis Sin Registro',
    description: 'Chat gay Argentina gratis. Conoce hombres gay en Buenos Aires, Cordoba, Rosario y toda Argentina. Sin registro, 100% anonimo.',
    canonical: 'https://chactivo.com/ar',
    ogLocale: 'es_AR',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat Gay Argentina</h1>
        <p>Una entrada pensada para Argentina. Habla con gente de Buenos Aires, Cordoba, Rosario y otras ciudades sin registro obligatorio.</p>
      </header>
      <section>
        <h2>Conecta desde cualquier ciudad</h2>
        <p>Chactivo ofrece una forma simple de entrar, conversar y conectar desde navegador con gente real interesada en hablar ahora.</p>
      </section>
      <nav aria-label="Entradas principales">
        <ul>
          <li><a href="/chat/principal">Entrar al chat principal</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/mx',
    lang: 'es-MX',
    title: 'Chat Gay Mexico - Chatea Gratis Sin Registro',
    description: 'Chat gay Mexico gratis. Conoce hombres gay en CDMX, Guadalajara, Monterrey y todo Mexico. Sin registro, 100% anonimo.',
    canonical: 'https://chactivo.com/mx',
    ogLocale: 'es_MX',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat Gay Mexico</h1>
        <p>Entrada de apoyo para Mexico. Habla con gente de CDMX, Guadalajara, Monterrey y otras ciudades desde tu navegador.</p>
      </header>
      <section>
        <h2>Conversacion rapida y sin vueltas</h2>
        <p>Accede gratis, sin pasos largos y con una comunidad que ya llega desde busquedas de alta intencion.</p>
      </section>
      <nav aria-label="Entradas principales">
        <ul>
          <li><a href="/chat/principal">Entrar al chat principal</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/es',
    lang: 'es-ES',
    title: 'Chat Gay Espana - Chatea Gratis Sin Registro',
    description: 'Chat gay Espana gratis. Conoce hombres gay en Madrid, Barcelona, Valencia y toda Espana. Sin registro, 100% anonimo.',
    canonical: 'https://chactivo.com/es',
    ogLocale: 'es_ES',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat Gay Espana</h1>
        <p>Una entrada para Espana donde puedes conversar con gente de Madrid, Barcelona, Valencia y otras ciudades sin registro obligatorio.</p>
      </header>
      <section>
        <h2>Habla con gente real</h2>
        <p>La idea es simple: menos friccion, acceso inmediato y una comunidad abierta a conversar ahora desde movil o desktop.</p>
      </section>
      <nav aria-label="Entradas principales">
        <ul>
          <li><a href="/chat/principal">Entrar al chat principal</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/br',
    lang: 'pt-BR',
    title: 'Chat Gay Brasil - Bate-papo Gay Gratis',
    description: 'Chat gay Brasil gratis. Conheca homens gays em Sao Paulo, Rio, Brasilia e todo Brasil. Sem registro, 100% anonimo.',
    canonical: 'https://chactivo.com/br',
    ogLocale: 'pt_BR',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat Gay Brasil</h1>
        <p>Uma entrada para o Brasil. Converse com homens de Sao Paulo, Rio, Brasilia e outras cidades sem cadastro obrigatorio.</p>
      </header>
      <section>
        <h2>Bate-papo rapido no navegador</h2>
        <p>A proposta e simples: acesso rapido, sem download e com uma comunidade real conectando agora.</p>
      </section>
      <nav aria-label="Entradas principais">
        <ul>
          <li><a href="/chat/principal">Entrar no chat principal</a></li>
          <li><a href="/faq">Ler perguntas frequentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/faq',
    lang: 'es',
    title: 'Preguntas Frecuentes | Chactivo',
    description: 'Respuestas claras sobre privacidad, registro, costo, moderacion y seguridad en Chactivo.',
    canonical: 'https://chactivo.com/faq',
    ogLocale: 'es_CL',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Preguntas frecuentes de Chactivo</h1>
        <p>Todo lo esencial sobre privacidad, costo, moderacion, anonimato y funcionamiento del chat.</p>
      </header>
      <section>
        <h2>Es gratis y necesito registrarme?</h2>
        <p>Si, el chat publico es gratis. El registro no es obligatorio para entrar y conversar.</p>
      </section>
      <section>
        <h2>Es anonimo y seguro?</h2>
        <p>Puedes entrar sin exponer datos personales. Hay moderacion y herramientas de reporte para mantener la experiencia util.</p>
      </section>
      <section>
        <h2>Puedo borrar mi cuenta y mis datos?</h2>
        <p>Si. La plataforma contempla eliminacion de cuenta y datos, junto con una politica de privacidad centrada en el usuario.</p>
      </section>
      <nav aria-label="Entradas principales">
        <ul>
          <li><a href="/chat/principal">Entrar al chat principal</a></li>
          <li><a href="/">Volver al inicio</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/mas-30',
    lang: 'es',
    title: 'Chat Gay Mayores de 30 en Chile | Conversacion Madura | Chactivo',
    description: 'Chat gay para mayores de 30 en Chile con conversaciones maduras y gente real. Entra gratis, sin registro obligatorio, y conecta en Chactivo.',
    canonical: 'https://chactivo.com/mas-30',
    ogLocale: 'es_CL',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat Gay Mayores de 30 en Chile</h1>
        <p>Una entrada orientada a quienes buscan conversacion madura, menos ruido y una comunidad con mejor contexto para hablar.</p>
      </header>
      <section>
        <h2>Conversaciones con mas afinidad</h2>
        <p>Esta pagina existe para capturar una intencion concreta: hablar con gente mayor de 30 desde Chile con menos friccion y una promesa mas clara.</p>
      </section>
      <nav aria-label="Entradas principales">
        <ul>
          <li><a href="/chat/principal">Entrar al chat principal</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/santiago',
    lang: 'es-CL',
    title: 'Chat Gay Santiago | Conoce Gente De Santiago En Vivo | Chactivo',
    description: 'Chat gay en Santiago con hombres de Providencia, Las Condes, Nunoa y toda la RM. Entra gratis y habla en vivo desde tu navegador en Chactivo.',
    canonical: 'https://chactivo.com/santiago',
    ogLocale: 'es_CL',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat Gay Santiago Chile</h1>
        <p>Entrada local para quienes buscan conversar con gente de Santiago y la Region Metropolitana desde una ruta clara y directa.</p>
      </header>
      <section>
        <h2>Contexto local sin complicaciones</h2>
        <p>La intencion de esta pagina es responder mejor a busquedas locales y llevar al usuario a una conversacion util con gente de su zona.</p>
      </section>
      <nav aria-label="Entradas principales">
        <ul>
          <li><a href="/chat/principal">Entrar al chat principal</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
];

function replaceTag(html, pattern, value) {
  return html.replace(pattern, value);
}

function renderRouteHtml(baseHtml, routeConfig) {
  const canonical = routeConfig.canonical;
  const escapedTitle = routeConfig.title;
  const escapedDescription = routeConfig.description;

  let html = baseHtml;
  html = html.replace(/<html lang="[^"]+" class="dark">/, `<html lang="${routeConfig.lang}" class="dark">`);
  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${escapedTitle}</title>`);
  html = replaceTag(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escapedDescription}" />`
  );
  html = replaceTag(
    html,
    /<meta name="robots" content="[^"]*"\s*\/>/,
    '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />'
  );
  html = replaceTag(html, /<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`);
  html = replaceTag(html, /<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapedTitle}" />`);
  html = replaceTag(html, /<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapedDescription}" />`);
  html = replaceTag(html, /<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`);
  html = replaceTag(html, /<meta property="og:locale" content="[^"]*"\s*\/>/, `<meta property="og:locale" content="${routeConfig.ogLocale}" />`);
  html = replaceTag(html, /<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapedTitle}" />`);
  html = replaceTag(html, /<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapedDescription}" />`);

  html = html.replace(
    /<script type="application\/ld\+json">\s*{\s*"@context": "https:\/\/schema.org",\s*"@type": "WebPage"[\s\S]*?<\/script>/,
    `<script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": "${canonical}#webpage",
        "url": "${canonical}",
        "name": "${escapedTitle}",
        "description": "${escapedDescription}",
        "isPartOf": { "@id": "https://chactivo.com/#website" },
        "about": { "@id": "https://chactivo.com/#organization" },
        "primaryImageOfPage": {
          "@type": "ImageObject",
          "url": "https://chactivo.com/og-preview.png",
          "width": 1200,
          "height": 630
        }
      }
    </script>`
  );

  html = html.replace(/<main id="seo-shell">[\s\S]*?<\/main>/, routeConfig.seoShell);

  return html;
}

async function main() {
  const baseHtml = await readFile(indexPath, 'utf8');

  for (const route of routes) {
    const outputDir = route.route === '/' ? distDir : path.join(distDir, route.route.replace(/^\//, ''));
    await mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, 'index.html');
    const routeHtml = renderRouteHtml(baseHtml, route);
    await writeFile(outputPath, routeHtml, 'utf8');
  }

  console.log(`Generated static SEO HTML for ${routes.length} routes`);
}

main().catch((error) => {
  console.error('Failed to generate static SEO pages:', error);
  process.exitCode = 1;
});
