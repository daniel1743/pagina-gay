/**
 * Servicio de subida de fotos de perfil a Cloudinary.
 *
 * La foto de perfil no usa Supabase ni Firebase Storage en este proyecto:
 * Cloudinary guarda el archivo y Firestore conserva la URL en users/{uid}.
 */

import imageCompression from 'browser-image-compression';
import { auth } from '@/config/firebase';
import { isSupabaseAuthEnabled } from '@/config/supabase';
import { uploadProfilePhotoToSupabase } from '@/services/supabaseMediaService';

const CLOUDINARY_CLOUD_NAME = 'dw9xypbzs';
const CLOUDINARY_UPLOAD_PRESET = 'tarjetas_baul';

export const PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const PROFILE_IMAGE_MAX_INPUT_BYTES = 10 * 1024 * 1024;
export const PROFILE_IMAGE_TARGET_MAX_KB = 80;

/** Comprime la imagen para un avatar liviano y compatible con Cloudinary. */
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

const getAuthenticatedUserId = (requestedUserId = null) => {
  const authenticatedUserId = String(auth.currentUser?.uid || '').trim();
  const explicitUserId = String(requestedUserId || '').trim();

  if (!authenticatedUserId) {
    throw new Error('Debes iniciar sesión para subir una foto de perfil.');
  }

  if (explicitUserId && explicitUserId !== authenticatedUserId) {
    throw new Error('No puedes subir una foto para otro perfil.');
  }

  return authenticatedUserId;
};

/**
 * Sube una foto de perfil. Nunca fabrica IDs temporales ni permite uploads
 * asociados a invitados o a un UID diferente del usuario autenticado.
 */
export const uploadProfilePhoto = async (file, userId = null) => {
  if (isSupabaseAuthEnabled()) {
    const uploaded = await uploadProfilePhotoToSupabase(file, userId);
    return uploaded.url;
  }
  const currentUserId = getAuthenticatedUserId(userId);

  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const compressedFile = await compressImage(file, PROFILE_IMAGE_TARGET_MAX_KB);
  const formData = new FormData();
  formData.append('file', compressedFile);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', `profile-photos/${currentUserId}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData, signal: controller.signal }
    );

    const responseData = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(responseData.error?.message || 'Error subiendo foto a Cloudinary.');
    }

    const publicUrl = String(responseData.secure_url || '').trim();
    if (!publicUrl.startsWith('https://')) {
      throw new Error('Cloudinary no devolvió una URL segura para la foto.');
    }

    return publicUrl;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('La subida tardó demasiado. Revisa tu conexión e inténtalo de nuevo.');
    }
    console.error('[UPLOAD] Error subiendo foto de perfil:', error);
    throw error instanceof Error ? error : new Error('No se pudo subir la foto de perfil.');
  } finally {
    clearTimeout(timeoutId);
  }
};

/** Cloudinary unsigned no permite eliminar desde el cliente de forma segura. */
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
