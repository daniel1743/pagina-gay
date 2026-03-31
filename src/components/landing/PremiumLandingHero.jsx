import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Zap,
  MessageCircle,
  ChevronRight,
  ShieldCheck,
  Users,
} from 'lucide-react';

const buildFeatureCards = (supportingPoints = []) => {
  const fallback = [
    'Entrada directa al chat desde tu navegador.',
    'Sin descargas ni pasos largos para empezar.',
    'Gente real conectando ahora dentro de Chile.',
  ];

  const points = supportingPoints.length > 0 ? supportingPoints.slice(0, 3) : fallback;
  const cardMeta = [
    {
      title: 'Acceso inmediato',
      icon: MessageCircle,
      iconClassName: 'text-fuchsia-400',
      iconWrapClassName: 'bg-fuchsia-500/10 border-fuchsia-500/20',
    },
    {
      title: 'Sin fricción',
      icon: Zap,
      iconClassName: 'text-indigo-400',
      iconWrapClassName: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Gente real ahora',
      icon: Users,
      iconClassName: 'text-blue-400',
      iconWrapClassName: 'bg-blue-500/10 border-blue-500/20',
    },
  ];

  return points.map((description, index) => ({
    ...cardMeta[index],
    description,
  }));
};

const PremiumLandingHero = ({
  badgeLabel = 'Chile activo ahora',
  title,
  subtitle,
  ctaLabel = 'Entrar ahora',
  ctaSubtext = 'Sin app · Sin registro obligatorio · Acceso inmediato',
  liveLabel = 'En vivo ahora',
  livePillLabel = 'Personas conectando ahora',
  supportingPoints = [],
  onPrimaryClick,
  showAutoRedirect = false,
  autoRedirectText = 'Abriendo el chat...',
  brandLabel = 'CHACTIVO',
}) => {
  const [mounted, setMounted] = useState(false);
  const featureCards = useMemo(() => buildFeatureCards(supportingPoints), [supportingPoints]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030305] text-white selection:bg-fuchsia-500/30">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes premium-blob {
              0% { transform: translate3d(0px, 0px, 0) scale(1); }
              33% { transform: translate3d(30px, -44px, 0) scale(1.08); }
              66% { transform: translate3d(-18px, 20px, 0) scale(0.95); }
              100% { transform: translate3d(0px, 0px, 0) scale(1); }
            }

            .premium-blob {
              animation: premium-blob 11s infinite alternate ease-in-out;
            }

            .premium-blob-delay-2000 {
              animation-delay: 2s;
            }

            .premium-blob-delay-4000 {
              animation-delay: 4s;
            }

            .premium-glass-panel {
              background: rgba(255, 255, 255, 0.035);
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.08);
            }

            .premium-hero-reveal {
              transition: opacity 900ms ease, transform 900ms ease;
            }
          `,
        }}
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="premium-blob absolute left-[-10%] top-[-12%] h-96 w-96 rounded-full bg-fuchsia-600/30 blur-[100px] opacity-70 mix-blend-screen" />
        <div className="premium-blob premium-blob-delay-2000 absolute right-[-12%] top-[15%] h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px] opacity-60 mix-blend-screen" />
        <div className="premium-blob premium-blob-delay-4000 absolute bottom-[-18%] left-[18%] h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[150px] opacity-50 mix-blend-screen" />
      </div>

      <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:py-8">
        <div className="group flex cursor-pointer items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 shadow-lg shadow-fuchsia-500/20 transition-all duration-300 group-hover:shadow-fuchsia-500/40">
            <MessageCircle size={18} className="text-white" />
          </div>
          <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            {brandLabel}
          </span>
        </div>

        <div className="hidden items-center gap-2 text-sm font-medium text-white/50 sm:flex">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.55)] animate-pulse" />
          <span>{liveLabel}</span>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[82vh] w-full max-w-6xl flex-col items-center justify-center px-6 pb-24 pt-6 sm:pt-8">
        <div
          className={`premium-hero-reveal transform ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="premium-glass-panel mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2">
            <Sparkles size={14} className="text-fuchsia-400" />
            <span className="text-sm font-medium tracking-wide text-white/85">{badgeLabel}</span>
          </div>
        </div>

        <section
          className={`premium-hero-reveal mx-auto max-w-4xl text-center transform ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '120ms' }}
        >
          <h1 className="mb-6 text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-base font-light leading-relaxed text-white/62 sm:text-xl">
            {subtitle}
          </p>
        </section>

        <div
          className={`premium-hero-reveal flex flex-col items-center transform ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '240ms' }}
        >
          <div className="group relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 opacity-70 blur transition duration-500 group-hover:opacity-100 group-hover:duration-200" />
            <button
              type="button"
              onClick={onPrimaryClick}
              className="relative flex items-center gap-3 rounded-full border border-white/10 bg-[#0a0a0c] px-7 py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-transparent sm:px-8 sm:text-lg"
            >
              {ctaLabel}
              <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-sm font-medium text-white/48">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500/80" />
              Sin app
            </span>
            <span className="text-white/20">·</span>
            <span>{ctaSubtext}</span>
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-white/65">
            <Users size={15} className="text-indigo-300" />
            <span>{livePillLabel}</span>
          </div>

          {showAutoRedirect && (
            <p className="mt-4 text-sm text-white/45">{autoRedirectText}</p>
          )}
        </div>

        <section
          className={`premium-hero-reveal mt-16 grid w-full grid-cols-1 gap-4 transform sm:mt-24 md:grid-cols-3 md:gap-6 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '360ms' }}
        >
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="premium-glass-panel group cursor-default rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 hover:bg-white/[0.05] sm:p-8"
              >
                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border ${card.iconWrapClassName} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon size={24} className={card.iconClassName} />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{card.title}</h3>
                <p className="text-sm leading-relaxed text-white/52">{card.description}</p>
              </div>
            );
          })}
        </section>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center border-t border-white/5 px-6 py-8 text-center">
        <p className="text-xs font-medium text-white/30">
          © {new Date().getFullYear()} Chactivo.
        </p>
      </footer>
    </div>
  );
};

export default PremiumLandingHero;
