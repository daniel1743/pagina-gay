import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import {
  hasGuestIdentity,
  saveTempGuestData,
} from '@/utils/guestIdentity';
import { PROFILE_ROLE_OPTIONS, normalizeProfileRole } from '@/config/profileRoles';
import { COMUNA_OPTIONS, ONBOARDING_COMUNA_KEY, normalizeComuna } from '@/config/comunas';
import { track } from '@/services/eventTrackingService';
import { clearSeoFunnelContext, readSeoFunnelContext } from '@/utils/seoFunnelContext';
import { 
  trackModalOpen, 
  trackChatEntry, 
  trackGuestAuth,
  startTiming,
  endTiming,
} from '@/utils/performanceMonitor';

// 10 avatares para asignación aleatoria
const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=avatar3',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=avatar4',
  'https://api.dicebear.com/7.x/identicon/svg?seed=avatar5',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar6',
  'https://api.dicebear.com/7.x/bottts/svg?seed=avatar7',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=avatar8',
  'https://api.dicebear.com/7.x/identicon/svg?seed=avatar9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar10',
];

const HETERO_SEX_OPTIONS = ['Hombre', 'Mujer'];

/**
 * ✅ FASE 1.1: MODAL ÚNICO PARA INVITADOS - FIX CRÍTICO
 * Modal canónico y único punto de entrada para usuarios invitados
 * ⚡ CERO FRICCIÓN - Entrada en segundos con solo nickname + ENTER
 * 🔒 Restricción: Invitados solo pueden acceder a /chat/principal
 *
 * @param {boolean} open - Estado de apertura del modal
 * @param {function} onClose - Callback para cerrar el modal
 * @param {string} chatRoomId - (deprecated) Siempre usa 'principal'
 * @param {'auto'|'user'} openSource - Origen de apertura: 'auto' (automático) o 'user' (click manual del usuario)
 * @param {function} onGuestReady - Callback invocado cuando el invitado está listo (para que parent navegue)
 */
