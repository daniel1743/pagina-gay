import React from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * Banner fijo para promocionar el grupo de Telegram
 * Se muestra en la parte superior de las salas de chat y landing
 */
const TelegramBanner = ({ className = '' }) => {
  return (
    <a
      href="https://t.me/+Rayp5VZ2shM2ODBh"
      target="_blank"
      rel="noopener noreferrer"
      className={`
        bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600
        text-white text-center py-2 px-4
        flex items-center justify-center gap-2
        hover:from-blue-500 hover:via-cyan-400 hover:to-blue-500
        transition-all cursor-pointer
        ${className}
      `}
    >
      <span className="font-bold text-sm sm:text-base">
        MEJOR GRUPO DE CUADRE Y GUEBEO CHILE
      </span>
      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap">
        UNETE GRATIS
        <ExternalLink className="w-3 h-3" />
      </span>
    </a>
  );
};

export default TelegramBanner;
