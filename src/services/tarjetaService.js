/**
 * 📋 SERVICIO DE TARJETAS (Baúl de Perfiles)
 * Sistema de identidad social persistente
 *
 * Cada usuario tiene una tarjeta que:
 * - Se crea automáticamente al registrarse/entrar
 * - Puede editarse (rol, medidas, horarios, etc.)
 * - Acumula actividad (likes, mensajes, visitas)
 * - Genera razones para volver
 */

import { db } from '@/config/firebase';
import { isBlockedBetween } from '@/services/blockService';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';

// ============================================
// 📊 MODELO DE DATOS
// ============================================

/**
 * Estructura de una Tarjeta en Firestore
 * Colección: tarjetas/{odIdUsuari}
 */
export const TARJETA_SCHEMA = {
  // Identificación
  odIdUsuari: '',          // UID del usuario (mismo que el doc ID)
  odIdUsuariNombre: '',    // Nombre de usuario (legacy, usar odIdUsuari)
  odIdUsuari: '',               // UID del usuario (campo principal)
  esInvitado: false,       // Si es usuario invitado o registrado

  // Datos básicos (editables)
  nombre: '',              // Nombre a mostrar
  edad: null,              // Edad (número)
  sexo: '',                // Hombre, Mujer, Trans, No binario, etc.
  rol: '',                 // Activo, Pasivo, Versátil

  // Datos físicos (opcionales)
  alturaCm: null,          // Altura en cm
  pesaje: null,           // Medida en cm (opcional)
  etnia: '',               // Latino, Caucásico, etc.

  // Ubicación
  ubicacionTexto: '',      // "Santiago", "Ñuñoa", etc.
  ubicacion: null,         // { latitude, longitude } para proximidad
  ubicacionActiva: false,  // Si comparte ubicación

  // Descripción
  bio: '',                 // Descripción corta (max 200 chars)
  buscando: '',            // Qué busca (max 100 chars)

  // Horarios de conexión
  horariosConexion: {
    manana: false,         // 6-12
    tarde: false,          // 12-18
    noche: false,          // 18-00
    madrugada: false       // 00-6
  },

  // Foto
  fotoUrl: '',             // URL de foto optimizada (320x320)
  fotoUrlThumb: '',        // Thumbnail (128x128) para chat
  fotoUrlFull: '',         // Foto completa (800x800) para perfil

  // Estado de conexión
  estaOnline: false,
  ultimaConexion: null,    // Timestamp

  // Métricas de actividad
  likesRecibidos: 0,
  visitasRecibidas: 0,
  mensajesRecibidos: 0,

  // Arrays de interacciones
  likesDe: [],             // UIDs de quien dio like (max 100)
  visitasDe: [],           // UIDs de últimas visitas (max 50)

  // Metadata
  creadaEn: null,          // Timestamp de creación
  actualizadaEn: null,     // Timestamp de última actualización
  actividadNoLeida: 0,     // Contador de actividad sin ver
};

// ============================================
// 🎨 OPCIONES DE CAMPOS
// ============================================

export const OPCIONES_SEXO = [
  'Hombre',
  'Mujer',
  'Trans',
  'No binario',
  'Prefiero no decir'
];

export const OPCIONES_ROL = [
  'Activo',
  'Pasivo',
  'Versátil',
  'Versátil Activo',
  'Versátil Pasivo'
];

export const OPCIONES_ETNIA = [
  'Latino',
  'Caucásico',
  'Afro',
  'Asiático',
  'Mestizo',
  'Otro',
  'Prefiero no decir'
];

export const HORARIOS_LABELS = {
  manana: 'Mañana (6-12)',
  tarde: 'Tarde (12-18)',
  noche: 'Noche (18-00)',
  madrugada: 'Madrugada (00-6)'
};

// ============================================
// 🔧 FUNCIONES PRINCIPALES
// ============================================

/**
 * Crear tarjeta automáticamente para un usuario
 * Se llama al registrarse o al entrar como invitado
 */
export async function crearTarjetaAutomatica(usuario) {
  try {
    console.log('[TARJETA] ========== CREAR TARJETA AUTOMÁTICA ==========');
    console.log('[TARJETA] Datos recibidos:', JSON.stringify(usuario, null, 2));

    const { odIdUsuari, username, esInvitado = false, edad, avatar } = usuario;

    if (!odIdUsuari) {
      console.error('[TARJETA] ❌ No se puede crear tarjeta sin odIdUsuari');
      return null;
    }

    // Verificar si ya existe
    console.log('[TARJETA] Verificando si existe tarjeta para:', odIdUsuari);
    const tarjetaExistente = await obtenerTarjeta(odIdUsuari);

    if (tarjetaExistente) {
      console.log('[TARJETA] ✅ Ya existe tarjeta para', odIdUsuari, '- Nombre:', tarjetaExistente.nombre);

      // Actualizar estado online y última conexión
      try {
        await updateDoc(doc(db, 'tarjetas', odIdUsuari), {
          estaOnline: true,
          ultimaConexion: serverTimestamp()
        });
        console.log('[TARJETA] 🔄 Estado online actualizado');
      } catch (updateError) {
        console.warn('[TARJETA] No se pudo actualizar estado online:', updateError.message);
      }

      return tarjetaExistente;
    }

    console.log('[TARJETA] 🆕 Creando NUEVA tarjeta para:', username, 'ID:', odIdUsuari);

    const nuevaTarjeta = {
      odIdUsuari,
      odIdUsuariNombre: username || 'Usuario',
      esInvitado,
      nombre: username || 'Usuario',
      edad: edad || null,
      sexo: '',
      rol: '',
      alturaCm: null,
      pesaje: null,
      etnia: '',
      ubicacionTexto: '',
      ubicacion: null,
      ubicacionActiva: false,
      bio: '',
      buscando: '',
      horariosConexion: {
        manana: false,
        tarde: false,
        noche: true, // Por defecto noches
        madrugada: false
      },
      fotoUrl: avatar || '',
      fotoUrlThumb: avatar || '',
      fotoUrlFull: avatar || '',
      estaOnline: true,
      ultimaConexion: serverTimestamp(),
      likesRecibidos: 0,
      visitasRecibidas: 0,
      mensajesRecibidos: 0,
      likesDe: [],
      visitasDe: [],
      creadaEn: serverTimestamp(),
      actualizadaEn: serverTimestamp(),
      actividadNoLeida: 0,
    };

    await setDoc(doc(db, 'tarjetas', odIdUsuari), nuevaTarjeta);
    console.log('[TARJETA] ✅✅ TARJETA CREADA EXITOSAMENTE para:', username, '(', odIdUsuari, ')');

    return nuevaTarjeta;
  } catch (error) {
    console.error('[TARJETA] ❌❌ ERROR CREANDO TARJETA:', error);
    console.error('[TARJETA] Error code:', error.code);
    console.error('[TARJETA] Error message:', error.message);
    return null;
  }
}

