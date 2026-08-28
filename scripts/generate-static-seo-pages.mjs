import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');

const routes = [
  {
    route: '/',
    lang: 'es-CL',
    indexable: true,
    title: 'Chat Gay Chile | Conversa Desde Tu Navegador | Chactivo',
    description: 'Entra al chat gay de Chile y conversa desde tu navegador. Revisa la actividad real, participa con un alias y consulta las normas de Chactivo.',
    canonical: 'https://chactivo.com/',
    ogLocale: 'es_CL',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Entra y conversa con la comunidad</h1>
        <p>Chactivo reúne chat y publicaciones comunitarias en un espacio web. Entra desde tu navegador y comprueba la actividad real disponible.</p>
      </header>
      <section>
        <h2>Dos formas de participar</h2>
        <p>Puedes entrar al chat principal para conversar o visitar OPIN para leer y publicar mensajes breves. La actividad cambia según la participación del momento.</p>
      </section>
      <nav aria-label="Entradas principales">
        <ul>
          <li><a href="/chat/principal">Entrar al chat principal</a></li>
          <li><a href="/opin">Explorar OPIN</a></li>
          <li><a href="/santiago">Entrada local de Santiago</a></li>
          <li><a href="/mas-30">Entrada para mayores de 30</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
          <li><a href="/normas-comunidad">Leer normas de la comunidad</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/ar',
    lang: 'es-AR',
    indexable: true,
    title: 'Chat Gay Argentina | Conversa Desde Tu Navegador | Chactivo',
    description: 'Entrada regional al chat gay de Argentina. Conversa desde tu navegador y revisa la actividad real de la comunidad en Chactivo.',
    canonical: 'https://chactivo.com/ar',
    ogLocale: 'es_AR',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat gay de Argentina</h1>
        <p>Una entrada regional para personas de Argentina que quieren conversar desde el navegador, sin actividad ni perfiles de relleno.</p>
      </header>
      <section>
        <h2>Argentina como contexto, no como promesa</h2>
        <p>La sala puede estar más o menos activa según el momento. La página no muestra un mapa de personas ni garantiza disponibilidad en una ciudad concreta.</p>
      </section>
      <nav aria-label="Entradas relacionadas">
        <ul>
          <li><a href="/ar/buenos-aires">Entrada de Buenos Aires</a></li>
          <li><a href="/chat/argentina">Entrar al chat de Argentina</a></li>
          <li><a href="/opin">Explorar OPIN</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/mx',
    lang: 'es-MX',
    indexable: true,
    title: 'Chat Gay México | Conversa Desde Tu Navegador | Chactivo',
    description: 'Entrada regional al chat gay de México. Conversa desde tu navegador y revisa la actividad real de la comunidad en Chactivo.',
    canonical: 'https://chactivo.com/mx',
    ogLocale: 'es_MX',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat gay de México</h1>
        <p>Una entrada regional para conversar sin descargar una aplicación y con expectativas claras sobre la disponibilidad.</p>
      </header>
      <section>
        <h2>Conversación antes que catálogo</h2>
        <p>La sala regional muestra la participación real del momento. No publicamos contadores, perfiles ni barrios activos si no existe una fuente real y autorizada.</p>
      </section>
      <nav aria-label="Entradas relacionadas">
        <ul>
          <li><a href="/mx/cdmx">Entrada de CDMX</a></li>
          <li><a href="/chat/mexico">Entrar al chat de México</a></li>
          <li><a href="/opin">Explorar OPIN</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/es',
    lang: 'es-ES',
    indexable: true,
    title: 'Chat Gay España | Conversa Desde Tu Navegador | Chactivo',
    description: 'Entrada regional al chat gay de España. Conversa desde tu navegador y revisa la actividad real de la comunidad en Chactivo.',
    canonical: 'https://chactivo.com/es',
    ogLocale: 'es_ES',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat gay de España</h1>
        <p>Una entrada sencilla para conversar desde España y revisar qué está pasando realmente en la sala.</p>
      </header>
      <section>
        <h2>Una experiencia web clara</h2>
        <p>Puedes entrar desde el navegador y decidir cuánto compartir. La comunidad puede estar más o menos activa; no sustituimos ese estado por testimonios o números promocionales.</p>
      </section>
      <nav aria-label="Entradas relacionadas">
        <ul>
          <li><a href="/es/madrid">Entrada de Madrid</a></li>
          <li><a href="/chat/espana">Entrar al chat de España</a></li>
          <li><a href="/opin">Explorar OPIN</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/br',
    lang: 'pt-BR',
    indexable: true,
    title: 'Chat Gay Brasil | Converse Pelo Navegador | Chactivo',
    description: 'Entre no chat gay do Brasil e converse pelo navegador. A atividade visível depende da participação real da comunidade Chactivo.',
    canonical: 'https://chactivo.com/br',
    ogLocale: 'pt_BR',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat gay do Brasil</h1>
        <p>Uma entrada regional para conversar pelo navegador, com informação clara sobre privacidade e disponibilidade.</p>
      </header>
      <section>
        <h2>Participação real e privacidade</h2>
        <p>A referência ao Brasil orienta a entrada, mas não é um mapa de pessoas nem uma promessa de atividade em uma cidade. Compartilhe apenas o que desejar.</p>
      </section>
      <nav aria-label="Entradas relacionadas">
        <ul>
          <li><a href="/br/sao-paulo">Entrada de São Paulo</a></li>
          <li><a href="/chat/brasil">Entrar no chat do Brasil</a></li>
          <li><a href="/opin">Explorar OPIN</a></li>
          <li><a href="/faq">Ler perguntas frequentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/faq',
    lang: 'es',
    indexable: true,
    title: 'Preguntas Frecuentes | Chactivo',
    description: 'Respuestas claras sobre privacidad, registro, costo, moderación y seguridad en Chactivo.',
    canonical: 'https://chactivo.com/faq',
    ogLocale: 'es_CL',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Preguntas frecuentes de Chactivo</h1>
        <p>Información práctica sobre registro, costo, funcionamiento del chat y herramientas de seguridad disponibles.</p>
      </header>
      <section>
        <h2>¿Es gratis y necesito registrarme?</h2>
        <p>El chat público puede utilizarse sin un registro obligatorio, según la configuración disponible. Algunas funciones pueden requerir una cuenta.</p>
      </section>
      <section>
        <h2>¿Qué información debo compartir?</h2>
        <p>Evita publicar datos personales en una sala pública. Usa un alias si lo prefieres y no compartas dirección, GPS exacto, teléfono, correo o credenciales.</p>
      </section>
      <section>
        <h2>¿Dónde reviso privacidad y seguridad?</h2>
        <p>Consulta las normas de comunidad y la política de privacidad. Una conversación pública no equivale a anonimato absoluto.</p>
      </section>
      <nav aria-label="Entradas principales">
        <ul>
          <li><a href="/chat/principal">Entrar al chat principal</a></li>
          <li><a href="/normas-comunidad">Leer normas de comunidad</a></li>
          <li><a href="/">Volver al inicio</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/mas-30',
    lang: 'es',
    indexable: true,
    title: 'Chat Gay Mayores de 30 | Conversa En Chile | Chactivo',
    description: 'Entrada para mayores de 30 que buscan conversaciones maduras. Entra al chat de Chactivo y revisa la actividad real disponible.',
    canonical: 'https://chactivo.com/mas-30',
    ogLocale: 'es_CL',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat gay para mayores de 30</h1>
        <p>Una entrada para quienes prefieren conversaciones maduras y un espacio con expectativas claras.</p>
      </header>
      <section>
        <h2>Una intención concreta, sin promesas exageradas</h2>
        <p>La sala no se rellena con testimonios, contadores o perfiles inventados. La experiencia depende de las personas que participan en cada momento.</p>
      </section>
      <nav aria-label="Entradas relacionadas">
        <ul>
          <li><a href="/chat/principal">Revisar la sala disponible</a></li>
          <li><a href="/opin">Explorar OPIN</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
          <li><a href="/">Volver al inicio</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/santiago',
    lang: 'es-CL',
    indexable: true,
    title: 'Chat Gay Santiago | Conversa Con La Comunidad | Chactivo',
    description: 'Entrada local al chat gay de Santiago y la Región Metropolitana. Conversa desde tu navegador y revisa la actividad real disponible.',
    canonical: 'https://chactivo.com/santiago',
    ogLocale: 'es_CL',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat gay en Santiago, con contexto local</h1>
        <p>Una entrada local para Santiago y la Región Metropolitana que te lleva a una conversación real, sin mapa de personas ni ubicación exacta.</p>
      </header>
      <section>
        <h2>Local no significa invadir tu privacidad</h2>
        <p>La referencia geográfica orienta la entrada. La disponibilidad depende de la participación y no se reemplaza por cifras, fotos, barrios activos o testimonios fabricados.</p>
      </section>
      <nav aria-label="Entradas relacionadas">
        <ul>
          <li><a href="/chat/principal">Entrar al chat principal</a></li>
          <li><a href="/opin">Explorar OPIN</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
          <li><a href="/">Volver al inicio</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/mx/cdmx',
    lang: 'es-MX',
    indexable: false,
    title: 'Chat Gay CDMX | Entrada Regional | Chactivo',
    description: 'Entrada regional para quienes buscan chat gay en Ciudad de México. Accede al hub de México sin actividad local inventada.',
    canonical: 'https://chactivo.com/mx/cdmx',
    ogLocale: 'es_MX',
    seoShell: `
    <main id="seo-shell">
      <header><h1>Chat gay en CDMX</h1><p>Esta entrada regional conduce al hub de México. La disponibilidad y las personas visibles dependen de la participación real.</p></header>
      <nav aria-label="Entradas relacionadas"><ul><li><a href="/mx">Ir al hub de México</a></li><li><a href="/faq">Leer preguntas frecuentes</a></li></ul></nav>
    </main>`,
  },
  {
    route: '/ar/buenos-aires',
    lang: 'es-AR',
    indexable: false,
    title: 'Chat Gay Buenos Aires | Entrada Regional | Chactivo',
    description: 'Entrada regional para quienes buscan chat gay en Buenos Aires. Accede al hub de Argentina sin actividad local inventada.',
    canonical: 'https://chactivo.com/ar/buenos-aires',
    ogLocale: 'es_AR',
    seoShell: `
    <main id="seo-shell">
      <header><h1>Chat gay en Buenos Aires</h1><p>Esta entrada regional conduce al hub de Argentina. No muestra barrios, distancias ni actividad de una ciudad concreta sin una fuente autorizada.</p></header>
      <nav aria-label="Entradas relacionadas"><ul><li><a href="/ar">Ir al hub de Argentina</a></li><li><a href="/faq">Leer preguntas frecuentes</a></li></ul></nav>
    </main>`,
  },
  {
    route: '/es/madrid',
    lang: 'es-ES',
    indexable: false,
    title: 'Chat Gay Madrid | Entrada Regional | Chactivo',
    description: 'Entrada regional para quienes buscan chat gay en Madrid. Accede al hub de España sin fotos, contadores o actividad inventada.',
    canonical: 'https://chactivo.com/es/madrid',
    ogLocale: 'es_ES',
    seoShell: `
    <main id="seo-shell">
      <header><h1>Chat gay en Madrid</h1><p>Esta entrada regional conduce al hub de España. La disponibilidad cambia según la participación del momento.</p></header>
      <nav aria-label="Entradas relacionadas"><ul><li><a href="/es">Ir al hub de España</a></li><li><a href="/faq">Leer preguntas frecuentes</a></li></ul></nav>
    </main>`,
  },
  {
    route: '/br/sao-paulo',
    lang: 'pt-BR',
    indexable: false,
    title: 'Chat Gay São Paulo | Entrada Regional | Chactivo',
    description: 'Entrada regional para quem busca chat gay em São Paulo. Acesse o hub do Brasil sem atividade local inventada.',
    canonical: 'https://chactivo.com/br/sao-paulo',
    ogLocale: 'pt_BR',
    seoShell: `
    <main id="seo-shell">
      <header><h1>Chat gay em São Paulo</h1><p>Esta entrada regional conduz ao hub do Brasil. A disponibilidade depende da participação real.</p></header>
      <nav aria-label="Entradas relacionadas"><ul><li><a href="/br">Ir ao hub do Brasil</a></li><li><a href="/faq">Ler perguntas frequentes</a></li></ul></nav>
    </main>`,
  },
];

