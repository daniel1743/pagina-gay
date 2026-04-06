import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCanonical } from '@/hooks/useCanonical';

const NoindexRouteNotice = ({
  title,
  description,
  heading,
  body,
  badge = 'Ruta informativa',
  footnote = 'Esta URL se mantiene por compatibilidad, pero ya no se trabaja como destino SEO independiente.',
  canonicalPath = null,
  primaryLabel = 'Ir al chat principal',
  primaryHref = '/chat/principal',
  secondaryLabel = 'Volver al inicio',
  secondaryHref = '/',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const resolvedCanonicalPath = canonicalPath || location.pathname;

  useCanonical(resolvedCanonicalPath);

  useEffect(() => {
    const previousTitle = document.title;
    const metaRobots = document.querySelector('meta[name="robots"]');
    const hadMetaRobots = !!metaRobots;
    const previousRobots = metaRobots?.getAttribute('content') || '';
    const metaDescription = document.querySelector('meta[name="description"]');
    const hadMetaDescription = !!metaDescription;
    const previousDescription = metaDescription?.getAttribute('content') || '';

    document.title = title;

    let ensuredMetaRobots = metaRobots;
    if (!ensuredMetaRobots) {
      ensuredMetaRobots = document.createElement('meta');
      ensuredMetaRobots.setAttribute('name', 'robots');
      document.head.appendChild(ensuredMetaRobots);
    }
    ensuredMetaRobots.setAttribute('content', 'noindex, nofollow, noarchive');

    let ensuredMetaDescription = metaDescription;
    if (!ensuredMetaDescription) {
      ensuredMetaDescription = document.createElement('meta');
      ensuredMetaDescription.setAttribute('name', 'description');
      document.head.appendChild(ensuredMetaDescription);
    }
    ensuredMetaDescription.setAttribute('content', description);

    return () => {
      document.title = previousTitle;

      const currentMetaRobots = document.querySelector('meta[name="robots"]');
      if (currentMetaRobots) {
        if (hadMetaRobots) {
          currentMetaRobots.setAttribute('content', previousRobots);
        } else {
          currentMetaRobots.remove();
        }
      }

      const currentMetaDescription = document.querySelector('meta[name="description"]');
      if (currentMetaDescription) {
        if (hadMetaDescription) {
          currentMetaDescription.setAttribute('content', previousDescription);
        } else {
          currentMetaDescription.remove();
        }
      }
    };
  }, [description, title]);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur sm:p-10">
        <div className="inline-flex w-fit rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
          {badge}
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {heading}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            {body}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-100">
          {footnote}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => navigate(primaryHref)}
            className="bg-cyan-400 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            {primaryLabel}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(secondaryHref)}
            className="border-white/15 text-white hover:bg-white/10"
          >
            {secondaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoindexRouteNotice;
