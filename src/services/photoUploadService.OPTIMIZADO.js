import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/config/firebase';
import { auth } from '@/config/firebase';
import imageCompression from 'browser-image-compression';

/**
 * 🚀 VERSIÓN OPTIMIZADA: Comprime una imagen en UNA SOLA PASADA
 * Reduce tiempo de 10+ segundos a 2-3 segundos
 *
 * @param {File} file - Archivo de imagen a comprimir
 * @param {number} maxSizeKB - Tamaño máximo en KB (default: 150)
 * @returns {Promise<File>} - Archivo comprimido
 */
export const compressImage = async (file, maxSizeKB = 150) => {
  try {
    console.time('⏱️ [COMPRESS] Tiempo total de compresión');

    // Calcular dimensiones óptimas basadas en el tamaño del archivo
    const fileSizeMB = file.size / (1024 * 1024);
    let maxWidthOrHeight;

    if (fileSizeMB > 5) {
      maxWidthOrHeight = 600; // Fotos grandes: reducir agresivamente
    } else if (fileSizeMB > 2) {
      maxWidthOrHeight = 800;
    } else if (fileSizeMB > 1) {
      maxWidthOrHeight = 1000;
    } else {
      maxWidthOrHeight = 1200; // Fotos pequeñas: mantener más calidad
    }

    // ✅ UNA SOLA COMPRESIÓN con configuración óptima
    const options = {
      maxSizeMB: maxSizeKB / 1024,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: file.type,
      initialQuality: 0.85, // Calidad inicial alta
      alwaysKeepResolution: false,
    };

    const compressedFile = await imageCompression(file, options);
    const finalSizeKB = compressedFile.size / 1024;

    console.log(`✅ [COMPRESS] Original: ${fileSizeMB.toFixed(2)} MB → Comprimido: ${finalSizeKB.toFixed(2)} KB`);
    console.timeEnd('⏱️ [COMPRESS] Tiempo total de compresión');

    // ⚠️ Si aún es muy grande (>200 KB), hacer segunda compresión más agresiva
    if (finalSizeKB > 200) {
      console.log('⚠️ [COMPRESS] Archivo aún grande, aplicando compresión extra...');
      const extraOptions = {
        maxSizeMB: 0.15, // 150 KB
        maxWidthOrHeight: 500,
        useWebWorker: true,
        fileType: file.type,
        initialQuality: 0.75,
      };
      const secondCompression = await imageCompression(compressedFile, extraOptions);
      const secondSizeKB = secondCompression.size / 1024;
      console.log(`✅ [COMPRESS] Segunda compresión: ${secondSizeKB.toFixed(2)} KB`);
      return secondCompression;
    }

    return compressedFile;
  } catch (error) {
    console.error('❌ [COMPRESS] Error comprimiendo imagen:', error);
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
    console.time('⏱️ [UPLOAD] Tiempo total de subida');

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

    console.log(`📤 [UPLOAD] Iniciando subida de ${file.name} (${fileSizeMB.toFixed(2)} MB)`);

    // Comprimir imagen a ~150 KB (más rápido que 80 KB)
    const compressedFile = await compressImage(file, 150);

    // Crear referencia en Storage
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `profile_photos/${currentUserId}/${timestamp}.${fileExtension}`;
    const storageRef = ref(storage, fileName);

    console.time('⏱️ [FIREBASE] Tiempo de subida a Firebase');

    // Subir archivo comprimido
    await uploadBytes(storageRef, compressedFile, {
      contentType: compressedFile.type,
      cacheControl: 'public, max-age=31536000', // Cache por 1 año
    });

    console.timeEnd('⏱️ [FIREBASE] Tiempo de subida a Firebase');

    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(storageRef);

    console.timeEnd('⏱️ [UPLOAD] Tiempo total de subida');
    console.log('✅ [UPLOAD] Foto subida exitosamente:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('❌ [UPLOAD] Error subiendo foto de perfil:', error);
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
    console.log('✅ [DELETE] Foto eliminada exitosamente');
  } catch (error) {
    console.error('❌ [DELETE] Error eliminando foto de perfil:', error);
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
