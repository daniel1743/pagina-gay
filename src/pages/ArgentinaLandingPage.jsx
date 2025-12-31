import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonical } from '@/hooks/useCanonical';
import ChatDemo from '@/components/landing/ChatDemo';
import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';
import { EntryOptionsModal } from '@/components/auth/EntryOptionsModal';

const ArgentinaLandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showGuestModal, setShowGuestModal] = React.useState(false);
  const [showEntryModal, setShowEntryModal] = React.useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const modelImages = [
    '/modelo-1.jpeg',
    '/modelo-2.jpeg',
    '/modelo-3.jpeg',
    '/modelo-4.jpeg',
    '/modelo-5.jpeg'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % modelImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [modelImages.length]);

  useCanonical('/ar');

  // 🔥 SEO PROFESIONAL: Meta tags, Keywords, Geo tags, Structured Data
  useEffect(() => {
    const previousTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const hadMetaDescription = !!metaDescription;
    const previousDescription = metaDescription?.getAttribute('content') ?? '';

    // Title
    document.title = 'Chat Gay Argentina 🏳️‍🌈 Gratis - Buenos Aires, Palermo, Córdoba | Chactivo';

    // Description
    let ensuredMeta = metaDescription;
    if (!ensuredMeta) {
      ensuredMeta = document.createElement('meta');
      ensuredMeta.setAttribute('name', 'description');
      document.head.appendChild(ensuredMeta);
    }
    ensuredMeta.setAttribute(
      'content',
      'Chat gay Argentina 100% gratis. Conoce pibes de Buenos Aires, Palermo, Córdoba y toda Argentina. Sin vueltas, che. Entra ya y chatea con gays argentinos.'
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
      'chat gay argentina, chat gay buenos aires, chat gay palermo, gay argentina online, conocer gays argentina, chat lgbt argentina, gays argentinos, chat gay bsas, chat gay córdoba, chat gay rosario, ambiente gay argentina'
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
    geoRegion.setAttribute('content', 'AR-C');

    let geoPlacename = document.querySelector('meta[name="geo.placename"]');
    const hadGeoPlacename = !!geoPlacename;
    const previousGeoPlacename = geoPlacename?.getAttribute('content') ?? '';
    if (!geoPlacename) {
      geoPlacename = document.createElement('meta');
      geoPlacename.setAttribute('name', 'geo.placename');
      document.head.appendChild(geoPlacename);
    }
    geoPlacename.setAttribute('content', 'Buenos Aires, Argentina');

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
    ogTitle.setAttribute('content', 'Chat Gay Argentina 🏳️‍🌈 Gratis - Chactivo');

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 'Chat gay Argentina 100% gratis. Conoce pibes de Buenos Aires, Palermo y toda Argentina. Sin vueltas, sin registro.');

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', 'https://chactivo.com/ar');

    let ogLocale = document.querySelector('meta[property="og:locale"]');
    if (!ogLocale) {
      ogLocale = document.createElement('meta');
      ogLocale.setAttribute('property', 'og:locale');
      document.head.appendChild(ogLocale);
    }
    ogLocale.setAttribute('content', 'es_AR');

    // Structured Data (JSON-LD)
    const structuredDataScript = document.createElement('script');
    structuredDataScript.type = 'application/ld+json';
    structuredDataScript.id = 'argentina-structured-data';
    structuredDataScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": "https://chactivo.com/ar#webapp",
      "name": "Chactivo - Chat Gay Argentina",
      "alternateName": ["Chat Gay Buenos Aires", "Chat Gay Palermo", "Chactivo Argentina"],
      "description": "Chat gay Argentina 100% gratis. Conoce pibes de Buenos Aires, Palermo, Córdoba y toda Argentina. Sin vueltas, sin registro. Comunidad LGBT+ argentina activa 24/7.",
      "url": "https://chactivo.com/ar",
      "applicationCategory": "SocialNetworkingApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "ARS",
        "availability": "https://schema.org/InStock"
      },
      "audience": {
        "@type": "Audience",
        "audienceType": "Comunidad LGBT+ Argentina",
        "geographicArea": {
          "@type": "Country",
          "name": "Argentina"
        }
      },
      "areaServed": [
        {
          "@type": "City",
          "name": "Buenos Aires"
        },
        {
          "@type": "City",
          "name": "Córdoba"
        },
        {
          "@type": "City",
          "name": "Rosario"
        },
        {
          "@type": "City",
          "name": "Mendoza"
        },
        {
          "@type": "Country",
          "name": "Argentina"
        }
      ],
      "availableLanguage": ["es", "es-AR"],
      "keywords": "chat gay argentina, chat gay buenos aires, chat gay palermo, lgbt argentina",
      "inLanguage": "es-AR"
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
      const scriptToRemove = document.getElementById('argentina-structured-data');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  const handleChatearAhora = () => {
    if (user && !user.isGuest) {
      navigate('/chat/ar-main');
    } else {
      setShowEntryModal(true);
    }
  };

  const handleContinueWithoutRegister = () => {
    setShowGuestModal(true);
  };

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full relative overflow-hidden"
        style={{ 
          marginTop: '-4rem',
          zIndex: 1
        }}
      >
        <div className="w-full h-[60vh] md:h-[75vh] relative group">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full"
            >
              <div className="w-full h-full relative overflow-hidden">
                <img
                  src={modelImages[currentImageIndex]}
                  alt="Chat gay Argentina - Conoce pibes en Buenos Aires y Palermo"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loading={currentImageIndex === 0 ? 'eager' : 'lazy'}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          <div className="absolute inset-0 z-10 h-full flex items-center justify-center px-4 sm:px-6">
            <div className="text-center max-w-3xl w-full">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 drop-shadow-2xl leading-tight px-2"
              >
                <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                  Chat Gay Argentina: Sin vueltas, che. 100% Real.
                </span>
              </motion.h1>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-base sm:text-lg md:text-xl text-white/95 font-semibold drop-shadow-lg mb-5 sm:mb-6 leading-relaxed px-2"
              >
                Conoce pibes de Buenos Aires, Palermo, Córdoba y toda Argentina. Sin registro, sin pavadas.
              </motion.h2>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button
                  onClick={handleChatearAhora}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg rounded-xl shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105 w-full sm:w-auto uppercase tracking-wide"
                  style={{ minHeight: '48px' }}
                >
                  ¡ENTRAR AL CHAT YA!
                </Button>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-sm sm:text-base text-white/80 mt-4 sm:mt-5 font-medium"
              >
                Sin email • Sin tarjeta • Sin complicaciones
              </motion.p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 flex gap-0.5">
          {modelImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentImageIndex
                  ? 'w-1 h-1 bg-white/50'
                  : 'w-0.5 h-0.5 bg-white/20 hover:bg-white/30'
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      </motion.div>

      <div className="px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-5xl mx-auto">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 sm:mb-12"
          >
            <ChatDemo onJoinClick={handleChatearAhora} />
          </motion.section>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-6 sm:mt-8 mb-6"
          >
            <Button
              onClick={handleChatearAhora}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-5 rounded-xl shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all uppercase tracking-wide"
            >
              ¡ENTRAR AL CHAT YA!
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Modal de opciones de entrada */}
      <EntryOptionsModal
        open={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        chatRoomId="ar-main"
        onContinueWithoutRegister={handleContinueWithoutRegister}
      />

      <GuestUsernameModal
        open={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        chatRoomId="ar-main"
      />
    </div>
  );
};

export default ArgentinaLandingPage;
