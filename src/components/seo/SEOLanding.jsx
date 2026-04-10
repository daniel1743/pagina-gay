import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { track, trackPageExit, trackPageView } from '@/services/eventTrackingService';
import PremiumLandingHero from '@/components/landing/PremiumLandingHero';
import { saveSeoFunnelContext } from '@/utils/seoFunnelContext';

const SEO_BASE_URL = 'https://chactivo.com';
const HREFLANG_ENTRIES = [
  { hreflang: 'es-CL', path: '/', documentLang: 'es-CL' },
  { hreflang: 'x-default', path: '/', documentLang: 'es-CL' },
  { hreflang: 'es-MX', path: '/mx', documentLang: 'es-MX' },
  { hreflang: 'es-AR', path: '/ar', documentLang: 'es-AR' },
  { hreflang: 'es-ES', path: '/es', documentLang: 'es-ES' },
  { hreflang: 'pt-BR', path: '/br', documentLang: 'pt-BR' },
];
const HREFLANG_PATHS = new Set(HREFLANG_ENTRIES.map(({ path }) => path));

const normalizeSeoPath = (pathname = '/') => {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '');
};

const toAbsoluteSeoUrl = (pathname = '/') => {
  const normalizedPath = normalizeSeoPath(pathname);
  return normalizedPath === '/'
    ? `${SEO_BASE_URL}/`
    : `${SEO_BASE_URL}${normalizedPath}`;
};

/**
 * 🚀 SEO LANDING MINIMALISTA
 *
 * - Google ve: Contenido, meta tags, keywords (SEO)
 * - Usuario ve: Pantalla 1 segundo y va directo al chat
 * - Bounce rate: Mínimo porque redirige automáticamente
 */

