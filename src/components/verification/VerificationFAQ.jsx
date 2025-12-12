import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VerificationFAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "¿Qué significa estar verificado?",
      answer: "Estar verificado significa que has demostrado compromiso con la plataforma conectándote durante 30 días consecutivos. Esto te da una insignia de verificación visible en tu perfil que genera mayor confianza en la comunidad."
    },
    {
      question: "¿Cuánto tiempo necesito estar conectado cada día?",
      answer: "Solo necesitas iniciar sesión unos minutos al día. No es necesario estar conectado todo el día. Lo importante es que te conectes al menos una vez cada 24 horas."
    },
    {
      question: "¿Qué pasa si olvido conectarme un día?",
      answer: "Si olvidas conectarte un día, tu contador de días consecutivos se reinicia a 0. Deberás empezar de nuevo los 30 días consecutivos para verificarte."
    },
    {
      question: "¿Puedo perder mi verificación?",
      answer: "Sí. Si pasas más de 3 días sin conectarte, al cuarto día perderás tu verificación automáticamente. Para recuperarla, deberás cumplir nuevamente los 30 días consecutivos."
    },
    {
      question: "¿Cuántos días puedo estar sin conectarme si ya estoy verificado?",
      answer: "Puedes estar hasta 3 días sin conectarte. Si pasas 4 días o más sin conexión, perderás tu verificación."
    },
    {
      question: "¿El contador se reinicia si ya estoy verificado?",
      answer: "No. Una vez verificado, solo necesitas mantenerte activo (conectarte al menos cada 3 días). El contador de días consecutivos se mantiene para estadísticas, pero no necesitas volver a cumplir los 30 días a menos que pierdas la verificación."
    },
    {
      question: "¿Qué pasa si me conecto el mismo día varias veces?",
      answer: "Solo cuenta como un día. No importa cuántas veces te conectes en el mismo día, solo cuenta como un día en tu racha."
    },
    {
      question: "¿Puedo verificar mi cuenta de otra forma?",
      answer: "No. La única forma de verificarte es cumplir los 30 días consecutivos de conexión. Esto asegura que solo usuarios comprometidos y activos obtengan la verificación."
    },
    {
      question: "¿Qué pasa si tengo problemas técnicos y no puedo conectarme?",
      answer: "Lamentablemente, si no puedes conectarte por problemas técnicos, el sistema no puede diferenciarlo de una ausencia voluntaria. Te recomendamos contactar soporte si tienes problemas persistentes."
    },
    {
      question: "¿Puedo recuperar mi verificación si la perdí?",
      answer: "Sí, pero deberás cumplir nuevamente los 30 días consecutivos de conexión desde el día que te reconectes."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg mb-4">Preguntas Frecuentes sobre Verificación</h3>
      {faqs.map((faq, index) => (
        <div key={index} className="border border-border rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto"
            onClick={() => toggleFAQ(index)}
          >
            <span className="text-left font-medium">{faq.question}</span>
            {openIndex === index ? (
              <ChevronUp className="w-5 h-5 flex-shrink-0 ml-2" />
            ) : (
              <ChevronDown className="w-5 h-5 flex-shrink-0 ml-2" />
            )}
          </Button>
          {openIndex === index && (
            <div className="px-4 pb-4 text-sm text-muted-foreground">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default VerificationFAQ;

