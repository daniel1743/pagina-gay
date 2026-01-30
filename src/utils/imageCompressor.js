/**
 * 🖼️ COMPRESOR DE IMÁGENES CLIENT-SIDE
 *
 * Optimiza imágenes antes de subir a Firebase Storage
 * Reduce costos de almacenamiento y mejora velocidad de carga
 *
 * Tamaños objetivo:
 * - Tarjeta: 320x320 WebP → ~25KB
 * - Avatar:  128x128 WebP → ~8KB
 * - Perfil:  800x800 WebP → ~80KB
 */

/**
 * Configuración de tamaños
 */
export const IMAGE_SIZES = {
  tarjeta: {
    width: 320,
    height: 320,
    quality: 0.8,
    maxSizeKB: 40
  },
  avatar: {
    width: 128,
    height: 128,
    quality: 0.75,
    maxSizeKB: 15
  },
  perfil: {
    width: 800,
    height: 800,
    quality: 0.85,
    maxSizeKB: 150
  }
};

/**
 * Verificar soporte de WebP
 */
const supportsWebP = () => {
  try {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch (e) {
    return false;
  }
};

/**
 * Cargar imagen desde File o URL
 */
const loadImage = (source) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => resolve(img);
    img.onerror = (error) => reject(new Error('Error cargando imagen'));

    if (source instanceof File) {
      img.src = URL.createObjectURL(source);
    } else if (typeof source === 'string') {
      img.src = source;
    } else {
      reject(new Error('Fuente de imagen no válida'));
    }
  });
};

/**
 * Calcular dimensiones manteniendo aspect ratio (crop cuadrado desde centro)
 */
const calculateCropDimensions = (imgWidth, imgHeight, targetSize) => {
  // Encontrar el lado más pequeño para hacer crop cuadrado
  const minSide = Math.min(imgWidth, imgHeight);

  // Calcular offset para centrar el crop
  const offsetX = (imgWidth - minSide) / 2;
  const offsetY = (imgHeight - minSide) / 2;

  return {
    sourceX: offsetX,
    sourceY: offsetY,
    sourceWidth: minSide,
    sourceHeight: minSide,
    targetWidth: targetSize,
    targetHeight: targetSize
  };
};

/**
 * Comprimir imagen a un tamaño específico
 * @param {File|String} source - Archivo de imagen o URL
 * @param {String} sizeType - 'tarjeta', 'avatar', o 'perfil'
 * @returns {Promise<{blob: Blob, dataUrl: string, width: number, height: number, sizeKB: number}>}
 */
export const compressImage = async (source, sizeType = 'tarjeta') => {
  const config = IMAGE_SIZES[sizeType];
  if (!config) {
    throw new Error(`Tipo de tamaño no válido: ${sizeType}`);
  }

  try {
    // Cargar imagen
    const img = await loadImage(source);

    // Calcular dimensiones de crop
    const dims = calculateCropDimensions(img.width, img.height, config.width);

    // Crear canvas
    const canvas = document.createElement('canvas');
    canvas.width = config.width;
    canvas.height = config.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo obtener contexto 2D');
    }

    // Habilitar suavizado para mejor calidad
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Dibujar imagen con crop centrado
    ctx.drawImage(
      img,
      dims.sourceX, dims.sourceY, dims.sourceWidth, dims.sourceHeight,
      0, 0, dims.targetWidth, dims.targetHeight
    );

    // Determinar formato (WebP si está soportado, JPEG como fallback)
    const useWebP = supportsWebP();
    const mimeType = useWebP ? 'image/webp' : 'image/jpeg';

    // Convertir a blob con compresión
    let quality = config.quality;
    let blob = null;
    let attempts = 0;
    const maxAttempts = 5;

    // Iterar reduciendo calidad hasta alcanzar tamaño objetivo
    while (attempts < maxAttempts) {
      blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, mimeType, quality);
      });

      if (!blob) {
        throw new Error('Error generando blob de imagen');
      }

      const sizeKB = blob.size / 1024;

      if (sizeKB <= config.maxSizeKB || quality <= 0.3) {
        break;
      }

      // Reducir calidad para siguiente intento
      quality -= 0.1;
      attempts++;
    }

    // Generar data URL para preview
    const dataUrl = canvas.toDataURL(mimeType, quality);

    // Limpiar URL de objeto si se creó
    if (source instanceof File) {
      URL.revokeObjectURL(img.src);
    }

    return {
      blob,
      dataUrl,
      width: config.width,
      height: config.height,
      sizeKB: Math.round(blob.size / 1024 * 10) / 10,
      mimeType,
      quality
    };
  } catch (error) {
    console.error('[IMAGE COMPRESSOR] Error:', error);
    throw error;
  }
};

