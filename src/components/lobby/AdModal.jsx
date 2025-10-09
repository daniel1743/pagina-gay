import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, X, MapPin, Clock, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const AdModal = ({ ad, isOpen, onClose }) => {
  if (!ad) return null;

  const handleVisitLink = () => {
    window.open(ad.link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border max-w-3xl w-[95vw] max-h-[90vh] rounded-2xl p-0 overflow-hidden flex flex-col">
        {/* Hero Image */}
        <div className="relative h-48 md:h-64 overflow-hidden flex-shrink-0">
          <img
            src={ad.image}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${ad.gradient} opacity-70`}></div>

          {/* Close button - Inside hero */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-extrabold text-white mb-2"
            >
              {ad.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-white/90 font-semibold"
            >
              {ad.subtitle}
            </motion.p>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="px-6 py-4 overflow-y-auto flex-1 scrollbar-hide">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-3">Detalles de la promoción</h3>
              <p className="text-muted-foreground leading-relaxed">
                {ad.description}
              </p>
            </div>

            {/* Additional info (ejemplo de datos que podrían incluirse) */}
            <div className="bg-accent rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-foreground mb-2">Información de contacto</h4>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Providencia, Santiago de Chile</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-primary" />
                <span>Lun-Vie: 10:00 - 22:00 | Sáb-Dom: 12:00 - 00:00</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                <span>+56 9 1234 5678</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@ejemplo.com</span>
              </div>
            </div>

            {/* Features/Benefits */}
            <div>
              <h4 className="font-bold text-foreground mb-3">¿Por qué elegirnos?</h4>
              <ul className="space-y-2">
                {[
                  'Espacio 100% LGBT-friendly y seguro',
                  'Descuentos exclusivos para miembros de Chactivo',
                  'Personal capacitado en diversidad e inclusión',
                  'Ambiente acogedor y sin discriminación'
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0 bg-background space-y-3">
          <Button
            onClick={handleVisitLink}
            className={`w-full bg-gradient-to-r ${ad.gradient} text-white font-bold py-6 text-lg hover:opacity-90 transition-opacity`}
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Visitar sitio web
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Al hacer clic serás redirigido a un sitio externo. Chactivo no se hace responsable del contenido de terceros.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdModal;
