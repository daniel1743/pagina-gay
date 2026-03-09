import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles, X } from 'lucide-react';

const PrivateMatchSuggestionCard = ({
  suggestion,
  quickGreetings = [],
  isSending = false,
  onPickGreeting,
  onDismiss,
}) => {
  if (!suggestion?.partner) return null;

  const partnerName = suggestion.partner.username || 'Usuario';
  const systemText = suggestion.systemText || 'Chactivo los conectó porque ambos están en línea ahora.';
  const greetings = Array.isArray(quickGreetings) && quickGreetings.length > 0
    ? quickGreetings.slice(0, 3)
    : ['Hola 👋', '¿Qué haces?', '¿De dónde eres?'];

  return (
    <div className="px-3 pt-2">
      <div className="max-w-2xl mx-auto rounded-xl border border-cyan-500/25 bg-slate-950/55 backdrop-blur-md shadow-lg p-3">
        <div className="flex items-start gap-2.5">
          <Avatar className="h-9 w-9 border border-cyan-400/55">
            <AvatarImage src={suggestion.partner.avatar} alt={partnerName} />
            <AvatarFallback>{partnerName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-cyan-300 text-[11px] font-semibold uppercase tracking-wide">
              <Sparkles className="h-3 w-3" />
              Sala privada sugerida
            </div>
            <p className="text-[15px] text-white/90 mt-1 leading-snug">
              {systemText}
            </p>
            <p className="text-xs text-cyan-200/90 mt-1">
              Pulsa un botón para saludar a <span className="font-semibold">{partnerName}</span>.
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full p-1 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar sugerencia"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          {greetings.map((greeting) => (
            <Button
              key={greeting}
              type="button"
              size="sm"
              disabled={isSending}
              onClick={() => onPickGreeting?.(greeting)}
              className="h-8 px-3 text-sm justify-start bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-100 border border-cyan-400/30"
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
              {greeting}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivateMatchSuggestionCard;