/**
 * Obtener tarjeta de un usuario
 */
export async function obtenerTarjeta(odIdUsuari) {
  try {
    if (!odIdUsuari) return null;

    const tarjetaDoc = await getDoc(doc(db, 'tarjetas', odIdUsuari));

    if (tarjetaDoc.exists()) {
      return { id: tarjetaDoc.id, ...tarjetaDoc.data() };
    }

    return null;
  } catch (error) {
    console.error('[TARJETA] Error obteniendo tarjeta:', error);
    return null;
  }
}

/**
 * Actualizar tarjeta del usuario actual
 */
export async function actualizarTarjeta(odIdUsuari, datos) {
  try {
    if (!odIdUsuari) {
      console.error('[TARJETA] ❌ Error: Se requiere odIdUsuari');
      throw new Error('Se requiere odIdUsuari');
    }

    console.log('[TARJETA] 📝 Actualizando tarjeta para:', odIdUsuari);
    console.log('[TARJETA] 📝 Datos recibidos:', JSON.stringify(datos, null, 2));

    // Campos permitidos para actualizar
    const camposPermitidos = [
      'nombre', 'edad', 'sexo', 'rol', 'alturaCm', 'pesaje', 'etnia',
      'ubicacionTexto', 'ubicacion', 'ubicacionActiva',
      'bio', 'buscando', 'horariosConexion',
      'fotoUrl', 'fotoUrlThumb', 'fotoUrlFull',
      'fotoSensible'
    ];

    // Filtrar solo campos permitidos y que no sean undefined
    const datosLimpios = {};
    for (const campo of camposPermitidos) {
      if (datos[campo] !== undefined) {
        // Convertir null a valor vacío para campos de texto
        if (datos[campo] === null && ['nombre', 'sexo', 'rol', 'etnia', 'ubicacionTexto', 'bio', 'buscando'].includes(campo)) {
          datosLimpios[campo] = '';
        } else {
          datosLimpios[campo] = datos[campo];
        }
      }
    }

    datosLimpios.actualizadaEn = serverTimestamp();

    console.log('[TARJETA] 📝 Datos limpios a guardar:', JSON.stringify(datosLimpios, (key, value) => {
      if (key === 'actualizadaEn') return '[serverTimestamp]';
      return value;
    }, 2));

    // Verificar que hay datos para guardar
    if (Object.keys(datosLimpios).length <= 1) { // Solo actualizadaEn
      console.warn('[TARJETA] ⚠️ No hay datos para actualizar');
      return false;
    }

    const tarjetaRef = doc(db, 'tarjetas', odIdUsuari);
    await updateDoc(tarjetaRef, datosLimpios);
    console.log('[TARJETA] ✅ Tarjeta actualizada exitosamente');

    return true;
  } catch (error) {
    console.error('[TARJETA] ❌ Error actualizando tarjeta:', error);
    console.error('[TARJETA] ❌ Error code:', error.code);
    console.error('[TARJETA] ❌ Error message:', error.message);
    return false;
  }
}

/**
 * Actualizar estado online del usuario
 */
export async function actualizarEstadoOnline(odIdUsuari, estaOnline) {
  try {
    if (!odIdUsuari) return;

    await updateDoc(doc(db, 'tarjetas', odIdUsuari), {
      estaOnline,
      ultimaConexion: serverTimestamp()
    });
  } catch (error) {
    console.error('[TARJETA] Error actualizando estado online:', error);
  }
}

// ============================================
// 📋 OBTENER TARJETAS (BAÚL)
// ============================================

// ⚙️ CONFIGURACIÓN DEL BAÚL
const BAUL_CONFIG = {
  TARJETAS_MINIMAS: 100,        // Siempre mostrar 100 tarjetas
};

/**
 * Obtener tarjetas cercanas ordenadas por proximidad y estado
 * @param {Object} miUbicacion - { latitude, longitude }
 * @param {string} miUserId - UID del usuario actual (para excluirlo o ponerlo primero)
 * @param {number} limite - Número máximo de tarjetas
 */