const SEOLanding = ({
  chatRoom = 'principal',
  title = 'Chat Gay Gratis - Chatea Ahora Sin Registro',
  description = 'Chat gay gratis y anónimo. Conoce gente nueva, haz amigos y chatea en tiempo real. Sin registro, sin descargas. ¡Entra ahora!',
  keywords = 'chat gay, chat gay gratis, chat gay sin registro, chat gay anonimo, gay chat',
  ogImage = 'https://chactivo.com/og-preview.png',
  h1 = 'Chat Gay Gratis',
  subtitle = 'Conecta con gente real ahora mismo',
  redirectDelay = 100, // ⚡ 100ms - casi instantáneo pero Google aún indexa
  canonicalPath = null,
  previewable = true,
  autoRedirect = true,
  ctaLabel = 'Entrar al chat ahora',
  supportingPoints = [],
  secondaryLinks = [],
  seoHeading = 'Bienvenido al mejor chat gay de habla hispana',
  seoParagraph = 'Únete a nuestra comunidad de chat gay gratis. Miles de usuarios conectados las 24 horas. Chatea de forma anónima, sin registro y sin descargas. Disponible para Chile, Argentina, México, España, Brasil y toda Latinoamérica.',
  seoBulletPoints = [
    'Chat gay gratis y sin registro',
    'Comunidad LGBTQ+ amigable',
    'Salas de chat por país y región',
    '100% anónimo y seguro',
    'Desde cualquier dispositivo',
  ],
}) => {
  const navigate = useNavigate();
  const pageStartRef = useRef(Date.now());
  const getSearchParams = () => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  };
  const searchParams = getSearchParams();
  const isPreviewMode =
    previewable &&
    (searchParams.get('preview') === '1' || searchParams.get('noredirect') === '1');
  const shouldAutoRedirect = autoRedirect && !isPreviewMode;
  const delayFromQuery = Number.parseInt(searchParams.get('delay') || '', 10);
  const effectiveRedirectDelay = Number.isFinite(delayFromQuery)
    ? Math.max(0, Math.min(delayFromQuery, 15000))
    : redirectDelay;
  const landingPath = normalizeSeoPath(
    canonicalPath || (typeof window !== 'undefined' ? window.location.pathname : '/')
  );

  const saveLandingFunnelContext = (entryMethod = 'landing_cta') => {
    saveSeoFunnelContext({
      fromPath: landingPath,
      countryPath: landingPath,
      targetPath: `/chat/${chatRoom}`,
      roomId: chatRoom,
      landingVariant: chatRoom,
      entryMethod,
    });
  };

  const goToChat = (method = 'landing_cta') => {
    saveLandingFunnelContext(method);
    track('entry_to_chat', {
      method,
      from_path: window.location.pathname,
      room_id: chatRoom,
      delay_ms: shouldAutoRedirect ? effectiveRedirectDelay : 0,
    }).catch(() => {});
    navigate(`/chat/${chatRoom}`);
  };

  const heroBadge = useMemo(() => {
    if (chatRoom === 'principal') return 'Chile activo ahora';
    return 'Gente conectando ahora';
  }, [chatRoom]);

  const heroSubtext = shouldAutoRedirect
    ? 'Acceso inmediato'
    : 'Sin registro obligatorio · Acceso inmediato';

  const heroLivePillLabel = chatRoom === 'principal'
    ? 'Personas conectando ahora'
    : 'Gente real entrando ahora';

  // 🔍 SEO - Actualizar meta tags dinámicamente
  useEffect(() => {
    const upsertMeta = (selector, attribute, value, factory) => {
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = factory();
        document.head.appendChild(tag);
      }
      tag.setAttribute(attribute, value);
      return tag;
    };

    const syncAlternateLinks = (currentPath) => {
      document
        .querySelectorAll('link[rel="alternate"][data-chactivo-hreflang="true"]')
        .forEach((tag) => tag.remove());

      if (!HREFLANG_PATHS.has(currentPath)) return;

      const canonicalTag = document.querySelector('link[rel="canonical"]');
      const anchorNode = canonicalTag || document.querySelector('meta[name="robots"]');

      HREFLANG_ENTRIES.forEach(({ hreflang, path }) => {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = hreflang;
        link.href = toAbsoluteSeoUrl(path);
        link.setAttribute('data-chactivo-hreflang', 'true');

        if (anchorNode?.parentNode) {
          anchorNode.parentNode.insertBefore(link, anchorNode.nextSibling);
        } else {
          document.head.appendChild(link);
        }
      });
    };

    // Title
    document.title = title;

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      metaDesc.content = description;
      document.head.appendChild(metaDesc);
    }

    // Meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    } else {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      metaKeywords.content = keywords;
      document.head.appendChild(metaKeywords);
    }

    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'index,follow,max-image-preview:large');

    const currentPath = landingPath;
    const canonicalHref = toAbsoluteSeoUrl(currentPath);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalHref;
    syncAlternateLinks(currentPath);

    const documentLangEntry = HREFLANG_ENTRIES.find(({ path }) => path === currentPath);
    document.documentElement.lang = documentLangEntry?.documentLang || 'es';

    upsertMeta('meta[property="og:title"]', 'content', title, () => {
      const tag = document.createElement('meta');
      tag.setAttribute('property', 'og:title');
      return tag;
    });
    upsertMeta('meta[property="og:description"]', 'content', description, () => {
      const tag = document.createElement('meta');
      tag.setAttribute('property', 'og:description');
      return tag;
    });
    upsertMeta('meta[property="og:url"]', 'content', canonicalHref, () => {
      const tag = document.createElement('meta');
      tag.setAttribute('property', 'og:url');
      return tag;
    });
    upsertMeta('meta[property="og:image"]', 'content', ogImage, () => {
      const tag = document.createElement('meta');
      tag.setAttribute('property', 'og:image');
      return tag;
    });
    upsertMeta('meta[property="og:image:alt"]', 'content', `${title} | Chactivo`, () => {
      const tag = document.createElement('meta');
      tag.setAttribute('property', 'og:image:alt');
      return tag;
    });
    upsertMeta('meta[name="twitter:card"]', 'content', 'summary_large_image', () => {
      const tag = document.createElement('meta');
      tag.setAttribute('name', 'twitter:card');
      return tag;
    });
    upsertMeta('meta[name="twitter:title"]', 'content', title, () => {
      const tag = document.createElement('meta');
      tag.setAttribute('name', 'twitter:title');
      return tag;
    });
    upsertMeta('meta[name="twitter:description"]', 'content', description, () => {
      const tag = document.createElement('meta');
      tag.setAttribute('name', 'twitter:description');
      return tag;
    });
    upsertMeta('meta[name="twitter:image"]', 'content', ogImage, () => {
      const tag = document.createElement('meta');
      tag.setAttribute('name', 'twitter:image');
      return tag;
    });
    upsertMeta('meta[name="twitter:image:alt"]', 'content', `${title} | Chactivo`, () => {
      const tag = document.createElement('meta');
      tag.setAttribute('name', 'twitter:image:alt');
      return tag;
    });
  }, [title, description, keywords, landingPath, ogImage]);

  // ⚡ Auto-redirect después de 1 segundo
  useEffect(() => {
    trackPageView(window.location.pathname, title).catch(() => {});
    track('landing_view', {
      page_path: window.location.pathname,
      landing_variant: chatRoom,
      seo_landing: true,
      preview_mode: isPreviewMode,
      auto_redirect_enabled: autoRedirect,
      redirect_delay_ms: effectiveRedirectDelay,
    }).catch(() => {});

    if (!shouldAutoRedirect) {
      return () => {
        const timeOnPage = Math.max(0, Math.round((Date.now() - pageStartRef.current) / 1000));
        trackPageExit(window.location.pathname, timeOnPage).catch(() => {});
      };
    }

    const timer = setTimeout(() => {
      saveLandingFunnelContext('auto_redirect');
      track('entry_to_chat', {
        method: 'auto_redirect',
        from_path: window.location.pathname,
        room_id: chatRoom,
        delay_ms: effectiveRedirectDelay,
      }).catch(() => {});
      navigate(`/chat/${chatRoom}`, { replace: true });
    }, effectiveRedirectDelay);

    return () => {
      clearTimeout(timer);
      const timeOnPage = Math.max(0, Math.round((Date.now() - pageStartRef.current) / 1000));
      trackPageExit(window.location.pathname, timeOnPage).catch(() => {});
    };
  }, [navigate, chatRoom, title, shouldAutoRedirect, effectiveRedirectDelay, landingPath]);

  return (
    <>

      <PremiumLandingHero
        badgeLabel={heroBadge}
        title={h1}
        subtitle={subtitle}
        ctaLabel={ctaLabel}
        ctaSubtext={heroSubtext}
        liveLabel={shouldAutoRedirect ? 'Entrando al chat' : 'En vivo ahora'}
        livePillLabel={heroLivePillLabel}
        supportingPoints={supportingPoints}
        secondaryLinks={secondaryLinks}
        onPrimaryClick={() => goToChat(isPreviewMode ? 'preview_cta' : 'landing_cta')}
        showAutoRedirect={shouldAutoRedirect}
        autoRedirectText={
          shouldAutoRedirect
            ? `Entrando al chat en ${Math.ceil(effectiveRedirectDelay / 1000)}s...`
            : ''
        }
      />

      {/* 📝 Contenido SEO oculto visualmente pero visible para Google */}
      <div className="sr-only">
        <h2>{seoHeading}</h2>
        <p>{seoParagraph}</p>
        <ul>
          {seoBulletPoints.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </>
  );
};

