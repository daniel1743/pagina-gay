import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, MessageSquare, Shield, AlertCircle, PhoneOff, Heart } from 'lucide-react';

/**
 * Componente que se muestra mientras se cargan los mensajes de la sala
 * Mantiene al usuario entretenido con reglas y le pide que escriba
 */
const LoadingMessagesPrompt = ({ roomName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-[400px] px-4 py-8"
    >
      <div className="max-w-2xl w-full space-y-6">
        {/* Header con spinner */}
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Loader2 className="w-12 h-12 text-purple-500" />
          </motion.div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <MessageSquare className="w-6 h-6 text-purple-500" />
              Cargando conversaciones...
            </h2>
            <p className="text-muted-foreground text-lg">
              Esto tomará muy poco tiempo. Mientras tanto, puedes empezar a escribir.
            </p>
          </div>
        </div>

        {/* Call to action para escribir */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-xl p-6 text-center"
        >
          <p className="text-foreground font-semibold text-lg mb-2">
            💬 ¡Escribe algo para mantenerte activo!
          </p>
          <p className="text-muted-foreground text-sm">
            Los mensajes de la sala aparecerán aquí en unos segundos. Mientras tanto, puedes empezar a chatear.
          </p>
        </motion.div>

        {/* Reglas del chat */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="bg-card border-2 border-border rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-bold text-foreground">Reglas del Chat</h3>
          </div>
          
          <div className="space-y-3">
            {/* Regla 1: No spam */}
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">No spam</p>
                <p className="text-sm text-muted-foreground">
                  Evita enviar mensajes repetitivos o publicidad no solicitada.
                </p>
              </div>
            </div>

            {/* Regla 2: No números de teléfono */}
            <div className="flex items-start gap-3">
              <PhoneOff className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">No intercambiar números de teléfono en salas públicas</p>
                <p className="text-sm text-muted-foreground">
                  Usa los chats privados para compartir información personal de forma segura.
                </p>
              </div>
            </div>

            {/* Regla 3: No mensajes de odio */}
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">No incitar mensajes de odio</p>
                <p className="text-sm text-muted-foreground">
                  Mantén un ambiente respetuoso y positivo para todos.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mensaje final */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="text-center text-sm text-muted-foreground"
        >
          Los mensajes de {roomName || 'esta sala'} aparecerán aquí en breve. ¡Gracias por tu paciencia! ⏳
        </motion.p>
      </div>
    </motion.div>
  );
};

export default LoadingMessagesPrompt;

