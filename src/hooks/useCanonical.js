import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook para manejar el canonical tag dinámicamente
 * @param {string} customPath - Ruta personalizada (opcional, usa location.pathname por defecto)
 */
export const useCanonical = (customPath = null) => {
  const location = useLocation();
  const baseUrl = 'https://chactivo.com';

  useEffect(() => {
    // Usar customPath si se proporciona, sino usar location.pathname
    const path = customPath || location.pathname;

    // Construir URL completa
    const fullUrl = `${baseUrl}${path === '/' ? '' : path}`;

    // Buscar canonical existente
    let canonicalLink = document.querySelector('link[rel="canonical"]');

    // Si no existe, crearlo
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }

    // Actualizar href
    canonicalLink.setAttribute('href', fullUrl);

    // Cleanup: No remover el elemento, solo actualizar
    return () => {
      // El canonical se mantiene para evitar parpadeos
    };
  }, [location.pathname, customPath, baseUrl]);
};

/**
 * Hook para actualizar title y description dinámicamente
 * @param {string} title - Título de la página
 * @param {string} description - Descripción de la página (opcional)
 */
export const usePageMeta = (title, description = null) => {
  useEffect(() => {
    // Actualizar título
    if (title) {
      document.title = title;
    }

    // Actualizar description si se proporciona
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);
    }

    return () => {
      // Mantener meta tags
    };
  }, [title, description]);
};

/**
 * Hook combinado para manejar SEO completo (canonical + meta tags)
 * @param {Object} options - Opciones de SEO
 * @param {string} options.title - Título de la página
 * @param {string} options.description - Descripción de la página
 * @param {string} options.canonical - URL canónica personalizada (opcional)
 */
export const useSEO = ({ title, description, canonical = null }) => {
  useCanonical(canonical);
  usePageMeta(title, description);
};

export default useCanonical;
