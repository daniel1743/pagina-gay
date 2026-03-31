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
      <div className="max-w-xl mx-auto rounded-2xl border border-cyan-500/20 bg-card/95 backdrop-blur-xl p-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9 border border-cyan-400/55">
            <AvatarImage src={suggestion.partner.avatar} alt={partnerName} />
            <AvatarFallback>{partnerName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-cyan-300 text-[11px] font-semibold uppercase tracking-wide">
              <Sparkles className="h-3 w-3" />
              Sala privada sugerida
            </div>
            <p className="text-[14px] text-foreground mt-0.5 leading-snug line-clamp-2">
              {systemText}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Saluda a <span className="font-semibold text-foreground">{partnerName}</span> sin abrir otro panel.
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
            aria-label="Cerrar sugerencia"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={isSending}
            onClick={() => onPickGreeting?.(greetings[0])}
            className="h-8 px-3 text-sm bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-100 border border-cyan-400/30"
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
            {greetings[0]}
          </Button>
          <div className="hidden sm:flex items-center gap-2 min-w-0">
            {greetings.slice(1).map((greeting) => (
              <button
                key={greeting}
                type="button"
                disabled={isSending}
                onClick={() => onPickGreeting?.(greeting)}
                className="rounded-full border border-border/70 px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
              >
                {greeting}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateMatchSuggestionCard;
