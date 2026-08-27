import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VerificationFAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "¿Qué significa tener la insignia de participación?",
      answer: "La insignia indica que has accedido durante 30 días consecutivos según el registro de la plataforma. No verifica tu identidad, no certifica el contenido de tu perfil y no garantiza seguridad."
    },
    {
      question: "¿Qué cuenta como un día de participación?",
      answer: "El sistema registra un acceso por día. No afirma cuánto tiempo estuviste conectado y no necesitas mantener abierta la página todo el día."
    },
    {
      question: "¿Qué pasa si dejo de acceder algunos días?",
      answer: "La racha se reinicia cuando hay una interrupción. Si la ausencia es de hasta tres días, el siguiente acceso empieza una nueva racha; si ya tenías la insignia y pasas cuatro días o más, puede retirarse."
    },
    {
      question: "¿Puedo perder la insignia?",
      answer: "Sí. Si pasas cuatro días o más sin acceder, el servicio puede retirar la insignia. Para recuperarla, debes cumplir nuevamente el periodo consecutivo."
    },
    {
      question: "¿Cuántos días puedo estar sin acceder si ya tengo la insignia?",
      answer: "La regla actual permite hasta tres días de ausencia; a partir de cuatro días, la insignia puede retirarse."
    },
    {
      question: "¿La racha sigue contando si ya tengo la insignia?",
      answer: "La insignia se mantiene mientras cumplas la regla de ausencia. Si se retira, debes iniciar de nuevo el periodo consecutivo para obtenerla otra vez."
    },
    {
      question: "¿Qué pasa si me conecto el mismo día varias veces?",
      answer: "Solo cuenta como un día. No importa cuántas veces te conectes en el mismo día, solo cuenta como un día en tu racha."
    },
    {
      question: "¿Puedo obtener la insignia de otra forma?",
      answer: "No desde esta función. La insignia se basa únicamente en la continuidad de acceso; no es una verificación de identidad ni una validación manual."
    },
    {
      question: "¿Qué pasa si tengo problemas técnicos?",
      answer: "La racha depende de que el acceso quede registrado. Si tienes un problema persistente, utiliza el canal de soporte disponible y describe la fecha y el error sin compartir credenciales."
    },
    {
      question: "¿Puedo recuperar la insignia si la perdí?",
      answer: "Sí, debes cumplir nuevamente el periodo consecutivo de acceso desde el día en que retomes la participación."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg mb-4">Preguntas frecuentes sobre la insignia de participación</h3>
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

