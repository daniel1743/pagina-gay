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
  h1 = 'Chat Gay Gratis',
  subtitle = 'Conecta con gente real ahora mismo',
  redirectDelay = 100, // ⚡ 100ms - casi instantáneo pero Google aún indexa
  canonicalPath = null,
  previewable = true
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
  const delayFromQuery = Number.parseInt(searchParams.get('delay') || '', 10);
  const effectiveRedirectDelay = Number.isFinite(delayFromQuery)
    ? Math.max(0, Math.min(delayFromQuery, 15000))
    : redirectDelay;

  // 🔍 SEO - Actualizar meta tags dinámicamente
  useEffect(() => {
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
  }, [title, description, keywords, canonicalPath]);

  // ⚡ Auto-redirect después de 1 segundo
  useEffect(() => {
    trackPageView(window.location.pathname, title).catch(() => {});
    track('landing_view', {
      page_path: window.location.pathname,
      landing_variant: chatRoom,
      seo_landing: true,
      preview_mode: isPreviewMode,
      redirect_delay_ms: effectiveRedirectDelay,
    }).catch(() => {});

    if (isPreviewMode) {
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
  }, [navigate, chatRoom, title, isPreviewMode, effectiveRedirectDelay]);

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

          {/* Spinner de carga */}
          <div className="flex justify-center mb-6">
            <div
              className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"
            />
          </div>

          <p className="text-sm opacity-70">
            {isPreviewMode ? 'Modo preview activo' : `Entrando al chat en ${Math.ceil(effectiveRedirectDelay / 1000)}s...`}
          </p>

          {isPreviewMode && (
            <button
              type="button"
              onClick={() => navigate(`/chat/${chatRoom}`)}
              className="mt-4 rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30"
            >
              Entrar al chat ahora
            </button>
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
    title="Chat Gay Chile Gratis | Chat Gay en Vivo Sin Registro - Chactivo"
    description="Chat gay Chile en vivo y gratis. Conecta con hombres de Santiago y todo Chile en segundos, sin registro obligatorio."
    keywords="chat gay chile, chat gay en vivo, chat gay gratis chile, chat gay santiago, chatgay chile"
    h1="Chat Gay Chile En Vivo"
    subtitle="Conecta con hombres reales de Chile"
    canonicalPath="/chat-gay-chile"
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
    title="Chat Gay Santiago Centro | Conoce Gente de la RM en Vivo - Chactivo"
    description="Chat gay en Santiago Centro y Región Metropolitana. Conversa en vivo con gente real cerca de ti. Sin registro obligatorio."
    keywords="chat gay santiago centro, chat gay santiago, chat gay region metropolitana, chat gay chile en vivo"
    h1="Chat Gay Santiago Centro"
    subtitle="Personas de la RM conectadas ahora"
    redirectDelay={4500}
    canonicalPath="/chat-gay-santiago-centro"
  />
);

export default SEOLanding;