// 🌍 Variantes pre-configuradas por región
export const SEOLandingChile = () => (
  <SEOLanding
    chatRoom="principal"
    title="Chat Gay Chile En Vivo | Entra Gratis y Habla al Instante | Chactivo"
    description="Entra al chat gay de Chile y habla al instante con hombres de Santiago y otras ciudades. Gratis, sin app y sin registro obligatorio en Chactivo."
    keywords="chat gay chile, chat gay en vivo chile, chat gay gratis chile, hablar al instante chile, chat principal chile"
    h1="Entra y conversa con gente real"
    subtitle="Chile activo ahora mismo. Entra gratis, habla al instante y conecta sin vueltas desde tu navegador."
    canonicalPath="/"
    autoRedirect={false}
    ctaLabel="Entrar al chat principal"
    supportingPoints={[
      'Entrada directa al chat principal desde tu navegador.',
      'Cero descargas y menos pasos para empezar a hablar.',
      'Gente real conectando ahora dentro de Chile.',
    ]}
  />
);

export const SEOLandingHome = () => (
  <SEOLanding
    chatRoom="principal"
    title="Chat Gay Chile En Vivo | Entra Gratis y Habla al Instante | Chactivo"
    description="Entra gratis al chat gay de Chile y habla al instante con hombres de Santiago y otras ciudades. Sin app, sin vueltas y sin registro obligatorio."
    keywords="chat gay chile, chat principal chile, chat gay en vivo chile, chat gay gratis chile, hablar al instante chile"
    h1="Entra y conversa con gente real"
    subtitle="Chat principal de Chile activo ahora mismo. Entra rápido, habla al instante y conecta con gente de Santiago y otras ciudades sin dar vueltas."
    canonicalPath="/"
    autoRedirect={false}
    ctaLabel="Entrar ahora"
    supportingPoints={[
      'Acceso inmediato al chat principal de Chile desde tu navegador.',
      'Ruta directa para conversar sin pasos largos ni descargas.',
      'Gente real conectando ahora desde Santiago y otras ciudades.',
    ]}
    secondaryLinks={[
      { href: '/chat/principal', label: 'Chat principal' },
      { href: '/santiago', label: 'Entrada Santiago' },
      { href: '/mas-30', label: 'Mayores de 30' },
      { href: '/faq', label: 'FAQ' },
      { href: '/mx', label: 'México' },
      { href: '/ar', label: 'Argentina' },
      { href: '/es', label: 'España' },
      { href: '/br', label: 'Brasil' },
    ]}
    seoHeading="Chat gay Chile en vivo con entrada directa al chat principal"
    seoParagraph="Chactivo es una entrada rápida al chat gay de Chile. La home está enfocada en captar intención chilena, llevar al usuario al chat principal y reforzar búsquedas locales como Santiago y mayores de 30."
    seoBulletPoints={[
      'Chat principal de Chile con acceso inmediato',
      'Entrada enfocada en Santiago y ciudades chilenas',
      'Ruta directa para conversación en vivo sin app',
      'Comunidad real y activa dentro de Chile',
      'Superficies de apoyo como Santiago, +30 y FAQ',
    ]}
  />
);

