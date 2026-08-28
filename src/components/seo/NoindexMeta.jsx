import { useEffect } from 'react';
import { useCanonical } from '@/hooks/useCanonical';

/**
 * Metadatos para contenido generado por usuarios o rutas privadas.
 * La vista se mantiene operativa para la comunidad, pero no se ofrece
 * como destino indexable porque su contenido cambia y puede contener PII.
 */
const NoindexMeta = ({ children, canonicalPath = null }) => {
  const canonical = canonicalPath || (typeof window !== 'undefined' ? window.location.pathname : '/');
  useCanonical(canonical);

  useEffect(() => {
    const previousTitle = document.title;
    const robots = document.querySelector('meta[name="robots"]') || document.createElement('meta');
    const wasAttached = robots.isConnected;
    const previousContent = robots.getAttribute('content');

    robots.setAttribute('name', 'robots');
    robots.setAttribute('content', 'noindex, nofollow, noarchive');
    if (!wasAttached) document.head.appendChild(robots);

    return () => {
      document.title = previousTitle;
      if (robots.isConnected) {
        if (wasAttached && previousContent !== null) robots.setAttribute('content', previousContent);
        else robots.remove();
      }
    };
  }, []);

  return children;
};

export default NoindexMeta;
