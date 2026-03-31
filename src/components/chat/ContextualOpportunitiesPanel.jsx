import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles, X } from 'lucide-react';

const getInitials = (value = '') => {
  const safe = String(value || '').trim();
  return safe ? safe.slice(0, 2).toUpperCase() : 'U';
};

const shellByVariant = {
  desktop: 'mx-3 mt-3 rounded-2xl border border-cyan-500/16 bg-[linear-gradient(180deg,rgba(8,18,28,0.98),rgba(11,22,34,0.92))] shadow-[0_16px_42px_rgba(0,0,0,0.32)]',
  mobile: 'rounded-2xl border border-cyan-500/18 bg-[linear-gradient(180deg,rgba(8,18,28,0.96),rgba(10,20,32,0.92))] shadow-[0_16px_44px_rgba(0,0,0,0.3)]',
};

const itemShellByVariant = {
  desktop: 'rounded-2xl border border-white/8 bg-white/[0.03] p-2.5',
  mobile: 'rounded-2xl border border-white/8 bg-white/[0.03] p-2.5',
};

const ContextualOpportunitiesPanel = ({
  items = [],
  variant = 'desktop',
  title = 'Disponible ahora',
  subtitle = '1 buena oportunidad > 10 irrelevantes.',
  badgeLabel = null,
  onOpenMatch,
  onDismiss,
  isSending = false,
}) => {
  const safeItems = Array.isArray(items) ? items.slice(0, 3) : [];

  if (safeItems.length === 0) return null;

  const isMobile = variant === 'mobile';

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={`${variant}:${safeItems.map((item) => item?.userId || item?.id).join('|')}`}
        initial={{ opacity: 0, y: isMobile ? 16 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: isMobile ? 16 : 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={shellByVariant[variant] || shellByVariant.desktop}
      >
        <div className={isMobile ? 'px-3 pb-3 pt-3' : 'px-3 pb-3 pt-3'}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    {title}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {subtitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {badgeLabel ? (
                <span className="rounded-full border border-cyan-400/18 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-200">
                  {badgeLabel}
                </span>
              ) : null}
              {onDismiss ? (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="rounded-full p-1 text-slate-400 transition-colors hover:bg-white/8 hover:text-white"
                  aria-label="Cerrar oportunidades"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-3 space-y-2.5">
            {safeItems.map((item, index) => {
              const partnerName = item?.username || 'Usuario';
              const itemKey = item?.userId || item?.id || `${partnerName}-${index}`;
              const roleLabel = item?.roleBadge || item?.roleLabel || null;
              const opportunityText = item?.opportunityText || item?.intentSummary || 'Disponible ahora';
              const activityText = item?.activityText || 'Activo hace poco';

              return (
                <div
                  key={itemKey}
                  className={[
                    itemShellByVariant[variant] || itemShellByVariant.desktop,
                    index === 0 ? 'border-cyan-400/18 bg-cyan-500/[0.06]' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onOpenMatch?.(item)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    >
                      <Avatar className={`h-11 w-11 border ${index === 0 ? 'border-cyan-300/40' : 'border-white/10'}`}>
                        <AvatarImage src={item?.avatar} alt={partnerName} />
                        <AvatarFallback>{getInitials(partnerName)}</AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-white">
                            {partnerName}
                          </p>
                          {roleLabel ? (
                            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-slate-200">
                              {roleLabel}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-cyan-100/88">
                          {opportunityText}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                          <span>{activityText}</span>
                          {item?.opportunityMeta ? (
                            <span className="rounded-full border border-white/8 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-slate-300">
                              {item.opportunityMeta}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>

                    <Button
                      type="button"
                      size="sm"
                      disabled={isSending}
                      onClick={() => onOpenMatch?.(item)}
                      className="h-9 shrink-0 rounded-xl border border-cyan-400/30 bg-cyan-500/14 px-3 text-xs font-semibold text-cyan-50 hover:bg-cyan-500/22"
                    >
                      <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                      Hablar ahora
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
};

export default ContextualOpportunitiesPanel;
