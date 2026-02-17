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
  redirectDelay = 100 // ⚡ 100ms - casi instantáneo pero Google aún indexa
}) => {
  const navigate = useNavigate();
  const pageStartRef = useRef(Date.now());

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
  }, [title, description, keywords]);

  // ⚡ Auto-redirect después de 1 segundo
  useEffect(() => {
    trackPageView(window.location.pathname, title).catch(() => {});
    track('landing_view', {
      page_path: window.location.pathname,
      landing_variant: chatRoom,
      seo_landing: true,
    }).catch(() => {});

    const timer = setTimeout(() => {
      track('entry_to_chat', {
        method: 'auto_redirect',
        from_path: window.location.pathname,
        room_id: chatRoom,
        delay_ms: redirectDelay,
      }).catch(() => {});
      navigate(`/chat/${chatRoom}`, { replace: true });
    }, redirectDelay);

    return () => {
      clearTimeout(timer);
      const timeOnPage = Math.max(0, Math.round((Date.now() - pageStartRef.current) / 1000));
      trackPageExit(window.location.pathname, timeOnPage).catch(() => {});
    };
  }, [navigate, chatRoom, redirectDelay, title]);

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
            Entrando al chat...
          </p>
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
    title="Chat Gay Chile - Chatea Gratis Sin Registro"
    description="Chat gay Chile gratis. Conoce hombres gay en Santiago, Valparaíso, Concepción y todo Chile. Sin registro, 100% anónimo."
    keywords="chat gay chile, chat gay santiago, gay chile, chat gay gratis chile"
    h1="Chat Gay Chile"
    subtitle="Conecta con hombres en todo Chile"
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
  />
);

export default SEOLanding;
