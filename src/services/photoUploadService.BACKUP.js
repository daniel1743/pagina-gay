import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/config/firebase';
import { auth } from '@/config/firebase';
import imageCompression from 'browser-image-compression';

/**
 * Comprime una imagen a un tamaño máximo de 50-80 KB
 * @param {File} file - Archivo de imagen a comprimir
 * @param {number} maxSizeKB - Tamaño máximo en KB (default: 80)
 * @returns {Promise<File>} - Archivo comprimido
 */
export const compressImage = async (file, maxSizeKB = 80) => {
  try {
    // Intentar múltiples niveles de compresión hasta alcanzar el tamaño objetivo
    const compressionLevels = [
      { maxSizeMB: maxSizeKB / 1024, maxWidthOrHeight: 800 },
      { maxSizeMB: maxSizeKB / 1024, maxWidthOrHeight: 600 },
      { maxSizeMB: maxSizeKB / 1024, maxWidthOrHeight: 500 },
      { maxSizeMB: maxSizeKB / 1024, maxWidthOrHeight: 400 },
    ];

    let lastCompressedFile = file;

    for (const level of compressionLevels) {
      const options = {
        maxSizeMB: level.maxSizeMB,
        maxWidthOrHeight: level.maxWidthOrHeight,
        useWebWorker: true,
        fileType: file.type,
      };

      lastCompressedFile = await imageCompression(file, options);
      const fileSizeKB = lastCompressedFile.size / 1024;

      // Si el archivo está dentro del rango objetivo (50-80 KB), retornarlo
      if (fileSizeKB <= maxSizeKB) {
        return lastCompressedFile;
      }
    }

    // Si después de todos los intentos aún es muy grande, retornar el último resultado
    // (aunque sea un poco más grande que el objetivo)
    const finalSizeKB = lastCompressedFile.size / 1024;
    if (finalSizeKB > maxSizeKB * 1.2) {
      console.warn(`Imagen comprimida a ${finalSizeKB.toFixed(2)} KB, objetivo era ${maxSizeKB} KB`);
    }

    return lastCompressedFile;
  } catch (error) {
    console.error('Error comprimiendo imagen:', error);
    throw new Error('No se pudo comprimir la imagen. Por favor, intenta con otra imagen.');
  }
};

/**
 * Sube una foto de perfil a Firebase Storage
 * @param {File} file - Archivo de imagen a subir
 * @param {string} userId - ID del usuario (opcional, usa auth.currentUser si no se provee)
 * @returns {Promise<string>} - URL de descarga de la imagen
 */
export const uploadProfilePhoto = async (file, userId = null) => {
  try {
    const currentUserId = userId || auth.currentUser?.uid;
    
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG o WEBP.');
    }

    // Validar tamaño inicial (máximo 10 MB antes de comprimir)
    const maxSizeMB = 10;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      throw new Error(`La imagen es demasiado grande. El tamaño máximo es ${maxSizeMB} MB.`);
    }

    // Comprimir imagen a 50-80 KB
    const compressedFile = await compressImage(file, 80);
    
    // Crear referencia en Storage
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `profile_photos/${currentUserId}/${timestamp}.${fileExtension}`;
    const storageRef = ref(storage, fileName);

    // Subir archivo comprimido
    await uploadBytes(storageRef, compressedFile, {
      contentType: compressedFile.type,
      cacheControl: 'public, max-age=31536000', // Cache por 1 año
    });

    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error subiendo foto de perfil:', error);
    throw error;
  }
};

/**
 * Elimina una foto de perfil de Firebase Storage
 * @param {string} photoURL - URL de la foto a eliminar
 * @returns {Promise<void>}
 */
export const deleteProfilePhoto = async (photoURL) => {
  try {
    if (!photoURL || !photoURL.includes('profile_photos')) {
      return; // No es una foto de perfil subida, no hacer nada
    }

    // Extraer la ruta del Storage desde la URL
    const urlParts = photoURL.split('/');
    const pathIndex = urlParts.findIndex(part => part === 'profile_photos');
    if (pathIndex === -1) return;

    const path = urlParts.slice(pathIndex).join('/');
    const storageRef = ref(storage, decodeURIComponent(path));

    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error eliminando foto de perfil:', error);
    // No lanzar error, solo loguear (puede que el archivo ya no exista)
  }
};

/**
 * Valida si un archivo es una imagen válida
 * @param {File} file - Archivo a validar
 * @returns {object} - { valid: boolean, error?: string }
 */
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSizeMB = 10;

  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo.' };
  }

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG o WEBP.' };
  }

  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return { valid: false, error: `La imagen es demasiado grande. El tamaño máximo es ${maxSizeMB} MB.` };
  }

  return { valid: true };
};

