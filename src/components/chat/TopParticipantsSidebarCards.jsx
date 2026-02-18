import React, { useEffect, useState } from 'react';
import { Crown, Lock, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { subscribeTopParticipantsPublic } from '@/services/topParticipantsService';

const TopParticipantsSidebarCards = ({ compact = false }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeTopParticipantsPublic(
      (items) => {
        setParticipants(items);
        setLoading(false);
      },
      () => {
        setParticipants([]);
        setLoading(false);
      }
    );

    return () => unsubscribe?.();
  }, []);

  const visibleParticipants = participants.slice(0, 8);

  return (
    <div className="mt-4 mb-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2 flex items-center gap-1.5">
        <Crown className="w-3.5 h-3.5 text-amber-400" />
        Top Participantes
      </h3>

      <div
        className={`space-y-1.5 overflow-y-auto pr-1 ${compact ? 'max-h-40' : 'max-h-52'}`}
      >
        {loading && (
          <div className="px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-xs text-muted-foreground">
            Cargando ranking...
          </div>
        )}

        {!loading && visibleParticipants.length === 0 && (
          <div className="px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-xs text-muted-foreground">
            Aun no hay participantes destacados.
          </div>
        )}

        {!loading &&
          visibleParticipants.map((item) => (
            <div
              key={item.userId}
              className="relative rounded-xl border border-border/60 bg-card/60 px-2.5 py-2"
            >
              <div className={`${item.effectiveBlur ? 'blur-[3px]' : ''} transition`}>
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Avatar className="w-8 h-8 border border-border/70">
                      <AvatarImage src={item.avatar} alt={item.username} />
                      <AvatarFallback>{(item.username || 'U').slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                      #{item.displayRank}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{item.username}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {item.messagesCount || 0}
                      </span>
                      <span>Score {item.activityScore || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {item.effectiveBlur && (
                <div className="absolute inset-0 rounded-xl bg-black/35 border border-white/10 flex items-center justify-center pointer-events-none">
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-black/60 text-white border border-white/20">
                    <Lock className="w-3 h-3" />
                    Desbloqueable
                  </span>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default TopParticipantsSidebarCards;
