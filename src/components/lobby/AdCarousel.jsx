import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Megaphone } from 'lucide-react';

const AdCarousel = ({ onAdClick }) => {
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef(null);

  // Datos de anuncios de ejemplo (estos vendrían de una API o base de datos)
  const ads = [
    {
      id: 1,
      title: '🎉 Bar Rainbow',
      subtitle: 'Happy Hour todos los jueves',
      description: '2x1 en tragos de 18:00 a 21:00',
      image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=250&fit=crop',
      link: 'https://ejemplo.com/bar-rainbow',
      gradient: 'from-purple-600 to-pink-600'
    },
    {
      id: 2,
      title: '💼 Trabajo Inclusivo',
      subtitle: 'Empresa tech busca talento LGBT+',
      description: 'Envía tu CV a rrhh@empresa.com',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=250&fit=crop',
      link: 'https://ejemplo.com/empleo',
      gradient: 'from-blue-600 to-cyan-600'
    },
    {
      id: 3,
      title: '🏋️ Gym Diversity',
      subtitle: '50% OFF en membresía anual',
      description: 'Menciona "CHACTIVO" al registrarte',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop',
      link: 'https://ejemplo.com/gym',
      gradient: 'from-green-600 to-teal-600'
    },
    {
      id: 4,
      title: '🎭 Teatro Pride',
      subtitle: 'Nueva obra: "Orgullo y Amor"',
      description: 'Funciones vie-sáb-dom 20:00hrs',
      image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=250&fit=crop',
      link: 'https://ejemplo.com/teatro',
      gradient: 'from-red-600 to-orange-600'
    },
    {
      id: 5,
      title: '✈️ Viajes LGBT Tours',
      subtitle: 'Paquetes exclusivos Orgullo 2025',
      description: 'Madrid, NYC, São Paulo y más',
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop',
      link: 'https://ejemplo.com/viajes',
      gradient: 'from-indigo-600 to-purple-600'
    },
    {
      id: 6,
      title: '🏨 Hotel Boutique Pride',
      subtitle: 'Alojamiento LGBT-friendly',
      description: '20% descuento reservando por Chactivo',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop',
      link: 'https://ejemplo.com/hotel',
      gradient: 'from-yellow-600 to-orange-600'
    }
  ];

  return (
    <div className="w-full py-8 my-8 overflow-hidden relative">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex items-center gap-3 justify-center">
          <Megaphone className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Anuncios y Promociones</h2>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-1">
          Apoya a negocios y marcas LGBT-friendly
        </p>
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>

      {/* Carousel */}
      <div
        ref={carouselRef}
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={`flex gap-6 ${isPaused ? '' : 'animate-scroll-left'}`}>
          {/* Duplicamos los anuncios para el efecto infinito */}
          {[...ads, ...ads].map((ad, index) => (
            <motion.div
              key={`${ad.id}-${index}`}
              className="flex-shrink-0 w-80 cursor-pointer"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.2 }}
              onClick={() => onAdClick(ad)}
            >
              <div className="glass-effect rounded-2xl overflow-hidden h-full border-2 border-border hover:border-primary transition-colors">
                {/* Image with gradient overlay */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={ad.image}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${ad.gradient} opacity-60`}></div>
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                    <ExternalLink className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1">
                    {ad.title}
                  </h3>
                  <p className="text-sm font-semibold text-primary mb-2 line-clamp-1">
                    {ad.subtitle}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {ad.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll-left {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-left {
          animation: scroll-left 40s linear infinite;
        }

        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default AdCarousel;
