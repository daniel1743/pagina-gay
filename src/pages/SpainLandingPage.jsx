import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonical } from '@/hooks/useCanonical';
import ChatDemo from '@/components/landing/ChatDemo';
import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';
import { EntryOptionsModal } from '@/components/auth/EntryOptionsModal';

const SpainLandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const modelImages = useMemo(
    () => [
      '/modelo-1.jpeg',
      '/modelo-2.jpeg',
      '/modelo-3.jpeg',
      '/modelo-4.jpeg',
      '/modelo-5.jpeg',
    ],
    []
  );

  useCanonical('/es');

  // Auto-carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % modelImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [modelImages.length]);

  // 🔥 SEO PROFESIONAL: Meta tags, Keywords, Geo tags, Structured Data
  useEffect(() => {
    const previousTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const hadMetaDescription = !!metaDescription;
    const previousDescription = metaDescription?.getAttribute('content') ?? '';

    // Title
    document.title = 'Chat Gay España 🏳️‍🌈 Gratis - Madrid, Barcelona, Chueca | Chactivo';

    // Description
    let ensuredMeta = metaDescription;
    if (!ensuredMeta) {
      ensuredMeta = document.createElement('meta');
      ensuredMeta.setAttribute('name', 'description');
      document.head.appendChild(ensuredMeta);
    }
    ensuredMeta.setAttribute(
      'content',
      'Chat gay España 100% gratis. Conoce tíos de Madrid, Barcelona, Chueca y toda España. Sin rollos, sin registro. Entra ya y chatea con gays españoles.'
    );

    // Keywords
    let keywords = document.querySelector('meta[name="keywords"]');
    const hadKeywords = !!keywords;
    const previousKeywords = keywords?.getAttribute('content') ?? '';
    if (!keywords) {
      keywords = document.createElement('meta');
      keywords.setAttribute('name', 'keywords');
      document.head.appendChild(keywords);
    }
    keywords.setAttribute(
      'content',
      'chat gay españa, chat gay madrid, chat gay barcelona, chueca madrid, gay españa online, ligar gay españa, conocer gays españa, chat homosexual españa, salas gay madrid, chat lgbt españa, gays españoles online, chat gay valencia, chat gay sevilla, ambiente gay españa'
    );

    // Geo tags
    let geoRegion = document.querySelector('meta[name="geo.region"]');
    const hadGeoRegion = !!geoRegion;
    const previousGeoRegion = geoRegion?.getAttribute('content') ?? '';
    if (!geoRegion) {
      geoRegion = document.createElement('meta');
      geoRegion.setAttribute('name', 'geo.region');
      document.head.appendChild(geoRegion);
    }
    geoRegion.setAttribute('content', 'ES');

    let geoPlacename = document.querySelector('meta[name="geo.placename"]');
    const hadGeoPlacename = !!geoPlacename;
    const previousGeoPlacename = geoPlacename?.getAttribute('content') ?? '';
    if (!geoPlacename) {
      geoPlacename = document.createElement('meta');
      geoPlacename.setAttribute('name', 'geo.placename');
      document.head.appendChild(geoPlacename);
    }
    geoPlacename.setAttribute('content', 'Madrid, España');

    // Open Graph tags
    const previousOgTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? '';
    const previousOgDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? '';
    const previousOgUrl = document.querySelector('meta[property="og:url"]')?.getAttribute('content') ?? '';
    const previousOgLocale = document.querySelector('meta[property="og:locale"]')?.getAttribute('content') ?? '';

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'Chat Gay España 🏳️‍🌈 Gratis - Chactivo');

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 'Chat gay España 100% gratis. Conoce tíos de Madrid, Barcelona y toda España. Sin rollos, sin registro.');

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', 'https://chactivo.com/es');

    let ogLocale = document.querySelector('meta[property="og:locale"]');
    if (!ogLocale) {
      ogLocale = document.createElement('meta');
      ogLocale.setAttribute('property', 'og:locale');
      document.head.appendChild(ogLocale);
    }
    ogLocale.setAttribute('content', 'es_ES');

    // Structured Data (JSON-LD)
    const structuredDataScript = document.createElement('script');
    structuredDataScript.type = 'application/ld+json';
    structuredDataScript.id = 'spain-structured-data';
    structuredDataScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": "https://chactivo.com/es#webapp",
      "name": "Chactivo - Chat Gay España",
      "alternateName": ["Chat Gay Madrid", "Chat Gay Barcelona", "Chactivo España"],
      "description": "Chat gay España 100% gratis. Conoce tíos de Madrid, Barcelona, Chueca y toda España. Sin rollos, sin registro. Comunidad LGBT+ española activa 24/7.",
      "url": "https://chactivo.com/es",
      "applicationCategory": "SocialNetworkingApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock"
      },
      "audience": {
        "@type": "Audience",
        "audienceType": "Comunidad LGBT+ España",
        "geographicArea": {
          "@type": "Country",
          "name": "España"
        }
      },
      "areaServed": [
        {
          "@type": "City",
          "name": "Madrid"
        },
        {
          "@type": "City",
          "name": "Barcelona"
        },
        {
          "@type": "City",
          "name": "Valencia"
        },
        {
          "@type": "City",
          "name": "Sevilla"
        },
        {
          "@type": "Country",
          "name": "España"
        }
      ],
      "availableLanguage": ["es", "es-ES"],
      "keywords": "chat gay españa, chat gay madrid, chat gay barcelona, chueca, lgbt españa",
      "inLanguage": "es-ES"
    });
    document.head.appendChild(structuredDataScript);

    return () => {
      // Restore title
      document.title = previousTitle;

      // Restore meta description
      const currentMeta = document.querySelector('meta[name="description"]');
      if (currentMeta) {
        if (hadMetaDescription) {
          currentMeta.setAttribute('content', previousDescription);
        } else {
          currentMeta.remove();
        }
      }

      // Restore keywords
      const currentKeywords = document.querySelector('meta[name="keywords"]');
      if (currentKeywords) {
        if (hadKeywords) {
          currentKeywords.setAttribute('content', previousKeywords);
        } else {
          currentKeywords.remove();
        }
      }

      // Restore geo tags
      const currentGeoRegion = document.querySelector('meta[name="geo.region"]');
      if (currentGeoRegion) {
        if (hadGeoRegion) {
          currentGeoRegion.setAttribute('content', previousGeoRegion);
        } else {
          currentGeoRegion.remove();
        }
      }

      const currentGeoPlacename = document.querySelector('meta[name="geo.placename"]');
      if (currentGeoPlacename) {
        if (hadGeoPlacename) {
          currentGeoPlacename.setAttribute('content', previousGeoPlacename);
        } else {
          currentGeoPlacename.remove();
        }
      }

      // Restore OG tags
      if (previousOgTitle) {
        const currentOgTitle = document.querySelector('meta[property="og:title"]');
        if (currentOgTitle) currentOgTitle.setAttribute('content', previousOgTitle);
      }
      if (previousOgDescription) {
        const currentOgDescription = document.querySelector('meta[property="og:description"]');
        if (currentOgDescription) currentOgDescription.setAttribute('content', previousOgDescription);
      }
      if (previousOgUrl) {
        const currentOgUrl = document.querySelector('meta[property="og:url"]');
        if (currentOgUrl) currentOgUrl.setAttribute('content', previousOgUrl);
      }
      if (previousOgLocale) {
        const currentOgLocale = document.querySelector('meta[property="og:locale"]');
        if (currentOgLocale) currentOgLocale.setAttribute('content', previousOgLocale);
      }

      // Remove structured data
      const scriptToRemove = document.getElementById('spain-structured-data');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  const handleChatearAhora = () => {
    if (user && !user.isGuest) {
      navigate('/chat/es-main');
    } else {
      setShowEntryModal(true);
    }
  };

  const handleContinueWithoutRegister = () => {
    setShowGuestModal(true);
  };

  const goToImage = (index) => {
    if (index < 0 || index >= modelImages.length) return;
    setCurrentImageIndex(index);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full relative overflow-hidden"
        style={{ marginTop: '-4rem', zIndex: 1 }}
      >
        <div className="w-full h-[60vh] md:h-[75vh] relative group">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={modelImages[currentImageIndex]}
                alt="Chat gay España - Conoce tíos en Madrid y Barcelona"
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading={currentImageIndex === 0 ? 'eager' : 'lazy'}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-6">
            <div className="text-center max-w-4xl w-full">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight tracking-tight text-white"
              >
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Chat Gay España:
                </span>
                <br /> Sin rollos, tío. 100% Real.
              </motion.h1>

              <p className="text-lg md:text-xl text-white/90 font-medium mb-8 drop-shadow-md">
                Conoce colegas de Madrid, Barcelona, Chueca y toda España. Sin registro, sin movidas raras.
              </p>

              <Button
                onClick={handleChatearAhora}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-10 py-6 text-xl rounded-2xl shadow-2xl transition-transform hover:scale-105 uppercase"
              >
                ¡ENTRAR AL CHAT YA!
              </Button>

              <p className="text-sm text-white/70 mt-4 font-light italic">
                Gratis • Sin registros obligatorios • Anonimato total
              </p>
            </div>
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {modelImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentImageIndex
                    ? 'w-2.5 h-2.5 bg-white/70'
                    : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-3xl p-1 shadow-2xl border border-border"
        >
          <ChatDemo onJoinClick={handleChatearAhora} />
        </motion.section>

        <div className="text-center py-16">
          <h3 className="text-2xl font-bold mb-6">
            ¿Listo para enrollarte con gente nueva en España?
          </h3>
          <Button
            onClick={handleChatearAhora}
            variant="outline"
            className="border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white font-black px-12 py-6 rounded-xl transition-all"
          >
            ABRIR CHAT AHORA
          </Button>
        </div>
      </div>

      {/* Modal de opciones de entrada */}
      <EntryOptionsModal
        open={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        chatRoomId="es-main"
        onContinueWithoutRegister={handleContinueWithoutRegister}
      />

      <GuestUsernameModal
        open={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        chatRoomId="es-main"
      />
    </div>
  );
};

export default SpainLandingPage;