export async function obtenerTarjetasCercanas(miUbicacion, miUserId, limite = 100) {
  try {
    console.log('[TARJETA] Buscando tarjetas cercanas para:', miUserId);

    const cantidadAObtener = Math.max(limite, BAUL_CONFIG.TARJETAS_MINIMAS);
    const tarjetasRef = collection(db, 'tarjetas');

    // 🔧 FIX: Obtener TODAS las tarjetas sin depender de orderBy
    // Firestore orderBy EXCLUYE documentos que no tienen el campo ordenado
    // Esto causaba que perfiles sin ultimaConexion no aparecieran
    let snapshot;
    let tarjetasMap = new Map(); // Para evitar duplicados al combinar queries

    // Query 1: Intentar con orderBy (para obtener las más recientes que SÍ tienen el campo)
    try {
      const qOrdered = query(
        tarjetasRef,
        orderBy('ultimaConexion', 'desc'),
        limit(cantidadAObtener)
      );
      const snapshotOrdered = await getDocs(qOrdered);
      snapshotOrdered.forEach(docSnap => {
        tarjetasMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
      });
      console.log('[TARJETA] Query ordenada retornó:', snapshotOrdered.size, 'tarjetas');
    } catch (indexError) {
      console.warn('[TARJETA] Index no disponible para query ordenada:', indexError.message);
    }

    // Query 2: SIEMPRE ejecutar query sin orderBy para capturar TODOS los perfiles
    // limit(500) asegura que no se excluyan perfiles con fotos reales por cap de 150
    // Firestore sin orderBy retorna docs en orden arbitrario; un limit bajo puede omitir perfiles válidos
    try {
      const LIMITE_COMPLETO = 500; // Suficiente para capturar toda la colección típica
      const qAll = query(tarjetasRef, limit(LIMITE_COMPLETO));
      const snapshotAll = await getDocs(qAll);
      snapshotAll.forEach(docSnap => {
        tarjetasMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
      });
      console.log('[TARJETA] Query completa retornó:', snapshotAll.size, 'tarjetas (total únicos:', tarjetasMap.size, ')');
    } catch (error) {
      console.error('[TARJETA] Error en query completa:', error.message);
    }

    let tarjetas = Array.from(tarjetasMap.values());

    console.log('[TARJETA] ========== TARJETAS EN FIRESTORE ==========');
    console.log('[TARJETA] Total tarjetas combinadas:', tarjetas.length);

    // 🔍 DEBUG: Log detallado de cada tarjeta para diagnóstico
    tarjetas.forEach((tarjeta, index) => {
      const tieneUltimaConexion = !!tarjeta.ultimaConexion;
      const fotoPrincipal = obtenerFotoPrincipal(tarjeta);
      const tieneFoto = !!fotoPrincipal;
      const fotoEsReal = tieneFoto && !esAvatarGenerico(fotoPrincipal);

      if (index < 10) {
        console.log(`[TARJETA] ${index + 1}. ${tarjeta.nombre || 'N/A'} | ID: ${tarjeta.odIdUsuari || tarjeta.id} | ultimaConexion: ${tieneUltimaConexion ? 'SÍ' : 'NO'} | foto: ${tieneFoto ? (fotoEsReal ? 'REAL' : 'AVATAR') : 'NO'}`);
      }
    });

    console.log('[TARJETA] ==========================================');

    // Calcular distancia y determinar estado REAL
    const ahora = Date.now();
    const dosHoras = 2 * 60 * 60 * 1000;

    tarjetas = tarjetas.map(tarjeta => {
      // Calcular distancia si hay ubicación
      let distanciaKm = null;
      let distanciaTexto = '';

      if (miUbicacion && tarjeta.ubicacion && tarjeta.ubicacion.latitude && tarjeta.ubicacion.longitude) {
        distanciaKm = calcularDistancia(
          miUbicacion.latitude,
          miUbicacion.longitude,
          tarjeta.ubicacion.latitude,
          tarjeta.ubicacion.longitude
        );
        distanciaTexto = formatearDistancia(distanciaKm);
      } else if (tarjeta.ubicacionTexto) {
        distanciaTexto = tarjeta.ubicacionTexto;
      } else {
        distanciaTexto = '';
        distanciaKm = 9999;
      }

      // Determinar estado real
      let estadoReal = 'offline';
      if (tarjeta.estaOnline) {
        estadoReal = 'online';
      } else if (tarjeta.ultimaConexion) {
        const ultimaConexionMs = tarjeta.ultimaConexion.toMillis?.() || tarjeta.ultimaConexion;
        if (ahora - ultimaConexionMs < dosHoras) {
          estadoReal = 'reciente';
        }
      }

      return {
        ...tarjeta,
        distanciaKm: distanciaKm || 9999,
        distanciaTexto,
        estadoReal,
        estado: estadoReal,
        esMiTarjeta: tarjeta.odIdUsuari === miUserId
      };
    });

    // 📊 Calcular puntaje de perfil para cada tarjeta
    tarjetas = tarjetas.map(t => ({
      ...t,
      puntajePerfil: calcularPuntajePerfil(t)
    }));

    // Ordenar: Mi tarjeta primero, luego por PUNTAJE DE PERFIL (foto + datos)
    // Los que se esforzaron en configurar su perfil aparecen primero
    tarjetas.sort((a, b) => {
      // 1. Mi tarjeta siempre primera
      if (a.esMiTarjeta) return -1;
      if (b.esMiTarjeta) return 1;

      // 2. Ordenar por puntaje de perfil (mayor = primero)
      // Esto prioriza: foto real > datos completos > perfiles vacíos
      if (a.puntajePerfil !== b.puntajePerfil) {
        return b.puntajePerfil - a.puntajePerfil;
      }

      // 3. Si tienen el mismo puntaje, ordenar por última conexión
      const aTime = a.ultimaConexion?.toMillis?.() || a.ultimaConexion || 0;
      const bTime = b.ultimaConexion?.toMillis?.() || b.ultimaConexion || 0;
      return bTime - aTime;
    });

    console.log('[BAUL] 📊 Ordenamiento por puntaje de perfil aplicado');
    console.log('[BAUL] Top 5:', tarjetas.slice(0, 5).map(t => `${t.nombre}: ${t.puntajePerfil}pts`));

    // Retornar las últimas 100 (o el límite especificado)
    return tarjetas.slice(0, cantidadAObtener);
  } catch (error) {
    console.error('[TARJETA] Error obteniendo tarjetas cercanas:', error);
    return [];
  }
}

