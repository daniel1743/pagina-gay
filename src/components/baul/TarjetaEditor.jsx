/**
 * ✏️ EDITOR DE TARJETA
 * Permite al usuario editar su propia tarjeta
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  User,
  Loader2,
  Camera,
  MapPin,
  Clock,
  Ruler,
  Heart
} from 'lucide-react';
import {
  actualizarTarjeta,
  OPCIONES_SEXO,
  OPCIONES_ROL,
  OPCIONES_ETNIA,
  HORARIOS_LABELS
} from '@/services/tarjetaService';
import { toast } from '@/components/ui/use-toast';
import { compressImage } from '@/utils/imageCompressor';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn } from 'lucide-react';

// ✅ Cloudinary config (gratuito, no requiere Firebase Storage)
const CLOUDINARY_CLOUD_NAME = 'dw9xypbzs';
const CLOUDINARY_UPLOAD_PRESET = 'tarjetas_baul';

/**
 * Campo de selección
 */
const CampoSelect = ({ label, value, onChange, opciones, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
    >
      <option value="">{placeholder}</option>
      {opciones.map((op) => (
        <option key={op} value={op}>{op}</option>
      ))}
    </select>
  </div>
);

/**
 * Campo de texto
 */
const CampoTexto = ({ label, value, onChange, placeholder, maxLength, multiline = false }) => {
  const Component = multiline ? 'textarea' : 'input';
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <Component
        value={value || ''}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength || 9999))}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={multiline ? 3 : undefined}
        className={`w-full bg-gray-700/50 border border-gray-600 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors ${multiline ? 'resize-none' : ''}`}
      />
      {maxLength && (
        <p className="text-xs text-gray-500 mt-1 text-right">{(value || '').length}/{maxLength}</p>
      )}
    </div>
  );
};

/**
 * Campo numérico
 */
