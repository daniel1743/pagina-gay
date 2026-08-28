import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  BubbleChatIcon,
  Globe02Icon,
  InformationCircleIcon,
  LockPasswordIcon,
  Shield01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { track, trackPageExit, trackPageView } from '@/services/eventTrackingService';
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
  return normalizedPath === '/' ? `${SEO_BASE_URL}/` : `${SEO_BASE_URL}${normalizedPath}`;
};

const upsertMeta = (selector, attribute, value) => {
  let tag = document.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    document.head.appendChild(tag);
  }
  tag.setAttribute(attribute, value);
  return tag;
};

const regionalSteps = [
  {
    title: 'Elige cómo entrar',
    text: 'Puedes ir al chat para conversar o revisar OPIN para leer publicaciones de la comunidad.',
    icon: BubbleChatIcon,
  },
  {
    title: 'Comprueba la actividad real',
    text: 'La disponibilidad cambia con la participación. Si una sala está tranquila, no rellenamos la pantalla con usuarios o mensajes inventados.',
    icon: UserGroupIcon,
  },
  {
    title: 'Comparte solo lo necesario',
    text: 'Usa un alias si lo prefieres y evita publicar dirección, GPS exacto, teléfono, correo o credenciales.',
    icon: LockPasswordIcon,
  },
];

