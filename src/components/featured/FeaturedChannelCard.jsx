import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Eye, EyeOff, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getEmbedSrc, normalizeMediaType } from '@/utils/embeds';

const platformStyles = {
  telegram: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  x: 'bg-zinc-500/15 text-zinc-200 border-zinc-400/30',
  twitter: 'bg-zinc-500/15 text-zinc-200 border-zinc-400/30',
  instagram: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  other: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
};

const getPlatformLabel = (platform = '') => {
  const normalized = String(platform).toLowerCase();
  if (normalized === 'x') return 'X';
  if (normalized === 'telegram') return 'Telegram';
  if (normalized === 'twitter') return 'Twitter';
  if (normalized === 'instagram') return 'Instagram';
  return 'Canal';
};

const getBadgeStyle = (badge) => {
  const normalized = String(badge || '').toLowerCase();
  if (normalized === 'vip') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  if (normalized === 'popular') return 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30';
  if (normalized === 'nuevo') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
};

const CardMedia = ({ ad, blurAmountPx }) => {
  const [embedFailed, setEmbedFailed] = useState(false);
  const mediaType = normalizeMediaType(ad.mediaType);
  const embedSrc = useMemo(() => getEmbedSrc(mediaType, ad.mediaUrl), [mediaType, ad.mediaUrl]);
  const canRenderEmbed = (mediaType === 'x_embed' || mediaType === 'iframe') && embedSrc && !embedFailed;
  const blurAmount = `${Math.max(0, Number(blurAmountPx || 0))}px`;

  return (
    <div className="relative h-[84px] rounded-xl overflow-hidden border border-border/50 bg-muted/20">
      {mediaType === 'image' && ad.mediaUrl && (
        <img
          src={ad.mediaUrl}
          alt={ad.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-200"
          style={{ filter: `blur(${blurAmount})` }}
        />
      )}

      {canRenderEmbed && (
        <iframe
          title={`preview-${ad.id}`}
          src={embedSrc}
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allow="autoplay; encrypted-media; picture-in-picture"
          className="h-full w-full border-0 pointer-events-none transition duration-200"
          style={{ filter: `blur(${blurAmount})` }}
          onError={() => setEmbedFailed(true)}
        />
      )}

      {((mediaType !== 'image' && !canRenderEmbed) || !ad.mediaUrl) && (
        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs bg-gradient-to-br from-slate-700/30 to-slate-900/20">
          <div className="flex items-center gap-1.5">
            <PlayCircle className="w-4 h-4" />
            <span>Preview no disponible</span>
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
    </div>
  );
};

const FeaturedChannelCard = ({
  ad,
  className = '',
  onOpen,
  disableLink = false,
  showClicks = false,
}) => {
  const [revealed, setRevealed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const revealTimeoutRef = useRef(null);

  const hasSensitiveBlur = Boolean(ad.blurEnabled);
  const blurAmountPx = !hasSensitiveBlur ? 0 : revealed ? 0 : isHovered ? 6 : (ad.blurStrength || 14);
  const platformClass = platformStyles[String(ad.platform || '').toLowerCase()] || platformStyles.other;
  const safeCtaText = ad.ctaText || 'Ver';

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  const openCard = () => {
    if (!ad.url || disableLink) return;
    if (typeof onOpen === 'function') {
      onOpen(ad);
      return;
    }
    window.open(ad.url, '_blank', 'noopener,noreferrer');
  };

  const handleToggleReveal = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const nextValue = !revealed;
    setRevealed(nextValue);

    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    if (nextValue) {
      revealTimeoutRef.current = setTimeout(() => {
        setRevealed(false);
      }, 12000);
    }
  };

  return (
    <article
      className={`group rounded-2xl border border-border/60 bg-card/80 p-3 transition-all duration-200 hover:-translate-y-[1px] hover:border-cyan-400/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={openCard}
      role={disableLink ? undefined : 'button'}
      tabIndex={disableLink ? -1 : 0}
      onKeyDown={(event) => {
        if (disableLink) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openCard();
        }
      }}
    >
      <div className="relative">
        <CardMedia ad={ad} blurAmountPx={blurAmountPx} />

        {hasSensitiveBlur && (
          <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-1.5">
            <Badge className="bg-black/70 text-white border-white/20 text-[10px]">
              Contenido +18
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-7 px-2.5 text-[11px] bg-black/55 hover:bg-black/70 border border-white/15"
              onClick={handleToggleReveal}
            >
              {revealed ? (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Ocultar
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Ver preview
                </>
              )}
            </Button>
          </div>
        )}

        {ad.badge && (
          <Badge className={`absolute top-2 right-2 text-[10px] border ${getBadgeStyle(ad.badge)}`}>
            {ad.badge}
          </Badge>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">{ad.title}</h4>
          <p className="text-xs text-muted-foreground truncate">{ad.description || 'Canal recomendado'}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Badge className={`text-[10px] border ${platformClass}`}>
            {getPlatformLabel(ad.platform)}
          </Badge>

          <div className="flex items-center gap-2">
            {showClicks && (
              <span className="text-[10px] text-muted-foreground">{ad.clickCount || 0} clicks</span>
            )}
            <Button
              type="button"
              size="sm"
              className="h-7 text-[11px] px-2.5"
              onClick={(event) => {
                event.stopPropagation();
                openCard();
              }}
              disabled={disableLink || !ad.url}
            >
              {safeCtaText}
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default FeaturedChannelCard;
