import { useEffect, useRef } from 'react';

/**
 * 🔥 SISTEMA DE LOGGING PROFESIONAL PARA LANDING PAGES INTERNACIONALES
 * Captura ABSOLUTAMENTE TODO: carga, renderizado, errores, loops, estilos, DOM, etc.
 */
export const useLandingPageLogger = (pageName, componentRef) => {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(Date.now());
  const lastRenderTimeRef = useRef(Date.now());
  const effectRunsRef = useRef({});
  const stateChangesRef = useRef([]);
  const errorLogRef = useRef([]);
  const domChecksRef = useRef([]);

  // 🎯 LOG INICIAL - Cuando el componente se monta
  useEffect(() => {
    const mountTime = Date.now();
    mountTimeRef.current = mountTime;
    renderCountRef.current = 0;

    console.group(`🔥🔥🔥 [${pageName.toUpperCase()}] INICIO DE CARGA - ${new Date().toISOString()}`);
    console.log('📊 [INFORMACIÓN INICIAL]', {
      pageName,
      mountTime: new Date(mountTime).toISOString(),
      url: window.location.href,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height,
      },
    });
    console.groupEnd();

    // 🔍 Verificar si el componente está en el DOM
    const checkDOM = () => {
      if (componentRef?.current) {
        const rect = componentRef.current.getBoundingClientRect();
        const styles = window.getComputedStyle(componentRef.current);
        
        console.log(`✅ [DOM CHECK] Componente en DOM:`, {
          exists: !!componentRef.current,
          visible: rect.width > 0 && rect.height > 0,
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
          styles: {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            zIndex: styles.zIndex,
            position: styles.position,
            backgroundColor: styles.backgroundColor,
            backgroundImage: styles.backgroundImage,
            marginTop: styles.marginTop,
            marginBottom: styles.marginBottom,
            paddingTop: styles.paddingTop,
            paddingBottom: styles.paddingBottom,
          },
          overflow: {
            overflow: styles.overflow,
            overflowX: styles.overflowX,
            overflowY: styles.overflowY,
          },
        });
      } else {
        console.warn(`⚠️ [DOM CHECK] Componente NO está en el DOM aún`);
      }
    };

    // Verificar múltiples veces
    const timeouts = [
      setTimeout(checkDOM, 100),
      setTimeout(checkDOM, 500),
      setTimeout(checkDOM, 1000),
      setTimeout(checkDOM, 2000),
      setTimeout(checkDOM, 3000),
    ];

    return () => {
      timeouts.forEach(clearTimeout);
      console.log(`🧹 [${pageName.toUpperCase()}] Limpiando logger`);
    };
  }, [pageName, componentRef]);

  // 🔄 DETECTOR DE LOOPS INFINITOS - Rastrear renders
  useEffect(() => {
    renderCountRef.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    lastRenderTimeRef.current = now;

    // Detectar renders muy rápidos (posible loop)
    if (timeSinceLastRender < 50 && renderCountRef.current > 5) {
      console.error(`🚨 [${pageName.toUpperCase()}] ⚠️ POSIBLE LOOP INFINITO DETECTADO!`, {
        renderCount: renderCountRef.current,
        timeSinceLastRender: `${timeSinceLastRender}ms`,
        warning: 'Renders muy rápidos detectados - posible loop infinito',
      });
    }

    console.log(`🔄 [${pageName.toUpperCase()}] RENDER #${renderCountRef.current}`, {
      renderNumber: renderCountRef.current,
      timeSinceLastRender: `${timeSinceLastRender}ms`,
      timeSinceMount: `${now - mountTimeRef.current}ms`,
      timestamp: new Date().toISOString(),
    });
  });

  // 🎨 DETECTOR DE ESTILOS Y OVERLAYS
  useEffect(() => {
    const checkStyles = () => {
      if (!componentRef?.current) return;

      const element = componentRef.current;
      const styles = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      // Detectar si está oscuro
      const bgColor = styles.backgroundColor;
      const isDark = 
        bgColor.includes('rgb(0, 0, 0)') ||
        bgColor.includes('rgba(0, 0, 0') ||
        bgColor.includes('rgb(19, 19, 19)') ||
        bgColor.includes('rgb(26, 26, 26)');

      // Detectar si está oculto
      const isHidden = 
        styles.display === 'none' ||
        styles.visibility === 'hidden' ||
        parseFloat(styles.opacity) === 0 ||
        rect.width === 0 ||
        rect.height === 0;

      const diagnostic = {
        visible: !isHidden && rect.width > 0 && rect.height > 0,
        isDark,
        isHidden,
        dimensions: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
        },
        styles: {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          zIndex: styles.zIndex,
          position: styles.position,
          backgroundColor: bgColor,
          backgroundImage: styles.backgroundImage,
          color: styles.color,
          marginTop: styles.marginTop,
          marginBottom: styles.marginBottom,
          paddingTop: styles.paddingTop,
          paddingBottom: styles.paddingBottom,
        },
        computed: {
          offsetWidth: element.offsetWidth,
          offsetHeight: element.offsetHeight,
          scrollWidth: element.scrollWidth,
          scrollHeight: element.scrollHeight,
          clientWidth: element.clientWidth,
          clientHeight: element.clientHeight,
        },
      };

      if (isDark || isHidden) {
        console.error(`❌ [${pageName.toUpperCase()}] PROBLEMA VISUAL DETECTADO:`, {
          ...diagnostic,
          problema: isDark ? 'Fondo oscuro detectado' : 'Elemento oculto',
          recomendacion: isDark 
            ? 'Verificar estilos de fondo y overlays'
            : 'Verificar display, visibility, opacity o dimensiones',
        });
      } else {
        console.log(`✅ [${pageName.toUpperCase()}] Estilos correctos:`, diagnostic);
      }

      domChecksRef.current.push({
        timestamp: Date.now(),
        diagnostic,
      });
    };

    const timeouts = [
      setTimeout(checkStyles, 100),
      setTimeout(checkStyles, 500),
      setTimeout(checkStyles, 1000),
      setTimeout(checkStyles, 2000),
    ];

    return () => timeouts.forEach(clearTimeout);
  }, [pageName, componentRef]);

  // 📸 DETECTOR DE CARGA DE IMÁGENES
  const logImageLoad = (imageSrc, status, details = {}) => {
    console.log(`🖼️ [${pageName.toUpperCase()}] Imagen: ${status}`, {
      src: imageSrc,
      status,
      ...details,
      timestamp: new Date().toISOString(),
    });

    if (status === 'error') {
      errorLogRef.current.push({
        type: 'image_load_error',
        src: imageSrc,
        timestamp: Date.now(),
        details,
      });
    }
  };

  // 🎯 LOG DE ESTADO
  const logStateChange = (stateName, oldValue, newValue) => {
    const change = {
      stateName,
      oldValue,
      newValue,
      timestamp: Date.now(),
    };

    stateChangesRef.current.push(change);

    console.log(`📊 [${pageName.toUpperCase()}] Cambio de estado:`, change);
  };

  // 🎯 LOG DE EFECTOS
  const logEffect = (effectName, dependencies = []) => {
    const runCount = (effectRunsRef.current[effectName] || 0) + 1;
    effectRunsRef.current[effectName] = runCount;

    console.log(`⚡ [${pageName.toUpperCase()}] Effect ejecutado:`, {
      effectName,
      runCount,
      dependencies,
      timestamp: new Date().toISOString(),
    });

    // Detectar efectos que se ejecutan demasiado
    if (runCount > 10) {
      console.warn(`⚠️ [${pageName.toUpperCase()}] Effect "${effectName}" ejecutado ${runCount} veces - posible dependencia incorrecta`);
    }
  };

  // 🚨 CAPTURADOR DE ERRORES
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      errorLogRef.current.push({
        type: 'console_error',
        message: args.join(' '),
        timestamp: Date.now(),
        stack: new Error().stack,
      });
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      if (args.some(arg => typeof arg === 'string' && arg.includes(pageName))) {
        errorLogRef.current.push({
          type: 'console_warn',
          message: args.join(' '),
          timestamp: Date.now(),
        });
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [pageName]);

  // 📋 REPORTE FINAL
  const generateReport = () => {
    const report = {
      pageName,
      mountTime: mountTimeRef.current,
      totalRenders: renderCountRef.current,
      totalTime: Date.now() - mountTimeRef.current,
      stateChanges: stateChangesRef.current.length,
      effectRuns: effectRunsRef.current,
      errors: errorLogRef.current,
      domChecks: domChecksRef.current.length,
      lastDomCheck: domChecksRef.current[domChecksRef.current.length - 1],
    };

    console.group(`📋 [${pageName.toUpperCase()}] REPORTE FINAL`);
    console.table(report);
    console.log('📊 Estado completo:', report);
    console.groupEnd();

    return report;
  };

  return {
    logImageLoad,
    logStateChange,
    logEffect,
    generateReport,
    renderCount: renderCountRef.current,
    errors: errorLogRef.current,
  };
};

