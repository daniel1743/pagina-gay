import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useCanonical, usePageMeta } from '@/hooks/useCanonical';

const FAQPage = () => {
  const navigate = useNavigate();
  useCanonical('/faq');
  usePageMeta(
    'Preguntas Frecuentes | Chactivo',
    'Respuestas claras sobre privacidad, registro, costo, moderacion y seguridad en Chactivo.'
  );

  const faqs = [
    {
      q: "¿Es realmente gratis?",
      a: "El chat público está disponible sin pago y algunas salas pueden solicitar registro. Las funciones Premium, si están habilitadas, son opcionales y deben revisarse en la pantalla correspondiente."
    },
    {
      q: "¿Necesito dar mi email o teléfono?",
      a: "Para algunas entradas públicas puedes participar sin proporcionar email o teléfono, usando un alias. Una cuenta registrada puede requerir otros datos; comparte solo lo necesario y revisa la política de privacidad vigente."
    },
    {
      q: "¿Cómo protegen mi privacidad?",
      a: "Puedes participar con un alias y evitar publicar datos personales, pero no prometemos anonimato total. El sitio puede utilizar herramientas técnicas de analítica y el almacenamiento depende del backend configurado. No compartas ubicación exacta, teléfono, correo ni información sensible en salas públicas."
    },
    {
      q: "¿Hay moderación? ¿Cómo funciona?",
      a: "Hay filtros locales para algunos patrones de spam o riesgo y herramientas de reporte cuando están disponibles. Los filtros pueden equivocarse y ningún sistema garantiza una revisión inmediata; evita continuar una interacción que te incomode."
    },
    {
      q: "¿Puedo eliminar mi cuenta y datos?",
      a: "Si la opción de eliminación está disponible en Configuración, sigue sus pasos y conserva la confirmación. No prometemos borrado inmediato, eliminación de copias de seguridad ni un plazo universal sin verificar primero el backend y la política vigente."
    },
    {
      q: "¿Por qué no hay anuncios?",
      a: "Priorizamos una interfaz sin anuncios intrusivos. La medición técnica del sitio puede utilizar herramientas de analítica; revisa la información de privacidad antes de compartir datos personales."
    },
    {
      q: "¿Es seguro para profesionales o personas públicas?",
      a: "Puedes usar un alias y decidir qué información compartir, pero no prometemos anonimato total ni invulnerabilidad. No publiques datos sensibles, ubicación exacta, teléfono o correo en una sala pública."
    },
    {
      q: "¿Cómo reporto comportamiento inapropiado?",
      a: "Usa la opción Reportar que aparece en el mensaje o perfil cuando esté disponible y describe el problema sin incluir datos sensibles. Los filtros locales ayudan a detectar algunos patrones, pero ningún sistema reemplaza tu criterio ni garantiza una revisión inmediata."
    },
    {
      q: "¿Verifican que los usuarios sean reales?",
      a: "La insignia de verificación es opcional y no constituye una prueba absoluta de identidad. Aplicamos controles y reportes contra abuso; si algo te parece sospechoso, no compartas datos ni continúes la conversación."
    },
    {
      q: "¿Qué diferencia a Chactivo de Grindr o Tinder?",
      a: "Nuestro enfoque combina conversación y comunidad, no solo citas. Puedes participar con un alias, usar herramientas de reporte cuando estén disponibles y decidir qué compartir. La actividad depende de las personas reales que participen; el chat público no requiere pago."
    },
  ];

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl">
          {/* Botón de regreso */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </motion.div>

          {/* Título */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Preguntas Frecuentes
              </span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              ¿Dudas? Haz clic en las preguntas para ver las respuestas
            </p>
          </motion.div>

          {/* Acordeón de preguntas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="glass-effect rounded-lg border border-cyan-500/20 hover:border-cyan-500/40 transition-all group"
              >
                <summary className="p-3 sm:p-4 cursor-pointer flex items-center justify-between gap-3 font-medium text-sm sm:text-base text-foreground list-none">
                  <span className="flex-1">{faq.q}</span>
                  <svg className="w-4 h-4 text-cyan-400 flex-shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12"
          >
            <p className="text-sm text-muted-foreground mb-4">
              ¿Más dudas? Contáctanos
            </p>
            <Button
              onClick={() => navigate('/')}
              className="magenta-gradient text-white font-bold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-[#E4007C]/50 hover:scale-105 transition-all"
            >
              Volver al Inicio
            </Button>
          </motion.div>
      </div>
    </main>
  );
};

export default FAQPage;

