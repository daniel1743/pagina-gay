import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft, MessageCircle, Users, Shield, Crown } from 'lucide-react';

const tourSteps = [
  {
    title: '¡Bienvenido a Chactivo! 🌈',
    description: 'La comunidad LGBT+ de chat en vivo más activa de Chile. Aquí podrás conocer personas, hacer amigos y conectar con la comunidad.',
    icon: MessageCircle,
    gradient: 'magenta-gradient',
  },
  {
    title: 'Chat Principal 💬',
    description: 'Todo sucede en una sola sala principal para concentrar usuarios reales y mantener la conversación viva.',
    icon: Users,
    gradient: 'cyan-gradient',
  },
  {
    title: 'Chats Privados 🔒',
    description: 'Puedes enviar mensajes privados y solicitar chats 1-a-1 con otros usuarios. ¡Conecta de forma más personal!',
    icon: Shield,
    gradient: 'purple-gradient',
  },
  {
    title: 'Hazte Premium ⭐',
    description: 'Con Chactivo Premium desbloqueas temas personalizados, burbujas de chat exclusivas y mucho más. ¡Personaliza tu experiencia!',
    icon: Crown,
    gradient: 'amber-gradient',
  },
];

const WelcomeTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentStepData = tourSteps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 pointer-events-none"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-card border-2 border-accent/50 rounded-2xl p-8 max-w-md w-full relative shadow-2xl pointer-events-auto"
        >
          {/* Botón de cerrar */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Ícono principal con gradiente */}
          <div className={`w-20 h-20 rounded-full ${currentStepData.gradient} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
            <Icon className="w-10 h-10 text-white" />
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-center text-foreground mb-3">
            {currentStepData.title}
          </h2>

          {/* Descripción */}
          <p className="text-center text-muted-foreground mb-8 leading-relaxed">
            {currentStepData.description}
          </p>

          {/* Indicadores de progreso (dots) */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {tourSteps.map((_, index) => (
              <motion.div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-accent'
                    : 'w-2 bg-muted'
                }`}
                initial={false}
                animate={{
                  scale: index === currentStep ? 1.2 : 1,
                }}
              />
            ))}
          </div>

          {/* Botones de navegación */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`${currentStep === 0 ? 'invisible' : ''}`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <Button
              onClick={handleNext}
              className={`${currentStepData.gradient} text-white px-6`}
            >
              {currentStep === tourSteps.length - 1 ? (
                '¡Empezar a chatear!'
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Botón de saltar */}
          {currentStep < tourSteps.length - 1 && (
            <button
              onClick={handleSkip}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors"
            >
              Saltar tutorial
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default WelcomeTour;
