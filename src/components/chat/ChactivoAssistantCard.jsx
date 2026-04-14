import React from 'react';
import { AlertTriangle, Bot, MapPin, MessageSquare, ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TOPIC_ICONS = {
  how_it_works: Bot,
  private_chat: MessageSquare,
  nearby_people: MapPin,
  report_safety: ShieldAlert,
  message_blocked: AlertTriangle,
};

const ChactivoAssistantCard = ({
  topics = [],
  activeTopicKey = 'how_it_works',
  reply = null,
  onTopicSelect,
  onQuickAction,
  onDismiss,
}) => {
  const ActiveIcon = TOPIC_ICONS[activeTopicKey] || Bot;

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(24,56,74,0.32),rgba(20,28,48,0.46))] px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-cyan-300/90">
            Chactivo Assistant
          </p>
          <p className="mt-1 text-xs text-cyan-50/90">
            Guia rapida real. No simula usuarios ni empuja conversaciones falsas.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="h-7 w-7 rounded-full text-muted-foreground hover:text-cyan-100"
          title="Cerrar ayuda"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {topics.map((topic) => {
          const isActive = topic.key === activeTopicKey;
          return (
            <button
              key={topic.key}
              type="button"
              onClick={() => onTopicSelect?.(topic.key)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'border-cyan-400/35 bg-cyan-500/15 text-cyan-100'
                  : 'border-white/10 bg-white/5 text-muted-foreground hover:border-cyan-500/20 hover:text-cyan-100'
              }`}
            >
              {topic.label}
            </button>
          );
        })}
      </div>

      {reply ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 rounded-full bg-cyan-500/15 p-1.5 text-cyan-200">
              <ActiveIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{reply.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{reply.summary}</p>
            </div>
          </div>

          {reply.bullets?.length ? (
            <div className="mt-3 space-y-2">
              {reply.bullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-2 text-xs text-foreground/90">
                  <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-cyan-300/80" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          ) : null}

          {reply.exampleMessage ? (
            <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-200/90">
                Ejemplo rapido
              </p>
              <p className="mt-1 text-xs text-emerald-50/95">{reply.exampleMessage}</p>
            </div>
          ) : null}

          {reply.quickActions?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {reply.quickActions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => onQuickAction?.(action.key, reply)}
                  className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-100 transition-colors hover:bg-emerald-500/15"
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ChactivoAssistantCard;
