import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');

const routes = [
  {
    route: '/',
    lang: 'es-CL',
    title: 'Chat Gay Chile En Vivo | Entra Gratis y Habla al Instante | Chactivo',
    description: 'Entra gratis al chat gay de Chile y habla al instante con hombres de Santiago y otras ciudades. Sin app, sin vueltas y sin registro obligatorio.',
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
          <li><a href="/mx">Explorar Mexico</a></li>
          <li><a href="/ar">Explorar Argentina</a></li>
          <li><a href="/es">Explorar España</a></li>
          <li><a href="/br">Explorar Brasil</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/ar',
    lang: 'es-AR',
    title: 'Chat Gay Argentina Gratis | Conoce Hombres En Vivo | Chactivo',
    description: 'Entra al chat gay de Argentina y conoce hombres de Buenos Aires, Cordoba, Rosario y otras ciudades. Gratis, simple y sin app.',
    canonical: 'https://chactivo.com/ar',
    ogLocale: 'es_AR',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat Gay Argentina</h1>
        <p>Una entrada pensada para Argentina. Habla con gente de Buenos Aires, Cordoba, Rosario y otras ciudades con una promesa local mas clara.</p>
      </header>
      <section>
        <h2>Entrada regional para separar mejor la demanda argentina</h2>
        <p>La idea de esta landing es darle a Google una superficie mas coherente para Argentina y evitar que la home de Chile siga absorbiendo en exceso estas busquedas.</p>
      </section>
      <nav aria-label="Entradas principales">
        <ul>
          <li><a href="/ar/buenos-aires">Ver Buenos Aires</a></li>
          <li><a href="/chat/principal">Entrar al chat principal</a></li>
          <li><a href="/">Ver home Chile</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/mx',
    lang: 'es-MX',
    title: 'Chat Gay Mexico Gratis | CDMX, Guadalajara y Monterrey | Chactivo',
    description: 'Explora el chat gay de Mexico y conecta con hombres de CDMX, Guadalajara, Monterrey y otras ciudades. Gratis, rapido y sin app.',
    canonical: 'https://chactivo.com/mx',
    ogLocale: 'es_MX',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat Gay Mexico</h1>
        <p>Entrada de apoyo para Mexico. Habla con gente de CDMX, Guadalajara, Monterrey y otras ciudades desde una superficie mas local.</p>
      </header>
      <section>
        <h2>Superficie local para no cargar todo sobre la home de Chile</h2>
        <p>Esta landing busca capturar mejor la demanda de Mexico, mejorar relevancia regional y repartir el crecimiento internacional con mas orden.</p>
      </section>
      <nav aria-label="Entradas principales">
        <ul>
          <li><a href="/mx/cdmx">Ver CDMX</a></li>
          <li><a href="/chat/principal">Entrar al chat principal</a></li>
          <li><a href="/">Ver home Chile</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/mx/cdmx',
    lang: 'es-MX',
    title: 'Chat Gay CDMX | Conecta En Ciudad de Mexico | Chactivo',
    description: 'Chat gay CDMX gratis para conectar con hombres de Ciudad de Mexico. Entra rapido, sin app y con una entrada local clara para CDMX.',
    canonical: 'https://chactivo.com/mx/cdmx',
    ogLocale: 'es_MX',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat Gay CDMX</h1>
        <p>Entrada local para Ciudad de Mexico. Habla con hombres de CDMX desde una superficie mas especifica y conectada al hub de Mexico.</p>
      </header>
      <section>
        <h2>Pagina satelite para reforzar el cluster Mexico</h2>
        <p>Esta pagina existe para empezar a captar busquedas mas especificas de CDMX y empujarlas hacia el hub /mx con mejor relevancia local.</p>
      </section>
      <nav aria-label="Entradas principales">
        <ul>
          <li><a href="/mx">Ver hub Mexico</a></li>
          <li><a href="/chat/principal">Entrar al chat principal</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/es',
    lang: 'es-ES',
    title: 'Chat Gay Espana Gratis | Habla En Vivo Sin App | Chactivo',
    description: 'Entra al chat gay de Espana y habla con chicos de Madrid, Barcelona, Valencia y otras ciudades. Gratis, claro y sin app.',
    canonical: 'https://chactivo.com/es',
    ogLocale: 'es_ES',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat Gay Espana</h1>
        <p>Una entrada para Espana donde puedes conversar con gente de Madrid, Barcelona, Valencia y otras ciudades desde una superficie mas local.</p>
      </header>
      <section>
        <h2>Mas relevancia local para la demanda de Espana</h2>
        <p>Esta landing ayuda a separar mejor las busquedas de Espana, mejorar la promesa regional y reducir la mezcla con la home chilena.</p>
      </section>
      <nav aria-label="Entradas principales">
        <ul>
          <li><a href="/es/madrid">Ver Madrid</a></li>
          <li><a href="/chat/principal">Entrar al chat principal</a></li>
          <li><a href="/">Ver home Chile</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/es/madrid',
    lang: 'es-ES',
    title: 'Chat Gay Madrid | Habla Con Chicos De Madrid | Chactivo',
    description: 'Chat gay Madrid gratis para hablar con chicos de Madrid y alrededores. Entra rapido, sin app y con una entrada clara para Madrid.',
    canonical: 'https://chactivo.com/es/madrid',
    ogLocale: 'es_ES',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat Gay Madrid</h1>
        <p>Entrada local para Madrid. Habla con chicos de Madrid y alrededores desde una superficie mas afinada para esa busqueda.</p>
      </header>
      <section>
        <h2>Refuerzo semantico del cluster Espana</h2>
        <p>Esta pagina satelite ayuda a capturar long-tail de Madrid sin mezclar toda la demanda con el hub general /es.</p>
      </section>
      <nav aria-label="Entradas principales">
        <ul>
          <li><a href="/es">Ver hub España</a></li>
          <li><a href="/chat/principal">Entrar al chat principal</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/br',
    lang: 'pt-BR',
    title: 'Bate-Papo Gay Brasil Gratis | Entre Agora Sem App | Chactivo',
    description: 'Entre no chat gay do Brasil e converse com homens de Sao Paulo, Rio, Brasilia e outras cidades. Gratis, rapido e sem app.',
    canonical: 'https://chactivo.com/br',
    ogLocale: 'pt_BR',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat Gay Brasil</h1>
        <p>Uma entrada para o Brasil. Converse com homens de Sao Paulo, Rio, Brasilia e outras cidades com foco mais local.</p>
      </header>
      <section>
        <h2>Superficie regional para organizar melhor o crescimento</h2>
        <p>Esta landing ajuda a dar mais contexto para buscas do Brasil, reduzir dependencia da home do Chile e tornar a expansao mais ordenada.</p>
      </section>
      <nav aria-label="Entradas principais">
        <ul>
          <li><a href="/br/sao-paulo">Ver Sao Paulo</a></li>
          <li><a href="/chat/principal">Entrar no chat principal</a></li>
          <li><a href="/">Ver home Chile</a></li>
          <li><a href="/faq">Ler perguntas frequentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/br/sao-paulo',
    lang: 'pt-BR',
    title: 'Chat Gay Sao Paulo | Converse Com Homens Da Cidade | Chactivo',
    description: 'Chat gay Sao Paulo gratis para conversar com homens da cidade e alredores. Entre rapido, sem app e com uma entrada local para Sao Paulo.',
    canonical: 'https://chactivo.com/br/sao-paulo',
    ogLocale: 'pt_BR',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat Gay Sao Paulo</h1>
        <p>Entrada local para Sao Paulo. Converse com homens da cidade desde uma superficie mais especifica e ligada ao hub do Brasil.</p>
      </header>
      <section>
        <h2>Pagina satelite para reforcar o cluster Brasil</h2>
        <p>Esta pagina ajuda a captar buscas mais especificas de Sao Paulo e leva essa intencao ao hub /br com mais contexto local.</p>
      </section>
      <nav aria-label="Entradas principales">
        <ul>
          <li><a href="/br">Ver hub Brasil</a></li>
          <li><a href="/chat/principal">Entrar no chat principal</a></li>
          <li><a href="/">Ver home Chile</a></li>
          <li><a href="/faq">Ler perguntas frequentes</a></li>
        </ul>
      </nav>
    </main>`,
  },
  {
    route: '/ar/buenos-aires',
    lang: 'es-AR',
    title: 'Chat Gay Buenos Aires | Conoce Hombres En Vivo | Chactivo',
    description: 'Chat gay Buenos Aires gratis para conocer hombres de Capital, GBA y otras zonas cercanas. Entra simple, rapido y sin app.',
    canonical: 'https://chactivo.com/ar/buenos-aires',
    ogLocale: 'es_AR',
    seoShell: `
    <main id="seo-shell">
      <header>
        <h1>Chat Gay Buenos Aires</h1>
        <p>Entrada local para Buenos Aires. Conoce hombres de Capital, GBA y otras zonas cercanas desde una superficie mas afinada para esa busqueda.</p>
      </header>
      <section>
        <h2>Pagina satelite para reforzar el cluster Argentina</h2>
        <p>Esta pagina ayuda a captar una intencion mas concreta dentro de Argentina y empujarla hacia el hub /ar con mejor relevancia semantica.</p>
      </section>
      <nav aria-label="Entradas principales">
        <ul>
          <li><a href="/ar">Ver hub Argentina</a></li>
          <li><a href="/chat/principal">Entrar al chat principal</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
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
          <li><a href="/">Volver a home Chile</a></li>
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
          <li><a href="/">Volver a home Chile</a></li>
          <li><a href="/faq">Leer preguntas frecuentes</a></li>
        </ul>
      </nav>
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
  const hreflangBlock = hreflangSupportedCanonicals.has(canonical)
    ? hreflangEntries
        .map(
          ({ hreflang, href }) =>
            `    <link rel="alternate" hreflang="${hreflang}" href="${href}" data-chactivo-hreflang="true" />`
        )
        .join('\n')
    : '';

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
  html = replaceTag(
    html,
    /<!-- hreflang:start -->[\s\S]*?<!-- hreflang:end -->/,
    `<!-- hreflang:start -->\n${hreflangBlock ? `${hreflangBlock}\n` : ''}    <!-- hreflang:end -->`
  );

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
