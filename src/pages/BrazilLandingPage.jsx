import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonical } from '@/hooks/useCanonical';
import ChatDemo from '@/components/landing/ChatDemo';
import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';
import { EntryOptionsModal } from '@/components/auth/EntryOptionsModal';

const BrazilLandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // IMPORTANT: filenames without spaces
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

  useCanonical('/br');

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
    document.title = 'Chat Gay Brasil 🏳️‍🌈 Grátis - São Paulo, Rio, SP | Chactivo';

    // Description
    let ensuredMeta = metaDescription;
    if (!ensuredMeta) {
      ensuredMeta = document.createElement('meta');
      ensuredMeta.setAttribute('name', 'description');
      document.head.appendChild(ensuredMeta);
    }
    ensuredMeta.setAttribute(
      'content',
      'Chat gay Brasil 100% grátis. Conhece caras de São Paulo, Rio, BH e todo Brasil. Sem enrolação, mano. Entre já e converse com gays brasileiros.'
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
      'chat gay brasil, bate-papo gay, chat gay são paulo, chat gay rio, gay brasil online, encontrar gays brasil, gays brasileiros, chat lgbt brasil, chat gay sp, chat gay rj, chat gay bh, papo gay brasil, chat gay grátis brasil'
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
    geoRegion.setAttribute('content', 'BR-SP');

    let geoPlacename = document.querySelector('meta[name="geo.placename"]');
    const hadGeoPlacename = !!geoPlacename;
    const previousGeoPlacename = geoPlacename?.getAttribute('content') ?? '';
    if (!geoPlacename) {
      geoPlacename = document.createElement('meta');
      geoPlacename.setAttribute('name', 'geo.placename');
      document.head.appendChild(geoPlacename);
    }
    geoPlacename.setAttribute('content', 'São Paulo, Brasil');

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
    ogTitle.setAttribute('content', 'Chat Gay Brasil 🏳️‍🌈 Grátis - Chactivo');

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 'Chat gay Brasil 100% grátis. Conhece caras de São Paulo, Rio e todo Brasil. Sem enrolação, sem cadastro.');

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', 'https://chactivo.com/br');

    let ogLocale = document.querySelector('meta[property="og:locale"]');
    if (!ogLocale) {
      ogLocale = document.createElement('meta');
      ogLocale.setAttribute('property', 'og:locale');
      document.head.appendChild(ogLocale);
    }
    ogLocale.setAttribute('content', 'pt_BR');

    // Structured Data (JSON-LD)
    const structuredDataScript = document.createElement('script');
    structuredDataScript.type = 'application/ld+json';
    structuredDataScript.id = 'brazil-structured-data';
    structuredDataScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": "https://chactivo.com/br#webapp",
      "name": "Chactivo - Chat Gay Brasil",
      "alternateName": ["Bate-papo Gay Brasil", "Chat Gay São Paulo", "Chactivo Brasil"],
      "description": "Chat gay Brasil 100% grátis. Conhece caras de São Paulo, Rio, Belo Horizonte e todo Brasil. Sem enrolação, sem cadastro. Comunidade LGBT+ brasileira ativa 24/7.",
      "url": "https://chactivo.com/br",
      "applicationCategory": "SocialNetworkingApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "BRL",
        "availability": "https://schema.org/InStock"
      },
      "audience": {
        "@type": "Audience",
        "audienceType": "Comunidade LGBT+ Brasil",
        "geographicArea": {
          "@type": "Country",
          "name": "Brasil"
        }
      },
      "areaServed": [
        {
          "@type": "City",
          "name": "São Paulo"
        },
        {
          "@type": "City",
          "name": "Rio de Janeiro"
        },
        {
          "@type": "City",
          "name": "Belo Horizonte"
        },
        {
          "@type": "City",
          "name": "Brasília"
        },
        {
          "@type": "Country",
          "name": "Brasil"
        }
      ],
      "availableLanguage": ["pt", "pt-BR"],
      "keywords": "chat gay brasil, bate-papo gay, chat gay são paulo, chat gay rio, lgbt brasil",
      "inLanguage": "pt-BR"
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
      const scriptToRemove = document.getElementById('brazil-structured-data');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  const handleEntrarAgora = () => {
    if (user && !user.isGuest) {
      navigate('/chat/br-main');
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
                alt="Chat gay Brasil - Conhece caras em São Paulo e Rio"
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
                  Chat Gay Brasil:
                </span>
                <br /> Sem enrolação, mano. 100% Real.
              </motion.h1>

              <p className="text-lg md:text-xl text-white/90 font-medium mb-8 drop-shadow-md">
                Conhece manos de São Paulo, Rio, BH e todo Brasil. Sem cadastro, sem papinho furado.
              </p>

              <Button
                onClick={handleEntrarAgora}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-10 py-6 text-xl rounded-2xl shadow-2xl transition-transform hover:scale-105 uppercase"
              >
                ENTRAR NO CHAT AGORA!
              </Button>

              <p className="text-sm text-white/70 mt-4 font-light italic">
                Grátis • Sem cadastro obrigatório • Anonimato total
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
                aria-label={`Ir para imagem ${index + 1}`}
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
          <ChatDemo onJoinClick={handleEntrarAgora} />
        </motion.section>

        <div className="text-center py-16">
          <h3 className="text-2xl font-bold mb-6">
            E aí, cara! Pronto para conhecer manos novos no Brasil?
          </h3>
          <Button
            onClick={handleEntrarAgora}
            variant="outline"
            className="border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white font-black px-12 py-6 rounded-xl transition-all"
          >
            ABRIR CHAT AGORA
          </Button>
        </div>
      </div>

      {/* Modal de opciones de entrada */}
      <EntryOptionsModal
        open={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        chatRoomId="br-main"
        onContinueWithoutRegister={handleContinueWithoutRegister}
      />

      <GuestUsernameModal
        open={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        chatRoomId="br-main"
      />
    </div>
  );
};

export default BrazilLandingPage;
