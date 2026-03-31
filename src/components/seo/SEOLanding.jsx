import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { track, trackPageExit, trackPageView } from '@/services/eventTrackingService';
import PremiumLandingHero from '@/components/landing/PremiumLandingHero';

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

      <PremiumLandingHero
        badgeLabel={heroBadge}
        title={h1}
        subtitle={subtitle}
        ctaLabel={ctaLabel}
        ctaSubtext={heroSubtext}
        liveLabel={shouldAutoRedirect ? 'Entrando al chat' : 'En vivo ahora'}
        livePillLabel={heroLivePillLabel}
        supportingPoints={supportingPoints}
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
    h1="Entra y conversa con gente real"
    subtitle="Chile activo ahora mismo. Entra al chat principal sin vueltas ni descargas."
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
    description="Conecta con gente real de Chile en segundos. Entra gratis, sin registro obligatorio y conversa al instante desde tu navegador."
    keywords="chat gay chile, chat gay en vivo, chat gay gratis chile, chat gay sin registro, chat gay chile gratis"
    h1="Entra y conversa con gente real"
    subtitle="Chile activo ahora mismo. Sin descargas, sin pasos largos y sin perder tiempo."
    canonicalPath="/"
    autoRedirect={false}
    ctaLabel="Entrar ahora"
    supportingPoints={[
      'Acceso inmediato al chat principal desde tu navegador.',
      'Nada que instalar para empezar a conversar al instante.',
      'Gente real conectando ahora dentro de Chile.',
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