const CampoNumero = ({ label, value, onChange, placeholder, min, max, suffix }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
    <div className="relative">
      <input
        type="number"
        value={value || ''}
        onChange={(e) => {
          const val = e.target.value ? parseInt(e.target.value) : null;
          if (val === null || (val >= min && val <= max)) {
            onChange(val);
          }
        }}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors pr-12"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

/**
 * Selector de horarios
 */
const SelectorHorarios = ({ horarios, onChange }) => {
  const toggleHorario = (key) => {
    onChange({
      ...horarios,
      [key]: !horarios?.[key]
    });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        <Clock className="w-4 h-4 inline mr-1" />
        Horarios de conexión
      </label>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(HORARIOS_LABELS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleHorario(key)}
            className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
              horarios?.[key]
                ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500/50'
                : 'bg-gray-700/50 text-gray-400 border border-gray-600 hover:border-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Indica cuándo sueles conectarte para que otros sepan cuándo encontrarte
      </p>
    </div>
  );
};

/**
 * Componente principal
 */
const TarjetaEditor = ({ isOpen, onClose, tarjeta }) => {
  const { user } = useAuth();
  const esInvitado = user?.isGuest || user?.isAnonymous;

  const [datos, setDatos] = useState({
    nombre: '',
    edad: null,
    sexo: '',
    rol: '',
    alturaCm: null,
    pesaje: null,
    etnia: '',
    ubicacionTexto: '',
    bio: '',
    buscando: '',
    horariosConexion: {
      manana: false,
      tarde: false,
      noche: true,
      madrugada: false
    }
  });
  const [isGuardando, setIsGuardando] = useState(false);
  const [isSubiendoFoto, setIsSubiendoFoto] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [nuevaFotoUrl, setNuevaFotoUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Cargar datos de la tarjeta
  useEffect(() => {
    if (tarjeta) {
      setDatos({
        nombre: tarjeta.nombre || '',
        edad: tarjeta.edad || null,
        sexo: tarjeta.sexo || '',
        rol: tarjeta.rol || '',
        alturaCm: tarjeta.alturaCm || null,
        pesaje: tarjeta.pesaje || null,
        etnia: tarjeta.etnia || '',
        ubicacionTexto: tarjeta.ubicacionTexto || '',
        bio: tarjeta.bio || '',
        buscando: tarjeta.buscando || '',
        horariosConexion: tarjeta.horariosConexion || {
          manana: false,
          tarde: false,
          noche: true,
          madrugada: false
        }
      });
    }
  }, [tarjeta]);

  const handleGuardar = async () => {
    if (isGuardando) return;
    setIsGuardando(true);

    try {
      // Preparar datos a guardar (la foto ya se auto-guarda, no incluirla aquí)
      const datosAGuardar = { ...datos };

      // ✅ USAR tarjeta.id como fallback si odIdUsuari no existe (tarjetas antiguas)
      const userId = tarjeta?.odIdUsuari || tarjeta?.id;

      console.log('[EDITOR] 📝 Guardando tarjeta...');
      console.log('[EDITOR] 📝 userId (odIdUsuari o id):', userId);
      console.log('[EDITOR] 📝 tarjeta.odIdUsuari:', tarjeta?.odIdUsuari);
      console.log('[EDITOR] 📝 tarjeta.id:', tarjeta?.id);
      console.log('[EDITOR] 📝 Datos a guardar:', JSON.stringify(datosAGuardar, null, 2));

      if (!userId) {
        console.error('[EDITOR] ❌ No hay ID de usuario en la tarjeta');
        throw new Error('No se encontró el ID de usuario');
      }

      const exito = await actualizarTarjeta(userId, datosAGuardar);
      console.log('[EDITOR] Resultado de actualizarTarjeta:', exito);

      if (exito) {
        toast({
          title: '✅ Tarjeta actualizada',
          description: 'Tus cambios se guardaron correctamente',
        });
        onClose();
      } else {
        console.error('[EDITOR] ❌ actualizarTarjeta retornó false');
        throw new Error('No se pudo guardar');
      }
    } catch (error) {
      console.error('[EDITOR] ❌ Error guardando:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron guardar los cambios',
        variant: 'destructive'
      });
    } finally {
      setIsGuardando(false);
    }
  };

  const updateDato = (campo, valor) => {
    setDatos(prev => ({ ...prev, [campo]: valor }));
  };

  // ✅ Manejar selección de foto
  const handleFotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Archivo inválido',
        description: 'Solo se permiten imágenes',
        variant: 'destructive'
      });
      return;
    }

    // Validar tamaño (máximo 10MB antes de comprimir)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Imagen muy grande',
        description: 'La imagen debe ser menor a 10MB',
        variant: 'destructive'
      });
      return;
    }

    // ✅ Mostrar preview INMEDIATO (antes de comprimir/subir)
    const previewUrl = URL.createObjectURL(file);
    setFotoPreview(previewUrl);
    setIsSubiendoFoto(true);

    // Notificar al usuario que está procesando
    toast({
      title: '📷 Validando tu foto...',
      description: 'Esto puede tardar unos segundos',
    });

    try {
      console.log('[FOTO] Iniciando compresión...');

      // Comprimir imagen (320x320 para tarjeta) con timeout
      const compressionPromise = compressImage(file, 'tarjeta');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout comprimiendo')), 15000)
      );

      const compressed = await Promise.race([compressionPromise, timeoutPromise]);
      console.log('[FOTO] ✅ Comprimida:', compressed.sizeKB, 'KB');

      // ✅ Subir a Cloudinary (gratis, sin Firebase Storage)
      // ✅ USAR tarjeta.id como fallback si odIdUsuari no existe (tarjetas antiguas)
      const userId = tarjeta?.odIdUsuari || tarjeta?.id;
      console.log('[FOTO] Usuario de tarjeta:', userId);
      console.log('[FOTO] tarjeta.odIdUsuari:', tarjeta?.odIdUsuari);
      console.log('[FOTO] tarjeta.id:', tarjeta?.id);
      console.log('[FOTO] Subiendo a Cloudinary...');

      const formData = new FormData();
      formData.append('file', compressed.blob);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', `tarjetas/${userId}`);

      const uploadPromise = fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const uploadTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout subiendo')), 30000)
      );

      const response = await Promise.race([uploadPromise, uploadTimeout]);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[FOTO] Error de Cloudinary:', errorData);
        throw new Error(errorData.error?.message || 'Error subiendo a Cloudinary');
      }

      const cloudinaryData = await response.json();
      console.log('[FOTO] ✅ Subida a Cloudinary completada!');

      const downloadUrl = cloudinaryData.secure_url;
      console.log('[FOTO] ✅ URL obtenida:', downloadUrl);

      // ✅ AUTO-GUARDAR: Guardar la foto inmediatamente en Firestore
      console.log('[FOTO] Auto-guardando foto en Firestore...');
      const autoSaveResult = await actualizarTarjeta(userId, {
        fotoUrl: downloadUrl,
        fotoUrlThumb: downloadUrl,
        fotoUrlFull: downloadUrl
      });

      if (autoSaveResult) {
        console.log('[FOTO] ✅ Foto auto-guardada exitosamente');
        setNuevaFotoUrl(downloadUrl);
        setIsSubiendoFoto(false);

        toast({
          title: '✅ Foto actualizada',
          description: 'Tu foto ya está visible para otros usuarios',
        });
      } else {
        throw new Error('No se pudo guardar la foto en tu perfil');
      }

    } catch (error) {
      console.error('[FOTO] Error:', error.message);
      setIsSubiendoFoto(false);

      let errorMsg = 'No se pudo subir la foto';
      if (error.message?.includes('Timeout')) {
        errorMsg = 'La conexión es lenta. Intenta de nuevo.';
      } else if (error.message?.includes('Cloudinary')) {
        errorMsg = error.message;
      }

      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
    }
  };

  // ✅ Limpiar preview al cerrar
  useEffect(() => {
    if (!isOpen) {
      if (fotoPreview) {
        URL.revokeObjectURL(fotoPreview);
      }
      setFotoPreview(null);
      setNuevaFotoUrl(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ✅ Si es invitado, mostrar mensaje para registrarse
  if (esInvitado) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-700 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <LogIn className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              ¡Regístrate para personalizar!
            </h3>
            <p className="text-gray-400 mb-6">
              Como invitado tienes una tarjeta básica. Regístrate para:
            </p>
            <ul className="text-left text-sm text-gray-300 space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span> Subir tu foto de perfil
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span> Agregar tu descripción
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span> Indicar tu rol y preferencias
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span> Recibir likes y mensajes
              </li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
              >
                Ahora no
              </button>
              <button
                onClick={() => {
                  onClose();
                  // Redirigir a registro
                  window.location.href = '/auth';
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 transition-colors font-medium"
              >
                Registrarme
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <h3 className="font-bold text-lg text-white">Editar mi tarjeta</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Foto con upload */}
            <div className="flex justify-center">
              <div className="relative">
                <div className={`w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 ${isSubiendoFoto ? 'border-cyan-500 animate-pulse' : 'border-gray-600'}`}>
                  {/* ✅ Siempre mostrar la foto (preview o existente) */}
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="" className="w-full h-full object-cover" />
                  ) : tarjeta.fotoUrl ? (
                    <img src={tarjeta.fotoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-500" />
                  )}
                  {/* ✅ Overlay de subida (no reemplaza la foto) */}
                  {isSubiendoFoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                      <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubiendoFoto}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFotoSelect}
                  className="hidden"
                />
              </div>
            </div>
            {/* ✅ Mensaje de estado dinámico */}
            <p className="text-center text-xs text-gray-500">
              {isSubiendoFoto
                ? '⏳ Validando tu foto... esto puede tardar unos segundos'
                : nuevaFotoUrl
                  ? '✅ Foto guardada automáticamente'
                  : 'Toca el ícono de cámara para subir tu foto'}
            </p>

            {/* Datos básicos */}
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="Nombre"
                value={datos.nombre}
                onChange={(v) => updateDato('nombre', v)}
                placeholder="Tu nombre"
                maxLength={30}
              />
              <CampoNumero
                label="Edad"
                value={datos.edad}
                onChange={(v) => updateDato('edad', v)}
                placeholder="18"
                min={18}
                max={99}
                suffix="años"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <CampoSelect
                label="Sexo"
                value={datos.sexo}
                onChange={(v) => updateDato('sexo', v)}
                opciones={OPCIONES_SEXO}
                placeholder="Seleccionar"
              />
              <CampoSelect
                label="Rol"
                value={datos.rol}
                onChange={(v) => updateDato('rol', v)}
                opciones={OPCIONES_ROL}
                placeholder="Seleccionar"
              />
            </div>

            {/* Datos físicos */}
            <div className="grid grid-cols-2 gap-4">
              <CampoNumero
                label="Altura"
                value={datos.alturaCm}
                onChange={(v) => updateDato('alturaCm', v)}
                placeholder="175"
                min={100}
                max={250}
                suffix="cm"
              />
              <CampoNumero
                label="Medida (opcional)"
                value={datos.pesaje}
                onChange={(v) => updateDato('pesaje', v)}
                placeholder="—"
                min={1}
                max={50}
                suffix="cm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <CampoSelect
                label="Etnia"
                value={datos.etnia}
                onChange={(v) => updateDato('etnia', v)}
                opciones={OPCIONES_ETNIA}
                placeholder="Seleccionar"
              />
              <CampoTexto
                label="Ubicación"
                value={datos.ubicacionTexto}
                onChange={(v) => updateDato('ubicacionTexto', v)}
                placeholder="Santiago, Ñuñoa..."
                maxLength={50}
              />
            </div>

            {/* Bio */}
            <CampoTexto
              label="Descripción"
              value={datos.bio}
              onChange={(v) => updateDato('bio', v)}
              placeholder="Cuéntanos algo sobre ti..."
              maxLength={200}
              multiline
            />

            {/* Buscando */}
            <CampoTexto
              label="¿Qué buscas?"
              value={datos.buscando}
              onChange={(v) => updateDato('buscando', v)}
              placeholder="Amistad, encuentros, chat..."
              maxLength={100}
            />

            {/* Horarios */}
            <SelectorHorarios
              horarios={datos.horariosConexion}
              onChange={(v) => updateDato('horariosConexion', v)}
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 flex gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors font-medium"
            >
              Cancelar
            </button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleGuardar}
              disabled={isGuardando}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGuardando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TarjetaEditor;
