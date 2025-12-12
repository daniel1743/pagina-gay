import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Ban, VolumeX, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SANCTION_TYPES } from '@/services/sanctionsService';

const SanctionsFAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "¿Qué tipos de sanciones existen?",
      answer: "Existen 5 tipos de sanciones: 1) Advertencia - Primera notificación por violación menor. 2) Silenciar - El usuario no puede enviar mensajes temporalmente. 3) Suspensión Temporal - El usuario no puede acceder a la plataforma por un período determinado (días). 4) Expulsión Permanente - El usuario es baneado permanentemente. 5) Restricción - Se limitan ciertas funciones de la cuenta."
    },
    {
      question: "¿Por qué razones puedo ser sancionado?",
      answer: "Las principales razones son: Spam (mensajes repetitivos o publicidad no autorizada), Acoso/Hostigamiento (molestar o intimidar a otros usuarios), Contenido Inapropiado (contenido sexual explícito o inadecuado), Groserías/Insultos (lenguaje ofensivo o discriminatorio), Cuenta Falsa (perfiles falsos o impersonación), Amenazas/Violencia (amenazas verbales o incitación a la violencia), Contenido Ilegal (material que viola leyes), y Otras violaciones de las normas de la comunidad."
    },
    {
      question: "¿Qué pasa si recibo una advertencia?",
      answer: "Una advertencia es una notificación formal de que has violado las normas. No tiene consecuencias inmediatas, pero queda registrada en tu historial. Si continúas violando las normas después de recibir advertencias, podrías recibir sanciones más severas como silenciamiento o suspensión."
    },
    {
      question: "¿Cuánto dura una suspensión temporal?",
      answer: "La duración de una suspensión temporal la determina el administrador según la gravedad de la violación. Puede ser desde 1 día hasta 365 días. Una vez que expire el período de suspensión, podrás volver a acceder a la plataforma normalmente."
    },
    {
      question: "¿Puedo apelar una sanción?",
      answer: "Sí, puedes crear un ticket de soporte desde tu perfil explicando tu situación. Los administradores revisarán tu caso y podrán revocar la sanción si consideran que fue aplicada incorrectamente o si hay circunstancias atenuantes."
    },
    {
      question: "¿Qué pasa si soy expulsado permanentemente?",
      answer: "Una expulsión permanente significa que no podrás volver a acceder a la plataforma con esa cuenta. Esta sanción se aplica solo en casos graves y repetitivos de violación de normas. Si crees que fue un error, puedes contactar soporte, pero las expulsiones permanentes rara vez se revocan."
    },
    {
      question: "¿Qué significa estar 'silenciado'?",
      answer: "Cuando estás silenciado, puedes acceder a la plataforma y ver el contenido, pero no puedes enviar mensajes en las salas de chat. Esta sanción es temporal y se aplica para prevenir spam o comportamiento disruptivo sin necesidad de suspender completamente tu acceso."
    },
    {
      question: "¿Las sanciones se acumulan?",
      answer: "Sí, todas las sanciones quedan registradas en tu historial. Si recibes múltiples advertencias o sanciones menores, es probable que recibas sanciones más severas en el futuro. Los administradores revisan el historial completo antes de aplicar sanciones."
    },
    {
      question: "¿Puedo ver mi historial de sanciones?",
      answer: "Actualmente, el historial de sanciones solo es visible para administradores. Si quieres conocer tu estado, puedes crear un ticket de soporte y preguntar sobre tu historial."
    },
    {
      question: "¿Qué pasa si violo las normas mientras estoy suspendido?",
      answer: "Si intentas crear una nueva cuenta o evadir una suspensión, tu sanción puede extenderse o convertirse en una expulsión permanente. Es importante respetar las sanciones aplicadas."
    },
    {
      question: "¿Cómo puedo evitar ser sancionado?",
      answer: "Lee y respeta las normas de la comunidad: no envíes spam, no acoses a otros usuarios, usa lenguaje respetuoso, no compartas contenido inapropiado o ilegal, y trata a todos con respeto. Si tienes dudas sobre qué está permitido, consulta las normas de la comunidad o contacta a un administrador."
    },
    {
      question: "¿Los administradores pueden ser sancionados?",
      answer: "Sí, los administradores también están sujetos a las normas de la comunidad. Si un administrador viola las normas, puede ser sancionado por otros administradores de mayor rango o por el equipo de moderación."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-6 h-6 text-red-400" />
        <h3 className="font-semibold text-lg">Preguntas Frecuentes sobre Sanciones y Expulsiones</h3>
      </div>
      
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
        <h4 className="font-semibold mb-2 text-red-400">⚠️ Normas de la Comunidad</h4>
        <p className="text-sm text-muted-foreground">
          Las siguientes acciones pueden resultar en sanciones: Spam, Acoso, Contenido Inapropiado, 
          Groserías/Insultos, Amenazas, Contenido Ilegal, y otras violaciones de las normas.
        </p>
      </div>

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

export default SanctionsFAQ;