export const SEOLandingArgentina = () => (
  <SEOLanding
    chatRoom="argentina"
    title="Chat Gay Argentina Gratis | Conocé Hombres En Vivo | Chactivo"
    description="Entrá al chat gay de Argentina y conocé hombres de Buenos Aires, Córdoba, Rosario y otras ciudades. Gratis, simple y sin app."
    keywords="chat gay argentina, chat gay buenos aires, chat gay cordoba, chat gay rosario, conocer hombres argentina"
    h1="Chat Gay Argentina"
    subtitle="Una entrada hecha para Argentina: más cercana, más simple y mejor alineada con búsquedas locales."
    canonicalPath="/ar"
    autoRedirect={false}
    ctaLabel="Entrar al chat de Argentina"
    supportingPoints={[
      'Entrada regional enfocada en Buenos Aires, Cordoba y Rosario.',
      'Mejor alineada con busquedas locales de Argentina.',
      'Acceso rapido desde navegador y sin pasos largos.',
    ]}
    secondaryLinks={[
      { href: '/ar/buenos-aires', label: 'Buenos Aires' },
      { href: '/faq', label: 'FAQ' },
      { href: '/', label: 'Chile' },
    ]}
    seoHeading="Chat gay Argentina con entrada local y acceso rapido"
    seoParagraph="Esta landing existe para separar mejor la demanda de Argentina de la home chilena. Reforzamos ciudades clave, una promesa local clara y una entrada mas coherente para usuarios argentinos."
    seoBulletPoints={[
      'Entrada local para Argentina con foco en ciudades reales',
      'Menos dependencia de la home de Chile para captar demanda argentina',
      'Acceso rapido al chat sin descargas ni app',
      'Promesa regional mas clara para mejorar CTR y relevancia',
    ]}
  />
);

