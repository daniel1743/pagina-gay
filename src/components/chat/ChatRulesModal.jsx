import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Heart, Shield, Users, MessageSquare, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Modal de reglas y normas del chat
 * Se muestra antes de chatear por primera vez
 */
const ChatRulesModal = ({ isOpen, onAccept }) => {
  const { user } = useAuth();
  const [hasReadAll, setHasReadAll] = useState(false);

  const rules = [
    {
      icon: Heart,
      title: 'Respeto y Tolerancia',
      description: 'Trata a todos con respeto. No toleramos discriminación, acoso o lenguaje ofensivo.',
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: Shield,
      title: 'Privacidad',
      description: 'No compartas información personal (teléfono, dirección, etc.) en el chat público.',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: Users,
      title: 'Mayores de 18 años',
      description: 'Este espacio es exclusivo para mayores de 18 años. Verificamos la edad de todos los usuarios.',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      icon: XCircle,
      title: 'Contenido Prohibido',
      description: 'Está prohibido: spam, contenido ilegal, venta de drogas, acoso, amenazas o contenido que viole los términos de servicio.',
      color: 'from-red-500 to-orange-500',
    },
    {
      icon: MessageSquare,
      title: 'Conversación Natural',
      description: 'Mantén conversaciones naturales y auténticas. Evita comportamientos sospechosos o automatizados.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Sparkles,
      title: 'Disfruta y Sé Tú Mismo',
      description: 'Este es un espacio seguro para ser quien eres. ¡Relájate, diviértete y conoce gente increíble!',
      color: 'from-yellow-500 to-amber-500',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={() => {}} modal={true}>
          <DialogContent className="bg-gradient-to-br from-[#1a0d2e] via-[#2d1b4e] to-[#1a0d2e] border-2 border-pink-500/30 text-white max-w-3xl max-h-[90vh] rounded-3xl p-0 overflow-hidden flex flex-col">
            {/* Fondo animado con colores arcoíris */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute w-64 h-64 bg-pink-500/20 rounded-full blur-3xl"
                animate={{
                  x: [0, 100, 0],
                  y: [0, -50, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                style={{ top: '10%', left: '10%' }}
              />
              <motion.div
                className="absolute w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
                animate={{
                  x: [0, -80, 0],
                  y: [0, 60, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                style={{ bottom: '10%', right: '10%' }}
              />
              <motion.div
                className="absolute w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl"
                animate={{
                  x: [0, 50, 0],
                  y: [0, -80, 0],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                style={{ top: '50%', left: '50%' }}
              />
            </div>

            {/* Header */}
            <div className="relative z-10 p-6 pb-4 border-b border-pink-500/30">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
                className="flex justify-center mb-4"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 via-cyan-500 to-pink-500 rounded-full blur-xl opacity-50"
                    style={{ width: '120px', height: '120px', margin: '-10px' }}
                  />
                  <div className="relative w-24 h-24 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl">
                    <Shield className="w-12 h-12 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-extrabold text-center mb-2 bg-gradient-to-r from-pink-400 via-purple-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent"
              >
                Reglas del Chat
              </motion.h2>
              <p className="text-center text-muted-foreground text-sm">
                Por favor, lee y acepta las reglas antes de chatear
              </p>
            </div>

            {/* Contenido con scroll */}
            <div className="relative z-10 p-6 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-4">
                {rules.map((rule, index) => {
                  const Icon = rule.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${rule.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1 text-white">{rule.title}</h3>
                          <p className="text-sm text-gray-300 leading-relaxed">{rule.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Advertencia importante */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="mt-6 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500/30 rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-400 mb-1">⚠️ Importante</h4>
                    <p className="text-sm text-gray-300">
                      El incumplimiento de estas reglas puede resultar en advertencias, suspensiones temporales o ban permanente. 
                      Nuestro equipo de moderadores revisa el contenido constantemente.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Footer con checkbox y botón */}
            <div className="relative z-10 p-6 pt-4 border-t border-pink-500/30 bg-gradient-to-t from-[#1a0d2e] to-transparent">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="space-y-4"
              >
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={hasReadAll}
                    onChange={(e) => setHasReadAll(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-pink-500/50 bg-transparent checked:bg-gradient-to-r checked:from-pink-500 checked:to-purple-500 checked:border-transparent focus:ring-2 focus:ring-pink-500/50 transition-all"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    He leído y acepto las reglas del chat. Entiendo que el incumplimiento puede resultar en sanciones.
                  </span>
                </label>

                <Button
                  onClick={() => {
                    if (hasReadAll) {
                      onAccept();
                    }
                  }}
                  disabled={!hasReadAll}
                  className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 text-white font-bold py-6 rounded-xl shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
                >
                  <CheckCircle className="w-6 h-6 mr-2" />
                  Acepto las Reglas y Quiero Chatear
                </Button>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ChatRulesModal;

