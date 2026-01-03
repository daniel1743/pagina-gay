/**
 * 🔥 HELPER PARA AGREGAR LOGGING COMPLETO A LANDING PAGES
 * Usa este helper para agregar logs detallados a cualquier landing page
 */

export const addLandingPageLogs = (pageName, componentRef, heroRef, logger, modelImages, currentImageIndex, imageLoadStatus) => {
  // Log de renderizado
  console.log(`🎨 [${pageName}] Iniciando renderizado JSX`);
  console.log(`📊 [${pageName}] Estado actual:`, {
    currentImageIndex,
    imageLoadStatus,
    totalRenders: logger?.renderCount || 0,
  });

  // Helper para logs de imágenes
  const logImageEvent = (event, img, src) => {
    if (event === 'load') {
      logger?.logImageLoad(src, 'loaded', {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayed: img.complete,
        visible: img.offsetWidth > 0 && img.offsetHeight > 0,
        src: img.src,
      });
      console.log(`✅ [${pageName}] Imagen renderizada:`, {
        src,
        dimensions: { width: img.naturalWidth, height: img.naturalHeight },
        visible: img.offsetWidth > 0 && img.offsetHeight > 0,
      });
    } else if (event === 'error') {
      const errorDetails = {
        src,
        encodedSrc: encodeURI(src),
        targetSrc: img.src,
      };
      logger?.logImageLoad(src, 'error', errorDetails);
      console.error(`❌ [${pageName}] Error cargando imagen:`, errorDetails);
    }
  };

  // Helper para logs de animación
  const logAnimationEvent = (event) => {
    if (event === 'start') {
      console.log(`🎬 [${pageName}] Animación de entrada iniciada`);
    } else if (event === 'complete') {
      console.log(`✅ [${pageName}] Animación de entrada completada`);
      if (heroRef?.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const styles = window.getComputedStyle(heroRef.current);
        console.log(`📐 [${pageName}] Hero después de animación:`, {
          dimensions: { width: rect.width, height: rect.height },
          position: { top: rect.top, left: rect.left },
          styles: {
            opacity: styles.opacity,
            backgroundColor: styles.backgroundColor,
            zIndex: styles.zIndex,
            marginTop: styles.marginTop,
          },
        });
      }
    }
  };

  return { logImageEvent, logAnimationEvent };
};