/**
 * Comprimir imagen para todos los tamaños necesarios
 * @param {File|String} source - Archivo de imagen o URL
 * @returns {Promise<{tarjeta: Object, avatar: Object, perfil: Object}>}
 */
export const compressAllSizes = async (source) => {
  try {
    const [tarjeta, avatar, perfil] = await Promise.all([
      compressImage(source, 'tarjeta'),
      compressImage(source, 'avatar'),
      compressImage(source, 'perfil')
    ]);

    console.log('[IMAGE COMPRESSOR] Compresión completada:', {
      tarjeta: `${tarjeta.sizeKB}KB`,
      avatar: `${avatar.sizeKB}KB`,
      perfil: `${perfil.sizeKB}KB`,
      total: `${(tarjeta.sizeKB + avatar.sizeKB + perfil.sizeKB).toFixed(1)}KB`
    });

    return { tarjeta, avatar, perfil };
  } catch (error) {
    console.error('[IMAGE COMPRESSOR] Error en compresión múltiple:', error);
    throw error;
  }
};

/**
 * Validar imagen antes de procesar
 * @param {File} file - Archivo de imagen
 * @returns {{valid: boolean, error?: string}}
 */
export const validateImage = (file) => {
  // Verificar que sea un archivo
  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'No se proporcionó un archivo válido' };
  }

  // Verificar tipo de archivo
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato no soportado. Usa JPG, PNG, WebP o GIF'
    };
  }

  // Verificar tamaño máximo (10MB)
  const maxSizeMB = 10;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `La imagen es muy grande. Máximo ${maxSizeMB}MB`
    };
  }

  return { valid: true };
};

/**
 * Crear preview rápido sin compresión completa
 * @param {File} file - Archivo de imagen
 * @returns {Promise<string>} Data URL del preview
 */
export const createQuickPreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * Redimensionar imagen manteniendo aspect ratio (sin crop)
 * @param {File|String} source - Archivo o URL
 * @param {number} maxWidth - Ancho máximo
 * @param {number} maxHeight - Alto máximo
 * @returns {Promise<{blob: Blob, dataUrl: string, width: number, height: number}>}
 */
export const resizeImage = async (source, maxWidth, maxHeight, quality = 0.85) => {
  try {
    const img = await loadImage(source);

    // Calcular nuevas dimensiones manteniendo aspect ratio
    let { width, height } = img;
    const ratio = Math.min(maxWidth / width, maxHeight / height);

    if (ratio < 1) {
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Crear canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, 0, 0, width, height);

    const mimeType = supportsWebP() ? 'image/webp' : 'image/jpeg';
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, mimeType, quality);
    });

    const dataUrl = canvas.toDataURL(mimeType, quality);

    if (source instanceof File) {
      URL.revokeObjectURL(img.src);
    }

    return {
      blob,
      dataUrl,
      width,
      height,
      sizeKB: Math.round(blob.size / 1024 * 10) / 10
    };
  } catch (error) {
    console.error('[IMAGE COMPRESSOR] Error en resize:', error);
    throw error;
  }
};

export default {
  compressImage,
  compressAllSizes,
  validateImage,
  createQuickPreview,
  resizeImage,
  IMAGE_SIZES
};
