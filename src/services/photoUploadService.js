/**
 * SERVICIO DE SUBIDA DE FOTOS - CLOUDINARY
 *
 * Migrado de Supabase Storage (DNS roto) a Cloudinary
 * Comprime imagenes a 60-90 KB y las sube via Cloudinary API
 * Usa la misma config que TarjetaEditor (cloud_name + preset)
 */

import imageCompression from 'browser-image-compression';

const CLOUDINARY_CLOUD_NAME = 'dw9xypbzs';
const CLOUDINARY_UPLOAD_PRESET = 'tarjetas_baul';

/**
 * Comprime imagen a ~80 KB para avatares
 */
export const compressImage = async (file, maxSizeKB = 80) => {
  try {
    const fileSizeMB = file.size / (1024 * 1024);

    const options = {
      maxSizeMB: maxSizeKB / 1024,
      maxWidthOrHeight: 400,
      useWebWorker: false,
      fileType: file.type,
      initialQuality: 0.7,
      maxIteration: 15,
      alwaysKeepResolution: false,
    };

    const compressedFile = await imageCompression(file, options);
    const finalSizeKB = compressedFile.size / 1024;

    console.log(`[COMPRESS] Original: ${fileSizeMB.toFixed(2)} MB → Comprimido: ${finalSizeKB.toFixed(2)} KB`);

    return compressedFile;
  } catch (error) {
    console.error('[COMPRESS] Error comprimiendo imagen:', error);
    throw new Error('No se pudo comprimir la imagen. Por favor, intenta con otra imagen.');
  }
};

/**
 * Sube una foto de perfil a Cloudinary
 * @param {File} file - Archivo de imagen a subir
 * @param {string} userId - ID del usuario
 * @returns {Promise<string>} - URL publica de la imagen
 */
export const uploadProfilePhoto = async (file, userId = null) => {
  try {
    // Obtener userId de Firebase Auth si no se proporciona
    let currentUserId = userId;

    if (!currentUserId) {
      try {
        const { auth } = await import('@/config/firebase');
        currentUserId = auth.currentUser?.uid;
      } catch (error) {
        console.warn('[UPLOAD] Firebase Auth no disponible:', error.message);
      }
    }

    if (!currentUserId) {
      currentUserId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.warn('[UPLOAD] Usuario sin auth, usando ID temporal:', currentUserId);
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no valido. Solo se permiten imagenes JPG, PNG o WEBP.');
    }

    // Validar tamano inicial (maximo 10 MB antes de comprimir)
    const maxSizeMB = 10;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      throw new Error(`La imagen es demasiado grande. El tamano maximo es ${maxSizeMB} MB.`);
    }

    // Comprimir imagen
    const compressedFile = await compressImage(file, 80);

    // Subir a Cloudinary
    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', `profile-photos/${currentUserId}`);

    const uploadPromise = fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    const uploadTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout subiendo foto')), 30000)
    );

    const response = await Promise.race([uploadPromise, uploadTimeout]);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[UPLOAD] Error de Cloudinary:', errorData);
      throw new Error(errorData.error?.message || 'Error subiendo foto a Cloudinary');
    }

    const cloudinaryData = await response.json();
    const publicUrl = cloudinaryData.secure_url;

    console.log('[UPLOAD] Foto subida exitosamente:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('[UPLOAD] Error subiendo foto de perfil:', error);
    throw error;
  }
};

/**
 * Elimina una foto de perfil (Cloudinary no requiere eliminacion manual con preset unsigned)
 * Las fotos antiguas de Supabase ya no se pueden eliminar (DNS roto)
 */
export const deleteProfilePhoto = async (photoURL) => {
  // Cloudinary con unsigned preset no permite eliminacion desde el cliente
  // Las fotos se gestionan desde el dashboard de Cloudinary si es necesario
  console.log('[DELETE] Eliminacion de foto no soportada desde cliente Cloudinary');
};

/**
 * Valida si un archivo es una imagen valida
 */
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSizeMB = 10;

  if (!file) {
    return { valid: false, error: 'No se selecciono ningun archivo.' };
  }

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no valido. Solo se permiten imagenes JPG, PNG o WEBP.' };
  }

  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return { valid: false, error: `La imagen es demasiado grande. El tamano maximo es ${maxSizeMB} MB.` };
  }

  return { valid: true };
};
