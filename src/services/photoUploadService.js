/**
 * 📁 SERVICIO DE SUBIDA DE FOTOS - SUPABASE STORAGE
 *
 * Servicio migrado de Firebase Storage a Supabase Storage
 * Comprime imágenes a 60-90 KB y las sube al bucket 'profile-photos'
 */

import { supabase } from '@/config/supabase';
import imageCompression from 'browser-image-compression';

/**
 * 🚀 VERSIÓN ULTRA-OPTIMIZADA: Comprime a 60-90 KB en una sola pasada
 * Reduce tiempo y garantiza tamaño pequeño manteniendo calidad visual
 *
 * @param {File} file - Archivo de imagen a comprimir
 * @param {number} maxSizeKB - Tamaño máximo en KB (default: 80)
 * @returns {Promise<File>} - Archivo comprimido
 */
export const compressImage = async (file, maxSizeKB = 80) => {
  try {
    console.time('⏱️ [COMPRESS] Tiempo total de compresión');

    const fileSizeMB = file.size / (1024 * 1024);

    // ✅ Dimensiones más agresivas para garantizar 60-90 KB
    let maxWidthOrHeight = 400; // Tamaño fijo para avatares
    let initialQuality = 0.7; // Calidad más baja pero aceptable

    // ✅ Configuración ultra-agresiva para archivo pequeño
    const options = {
      maxSizeMB: maxSizeKB / 1024, // 0.08 MB (80 KB)
      maxWidthOrHeight, // 400px es perfecto para avatares
      useWebWorker: false, // Más estable sin worker
      fileType: file.type,
      initialQuality, // 0.7 balance calidad/tamaño
      maxIteration: 15, // Más iteraciones para alcanzar objetivo
      alwaysKeepResolution: false,
    };

    const compressedFile = await imageCompression(file, options);
    const finalSizeKB = compressedFile.size / 1024;

    console.log(`✅ [COMPRESS] Original: ${fileSizeMB.toFixed(2)} MB → Comprimido: ${finalSizeKB.toFixed(2)} KB`);
    console.timeEnd('⏱️ [COMPRESS] Tiempo total de compresión');

    return compressedFile;
  } catch (error) {
    console.error('❌ [COMPRESS] Error comprimiendo imagen:', error);
    throw new Error('No se pudo comprimir la imagen. Por favor, intenta con otra imagen.');
  }
};

/**
 * Sube una foto de perfil a Supabase Storage
 * @param {File} file - Archivo de imagen a subir
 * @param {string} userId - ID del usuario (opcional, usa Firebase Auth o genera uno temporal)
 * @returns {Promise<string>} - URL pública de la imagen
 */
export const uploadProfilePhoto = async (file, userId = null) => {
  try {
    console.time('⏱️ [UPLOAD] Tiempo total de subida');

    // Obtener userId de múltiples fuentes (compatibilidad Firebase + Supabase)
    let currentUserId = userId;

    if (!currentUserId) {
      // Intentar obtener de Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id;
    }

    if (!currentUserId) {
      // Intentar obtener de Firebase Auth (importar dinámicamente)
      try {
        const { auth } = await import('@/config/firebase');
        currentUserId = auth.currentUser?.uid;
      } catch (error) {
        console.warn('⚠️ Firebase Auth no disponible:', error.message);
      }
    }

    if (!currentUserId) {
      // Generar ID temporal basado en timestamp (para usuarios anónimos)
      currentUserId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.warn('⚠️ [UPLOAD] Usuario sin auth, usando ID temporal:', currentUserId);
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

    // Comprimir imagen a ~80 KB (60-90 KB final)
    const compressedFile = await compressImage(file, 80);

    // Crear nombre único para el archivo
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${currentUserId}/${timestamp}.${fileExtension}`;

    // ✅ VERIFICAR SI SUPABASE ESTÁ CONFIGURADO
    if (!supabase) {
      console.warn('⚠️ [UPLOAD] Supabase no configurado - Usando Firebase Storage como fallback');

      // 🔥 FALLBACK: Usar Firebase Storage
      const { storage: firebaseStorage } = await import('@/config/firebase');
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

      const storageRef = ref(firebaseStorage, `profile-photos/${fileName}`);
      const uploadResult = await uploadBytes(storageRef, compressedFile, {
        contentType: compressedFile.type,
        cacheControl: 'public, max-age=31536000',
      });

      const publicUrl = await getDownloadURL(uploadResult.ref);
      console.log('✅ [FIREBASE] Foto subida exitosamente a Firebase Storage:', publicUrl);
      console.timeEnd('⏱️ [UPLOAD] Tiempo total de subida');
      return publicUrl;
    }

    // ✅ SUPABASE CONFIGURADO - Usar Supabase Storage
    console.time('⏱️ [SUPABASE] Tiempo de subida a Supabase Storage');

    // Subir archivo comprimido a Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, compressedFile, {
        contentType: compressedFile.type,
        cacheControl: '31536000', // Cache por 1 año
        upsert: false, // No sobrescribir si existe
      });

    console.timeEnd('⏱️ [SUPABASE] Tiempo de subida a Supabase Storage');

    if (error) {
      console.error('❌ [SUPABASE] Error subiendo archivo:', error);
      throw new Error(`Error al subir la foto: ${error.message}`);
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    console.timeEnd('⏱️ [UPLOAD] Tiempo total de subida');
    console.log('✅ [UPLOAD] Foto subida exitosamente:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('❌ [UPLOAD] Error subiendo foto de perfil:', error);
    throw error;
  }
};

/**
 * Elimina una foto de perfil de Supabase Storage
 * @param {string} photoURL - URL de la foto a eliminar
 * @returns {Promise<void>}
 */
export const deleteProfilePhoto = async (photoURL) => {
  try {
    if (!photoURL || !photoURL.includes('profile-photos')) {
      return; // No es una foto de perfil subida, no hacer nada
    }

    // Extraer el path desde la URL pública de Supabase
    // URL format: https://xlnwpixqkjcozkqgoutf.supabase.co/storage/v1/object/public/profile-photos/{userId}/{timestamp}.jpg
    const urlParts = photoURL.split('/profile-photos/');
    if (urlParts.length < 2) {
      console.warn('⚠️ [DELETE] URL no válida:', photoURL);
      return;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([filePath]);

    if (error) {
      console.error('❌ [DELETE] Error eliminando foto:', error);
      // No lanzar error, solo loguear (puede que el archivo ya no exista)
      return;
    }

    console.log('✅ [DELETE] Foto eliminada exitosamente');
  } catch (error) {
    console.error('❌ [DELETE] Error eliminando foto de perfil:', error);
    // No lanzar error, solo loguear
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
