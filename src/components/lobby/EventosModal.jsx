import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, X, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const eventos = [
  {
    title: 'Marcha del Orgullo Santiago 2025',
    date: 'Sábado, 28 de Junio',
    description: '¡Volvemos a las calles! La marcha más grande de Chile por nuestros derechos. Punto de encuentro: Plaza Italia. ¡No faltes!',
    image: 'A colorful pride march with thousands of people',
    link: '#',
  },
  {
    title: 'Anuncio: Nuevas Funciones en Chactivo',
    date: 'Viernes, 14 de Noviembre',
    description: '¡Estamos emocionados de anunciar que pronto lanzaremos perfiles verificados y eventos exclusivos para miembros Premium! Mantente atento.',
    image: 'A sleek smartphone screen showing a new app feature with glowing icons',
    link: '#',
  },
  {
    title: 'Fiesta "Neón" en Club Divino',
    date: 'Sábado, 22 de Noviembre',
    description: 'La fiesta más esperada del mes. Viste tus mejores atuendos neón y brilla toda la noche. ¡Música, shows y sorpresas!',
    image: 'A vibrant nightclub scene with people dancing under neon and black lights',
    link: '#',
  },
];

const EventosModal = ({ isOpen, onClose }) => {
  const handleReadMore = (link) => {
    if (link === '#') {
      toast({
        title: '🚧 Enlace en construcción',
        description: 'Este enlace se activará cuando el evento esté disponible.',
      });
    } else {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#22203a] border-[#413e62] text-white max-w-3xl rounded-2xl p-0">
        <DialogHeader className="p-6">
          <DialogTitle className="text-3xl font-extrabold flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-400" />
            Eventos y Noticias
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Mantente al día con lo último de la comunidad y de Chactivo.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto space-y-6 scrollbar-hide">
          {eventos.map((evento, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col md:flex-row gap-6 p-4 rounded-xl bg-[#2C2A4A] overflow-hidden"
            >
              <div className="md:w-1/3 h-48 md:h-auto rounded-lg overflow-hidden">
                <img
                  alt={evento.title}
                  className="w-full h-full object-cover"
                 src="https://images.unsplash.com/photo-1509930854872-0f61005b282e" />
              </div>
              <div className="md:w-2/3 flex flex-col">
                <span className="text-sm font-bold text-yellow-400">{evento.date}</span>
                <h3 className="text-xl font-bold text-gray-100 mt-1 mb-2">{evento.title}</h3>
                <p className="text-gray-300 text-sm flex-grow">{evento.description}</p>
                <Button onClick={() => handleReadMore(evento.link)} variant="link" className="self-start p-0 mt-3 text-[#00FFFF] hover:text-[#E4007C]">
                  Leer más <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 z-50 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default EventosModal;