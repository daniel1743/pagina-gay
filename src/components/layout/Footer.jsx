
import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="w-full bg-card/50 border-t py-8 md:py-12 mt-16"
    >
      <div className="container mx-auto px-4 text-muted-foreground max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-foreground">Misión</span>
            <p className="mt-2 text-sm max-w-xs">
              Crear un espacio digital seguro, inclusivo y auténtico para que la comunidad LGBTQ+ de Chile pueda conectar, compartir y prosperar.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-foreground">Visión</span>
            <p className="mt-2 text-sm max-w-xs">
              Ser el hub comunitario LGBTQ+ líder en Latinoamérica, fomentando relaciones significativas y apoyando el bienestar de nuestros miembros.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-foreground">Legal & Soporte</span>
             <div className="flex flex-col items-center gap-1 mt-2">
              <a href="/terminos-condiciones.html" className="hover:text-cyan-400 transition-colors text-sm" target="_blank" rel="noopener noreferrer">Términos y Condiciones</a>
              <a href="/politica-privacidad.html" className="hover:text-cyan-400 transition-colors text-sm" target="_blank" rel="noopener noreferrer">Política de Privacidad</a>
              <a href="/aviso-legal.html" className="hover:text-cyan-400 transition-colors text-sm" target="_blank" rel="noopener noreferrer">Aviso Legal</a>
              <a href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('openDenunciaModal')); }} className="hover:text-orange-400 transition-colors text-sm font-semibold">🛡️ Centro de Seguridad</a>
            </div>
          </div>
        </div>
        <div className="text-center mt-8 border-t pt-6">
          <p className="text-sm">&copy; {new Date().getFullYear()} Chactivo. Todos los derechos reservados.</p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