export const SEOLandingMexico = () => (
  <SEOLanding
    chatRoom="mexico"
    title="Chat Gay Mexico Gratis | CDMX, Guadalajara y Monterrey | Chactivo"
    description="Explora el chat gay de Mexico y conecta con hombres de CDMX, Guadalajara, Monterrey y otras ciudades. Gratis, rapido y sin app."
    keywords="chat gay mexico, chat gay cdmx, chat gay guadalajara, chat gay monterrey, conectar hombres mexico"
    h1="Chat Gay México"
    subtitle="Una entrada hecha para Mexico: más curiosidad, mejor contexto local y acceso rapido sin pasos extra."
    canonicalPath="/mx"
    autoRedirect={false}
    ctaLabel="Entrar al chat de México"
    supportingPoints={[
      'Entrada regional enfocada en CDMX, Guadalajara y Monterrey.',
      'Promesa local mas clara para busquedas de Mexico.',
      'Acceso directo desde navegador y sin friccion extra.',
    ]}
    secondaryLinks={[
      { href: '/mx/cdmx', label: 'CDMX' },
      { href: '/faq', label: 'FAQ' },
      { href: '/', label: 'Chile' },
    ]}
    seoHeading="Chat gay Mexico con mejor foco local"
    seoParagraph="La landing de Mexico busca captar mejor la intencion local, reducir dependencia de la home chilena y darle a Google una superficie mas clara para busquedas mexicanas."
    seoBulletPoints={[
      'Entrada local para CDMX, Guadalajara y Monterrey',
      'Separacion semantica respecto de la home de Chile',
      'Mejor contexto para usuarios mexicanos antes de entrar al chat',
      'Acceso rapido sin descargas ni registro obligatorio',
    ]}
  />
);

export const SEOLandingEspana = () => (
  <SEOLanding
    chatRoom="espana"
    title="Chat Gay España Gratis | Habla En Vivo Sin App | Chactivo"
    description="Entra al chat gay de España y habla con chicos de Madrid, Barcelona, Valencia y otras ciudades. Gratis, claro y sin app."
    keywords="chat gay españa, chat gay madrid, chat gay barcelona, chat gay valencia, hablar en vivo españa"
    h1="Chat Gay España"
    subtitle="Una entrada clara para España, con una promesa más sobria y mejor separada de la home de Chile."
    canonicalPath="/es"
    autoRedirect={false}
    ctaLabel="Entrar al chat de España"
    supportingPoints={[
      'Entrada regional enfocada en Madrid, Barcelona y Valencia.',
      'Mas coherente para busquedas de Espana que una home chilena.',
      'Acceso rapido al chat sin descargas ni pasos largos.',
    ]}
    secondaryLinks={[
      { href: '/es/madrid', label: 'Madrid' },
      { href: '/faq', label: 'FAQ' },
      { href: '/', label: 'Chile' },
    ]}
    seoHeading="Chat gay Espana con entrada regional clara"
    seoParagraph="Esta landing ayuda a separar mejor la demanda de Espana, reforzar ciudades clave y darle a Google una superficie mas local para mejorar relevancia y CTR."
    seoBulletPoints={[
      'Entrada local para Madrid, Barcelona y Valencia',
      'Menos mezcla semantica con la home de Chile',
      'Promesa regional clara para usuarios de Espana',
      'Acceso directo al chat desde navegador',
    ]}
  />
);

export const SEOLandingBrasil = () => (
  <SEOLanding
    chatRoom="brasil"
    title="Bate-Papo Gay Brasil Gratis | Entre Agora Sem App | Chactivo"
    description="Entre no chat gay do Brasil e converse com homens de Sao Paulo, Rio, Brasilia e outras cidades. Gratis, rapido e sem app."
    keywords="chat gay brasil, bate-papo gay brasil, chat gay sao paulo, chat gay rio, entrar agora brasil"
    h1="Chat Gay Brasil"
    subtitle="Uma entrada pensada para o Brasil: mais contexto local, acesso rapido e menos dependencia da home do Chile."
    canonicalPath="/br"
    autoRedirect={false}
    ctaLabel="Entrar no chat do Brasil"
    supportingPoints={[
      'Entrada regional focada em Sao Paulo, Rio e Brasilia.',
      'Melhor alinhada com buscas do Brasil.',
      'Acesso rapido pelo navegador, sem download.',
    ]}
    secondaryLinks={[
      { href: '/br/sao-paulo', label: 'Sao Paulo' },
      { href: '/faq', label: 'FAQ' },
      { href: '/', label: 'Chile' },
    ]}
    seoHeading="Chat gay Brasil com entrada regional mais clara"
    seoParagraph="A landing do Brasil ajuda a tirar peso internacional da home do Chile, reforcar cidades importantes e dar uma superficie mais local para buscas brasileiras."
    seoBulletPoints={[
      'Entrada local para Sao Paulo, Rio e Brasilia',
      'Separacao semantica da home chilena',
      'Melhor contexto para usuarios brasileiros',
      'Acesso rapido sem app e sem cadastro obrigatorio',
    ]}
  />
);