const SEOLanding = ({
  chatRoom = 'principal',
  title = 'Chat gay en español | Conversa desde tu navegador | Chactivo',
  description = 'Entra a Chactivo para conversar con la comunidad LGBTQ+ desde tu navegador. La actividad visible depende de la participación real.',
  ogImage = 'https://chactivo.com/og-preview.png',
  h1 = 'Conversa con la comunidad',
  subtitle = 'Una entrada clara al chat y a las publicaciones de Chactivo.',
  redirectDelay = 0,
  canonicalPath = null,
  previewable = true,
  autoRedirect = false,
  indexable = true,
  ctaLabel = 'Entrar al chat',
  supportingPoints = [],
  secondaryLinks = [],
  contentHeading = 'Una entrada simple y honesta',
  contentParagraph = 'Chactivo reúne conversación y publicaciones comunitarias en un espacio web. La experiencia puede cambiar según la actividad real del momento.',
}) => {
  const navigate = useNavigate();
  const pageStartRef = useRef(Date.now());
  const landingPath = normalizeSeoPath(
    canonicalPath || (typeof window !== 'undefined' ? window.location.pathname : '/')
  );
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const isPreviewMode = previewable && (searchParams.get('preview') === '1' || searchParams.get('noredirect') === '1');
  const shouldAutoRedirect = autoRedirect && !isPreviewMode;
  const delayFromQuery = Number.parseInt(searchParams.get('delay') || '', 10);
  const effectiveRedirectDelay = Number.isFinite(delayFromQuery)
    ? Math.max(0, Math.min(delayFromQuery, 15000))
    : Math.max(0, redirectDelay);

  const saveLandingFunnelContext = useCallback((entryMethod = 'landing_cta') => {
    saveSeoFunnelContext({
      fromPath: landingPath,
      countryPath: landingPath,
      targetPath: `/chat/${chatRoom}`,
      roomId: chatRoom,
      landingVariant: chatRoom,
      entryMethod,
    });
  }, [chatRoom, landingPath]);

  const goToChat = useCallback((method = 'landing_cta') => {
    saveLandingFunnelContext(method);
    track('entry_to_chat', {
      method,
      from_path: typeof window !== 'undefined' ? window.location.pathname : landingPath,
      room_id: chatRoom,
      delay_ms: shouldAutoRedirect ? effectiveRedirectDelay : 0,
    }).catch(() => {});
    navigate(`/chat/${chatRoom}`);
  }, [chatRoom, effectiveRedirectDelay, landingPath, navigate, saveLandingFunnelContext, shouldAutoRedirect]);

  const heroBadge = useMemo(() => {
    if (chatRoom === 'principal') return 'Chat principal';
    return `Entrada ${chatRoom}`;
  }, [chatRoom]);

  useEffect(() => {
    const previousTitle = document.title;
    const previousLang = document.documentElement.lang;
    const previousRobots = document.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
    const previousDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const previousCanonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
    const previousKeywords = document.querySelector('meta[name="keywords"]');
    const previousKeywordsContent = previousKeywords?.getAttribute('content') || '';
    const previousAlternates = Array.from(document.querySelectorAll('link[rel="alternate"][data-chactivo-hreflang="true"]'));

    document.title = title;
    upsertMeta('meta[name="description"]', 'content', description);
    upsertMeta('meta[name="robots"]', 'content', indexable ? 'index,follow,max-image-preview:large' : 'noindex,nofollow,noarchive');

    // Meta keywords no aporta valor en buscadores modernos y se elimina de esta superficie.
    previousKeywords?.remove();

    const canonicalHref = toAbsoluteSeoUrl(landingPath);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalHref;

    const documentLangEntry = HREFLANG_ENTRIES.find(({ path }) => path === landingPath);
    document.documentElement.lang = documentLangEntry?.documentLang || 'es';

    upsertMeta('meta[property="og:title"]', 'content', title);
    upsertMeta('meta[property="og:description"]', 'content', description);
    upsertMeta('meta[property="og:url"]', 'content', canonicalHref);
    upsertMeta('meta[property="og:image"]', 'content', ogImage);
    upsertMeta('meta[property="og:image:alt"]', 'content', `${title} | Chactivo`);
    upsertMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', 'content', title);
    upsertMeta('meta[name="twitter:description"]', 'content', description);
    upsertMeta('meta[name="twitter:image"]', 'content', ogImage);
    upsertMeta('meta[name="twitter:image:alt"]', 'content', `${title} | Chactivo`);

    document.querySelectorAll('link[rel="alternate"][data-chactivo-hreflang="true"]').forEach((tag) => tag.remove());
    if (indexable && HREFLANG_PATHS.has(landingPath)) {
      HREFLANG_ENTRIES.forEach(({ hreflang, path }) => {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = hreflang;
        link.href = toAbsoluteSeoUrl(path);
        link.setAttribute('data-chactivo-hreflang', 'true');
        canonical.parentNode?.insertBefore(link, canonical.nextSibling);
      });
    }

    return () => {
      document.title = previousTitle;
      document.documentElement.lang = previousLang;
      if (previousRobots) upsertMeta('meta[name="robots"]', 'content', previousRobots);
      if (previousDescription) upsertMeta('meta[name="description"]', 'content', previousDescription);
      if (previousCanonical) {
        let currentCanonical = document.querySelector('link[rel="canonical"]');
        if (!currentCanonical) {
          currentCanonical = document.createElement('link');
          currentCanonical.rel = 'canonical';
          document.head.appendChild(currentCanonical);
        }
        currentCanonical.href = previousCanonical;
      }
      document.querySelectorAll('link[rel="alternate"][data-chactivo-hreflang="true"]').forEach((tag) => tag.remove());
      previousAlternates.forEach((tag) => document.head.appendChild(tag));
      if (previousKeywordsContent) upsertMeta('meta[name="keywords"]', 'content', previousKeywordsContent);
    };
  }, [description, indexable, landingPath, ogImage, title]);

  useEffect(() => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : landingPath;
    trackPageView(currentPath, title).catch(() => {});
    track('landing_view', {
      page_path: currentPath,
      landing_variant: chatRoom,
      seo_landing: true,
      preview_mode: isPreviewMode,
      auto_redirect_enabled: shouldAutoRedirect,
      redirect_delay_ms: effectiveRedirectDelay,
    }).catch(() => {});

    if (!shouldAutoRedirect) {
      return () => {
        const timeOnPage = Math.max(0, Math.round((Date.now() - pageStartRef.current) / 1000));
        trackPageExit(currentPath, timeOnPage).catch(() => {});
      };
    }

    const timer = setTimeout(() => {
      saveLandingFunnelContext('auto_redirect');
      goToChat('auto_redirect');
    }, effectiveRedirectDelay);

    return () => {
      clearTimeout(timer);
      const timeOnPage = Math.max(0, Math.round((Date.now() - pageStartRef.current) / 1000));
      trackPageExit(currentPath, timeOnPage).catch(() => {});
    };
  }, [chatRoom, effectiveRedirectDelay, goToChat, isPreviewMode, landingPath, shouldAutoRedirect, title]);

  return (
    <main className="cv-page cv-shell min-h-screen text-foreground">
      <section className="mx-auto w-full max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <div className="cv-surface-elevated cv-hero relative overflow-hidden rounded-[2rem] px-5 py-12 shadow-2xl sm:px-10 sm:py-16 lg:px-16">
          <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" aria-hidden="true" />
          <div className="relative max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-sm font-medium text-cyan-100">
              <HugeiconsIcon icon={Globe02Icon} size={16} color="currentColor" aria-hidden="true" />
              {heroBadge}
            </div>
            <h1 className="cv-display text-4xl font-black tracking-tight text-white sm:text-6xl">{h1}</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-xl sm:leading-8">{subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => goToChat(isPreviewMode ? 'preview_cta' : 'landing_cta')}
                className="cv-button-primary inline-flex min-h-12 rounded-xl px-6 text-base font-bold shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                {ctaLabel}
                <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="currentColor" className="ml-2" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/opin')}
                className="cv-button-secondary inline-flex min-h-12 rounded-xl px-6 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Explorar OPIN
              </button>
            </div>
            {shouldAutoRedirect && <p className="mt-4 text-sm text-slate-400">Entrando al chat en {Math.ceil(effectiveRedirectDelay / 1000)} s…</p>}
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {supportingPoints.slice(0, 3).map((point) => (
            <div key={point} className="cv-card cv-card-interactive rounded-2xl p-4 text-sm leading-6 text-muted-foreground">{point}</div>
          ))}
        </div>

        <section aria-labelledby="regional-content-title" className="cv-card mt-14 rounded-3xl p-6 sm:mt-16 sm:p-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Antes de entrar</p>
            <h2 id="regional-content-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{contentHeading}</h2>
            <p className="mt-4 leading-7 text-muted-foreground">{contentParagraph}</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {regionalSteps.map((step) => (
              <article key={step.title} className="cv-card cv-card-interactive rounded-2xl p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                  <HugeiconsIcon icon={step.icon} size={21} color="currentColor" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        {secondaryLinks.length > 0 && (
          <nav aria-label="Otras entradas de Chactivo" className="cv-card mt-10 rounded-2xl p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <HugeiconsIcon icon={InformationCircleIcon} size={21} color="currentColor" className="mt-0.5 shrink-0 text-cyan-300" aria-hidden="true" />
              <div>
                <h2 className="font-bold">Otras formas de participar</h2>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                  {secondaryLinks.map((link) => (
                    <a key={link.href} href={link.href} className="font-medium text-cyan-300 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-cyan-200">{link.label}</a>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        )}

        <section className="cv-card mt-10 rounded-3xl p-7 text-center sm:p-10">
          <HugeiconsIcon icon={Shield01Icon} size={28} color="currentColor" className="mx-auto text-cyan-200" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Conversación con límites claros</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-muted-foreground">Revisa las <a href="/normas-comunidad" className="font-semibold text-cyan-300 underline-offset-4 hover:underline">normas de la comunidad</a> y la <a href="/faq" className="font-semibold text-cyan-300 underline-offset-4 hover:underline">FAQ</a> antes de continuar.</p>
          <button type="button" onClick={() => goToChat('bottom_cta')} className="cv-button-primary mt-6 inline-flex min-h-12 rounded-xl px-7 text-base font-bold focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-background">Entrar al chat<HugeiconsIcon icon={ArrowRight01Icon} size={19} color="currentColor" className="ml-2" aria-hidden="true" /></button>
        </section>
      </section>
    </main>
  );
};

export const SEOLandingChile = () => (
  <SEOLanding
    chatRoom="principal"
    title="Chat Gay Chile En Vivo | Conversa Desde Tu Navegador | Chactivo"
    description="Entra al chat gay de Chile, revisa la actividad real y conversa desde tu navegador. Sin descarga y con normas visibles en Chactivo."
    h1="Chat gay de Chile para conversar"
    subtitle="Una entrada directa al chat principal de Chile, con información clara sobre cómo participar."
    canonicalPath="/chat-gay-chile"
    indexable={false}
    ctaLabel="Entrar al chat de Chile"
    contentHeading="Qué encontrarás en esta entrada"
    contentParagraph="Esta URL se conserva como acceso histórico y dirige al chat principal. La actividad visible depende de quienes estén participando; no mostramos cifras, perfiles ni mensajes de relleno."
    secondaryLinks={[{ href: '/', label: 'Entrada principal' }, { href: '/santiago', label: 'Santiago' }, { href: '/faq', label: 'FAQ' }]}
    supportingPoints={['Acceso al chat principal desde el navegador.', 'La actividad se muestra según participación real.', 'Normas y opciones de ayuda accesibles.']}
  />
);

export const SEOLandingHome = () => (
  <SEOLanding
    chatRoom="principal"
    title="Chat Gay Chile En Vivo | Conversa Desde Tu Navegador | Chactivo"
    description="Entra al chat gay de Chile y conversa desde tu navegador. Revisa la actividad real, participa con un alias y consulta las normas de Chactivo."
    h1="Entra y conversa con la comunidad"
    subtitle="Chat principal de Chile con una entrada rápida, una experiencia clara y actividad sin inventar."
    canonicalPath="/"
    ctaLabel="Entrar al chat principal"
    contentHeading="Una comunidad que se construye con participación real"
    contentParagraph="Chactivo combina un chat web y OPIN, un espacio de publicaciones breves. Puedes elegir dónde participar y volver cuando encuentres una conversación que te interese."
    supportingPoints={['Acceso desde móvil, tablet o escritorio.', 'Chat y OPIN como dos maneras de participar.', 'La disponibilidad puede cambiar durante el día.']}
    secondaryLinks={[{ href: '/santiago', label: 'Santiago' }, { href: '/mas-30', label: 'Mayores de 30' }, { href: '/faq', label: 'FAQ' }, { href: '/mx', label: 'México' }, { href: '/ar', label: 'Argentina' }, { href: '/es', label: 'España' }, { href: '/br', label: 'Brasil' }]}
  />
);

export const SEOLandingArgentina = () => (
  <SEOLanding
    chatRoom="argentina"
    title="Chat Gay Argentina | Conversa Desde Tu Navegador | Chactivo"
    description="Entrada regional al chat gay de Argentina. Conversa desde tu navegador y revisa la actividad real de la comunidad en Chactivo."
    h1="Chat gay de Argentina"
    subtitle="Un punto de entrada para personas de Argentina que quieren conversar sin descargar una aplicación."
    canonicalPath="/ar"
    ctaLabel="Entrar al chat de Argentina"
    contentHeading="Argentina como contexto, no como promesa de disponibilidad"
    contentParagraph="La sala se comparte entre personas que participan desde distintos lugares. La referencia regional orienta la entrada, pero no muestra un mapa de usuarios ni garantiza que haya actividad en una ciudad concreta."
    supportingPoints={['Entrada regional para Argentina.', 'Actividad visible cuando hay participación.', 'Puedes continuar hacia OPIN o la FAQ.']}
    secondaryLinks={[{ href: '/ar/buenos-aires', label: 'Buenos Aires' }, { href: '/', label: 'Chile' }, { href: '/faq', label: 'FAQ' }]}
  />
);

export const SEOLandingMexico = () => (
  <SEOLanding
    chatRoom="mexico"
    title="Chat Gay México | Conversa Desde Tu Navegador | Chactivo"
    description="Entrada regional al chat gay de México. Conversa desde tu navegador y revisa la actividad real de la comunidad en Chactivo."
    h1="Chat gay de México"
    subtitle="Una entrada regional para conversar, con expectativas claras y sin inventar actividad local."
    canonicalPath="/mx"
    ctaLabel="Entrar al chat de México"
    contentHeading="Elige una conversación, no un catálogo inventado"
    contentParagraph="La página te lleva a la sala regional disponible. No publicamos listados de perfiles, barrios o contadores que no procedan de actividad real y autorizada."
    supportingPoints={['Entrada regional para México.', 'Sin prometer actividad constante.', 'Chat, OPIN y ayuda en rutas visibles.']}
    secondaryLinks={[{ href: '/mx/cdmx', label: 'CDMX' }, { href: '/', label: 'Chile' }, { href: '/faq', label: 'FAQ' }]}
  />
);

export const SEOLandingEspana = () => (
  <SEOLanding
    chatRoom="espana"
    title="Chat Gay España | Conversa Desde Tu Navegador | Chactivo"
    description="Entrada regional al chat gay de España. Conversa desde tu navegador y revisa la actividad real de la comunidad en Chactivo."
    h1="Chat gay de España"
    subtitle="Una entrada sencilla para conversar desde España y revisar qué está pasando realmente en la sala."
    canonicalPath="/es"
    ctaLabel="Entrar al chat de España"
    contentHeading="Una experiencia web sencilla"
    contentParagraph="Puedes entrar desde el navegador y decidir cuánto compartir. La comunidad puede estar más o menos activa; la interfaz debe mostrar ese estado sin sustituirlo por testimonios, fotos o números promocionales."
    supportingPoints={['Entrada regional para España.', 'Sin descarga obligatoria.', 'Información de seguridad y ayuda accesible.']}
    secondaryLinks={[{ href: '/es/madrid', label: 'Madrid' }, { href: '/', label: 'Chile' }, { href: '/faq', label: 'FAQ' }]}
  />
);

export const SEOLandingBrasil = () => (
  <SEOLanding
    chatRoom="brasil"
    title="Chat Gay Brasil | Converse Pelo Navegador | Chactivo"
    description="Entre no chat gay do Brasil e converse pelo navegador. A atividade visível depende da participação real da comunidade Chactivo."
    h1="Chat gay do Brasil"
    subtitle="Uma entrada regional para conversar com expectativas claras e sem atividade fabricada."
    canonicalPath="/br"
    ctaLabel="Entrar no chat do Brasil"
    contentHeading="Participação real e privacidade"
    contentParagraph="A referência ao Brasil ajuda a orientar a entrada, mas não representa um mapa de pessoas nem garante disponibilidade em uma cidade. Compartilhe apenas o que desejar e respeite as normas."
    supportingPoints={['Entrada regional para o Brasil.', 'Atividade conforme a participação real.', 'Chat, OPIN e ajuda com links claros.']}
    secondaryLinks={[{ href: '/br/sao-paulo', label: 'São Paulo' }, { href: '/', label: 'Chile' }, { href: '/faq', label: 'FAQ' }]}
  />
);

export const SEOLandingSantiagoCentro = () => (
  <SEOLanding
    chatRoom="principal"
    title="Chat Gay Santiago Centro | Entrada Local | Chactivo"
    description="Entrada local de apoyo para quienes buscan chat gay en Santiago Centro. Accede al chat principal de Chactivo desde tu navegador."
    h1="Chat gay en Santiago Centro"
    subtitle="Una entrada local de apoyo que te lleva al chat principal de Chile."
    canonicalPath="/santiago"
    indexable={false}
    ctaLabel="Entrar al chat de Chile"
    contentHeading="Una referencia local sin ubicación exacta"
    contentParagraph="Santiago Centro sirve como contexto de búsqueda, no como un mapa de personas. La página principal de Santiago explica los límites de ubicación y conserva la actividad real de la comunidad."
    supportingPoints={['Entrada local hacia el chat de Chile.', 'No muestra GPS ni barrios activos.', 'Consulta la página regional principal.']}
    secondaryLinks={[{ href: '/santiago', label: 'Entrada Santiago' }, { href: '/', label: 'Chile' }, { href: '/faq', label: 'FAQ' }]}
  />
);

export const SEOLandingCDMX = () => (
  <SEOLanding
    chatRoom="mexico"
    title="Chat Gay CDMX | Entrada Regional | Chactivo"
    description="Entrada regional para quienes buscan chat gay en Ciudad de México. Accede al hub de México sin mapas de usuarios ni actividad inventada."
    h1="Chat gay en CDMX"
    subtitle="Una entrada regional que te lleva al chat de México sin prometer presencia en una zona concreta."
    canonicalPath="/mx/cdmx"
    indexable={false}
    ctaLabel="Entrar al chat de México"
    contentHeading="CDMX como orientación, no como catálogo"
    contentParagraph="Esta URL se conserva como acceso regional, pero el hub de México es el destino principal. La disponibilidad y las personas visibles dependen de la participación real."
    supportingPoints={['Acceso al hub de México.', 'Sin listados locales fabricados.', 'Normas y ayuda disponibles.']}
    secondaryLinks={[{ href: '/mx', label: 'Hub México' }, { href: '/faq', label: 'FAQ' }, { href: '/', label: 'Chile' }]}
  />
);

export const SEOLandingBuenosAires = () => (
  <SEOLanding
    chatRoom="argentina"
    title="Chat Gay Buenos Aires | Entrada Regional | Chactivo"
    description="Entrada regional para quienes buscan chat gay en Buenos Aires. Accede al hub de Argentina sin actividad local inventada."
    h1="Chat gay en Buenos Aires"
    subtitle="Una entrada local que te lleva al chat de Argentina con expectativas claras."
    canonicalPath="/ar/buenos-aires"
    indexable={false}
    ctaLabel="Entrar al chat de Argentina"
    contentHeading="Una ruta local, no una promesa de usuarios cercanos"
    contentParagraph="Buenos Aires sirve como referencia regional. No mostramos barrios, distancias ni actividad de una ciudad concreta salvo que exista una fuente real y autorizada para ello."
    supportingPoints={['Acceso al hub de Argentina.', 'Sin actividad local sintética.', 'La comunidad decide qué compartir.']}
    secondaryLinks={[{ href: '/ar', label: 'Hub Argentina' }, { href: '/faq', label: 'FAQ' }, { href: '/', label: 'Chile' }]}
  />
);

export const SEOLandingMadrid = () => (
  <SEOLanding
    chatRoom="espana"
    title="Chat Gay Madrid | Entrada Regional | Chactivo"
    description="Entrada regional para quienes buscan chat gay en Madrid. Accede al hub de España sin fotos, contadores o actividad inventada."
    h1="Chat gay en Madrid"
    subtitle="Una ruta local que te lleva al chat de España con información honesta sobre disponibilidad."
    canonicalPath="/es/madrid"
    indexable={false}
    ctaLabel="Entrar al chat de España"
    contentHeading="Más contexto, menos promesas"
    contentParagraph="Madrid es una referencia de entrada, no una garantía de que haya personas conectadas en un momento concreto. Para una experiencia regional coherente, continúa en el hub de España."
    supportingPoints={['Acceso al hub de España.', 'Sin testimonios ni contadores fabricados.', 'Chat y OPIN siguen siendo rutas distintas.']}
    secondaryLinks={[{ href: '/es', label: 'Hub España' }, { href: '/faq', label: 'FAQ' }, { href: '/', label: 'Chile' }]}
  />
);

export const SEOLandingSaoPaulo = () => (
  <SEOLanding
    chatRoom="brasil"
    title="Chat Gay São Paulo | Entrada Regional | Chactivo"
    description="Entrada regional para quem busca chat gay em São Paulo. Acesse o hub do Brasil sem atividade local inventada."
    h1="Chat gay em São Paulo"
    subtitle="Uma rota local para o chat do Brasil, com limites claros sobre localização e disponibilidade."
    canonicalPath="/br/sao-paulo"
    indexable={false}
    ctaLabel="Entrar no chat do Brasil"
    contentHeading="Referência local com privacidade"
    contentParagraph="São Paulo orienta a entrada, mas não representa um mapa de pessoas nem uma promessa de atividade constante. O hub do Brasil é o destino principal para continuar."
    supportingPoints={['Acesso ao hub do Brasil.', 'Sem perfis ou contadores sintéticos.', 'Compartilhe apenas o necessário.']}
    secondaryLinks={[{ href: '/br', label: 'Hub Brasil' }, { href: '/faq', label: 'FAQ' }, { href: '/', label: 'Chile' }]}
  />
);

export default SEOLanding;