/**
 * Obtener tarjetas recientes (sin ubicación requerida)
 * Muestra las últimas 100 tarjetas por última conexión
 * Los usuarios nuevos van apareciendo y los antiguos salen del historial
 */
export async function obtenerTarjetasRecientes(miUserId, limite = 100) {
  try {
    console.log('[TARJETA] Buscando tarjetas recientes para usuario:', miUserId);

    const cantidadAObtener = Math.max(limite, BAUL_CONFIG.TARJETAS_MINIMAS);
    const tarjetasRef = collection(db, 'tarjetas');

    // 🔧 FIX: Obtener TODAS las tarjetas sin depender de orderBy
    // Firestore orderBy EXCLUYE documentos que no tienen el campo ordenado
    let tarjetasMap = new Map();

    // Query 1: Intentar con orderBy
    try {
      const qOrdered = query(
        tarjetasRef,
        orderBy('ultimaConexion', 'desc'),
        limit(cantidadAObtener)
      );
      const snapshotOrdered = await getDocs(qOrdered);
      snapshotOrdered.forEach(docSnap => {
        tarjetasMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
      });
      console.log('[TARJETA] Query ordenada retornó:', snapshotOrdered.size, 'tarjetas');
    } catch (indexError) {
      console.warn('[TARJETA] Index no disponible:', indexError.message);
    }

    // Query 2: SIEMPRE ejecutar query sin orderBy para capturar TODOS los perfiles
    // limit(500) evita excluir perfiles con fotos reales (bug: limit 150 omitía perfiles válidos)
    try {
      const LIMITE_COMPLETO = 500;
      const qAll = query(tarjetasRef, limit(LIMITE_COMPLETO));
      const snapshotAll = await getDocs(qAll);
      snapshotAll.forEach(docSnap => {
        tarjetasMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
      });
      console.log('[TARJETA] Query completa capturó:', snapshotAll.size, 'tarjetas');
    } catch (error) {
      console.error('[TARJETA] Error en query completa:', error.message);
    }

    console.log('[TARJETA] Total tarjetas combinadas:', tarjetasMap.size);

    let tarjetas = [];
    const ahora = Date.now();
    const dosHoras = 2 * 60 * 60 * 1000;

    // 🔍 DEBUG: Log detallado para diagnóstico
    let contadorConFoto = 0;
    let contadorSinUltimaConexion = 0;

    tarjetasMap.forEach((data, docId) => {
      // Determinar estado REAL
      let estadoReal = 'offline';
      if (data.estaOnline) {
        estadoReal = 'online';
      } else if (data.ultimaConexion) {
        const ultimaConexionMs = data.ultimaConexion?.toMillis?.() || data.ultimaConexion;
        if (ahora - ultimaConexionMs < dosHoras) {
          estadoReal = 'reciente';
        }
      } else {
        contadorSinUltimaConexion++;
      }

      // Detectar foto real (revisar todos los campos de foto)
      const fotoPrincipal = data.fotoUrl || data.fotoUrlFull || data.fotoUrlThumb || '';
      if (!esAvatarGenerico(fotoPrincipal)) {
        contadorConFoto++;
      }

      tarjetas.push({
        id: docId,
        ...data,
        estadoReal,
        estado: estadoReal,
        esMiTarjeta: docId === miUserId || data.odIdUsuari === miUserId,
        distanciaTexto: data.ubicacionTexto || '',
        distanciaKm: 9999
      });
    });

    console.log(`[TARJETA] 📊 Stats: ${contadorConFoto} con foto real, ${contadorSinUltimaConexion} sin ultimaConexion`);


    // 📊 Calcular puntaje de perfil para cada tarjeta
    tarjetas = tarjetas.map(t => ({
      ...t,
      puntajePerfil: calcularPuntajePerfil(t)
    }));

    // Ordenar: Mi tarjeta primero, luego por PUNTAJE DE PERFIL (foto + datos)
    // Los que se esforzaron en configurar su perfil aparecen primero
    tarjetas.sort((a, b) => {
      // 1. Mi tarjeta siempre primera
      if (a.esMiTarjeta) return -1;
      if (b.esMiTarjeta) return 1;

      // 2. Ordenar por puntaje de perfil (mayor = primero)
      // Esto prioriza: foto real > datos completos > perfiles vacíos
      if (a.puntajePerfil !== b.puntajePerfil) {
        return b.puntajePerfil - a.puntajePerfil;
      }

      // 3. Si tienen el mismo puntaje, ordenar por última conexión
      const aTime = a.ultimaConexion?.toMillis?.() || a.ultimaConexion || 0;
      const bTime = b.ultimaConexion?.toMillis?.() || b.ultimaConexion || 0;
      return bTime - aTime;
    });

    console.log('[BAUL] 📊 Ordenamiento por puntaje de perfil aplicado');
    console.log('[BAUL] Top 5:', tarjetas.slice(0, 5).map(t => `${t.nombre}: ${t.puntajePerfil}pts`));

    // Retornar las últimas 100 tarjetas
    return tarjetas.slice(0, cantidadAObtener);
  } catch (error) {
    console.error('[TARJETA] Error obteniendo tarjetas recientes:', error);
    return [];
  }
}

