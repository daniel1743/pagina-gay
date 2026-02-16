import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock3 } from 'lucide-react';

const formatTimeAgo = (createdAtMs, nowMs) => {
  if (!createdAtMs) return 'ahora';
  const diff = Math.max(0, nowMs - createdAtMs);
  const seconds = Math.floor(diff / 1000);

  if (seconds < 15) return 'justo ahora';
  if (seconds < 60) return `hace ${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;

  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
};

const formatRemaining = (expiresAtMs, nowMs) => {
  if (!expiresAtMs) return '';
  const remainingSeconds = Math.max(0, Math.ceil((expiresAtMs - nowMs) / 1000));
  if (remainingSeconds <= 0) return 'expirada';
  if (remainingSeconds < 60) return `${remainingSeconds}s`;

  const remainingMinutes = Math.floor(remainingSeconds / 60);
  if (remainingMinutes < 60) return `${remainingMinutes}m`;

  const remainingHours = Math.floor(remainingMinutes / 60);
  if (remainingHours < 24) return `${remainingHours}h`;

  const remainingDays = Math.floor(remainingHours / 24);
  return `${remainingDays}d`;
};

const EsenciaCard = ({ esencia, nowMs }) => {
  const timeAgo = useMemo(
    () => formatTimeAgo(esencia.createdAtMs, nowMs),
    [esencia.createdAtMs, nowMs]
  );
  const remaining = useMemo(
    () => formatRemaining(esencia.expiresAtMs, nowMs),
    [esencia.expiresAtMs, nowMs]
  );

  return (
    <article className="rounded-xl border border-border/60 bg-secondary/25 hover:bg-secondary/40 transition-colors p-3">
      <div className="flex items-start gap-2.5">
        <Avatar className="w-9 h-9 border border-border/70">
          <AvatarImage src={esencia.avatar} alt={esencia.username} />
          <AvatarFallback className="bg-secondary text-xs font-semibold">
            {esencia.username?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground truncate">{esencia.username}</p>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo}</span>
          </div>
          <p className="mt-1 text-sm text-foreground/95 break-words leading-relaxed">
            {esencia.mensaje}
          </p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock3 className="w-3 h-3" />
            <span>Expira en {remaining}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default EsenciaCard;

