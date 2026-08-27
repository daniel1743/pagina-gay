/**
 * Servicio de subida de fotos de perfil con Supabase Storage.
 *
 * En el modo actual, las cuentas nuevas y sus archivos pasan por Supabase.
 * Firebase/Cloudinary no son un fallback de escritura para perfiles nuevos.
 */

import imageCompression from 'browser-image-compression';
import { isSupabaseAuthEnabled } from '@/config/supabase';
import { uploadProfilePhotoToSupabase } from '@/services/supabaseMediaService';

export const PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const PROFILE_IMAGE_MAX_INPUT_BYTES = 10 * 1024 * 1024;
export const PROFILE_IMAGE_TARGET_MAX_KB = 80;

/** Comprime la imagen para un avatar liviano y compatible con Supabase Storage. */
export const compressImage = async (file, maxSizeKB = PROFILE_IMAGE_TARGET_MAX_KB) => {
  try {
    const options = {
      maxSizeMB: maxSizeKB / 1024,
      maxWidthOrHeight: 400,
      useWebWorker: false,
      initialQuality: 0.7,
      maxIteration: 15,
      alwaysKeepResolution: false,
      fileType: file.type,
    };

    const compressedFile = await imageCompression(file, options);
    if (compressedFile.size > maxSizeKB * 1024) {
      throw new Error(`La imagen no pudo comprimirse por debajo de ${maxSizeKB} KB.`);
    }

    return compressedFile;
  } catch (error) {
    console.error('[UPLOAD] Error comprimiendo imagen:', error);
    throw new Error('No se pudo comprimir la imagen. Prueba con JPG, PNG o WEBP.');
  }
};

/**
 * Sube una foto de perfil. Nunca fabrica IDs temporales ni permite uploads
 * asociados a invitados o a un UID diferente del usuario autenticado.
 */
export const uploadProfilePhoto = async (file, userId = null) => {
  if (!isSupabaseAuthEnabled()) {
    throw new Error('SUPABASE_REQUIRED_FOR_PROFILE_PHOTOS');
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    const uploaded = await uploadProfilePhotoToSupabase(file, userId);
    const publicUrl = String(uploaded?.url || '').trim();
    if (!publicUrl.startsWith('https://')) {
      throw new Error('Supabase no devolvió una URL segura para la foto.');
    }
    return publicUrl;
  } catch (error) {
    if (error?.message === 'NOT_AUTHENTICATED' || error?.code === '401') {
      throw new Error('Debes iniciar sesión para subir una foto de perfil.');
    }
    throw error;
  }
};

/** La eliminación de archivos requiere una operación autenticada y validada. */
export const deleteProfilePhoto = async () => {
  // La eliminación de recursos antiguos requiere una operación administrativa.
  return { supported: false };
};

/** Valida el archivo antes de abrir compresión o red. */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo.' };
  }

  if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG o WEBP.' };
  }

  if (!Number.isFinite(file.size) || file.size > PROFILE_IMAGE_MAX_INPUT_BYTES) {
    return { valid: false, error: 'La imagen es demasiado grande. El tamaño máximo es 10 MB.' };
  }

  return { valid: true };
};