const hreflangEntries = [
  { hreflang: 'es-CL', href: 'https://chactivo.com/' },
  { hreflang: 'x-default', href: 'https://chactivo.com/' },
  { hreflang: 'es-MX', href: 'https://chactivo.com/mx' },
  { hreflang: 'es-AR', href: 'https://chactivo.com/ar' },
  { hreflang: 'es-ES', href: 'https://chactivo.com/es' },
  { hreflang: 'pt-BR', href: 'https://chactivo.com/br' },
];
const hreflangSupportedCanonicals = new Set(hreflangEntries.map(({ href }) => href));

function replaceTag(html, pattern, value) {
  return html.replace(pattern, value);
}

function renderRouteHtml(baseHtml, routeConfig) {
  const canonical = routeConfig.canonical;
  const escapedTitle = routeConfig.title;
  const escapedDescription = routeConfig.description;
  const hreflangBlock = routeConfig.indexable && hreflangSupportedCanonicals.has(canonical)
    ? hreflangEntries
        .map(({ hreflang, href }) => `    <link rel="alternate" hreflang="${hreflang}" href="${href}" data-chactivo-hreflang="true" />`)
        .join('\n')
    : '';
  const robots = routeConfig.indexable
    ? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    : 'noindex, nofollow, noarchive, nosnippet';

  let html = baseHtml;
  html = html.replace(/<html lang="[^"]+" class="dark">/, `<html lang="${routeConfig.lang}" class="dark">`);
  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${escapedTitle}</title>`);
  html = replaceTag(html, /<meta\s+name="description"\s+content="[^"]*"\s*\/>/, `<meta name="description" content="${escapedDescription}" />`);
  html = replaceTag(html, /<meta name="robots" content="[^"]*"\s*\/>/, `<meta name="robots" content="${robots}" />`);
  html = replaceTag(html, /<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`);
  html = replaceTag(html, /<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapedTitle}" />`);
  html = replaceTag(html, /<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapedDescription}" />`);
  html = replaceTag(html, /<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`);
  html = replaceTag(html, /<meta property="og:locale" content="[^"]*"\s*\/>/, `<meta property="og:locale" content="${routeConfig.ogLocale}" />`);
  html = replaceTag(html, /<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapedTitle}" />`);
  html = replaceTag(html, /<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapedDescription}" />`);
  html = replaceTag(html, /<!-- hreflang:start -->[\s\S]*?<!-- hreflang:end -->/, `<!-- hreflang:start -->\n${hreflangBlock ? `${hreflangBlock}\n` : ''}    <!-- hreflang:end -->`);
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
    await writeFile(path.join(outputDir, 'index.html'), renderRouteHtml(baseHtml, route), 'utf8');
  }
  console.log(`Generated static SEO HTML for ${routes.length} routes`);
}

main().catch((error) => {
  console.error('Failed to generate static SEO pages:', error);
  process.exitCode = 1;
});
