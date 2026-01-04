import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const FAQPage = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      q: "¿Es realmente gratis?",
      a: "Sí, 100% gratis para chatear. Puedes usar Chactivo sin pagar nada, sin registro, sin email. Ofrecemos una suscripción Premium opcional con beneficios extras (chats privados, badges exclusivos, avatares), pero el chat público es completamente gratuito para siempre."
    },
    {
      q: "¿Necesito dar mi email o teléfono?",
      a: "No. Puedes chatear completamente anónimo sin dar email, teléfono ni vincular redes sociales. Solo elige un nombre de usuario y listo. Si quieres crear una cuenta para acceder desde otros dispositivos, solo necesitas email (que nunca compartimos ni vendemos)."
    },
    {
      q: "¿Cómo protegen mi privacidad?",
      a: "No vendemos ni compartimos tus datos. No usamos trackers de terceros ni anuncios invasivos. Tus conversaciones están encriptadas. Puedes chatear anónimo sin dar datos personales. Y tienes derecho al olvido: borra tu cuenta y datos en 24h, permanentemente."
    },
    {
      q: "¿Hay moderación? ¿Cómo funciona?",
      a: "Sí, moderación 24/7 con sistema híbrido único: IA detecta contenido inapropiado en tiempo real + moderadores humanos verifican reportes. Esto nos permite ser rápidos sin invadir tu privacidad. Puedes reportar cualquier mensaje o usuario con un click."
    },
    {
      q: "¿Puedo eliminar mi cuenta y datos?",
      a: "Sí, en cualquier momento. Desde Configuración > Eliminar Cuenta. Todos tus datos se borran permanentemente en 24 horas. Sin excepciones, sin backups ocultos. Derecho al olvido garantizado."
    },
    {
      q: "¿Por qué no hay anuncios?",
      a: "Porque los odiamos tanto como tú. Nuestro modelo es sostenible con suscripciones Premium opcionales, no vendiendo tu atención a anunciantes. Sin publicidad invasiva, sin trackers, sin distracciones. Solo chat real."
    },
    {
      q: "¿Es seguro para profesionales o personas públicas?",
      a: "Absolutamente. Anonimato total garantizado si lo deseas. No pedimos email ni teléfono para chatear. No hay forma de vincular tu identidad real con tu usuario del chat a menos que tú lo compartas. Muchos profesionales y figuras públicas usan Chactivo con tranquilidad."
    },
    {
      q: "¿Cómo reporto comportamiento inapropiado?",
      a: "Hay un botón de reporte en cada mensaje y perfil. Click derecho > Reportar. Nuestro equipo revisa todos los reportes en minutos (no horas). También tenemos IA que detecta automáticamente acoso, spam y contenido prohibido."
    },
    {
      q: "¿Verifican que los usuarios sean reales?",
      a: "Tenemos sistema de verificación opcional (badge azul) para usuarios que quieran demostrar autenticidad. No es obligatorio. También moderamos activamente para detectar bots, perfiles fake y comportamiento sospechoso. Tolerancia cero con spam."
    },
    {
      q: "¿Qué diferencia a Chactivo de Grindr o Tinder?",
      a: "Enfoque: somos comunidad, no solo hookups. Privacidad real (no vendemos datos). Sin bots ni perfiles fake. Moderación humana 24/7. Sin publicidad invasiva. Ambiente más relajado y conversacional. Ideal para hacer amigos, no solo citas. Y 100% gratis para chatear."
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-16 sm:pt-20">
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
              onClick={() => navigate('/landing')}
              className="magenta-gradient text-white font-bold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-[#E4007C]/50 hover:scale-105 transition-all"
            >
              Volver al Inicio
            </Button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQPage;