// ============================================
// ❤️ SISTEMA DE LIKES Y MATCHES
// ============================================

/**
 * Dar like a una tarjeta
 * Si es mutuo (el otro ya me dio like), se crea un MATCH
 * @returns {Object} { success: boolean, isMatch: boolean, matchData?: object }
 */
export async function darLike(tarjetaId, miUserId, miUsername, miAvatar = '') {
  try {
    if (!tarjetaId || !miUserId) {
      throw new Error('Se requiere tarjetaId y miUserId');
    }

    if (tarjetaId === miUserId) {
      console.warn('[TARJETA] No puedes darte like a ti mismo');
      return { success: false, isMatch: false };
    }
    const blocked = await isBlockedBetween(miUserId, tarjetaId);
    if (blocked) {
      return { success: false, isMatch: false, reason: 'blocked' };
    }

    // 1. Verificar si el otro usuario ya me dio like (para detectar match)
    const miTarjeta = await obtenerTarjeta(miUserId);
    const elOtroYaMeDioLike = miTarjeta?.likesDe?.includes(tarjetaId) || false;

    // 2. Obtener datos del destinatario para el match
    const tarjetaDestino = await obtenerTarjeta(tarjetaId);
    if (!tarjetaDestino) {
      console.error('[TARJETA] Tarjeta destino no encontrada:', tarjetaId);
      return { success: false, isMatch: false };
    }

    const tarjetaRef = doc(db, 'tarjetas', tarjetaId);

    // 3. Actualizar tarjeta del destinatario
    await updateDoc(tarjetaRef, {
      likesRecibidos: increment(1),
      likesDe: arrayUnion(miUserId),
      actividadNoLeida: increment(1),
      actualizadaEn: serverTimestamp()
    });

    // 4. Guardar registro de actividad
    await agregarActividad(tarjetaId, {
      tipo: 'like',
      deUserId: miUserId,
      deUsername: miUsername,
      timestamp: serverTimestamp()
    });

    console.log('[TARJETA] Like enviado a', tarjetaId);

    // 4b. Crear notificacion para push (alimenta Cloud Function)
    try {
      const notifRef = collection(db, 'users', tarjetaId, 'notifications');
      await addDoc(notifRef, {
        type: 'tarjeta_like',
        fromUserId: miUserId,
        fromUsername: miUsername,
        message: `${miUsername} le dio like a tu tarjeta`,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (notifError) {
      console.error('[TARJETA] Error creando notificacion de like:', notifError);
    }

    // 5. ¡VERIFICAR MATCH!
    if (elOtroYaMeDioLike) {
      console.log('[MATCH] 🎉 ¡MATCH DETECTADO! Entre', miUserId, 'y', tarjetaId);

      // Crear el match
      const matchData = await crearMatch({
        userA: {
          odIdUsuari: miUserId,
          username: miUsername,
          avatar: miAvatar,
          nombre: miTarjeta?.nombre || miUsername
        },
        userB: {
          odIdUsuari: tarjetaId,
          username: tarjetaDestino.nombre || tarjetaDestino.odIdUsuariNombre,
          avatar: tarjetaDestino.fotoUrl || '',
          nombre: tarjetaDestino.nombre || tarjetaDestino.odIdUsuariNombre
        }
      });

      return { success: true, isMatch: true, matchData };
    }

    return { success: true, isMatch: false };
  } catch (error) {
    console.error('[TARJETA] Error dando like:', error);
    return { success: false, isMatch: false };
  }
}

/**
 * Crear un match entre dos usuarios
 */
async function crearMatch({ userA, userB }) {
  try {
    // Generar ID único ordenando los IDs para evitar duplicados
    const sortedIds = [userA.odIdUsuari, userB.odIdUsuari].sort();
    const matchId = `${sortedIds[0]}_${sortedIds[1]}`;

    const matchRef = doc(db, 'matches', matchId);

    // Verificar si ya existe el match
    const existingMatch = await getDoc(matchRef);
    if (existingMatch.exists()) {
      console.log('[MATCH] Match ya existía:', matchId);
      return { id: matchId, ...existingMatch.data(), alreadyExisted: true };
    }

    const matchData = {
      id: matchId,
      users: sortedIds,
      userA: {
        odIdUsuari: userA.odIdUsuari,
        username: userA.username,
        avatar: userA.avatar || '',
        nombre: userA.nombre
      },
      userB: {
        odIdUsuari: userB.odIdUsuari,
        username: userB.username,
        avatar: userB.avatar || '',
        nombre: userB.nombre
      },
      createdAt: serverTimestamp(),
      lastInteraction: serverTimestamp(),
      status: 'active',
      chatStarted: false,
      unreadByA: true,
      unreadByB: true
    };

    await setDoc(matchRef, matchData);
    console.log('[MATCH] ✅ Match creado:', matchId);

    // Notificar a ambos usuarios
    await agregarActividad(userA.odIdUsuari, {
      tipo: 'match',
      deUserId: userB.odIdUsuari,
      deUsername: userB.nombre,
      mensaje: `¡Hiciste match con ${userB.nombre}!`,
      matchId,
      timestamp: serverTimestamp()
    });

    await agregarActividad(userB.odIdUsuari, {
      tipo: 'match',
      deUserId: userA.odIdUsuari,
      deUsername: userA.nombre,
      mensaje: `¡Hiciste match con ${userA.nombre}!`,
      matchId,
      timestamp: serverTimestamp()
    });

    // Incrementar contador de actividad no leída
    await updateDoc(doc(db, 'tarjetas', userA.odIdUsuari), {
      actividadNoLeida: increment(1)
    });
    await updateDoc(doc(db, 'tarjetas', userB.odIdUsuari), {
      actividadNoLeida: increment(1)
    });

    return { id: matchId, ...matchData, alreadyExisted: false };
  } catch (error) {
    console.error('[MATCH] Error creando match:', error);
    return null;
  }
}

/**
 * Obtener mis matches
 */
export async function obtenerMisMatches(miUserId) {
  try {
    if (!miUserId) return [];

    const matchesRef = collection(db, 'matches');
    const q = query(
      matchesRef,
      where('users', 'array-contains', miUserId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch (indexError) {
      console.warn('[MATCH] Index no disponible, usando query simple');
      const qSimple = query(
        matchesRef,
        where('users', 'array-contains', miUserId),
        limit(50)
      );
      snapshot = await getDocs(qSimple);
    }

    const matches = snapshot.docs.map(doc => {
      const data = doc.data();
      // Determinar quién es "el otro" usuario
      const otroUsuario = data.userA.odIdUsuari === miUserId ? data.userB : data.userA;
      const yoSoy = data.userA.odIdUsuari === miUserId ? 'A' : 'B';
      const tengoNoLeido = yoSoy === 'A' ? data.unreadByA : data.unreadByB;

      return {
        id: doc.id,
        ...data,
        otroUsuario,
        yoSoy,
        tengoNoLeido
      };
    });

    console.log('[MATCH] Matches encontrados:', matches.length);
    return matches;
  } catch (error) {
    console.error('[MATCH] Error obteniendo matches:', error);
    return [];
  }
}

/**
 * Marcar match como leído
 */
export async function marcarMatchLeido(matchId, miUserId) {
  try {
    const matchRef = doc(db, 'matches', matchId);
    const matchDoc = await getDoc(matchRef);

    if (!matchDoc.exists()) return;

    const data = matchDoc.data();
    const yoSoy = data.userA.odIdUsuari === miUserId ? 'A' : 'B';

    await updateDoc(matchRef, {
      [yoSoy === 'A' ? 'unreadByA' : 'unreadByB']: false
    });
  } catch (error) {
    console.error('[MATCH] Error marcando como leído:', error);
  }
}

/**
 * Verificar si hay match entre dos usuarios
 */
export async function verificarMatch(userId1, userId2) {
  try {
    const sortedIds = [userId1, userId2].sort();
    const matchId = `${sortedIds[0]}_${sortedIds[1]}`;
    const matchRef = doc(db, 'matches', matchId);
    const matchDoc = await getDoc(matchRef);

    return matchDoc.exists() ? { exists: true, data: matchDoc.data() } : { exists: false };
  } catch (error) {
    console.error('[MATCH] Error verificando match:', error);
    return { exists: false };
  }
}

/**
 * Obtener cantidad de matches no leídos
 */
export async function contarMatchesNoLeidos(miUserId) {
  try {
    const matches = await obtenerMisMatches(miUserId);
    return matches.filter(m => m.tengoNoLeido).length;
  } catch (error) {
    return 0;
  }
}

/**
 * Quitar like de una tarjeta
 */
export async function quitarLike(tarjetaId, miUserId) {
  try {
    if (!tarjetaId || !miUserId) return false;

    const tarjetaRef = doc(db, 'tarjetas', tarjetaId);

    await updateDoc(tarjetaRef, {
      likesRecibidos: increment(-1),
      likesDe: arrayRemove(miUserId),
      actualizadaEn: serverTimestamp()
    });

    console.log('[TARJETA] Like removido de', tarjetaId);
    return true;
  } catch (error) {
    console.error('[TARJETA] Error quitando like:', error);
    return false;
  }
}

/**
 * Verificar si ya di like a una tarjeta
 */
export async function yaLeDiLike(tarjetaId, miUserId) {
  try {
    const tarjeta = await obtenerTarjeta(tarjetaId);
    return tarjeta?.likesDe?.includes(miUserId) || false;
  } catch (error) {
    return false;
  }
}

/**
 * Toggle like (dar o quitar)
 */
export async function toggleLike(tarjetaId, miUserId, miUsername) {
  const yaTieneLike = await yaLeDiLike(tarjetaId, miUserId);

  if (yaTieneLike) {
    return await quitarLike(tarjetaId, miUserId);
  } else {
    return await darLike(tarjetaId, miUserId, miUsername);
  }
}

// ============================================
// 💬 SISTEMA DE MENSAJES EN TARJETA
// ============================================

/**
 * Enviar mensaje a una tarjeta
 * Es diferente al chat privado - es como dejar una nota
 */
export async function enviarMensajeTarjeta(tarjetaId, miUserId, miUsername, mensaje) {
  try {
    if (!tarjetaId || !miUserId || !mensaje?.trim()) {
      throw new Error('Datos incompletos');
    }

    if (tarjetaId === miUserId) {
      console.warn('[TARJETA] No puedes enviarte mensaje a ti mismo');
      return false;
    }
    const blocked = await isBlockedBetween(miUserId, tarjetaId);
    if (blocked) {
      throw new Error('BLOCKED');
    }

    // Limitar longitud del mensaje
    const mensajeLimpio = mensaje.trim().substring(0, 200);

    // Actualizar contador en tarjeta
    await updateDoc(doc(db, 'tarjetas', tarjetaId), {
      mensajesRecibidos: increment(1),
      actividadNoLeida: increment(1),
      actualizadaEn: serverTimestamp()
    });

    // Guardar mensaje como actividad
    await agregarActividad(tarjetaId, {
      tipo: 'mensaje',
      deUserId: miUserId,
      deUsername: miUsername,
      mensaje: mensajeLimpio,
      timestamp: serverTimestamp()
    });

    console.log('[TARJETA] ✅ Mensaje enviado a', tarjetaId);
    return true;
  } catch (error) {
    console.error('[TARJETA] Error enviando mensaje:', error);
    return false;
  }
}

// ============================================
// 👁️ SISTEMA DE VISITAS
// ============================================

/**
 * Registrar visita a una tarjeta
 */
export async function registrarVisita(tarjetaId, miUserId, miUsername) {
  try {
    if (!tarjetaId || !miUserId) return;
    if (tarjetaId === miUserId) return; // No registrar visita propia
    const blocked = await isBlockedBetween(miUserId, tarjetaId);
    if (blocked) return;

    const tarjetaRef = doc(db, 'tarjetas', tarjetaId);

    await updateDoc(tarjetaRef, {
      visitasRecibidas: increment(1),
      visitasDe: arrayUnion(miUserId),
      actividadNoLeida: increment(1),
      actualizadaEn: serverTimestamp()
    });

    // Guardar actividad
    await agregarActividad(tarjetaId, {
      tipo: 'visita',
      deUserId: miUserId,
      deUsername: miUsername,
      timestamp: serverTimestamp()
    });

  } catch (error) {
    console.error('[TARJETA] Error registrando visita:', error);
  }
}

// ============================================
// 📊 ACTIVIDAD Y FEED
// ============================================

/**
 * Agregar actividad a la tarjeta (subcolección)
 */
async function agregarActividad(tarjetaId, actividad) {
  try {
    const actividadRef = collection(db, 'tarjetas', tarjetaId, 'actividad');
    await setDoc(doc(actividadRef), {
      ...actividad,
      leida: false
    });
  } catch (error) {
    console.error('[TARJETA] Error agregando actividad:', error);
  }
}

/**
 * Obtener actividad reciente de mi tarjeta (feed)
 */
export async function obtenerMiActividad(miUserId, limite = 20) {
  try {
    if (!miUserId) return [];

    const actividadRef = collection(db, 'tarjetas', miUserId, 'actividad');
    const q = query(
      actividadRef,
      orderBy('timestamp', 'desc'),
      limit(limite)
    );

    const snapshot = await getDocs(q);
    const actividades = [];

    snapshot.forEach(doc => {
      actividades.push({ id: doc.id, ...doc.data() });
    });

    return actividades;
  } catch (error) {
    console.error('[TARJETA] Error obteniendo actividad:', error);
    return [];
  }
}

/**
 * Verificar si hay interés mutuo entre dos usuarios
 * Retorna true si:
 * - Hay match formal
 * - O hay likes mutuos (sin leer actividad privada)
 */
export async function verificarInteresMutuo(userId1, userId2) {
  try {
    const blocked = await isBlockedBetween(userId1, userId2);
    if (blocked) {
      return { hayInteres: false, tipo: 'bloqueado' };
    }
    // 1. Verificar match formal
    const matchResult = await verificarMatch(userId1, userId2);
    if (matchResult.exists) {
      return { hayInteres: true, tipo: 'match' };
    }

    // 2. Verificar likes mutuos en las tarjetas (sin leer actividad privada)
    const tarjeta1 = await getDoc(doc(db, 'tarjetas', userId1));
    const tarjeta2 = await getDoc(doc(db, 'tarjetas', userId2));

    const user2LikedUser1 = tarjeta1.data()?.likesDe?.includes(userId2) || false;
    const user1LikedUser2 = tarjeta2.data()?.likesDe?.includes(userId1) || false;

    if (user1LikedUser2 && user2LikedUser1) {
      return { hayInteres: true, tipo: 'likes_mutuos' };
    }

    // Si solo uno interactuó, hay interés parcial
    if (user1LikedUser2 || user2LikedUser1) {
      return { hayInteres: false, tipo: 'parcial', quienInteractuo: user1LikedUser2 ? userId1 : userId2 };
    }

    return { hayInteres: false, tipo: 'ninguno' };
  } catch (error) {
    console.error('[TARJETA] Error verificando interés mutuo:', error);
    return { hayInteres: false, tipo: 'error' };
  }
}

/**
 * Marcar actividad como leída
 */
export async function marcarActividadLeida(miUserId) {
  try {
    if (!miUserId) return;

    // Resetear contador de actividad no leída
    await updateDoc(doc(db, 'tarjetas', miUserId), {
      actividadNoLeida: 0
    });

    // TODO: Marcar items individuales como leídos si es necesario
  } catch (error) {
    console.error('[TARJETA] Error marcando actividad leída:', error);
  }
}

/**
 * Suscribirse a cambios en mi tarjeta (tiempo real)
 */
export function suscribirseAMiTarjeta(miUserId, callback) {
  if (!miUserId) return () => {};

  return onSnapshot(
    doc(db, 'tarjetas', miUserId),
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      }
    },
    (error) => {
      console.error('[TARJETA] Error en suscripción:', error);
    }
  );
}

// ============================================
// 🔧 UTILIDADES
// ============================================

/**
 * 🔍 Detectar si una URL es un avatar genérico (NO foto real)
 * Retorna TRUE si es avatar genérico, FALSE si es foto real
 */
function esAvatarGenerico(fotoUrl) {
  if (!fotoUrl || typeof fotoUrl !== 'string' || !fotoUrl.trim()) {
    return true; // Sin foto = se trata como avatar genérico
  }

  const url = fotoUrl.toLowerCase();

  // Patrones de servicios de avatares genéricos
  const patronesGenericos = [
    'dicebear',
    'ui-avatars.com',
    'robohash',
    'gravatar.com/avatar',
    'placeholder',
    'default-avatar',
    'default_avatar',
    'no-avatar',
    'no_avatar',
    'anonymous',
    'blank-profile',
    'blank_profile'
  ];

  // Si contiene algún patrón de avatar genérico, es genérico
  for (const patron of patronesGenericos) {
    if (url.includes(patron)) {
      return true;
    }
  }

  // Si es una URL de Firebase Storage o CDN conocido, probablemente es foto real
  const cdnsReales = [
    'firebasestorage.googleapis.com',
    'storage.googleapis.com',
    'cloudinary.com',
    'imgur.com',
    'imgbb.com',
    'ibb.co'
  ];

  for (const cdn of cdnsReales) {
    if (url.includes(cdn)) {
      return false; // Es foto real
    }
  }

  // Si empieza con http/https y no es un patrón genérico, asumir que es real
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return false;
  }

  // Data URLs base64 de imágenes pequeñas suelen ser avatares generados
  if (url.startsWith('data:image') && url.length < 5000) {
    return true;
  }

  // Por defecto, asumir que es genérico si no podemos determinar
  return true;
}

/**
 * Obtener la URL de foto principal de una tarjeta
 * Algunos perfiles tienen foto en fotoUrlFull o fotoUrlThumb pero no en fotoUrl
 */
function obtenerFotoPrincipal(tarjeta) {
  return tarjeta.fotoUrl || tarjeta.fotoUrlFull || tarjeta.fotoUrlThumb || '';
}

/**
 * Calcular puntaje de completitud del perfil
 * Los perfiles más completos aparecen primero
 * Esto recompensa a usuarios que se tomaron el tiempo de configurar
 */
function calcularPuntajePerfil(tarjeta) {
  let puntaje = 0;

  // 🖼️ FOTO REAL (máxima prioridad: +1000)
  // Revisar fotoUrl, fotoUrlFull y fotoUrlThumb (admin/perfiles pueden usar distintos campos)
  const fotoPrincipal = obtenerFotoPrincipal(tarjeta);
  const tieneFotoReal = !esAvatarGenerico(fotoPrincipal);

  if (tieneFotoReal) {
    puntaje += 1000; // Foto real = prioridad máxima
  }

  // 📋 DATOS DEL PERFIL (secundarios)
  if (tarjeta.rol && tarjeta.rol.trim()) puntaje += 50;        // Rol definido
  if (tarjeta.bio && tarjeta.bio.trim()) puntaje += 40;        // Bio escrita
  if (tarjeta.edad && tarjeta.edad > 0) puntaje += 30;         // Edad
  if (tarjeta.buscando && tarjeta.buscando.trim()) puntaje += 25; // Qué busca
  if (tarjeta.ubicacionTexto && tarjeta.ubicacionTexto.trim()) puntaje += 20; // Ubicación
  if (tarjeta.etnia && tarjeta.etnia.trim()) puntaje += 15;    // Etnia
  if (tarjeta.alturaCm && tarjeta.alturaCm > 0) puntaje += 10; // Altura
  if (tarjeta.pesaje && tarjeta.pesaje > 0) puntaje += 10;     // Medida

  // 🔥 ACTIVIDAD (bonus menor)
  if ((tarjeta.likesRecibidos || 0) > 5) puntaje += 5;
  if ((tarjeta.visitasRecibidas || 0) > 10) puntaje += 5;

  return puntaje;
}

/**
 * Calcular distancia entre dos coordenadas (fórmula Haversine)
 */
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Formatear distancia para mostrar
 */
function formatearDistancia(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

/**
 * Formatear horarios de conexión para mostrar
 */
export function formatearHorarios(horariosConexion) {
  if (!horariosConexion) return 'No especificado';

  const activos = [];
  if (horariosConexion.manana) activos.push('Mañanas');
  if (horariosConexion.tarde) activos.push('Tardes');
  if (horariosConexion.noche) activos.push('Noches');
  if (horariosConexion.madrugada) activos.push('Madrugadas');

  if (activos.length === 0) return 'No especificado';
  if (activos.length === 4) return 'Todo el día';

  return activos.join(', ');
}

/**
 * Obtener color del rol
 */
export function getColorRol(rol) {
  if (!rol) return 'bg-gray-500';

  const rolLower = rol.toLowerCase();

  if (rolLower.includes('activo') && !rolLower.includes('pasivo')) {
    return 'bg-blue-500';
  }
  if (rolLower.includes('pasivo') && !rolLower.includes('activo')) {
    return 'bg-pink-500';
  }
  if (rolLower.includes('versátil') || rolLower.includes('versatil')) {
    return 'bg-purple-500';
  }

  return 'bg-gray-500';
}

/**
 * Obtener emoji del estado
 */
export function getEmojiEstado(estado) {
  switch (estado) {
    case 'online': return '🟢';
    case 'reciente': return '🟠';
    case 'offline': return '⚫';
    default: return '⚫';
  }
}

export default {
  crearTarjetaAutomatica,
  obtenerTarjeta,
  actualizarTarjeta,
  actualizarEstadoOnline,
  obtenerTarjetasCercanas,
  obtenerTarjetasRecientes,
  darLike,
  quitarLike,
  yaLeDiLike,
  enviarMensajeTarjeta,
  registrarVisita,
  obtenerMiActividad,
  marcarActividadLeida,
  suscribirseAMiTarjeta,
  formatearHorarios,
  getColorRol,
  getEmojiEstado,
  // Match system
  obtenerMisMatches,
  marcarMatchLeido,
  verificarMatch,
  contarMatchesNoLeidos,
  // Constants
  OPCIONES_SEXO,
  OPCIONES_ROL,
  OPCIONES_ETNIA,
  HORARIOS_LABELS,
};