export const SEOLandingSantiagoCentro = () => (
  <SEOLanding
    chatRoom="principal"
    title="Chat Gay Santiago Centro | Entrada Local Al Chat De Santiago | Chactivo"
    description="Una landing de apoyo para quienes buscan chat gay en Santiago Centro y la Región Metropolitana. Entra gratis y accede al chat local de Chactivo."
    keywords="chat gay santiago centro, chat gay santiago, chat gay region metropolitana, entrar al chat gay santiago"
    h1="Chat Gay Santiago Centro"
    subtitle="Una entrada local de apoyo para búsquedas de Santiago y la RM"
    canonicalPath="/santiago"
    autoRedirect={false}
    ctaLabel="Entrar al chat de Chile"
    supportingPoints={[
      'Pensada para apoyar búsquedas locales de Santiago Centro y la Región Metropolitana.',
      'Refuerza la landing local dueña en vez de competir con ella.',
      'Mantiene una promesa local clara y sobria.',
    ]}
    secondaryLinks={[
      { href: '/', label: 'Home Chile' },
      { href: '/chat/principal', label: 'Chat principal' },
      { href: '/faq', label: 'FAQ' },
    ]}
  />
);

export const SEOLandingCDMX = () => (
  <SEOLanding
    chatRoom="mexico"
    title="Chat Gay CDMX | Conecta En Ciudad de Mexico | Chactivo"
    description="Chat gay CDMX gratis para conectar con hombres de Ciudad de Mexico. Entra rapido, sin app y con una entrada local clara para CDMX."
    keywords="chat gay cdmx, chat gay ciudad de mexico, gay chat cdmx, hombres cdmx chat gay"
    h1="Chat Gay CDMX"
    subtitle="Una entrada satelite para captar busquedas de Ciudad de Mexico y empujarlas al hub de Mexico con mejor contexto local."
    canonicalPath="/mx/cdmx"
    autoRedirect={false}
    ctaLabel="Entrar al chat de México"
    supportingPoints={[
      'Pensada para busquedas locales de CDMX con mejor ajuste semantico.',
      'Refuerza el cluster de Mexico sin cargar todo sobre /mx.',
      'Acceso directo al chat desde navegador y sin app.',
    ]}
    secondaryLinks={[
      { href: '/mx', label: 'Hub México' },
      { href: '/faq', label: 'FAQ' },
      { href: '/', label: 'Chile' },
    ]}
    seoHeading="Chat gay CDMX como entrada local del cluster Mexico"
    seoParagraph="Esta pagina existe para empezar a construir dominancia semantica en Mexico desde una superficie mas especifica. El objetivo es captar la intencion de CDMX y llevarla al hub de Mexico con una promesa mas coherente."
    seoBulletPoints={[
      'Entrada local para Ciudad de Mexico',
      'Apoya el cluster Mexico sin duplicar la home de Chile',
      'Mejor ajuste para busquedas de alta intencion en CDMX',
      'Conecta el long-tail con el hub pais correspondiente',
    ]}
  />
);

export const SEOLandingBuenosAires = () => (
  <SEOLanding
    chatRoom="argentina"
    title="Chat Gay Buenos Aires | Conoce Hombres En Vivo | Chactivo"
    description="Chat gay Buenos Aires gratis para conocer hombres de Capital, GBA y otras zonas cercanas. Entra simple, rapido y sin app."
    keywords="chat gay buenos aires, gay chat buenos aires, conocer hombres buenos aires, chat gay capital federal"
    h1="Chat Gay Buenos Aires"
    subtitle="Una entrada satelite para Buenos Aires que refuerza el hub de Argentina y capta mejor la intencion local."
    canonicalPath="/ar/buenos-aires"
    autoRedirect={false}
    ctaLabel="Entrar al chat de Argentina"
    supportingPoints={[
      'Pensada para busquedas locales de Buenos Aires y GBA.',
      'Ayuda a que Argentina gane cluster propio y menos trafico dilutivo.',
      'Entrada simple para conocer gente sin app ni vueltas.',
    ]}
    secondaryLinks={[
      { href: '/ar', label: 'Hub Argentina' },
      { href: '/faq', label: 'FAQ' },
      { href: '/', label: 'Chile' },
    ]}
    seoHeading="Chat gay Buenos Aires como pagina satelite del cluster Argentina"
    seoParagraph="Esta superficie ayuda a capturar una intencion mas concreta dentro de Argentina. Buenos Aires es una ciudad con suficiente peso semantico como para justificar una pagina propia conectada al hub /ar."
    seoBulletPoints={[
      'Entrada local para Buenos Aires',
      'Refuerzo semantico para el hub Argentina',
      'Long-tail mas especifico y menos dilutivo',
      'Promesa local mas cercana para mejorar relevancia',
    ]}
  />
);