export const GuestUsernameModal = ({
  open,
  onClose,
  chatRoomId = 'principal',
  openSource = 'user', // Default: apertura manual por el usuario
  onGuestReady // Callback para que el parent maneje la navegación
}) => {
  const { signInAsGuest, setGuestAuthInProgress } = useAuth(); // ✅ FASE 2: Acceso al setter del loading overlay
  const isHeteroRoom = chatRoomId === 'hetero-general';

  const [nickname, setNickname] = useState('');
  const [selectedRole, setSelectedRole] = useState(() => {
    if (typeof window === 'undefined') return '';
    return normalizeProfileRole(localStorage.getItem('chactivo:role') || '') || '';
  });
  const [selectedComuna, setSelectedComuna] = useState(() => {
    if (typeof window === 'undefined') return '';
    return normalizeComuna(localStorage.getItem(ONBOARDING_COMUNA_KEY) || '') || '';
  });
  const [selectedSexo, setSelectedSexo] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('chactivo:hetero_sex') || '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(true); // ✅ PRE-MARCADO: Menos fricción para el usuario
  const modalOpenTimeRef = useRef(null); // 📊 Timestamp cuando se abre el modal
  const canSubmit = Boolean(
    nickname.trim() &&
    selectedComuna &&
    (isHeteroRoom ? selectedSexo : selectedRole)
  );

  // ⚡ FIX CRÍTICO: Auto-skip SOLO si openSource === 'auto'
  // Si es 'user' (click manual), el modal DEBE mostrarse incluso con identidad existente
  useEffect(() => {
    if (open && openSource === 'auto' && hasGuestIdentity()) {
      console.log('[GuestModal] ✅ Identidad persistente detectada (apertura AUTO) - notificando al parent...');
      const seoContext = readSeoFunnelContext();
      if (seoContext) {
        track('seo_chat_entry_completed', {
          room_id: chatRoomId,
          modal_source: openSource,
          completion_type: 'guest_identity_reused',
          seo_context_id: seoContext.contextId,
          seo_from_path: seoContext.fromPath,
          seo_country_path: seoContext.countryPath,
          seo_entry_method: seoContext.entryMethod,
        }).catch(() => {});
        clearSeoFunnelContext();
      }
      // Cerrar modal y notificar al parent para que navegue
      onClose();
      // Notificar al parent que hay identidad y puede navegar directamente
      if (onGuestReady) {
        onGuestReady({ hasExistingIdentity: true });
      }
    }
  }, [open, openSource, onClose, onGuestReady]);

  // 📊 PERFORMANCE MONITOR: Rastrear apertura del modal
  useEffect(() => {
    if (open) {
      modalOpenTimeRef.current = performance.now();
      trackModalOpen(modalOpenTimeRef.current);
      startTiming('guestModalInteraction', { action: 'modal_opened' });

      const seoContext = readSeoFunnelContext();
      if (seoContext) {
        track('seo_guest_modal_open', {
          room_id: chatRoomId,
          modal_source: openSource,
          seo_context_id: seoContext.contextId,
          seo_from_path: seoContext.fromPath,
          seo_country_path: seoContext.countryPath,
          seo_entry_method: seoContext.entryMethod,
          seo_landing_variant: seoContext.landingVariant,
        }).catch(() => {});
      }
    }
  }, [open, chatRoomId, openSource]);

  // ⚡ Auto-marcar checkbox de edad al presionar ENTER
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading && nickname.trim().length >= 3) {
      // Auto-confirmar edad al presionar ENTER
      setAgeConfirmed(true);
      // El submit se maneja automáticamente por el formulario
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ✅ Auto-confirmar edad al hacer submit (si no está marcado)
    if (!ageConfirmed) {
      setAgeConfirmed(true);
    }

    // 📊 PERFORMANCE MONITOR: Iniciar medición de entrada al chat
    const chatEntryStartTime = performance.now();

    // ✅ Validación - nickname
    if (!nickname.trim()) {
      setError('Ingresa tu nickname');
      setAgeConfirmed(false); // Reset si hay error
      return;
    }
    if (nickname.trim().length < 3) {
      setError('El nickname debe tener al menos 3 caracteres');
      setAgeConfirmed(false);
      return;
    }
    if (nickname.trim().length > 20) {
      setError('El nickname no puede tener más de 20 caracteres');
      setAgeConfirmed(false);
      return;
    }
    const normalizedRole = isHeteroRoom ? null : normalizeProfileRole(selectedRole);
    if (!isHeteroRoom && !normalizedRole) {
      setError('Selecciona tu rol para entrar al chat');
      setAgeConfirmed(false);
      return;
    }
    const normalizedSexo = isHeteroRoom ? String(selectedSexo || '').trim() : null;
    if (isHeteroRoom && !normalizedSexo) {
      setError('Selecciona si entras como hombre o mujer');
      setAgeConfirmed(false);
      return;
    }
    const normalizedComuna = normalizeComuna(selectedComuna);
    if (!normalizedComuna) {
      setError('Selecciona tu comuna o ciudad para conectar gente cerca');
      setAgeConfirmed(false);
      return;
    }

    console.log('%c═══════════════════════════════════════════', 'color: #00ffff; font-weight: bold');
    console.log('%c🚀 FASE 1: Entrada OPTIMISTIC - Navegación instantánea', 'color: #00ffff; font-weight: bold; font-size: 16px');
    console.log('%c═══════════════════════════════════════════', 'color: #00ffff; font-weight: bold');

    setIsLoading(true);
    setGuestAuthInProgress(true); // ✅ FASE 2: Activar loading overlay INMEDIATAMENTE

    try {
      // ⚡ Avatar ALEATORIO automático (usuario NO puede elegir)
      const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
      console.log(`🎨 Avatar asignado automáticamente: ${randomAvatar.split('seed=')[1]}`);

      // ✅ SIEMPRE guardar para persistencia (implícito keepSession=true)
      saveTempGuestData({
        nombre: nickname.trim(),
        avatar: randomAvatar,
        role: normalizedRole,
        comuna: normalizedComuna,
        sexo: normalizedSexo,
      });
      console.log('[GuestModal] ✅ Datos guardados para persistencia automática');

      if (typeof window !== 'undefined') {
        if (normalizedRole) {
          localStorage.setItem('chactivo:role', normalizedRole);
        }
        if (normalizedSexo) {
          localStorage.setItem('chactivo:hetero_sex', normalizedSexo);
        }
        localStorage.setItem(ONBOARDING_COMUNA_KEY, normalizedComuna);
      }

      // 📊 PERFORMANCE MONITOR: Iniciar tracking de autenticación
      const authStartTime = performance.now();
      startTiming('guestAuth', { username: nickname.trim() });

      // 📊 PERFORMANCE MONITOR: Registrar entrada al chat
      trackChatEntry(chatEntryStartTime);

      // ⚡ ESTRATEGIA OPTIMISTIC MEJORADA:
      // 1. Iniciar signInAsGuest (setea usuario optimistic inmediatamente)
      // 2. Esperar solo 100ms para que el usuario se setee
      // 3. Navegar (usuario ya está disponible, ChatPage NO muestra landing)
      // 4. Firebase completa en background (30+ segundos, invisible)

      console.log('%c✅ Iniciando signInAsGuest para setear usuario optimistic...', 'color: #00ff00; font-weight: bold; font-size: 14px');

      // Iniciar proceso (esto setea usuario en ~50ms)
      const guestPromise = signInAsGuest(nickname.trim(), randomAvatar, false, normalizedRole, normalizedComuna);

      // Esperar SOLO lo necesario para que setUser() se ejecute
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('%c✅ Usuario optimistic seteado - navegando ahora...', 'color: #00ff00; font-weight: bold; font-size: 14px');

      // Cerrar modal
      onClose();

      const seoContext = readSeoFunnelContext();
      if (seoContext) {
        track('seo_chat_entry_completed', {
          room_id: chatRoomId,
          modal_source: openSource,
          completion_type: 'guest_created',
          seo_context_id: seoContext.contextId,
          seo_from_path: seoContext.fromPath,
          seo_country_path: seoContext.countryPath,
          seo_entry_method: seoContext.entryMethod,
          seo_landing_variant: seoContext.landingVariant,
          nickname_length: nickname.trim().length,
          profile_role: normalizedRole,
          comuna: normalizedComuna,
          sexo: normalizedSexo,
        }).catch(() => {});
        clearSeoFunnelContext();
      }

      // Notificar al parent para que navegue (usuario YA está seteado)
      if (onGuestReady) {
        onGuestReady({
          hasExistingIdentity: false,
          nickname: nickname.trim(),
          avatar: randomAvatar,
          role: normalizedRole,
          comuna: normalizedComuna,
          sexo: normalizedSexo,
          authenticated: false,
          optimistic: true
        });
      }

      // ⚡ Firebase continúa en BACKGROUND (no bloquea navegación)
      console.time('⏱️ [MODAL] Firebase completo (background)');
      guestPromise
        .then(() => {
          console.timeEnd('⏱️ [MODAL] Firebase completo (background)');
          console.log('%c✅ Firebase autenticación completada en background', 'color: #888; font-style: italic');
          
          // 📊 PERFORMANCE MONITOR: Completar tracking de autenticación
          endTiming('guestAuth', { status: 'success' });
          trackGuestAuth(authStartTime, { 
            method: 'optimistic',
            username: nickname.trim(),
            completed: true 
          });
        })
        .catch((error) => {
          console.timeEnd('⏱️ [MODAL] Firebase completo (background)');
          console.error('%c❌ Error en Firebase background (no crítico):', 'color: #ff0000; font-weight: bold', error);
          
          // 📊 PERFORMANCE MONITOR: Registrar error en autenticación
          endTiming('guestAuth', { status: 'error', error: error.message });
        });

      // Toast DESPUÉS de navegar (no bloquea)
      setTimeout(() => {
        toast({
          title: "¡Bienvenido! 🎉",
          description: `Hola ${nickname.trim()}`,
        });
        console.log('%c═══════════════════════════════════════════', 'color: #00ffff; font-weight: bold');
        console.log('%c✅ FASE 1 COMPLETADA: Usuario invitado en /chat/principal (OPTIMISTIC)', 'color: #00ff00; font-weight: bold; font-size: 16px');
        console.log('%c═══════════════════════════════════════════', 'color: #00ffff; font-weight: bold');
      }, 100);
    } catch (error) {
      console.error('%c❌ ERROR EN ENTRADA (MODAL):', 'color: #ff0000; font-weight: bold; font-size: 14px', error);
      console.log('%c═══════════════════════════════════════════', 'color: #ff0000; font-weight: bold');

      const seoContext = readSeoFunnelContext();
      if (seoContext) {
        track('seo_guest_modal_error', {
          room_id: chatRoomId,
          modal_source: openSource,
          seo_context_id: seoContext.contextId,
          seo_from_path: seoContext.fromPath,
          seo_country_path: seoContext.countryPath,
          seo_entry_method: seoContext.entryMethod,
          error_message: error?.message || 'guest_modal_error',
        }).catch(() => {});
      }

      setError(`Error al entrar: ${error.message || 'Intenta de nuevo.'}`);
      setAgeConfirmed(false); // Reset en caso de error
      setIsLoading(false);
      setGuestAuthInProgress(false); // ✅ FASE 2: Desactivar loading overlay en caso de error
      
      // 📊 PERFORMANCE MONITOR: Registrar error
      endTiming('guestModalInteraction', { action: 'error', error: error.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Entra SIN Registro</DialogTitle>
          <DialogDescription>Completa estos datos para empezar a chatear</DialogDescription>
        </DialogHeader>
        <style>{`
          .modal-scroll::-webkit-scrollbar {
            display: none;
          }
          .modal-scroll {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <div 
          className="modal-scroll"
          style={{ 
            width: '100%', 
            maxHeight: '90vh', 
            overflowY: 'auto',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'Arial, sans-serif',
            padding: '40px',
            boxSizing: 'border-box'
          }}
        >
          <div 
            style={{ 
              width: '100%', 
              maxWidth: '500px', 
              margin: '0 auto',
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '20px', 
              padding: '40px', 
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
              textAlign: 'center'
            }}
          >
            <h1 style={{ fontSize: '38px', fontWeight: 'bold', color: '#667eea', marginBottom: '8px' }}>
              Chatea YA
            </h1>
            <p style={{ fontSize: '18px', color: '#555', marginBottom: '8px', fontWeight: '600' }}>
              con Gente Real
            </p>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '30px' }}>
              {isHeteroRoom ? 'Sin registro • Sala activa • 100% Gratis' : 'Sin registro • Sin esperas • 100% Gratis'}
              </p>

            <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
                  Tu Nickname:
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ej: Carlos23"
                  maxLength={20}
                  required
                  autoFocus
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '18px',
                    border: '2px solid #667eea',
                    borderRadius: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'white',
                    color: '#333',
                    fontWeight: '500',
                    marginBottom: '16px'
                  }}
                />
                <p style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
                  ✨ Avatar asignado automáticamente • Presiona ENTER para entrar
                </p>

                {isHeteroRoom && (
                  <>
                    <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
                      Entras como:
                    </label>
                    <select
                      value={selectedSexo}
                      onChange={(e) => {
                        setSelectedSexo(e.target.value);
                        if (error) setError('');
                      }}
                      required
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '16px',
                        border: '2px solid #667eea',
                        borderRadius: '12px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: 'white',
                        color: '#333',
                        fontWeight: '500',
                        marginBottom: '16px'
                      }}
                    >
                      <option value="">Selecciona hombre o mujer</option>
                      {HETERO_SEX_OPTIONS.map((sexoOption) => (
                        <option key={sexoOption} value={sexoOption}>
                          {sexoOption}
                        </option>
                      ))}
                    </select>
                    <p style={{ fontSize: '11px', color: '#888', marginBottom: '16px' }}>
                      Lo usamos solo para ordenar mejor la entrada a esta sala.
                    </p>
                  </>
                )}

                {!isHeteroRoom && (
                  <>
                    <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
                      Tu Rol (obligatorio):
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => {
                        setSelectedRole(e.target.value);
                        if (error) setError('');
                      }}
                      required
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '16px',
                        border: '2px solid #667eea',
                        borderRadius: '12px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: 'white',
                        color: '#333',
                        fontWeight: '500',
                        marginBottom: '16px'
                      }}
                    >
                      <option value="">Selecciona un rol</option>
                      {PROFILE_ROLE_OPTIONS.map((roleOption) => (
                        <option key={roleOption.value} value={roleOption.value}>
                          {roleOption.label}
                        </option>
                      ))}
                    </select>
                    <p style={{ fontSize: '11px', color: '#888', marginBottom: '16px' }}>
                      Activo, Versátil Act, Versátil Pasivo, Pasivo, Inter, Hetero Curioso, Solo Mamar, Solo Ver
                    </p>
                  </>
                )}

                <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
                  Tu comuna o ciudad:
                </label>
                <select
                  value={selectedComuna}
                  onChange={(e) => {
                    setSelectedComuna(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '16px',
                    border: '2px solid #667eea',
                    borderRadius: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'white',
                    color: '#333',
                    fontWeight: '500',
                    marginBottom: '10px'
                  }}
                >
                  <option value="">Selecciona tu comuna o ciudad</option>
                  {COMUNA_OPTIONS.map((comunaOption) => (
                    <option key={comunaOption} value={comunaOption}>
                      {comunaOption}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '11px', color: '#888', marginBottom: '16px' }}>
                  Esto ayuda a mostrarte gente cercana y ordenar mejor la sala.
                </p>
                
                {/* ✅ Checkbox "Soy mayor de edad" (se auto-marca con ENTER o submit) */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '20px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <input
                    type="checkbox"
                    id="age-confirmation-guest"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <label
                    htmlFor="age-confirmation-guest"
                    style={{
                      fontSize: '14px',
                      color: '#555',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    Soy mayor de edad y entiendo que entro a una sala para adultos
                  </label>
                </div>
                <p style={{ fontSize: '11px', color: '#999', marginBottom: '20px', marginTop: '-12px' }}>
                  Se marca automáticamente al presionar ENTER o hacer click en "Ir al Chat"
                </p>
                
                <button
                  type="submit"
                  onClick={() => setAgeConfirmed(true)} // ✅ Auto-marcar checkbox al hacer click
                  disabled={isLoading || !canSubmit}
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'white',
                    background: isLoading || !canSubmit
                      ? 'linear-gradient(135deg, #999 0%, #888 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: isLoading || !canSubmit ? 'not-allowed' : 'pointer',
                    opacity: isLoading || !canSubmit ? '0.6' : '1',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{isLoading ? '⏳ Entrando...' : '🚀 Ir al Chat'}</span>
                </button>
              </div>

              {error && (
                <div style={{ 
                  padding: '12px', 
                  marginBottom: '20px', 
                  backgroundColor: '#fee', 
                  border: '1px solid #fcc', 
                  borderRadius: '8px', 
                  color: '#c33', 
                  fontSize: '14px' 
                }}>
                  {error}
                </div>
              )}
            </form>

            <p style={{ fontSize: '12px', color: '#999', marginTop: '24px', lineHeight: '1.6' }}>
              Totalmente anónimo • Sin descargas<br/>
              Desde tu navegador
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
