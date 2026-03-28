import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { track, trackPageExit, trackPageView } from '@/services/eventTrackingService';

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
  supportingPoints = []
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

  const goToChat = (method = 'landing_cta') => {
    track('entry_to_chat', {
      method,
      from_path: window.location.pathname,
      room_id: chatRoom,
      delay_ms: shouldAutoRedirect ? effectiveRedirectDelay : 0,
    }).catch(() => {});
    navigate(`/chat/${chatRoom}`);
  };

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

    const canonicalHref = canonicalPath
      ? `https://chactivo.com${canonicalPath}`
      : `https://chactivo.com${window.location.pathname}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalHref;

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
  }, [title, description, keywords, canonicalPath, ogImage]);

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
  }, [navigate, chatRoom, title, shouldAutoRedirect, effectiveRedirectDelay]);

  return (
    <>

      {/* 🎨 UI Minimalista - Usuario ve esto 1 segundo */}
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        {/* Contenido SEO visible para Google */}
        <div className="text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-pulse">
            {h1}
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8">
            {subtitle}
          </p>

          {shouldAutoRedirect ? (
            <>
              <div className="flex justify-center mb-6">
                <div
                  className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"
                />
              </div>
              <p className="text-sm opacity-70">
                {`Entrando al chat en ${Math.ceil(effectiveRedirectDelay / 1000)}s...`}
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => goToChat(isPreviewMode ? 'preview_cta' : 'landing_cta')}
                className="rounded-xl bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                {ctaLabel}
              </button>
              <p className="mt-3 text-sm opacity-75">
                {isPreviewMode
                  ? 'Modo preview activo. Puedes revisar la landing o entrar al chat ahora.'
                  : 'Sin redirección automática. Entra cuando quieras al chat.'}
              </p>
            </>
          )}

          {supportingPoints.length > 0 && (
            <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
              {supportingPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur-sm"
                >
                  {point}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 📝 Contenido SEO oculto visualmente pero visible para Google */}
        <div className="sr-only">
          <h2>Bienvenido al mejor chat gay de habla hispana</h2>
          <p>
            Únete a nuestra comunidad de chat gay gratis. Miles de usuarios
            conectados las 24 horas. Chatea de forma anónima, sin registro
            y sin descargas. Disponible para Chile, Argentina, México, España,
            Brasil y toda Latinoamérica.
          </p>
          <ul>
            <li>Chat gay gratis y sin registro</li>
            <li>Comunidad LGBTQ+ amigable</li>
            <li>Salas de chat por país y región</li>
            <li>100% anónimo y seguro</li>
            <li>Desde cualquier dispositivo</li>
          </ul>
        </div>
      </div>
    </>
  );
};

// 🌍 Variantes pre-configuradas por región
export const SEOLandingChile = () => (
  <SEOLanding
    chatRoom="principal"
    title="Chat Gay Chile | Entrada Rápida Al Chat Principal | Chactivo"
    description="Una landing de apoyo para entrar al chat gay de Chile. Habla en vivo, entra gratis y accede al chat principal desde tu navegador."
    keywords="chat gay chile, chat gay en vivo chile, entrar al chat gay chile, chat principal chile"
    h1="Chat Gay Chile En Vivo"
    subtitle="Una entrada de apoyo al chat principal de Chile"
    canonicalPath="/"
    autoRedirect={false}
    ctaLabel="Entrar al chat principal"
    supportingPoints={[
      'Sirve como puerta de entrada complementaria para búsquedas de Chile.',
      'Refuerza la URL principal en lugar de competir con ella.',
      'Mantiene el foco en hablar en vivo sin exagerar la promesa.',
    ]}
  />
);

export const SEOLandingHome = () => (
  <SEOLanding
    chatRoom="principal"
    title="Chat Gay Chile En Vivo | Entra Gratis y Habla al Instante | Chactivo"
    description="Conecta con gente real de Chile en segundos. Entra gratis, sin registro obligatorio y conversa al instante desde tu navegador."
    keywords="chat gay chile, chat gay en vivo, chat gay gratis chile, chat gay sin registro, chat gay chile gratis"
    h1="Chat Gay Chile En Vivo"
    subtitle="Conecta con gente real sin perder tiempo"
    canonicalPath="/"
    autoRedirect={false}
    ctaLabel="Entrar al chat principal"
    supportingPoints={[
      'Entrada directa al chat principal desde tu navegador.',
      'Sin descargas y con acceso rápido para conversar al instante.',
      'Pensado para captar la intención global de Chile en una sola URL fuerte.',
    ]}
  />
);

export const SEOLandingArgentina = () => (
  <SEOLanding
    chatRoom="argentina"
    title="Chat Gay Argentina - Chatea Gratis Sin Registro"
    description="Chat gay Argentina gratis. Conoce hombres gay en Buenos Aires, Córdoba, Rosario y toda Argentina. Sin registro, 100% anónimo."
    keywords="chat gay argentina, chat gay buenos aires, gay argentina, chat gay gratis argentina"
    h1="Chat Gay Argentina"
    subtitle="Conecta con hombres en toda Argentina"
    canonicalPath="/ar"
  />
);

export const SEOLandingMexico = () => (
  <SEOLanding
    chatRoom="mexico"
    title="Chat Gay México - Chatea Gratis Sin Registro"
    description="Chat gay México gratis. Conoce hombres gay en CDMX, Guadalajara, Monterrey y todo México. Sin registro, 100% anónimo."
    keywords="chat gay mexico, chat gay cdmx, gay mexico, chat gay gratis mexico"
    h1="Chat Gay México"
    subtitle="Conecta con hombres en todo México"
    canonicalPath="/mx"
  />
);

export const SEOLandingEspana = () => (
  <SEOLanding
    chatRoom="espana"
    title="Chat Gay España - Chatea Gratis Sin Registro"
    description="Chat gay España gratis. Conoce hombres gay en Madrid, Barcelona, Valencia y toda España. Sin registro, 100% anónimo."
    keywords="chat gay españa, chat gay madrid, chat gay barcelona, gay españa"
    h1="Chat Gay España"
    subtitle="Conecta con hombres en toda España"
    canonicalPath="/es"
  />
);

export const SEOLandingBrasil = () => (
  <SEOLanding
    chatRoom="brasil"
    title="Chat Gay Brasil - Bate-papo Gay Grátis"
    description="Chat gay Brasil grátis. Conheça homens gays em São Paulo, Rio, Brasília e todo Brasil. Sem registro, 100% anônimo."
    keywords="chat gay brasil, bate-papo gay, gay brasil, chat gay gratis brasil"
    h1="Chat Gay Brasil"
    subtitle="Conecte-se com homens em todo o Brasil"
    canonicalPath="/br"
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
  />
);

export default SEOLanding;