export const SEOLandingMadrid = () => (
  <SEOLanding
    chatRoom="espana"
    title="Chat Gay Madrid | Habla Con Chicos De Madrid | Chactivo"
    description="Chat gay Madrid gratis para hablar con chicos de Madrid y alrededores. Entra rapido, sin app y con una entrada clara para Madrid."
    keywords="chat gay madrid, gay chat madrid, chicos madrid chat gay, hablar con chicos madrid"
    h1="Chat Gay Madrid"
    subtitle="Una entrada satelite pensada para Madrid, conectada al hub de España y con una promesa local mas clara."
    canonicalPath="/es/madrid"
    autoRedirect={false}
    ctaLabel="Entrar al chat de España"
    supportingPoints={[
      'Captura mejor la intencion local de Madrid.',
      'Refuerza el cluster de España con una ciudad concreta.',
      'Entrada clara y sobria, sin app ni pasos largos.',
    ]}
    secondaryLinks={[
      { href: '/es', label: 'Hub España' },
      { href: '/faq', label: 'FAQ' },
      { href: '/', label: 'Chile' },
    ]}
    seoHeading="Chat gay Madrid como pagina satelite del cluster Espana"
    seoParagraph="Madrid es una ciudad suficientemente fuerte para iniciar un cluster mas profundo en España. Esta pagina no reemplaza al hub /es; lo refuerza con una capa semantica mas precisa."
    seoBulletPoints={[
      'Entrada local para Madrid',
      'Mejor contexto para busquedas de alta intencion',
      'Refuerzo semantico del hub Espana',
      'Promesa sobria y mas alineada al mercado local',
    ]}
  />
);

export const SEOLandingSaoPaulo = () => (
  <SEOLanding
    chatRoom="brasil"
    title="Chat Gay Sao Paulo | Converse Com Homens Da Cidade | Chactivo"
    description="Chat gay Sao Paulo gratis para conversar com homens da cidade e alredores. Entre rapido, sem app e com uma entrada local para Sao Paulo."
    keywords="chat gay sao paulo, bate-papo gay sao paulo, homens sao paulo chat gay, conversar homens sao paulo"
    h1="Chat Gay Sao Paulo"
    subtitle="Uma entrada satelite para Sao Paulo, conectada ao hub do Brasil e pensada para buscas mais especificas."
    canonicalPath="/br/sao-paulo"
    autoRedirect={false}
    ctaLabel="Entrar no chat do Brasil"
    supportingPoints={[
      'Captura melhor a intencao local de Sao Paulo.',
      'Reforca o cluster Brasil sem depender so da home do Chile.',
      'Entrada direta, sem app e sem passos longos.',
    ]}
    secondaryLinks={[
      { href: '/br', label: 'Hub Brasil' },
      { href: '/faq', label: 'FAQ' },
      { href: '/', label: 'Chile' },
    ]}
    seoHeading="Chat gay Sao Paulo como pagina satelite do cluster Brasil"
    seoParagraph="Sao Paulo e uma cidade chave para abrir o cluster semantico do Brasil com mais controle. Esta pagina ajuda a captar buscas locais e empurra essa demanda ao hub /br."
    seoBulletPoints={[
      'Entrada local para Sao Paulo',
      'Melhor ajuste para buscas especificas no Brasil',
      'Reforco semantico do hub /br',
      'Long-tail mais controlado e menos dilutivo',
    ]}
  />
);

export default SEOLanding;
