import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

/**
 * Modal de Entrada ULTRA RÁPIDA para Guests
 * ✅ NUEVA VERSIÓN: Solo nickname + avatar aleatorio
 * ⚡ CERO FRICCIÓN - Entrada en 1 segundo
 */
export const GuestUsernameModal = ({ open, onClose, chatRoomId = 'principal' }) => {
  const navigate = useNavigate();
  const { signInAsGuest } = useAuth();

  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [keepSession, setKeepSession] = useState(true); // ✅ Default TRUE - persistencia por defecto

  // ⚡ NUEVO: Verificar identidad existente y auto-entrar al chat
  useEffect(() => {
    if (open && hasGuestIdentity()) {
      console.log('[GuestModal] ✅ Identidad persistente detectada - entrando automáticamente...');
      // No mostrar modal, entrar directamente
      onClose();
      navigate(`/chat/${chatRoomId}`, { replace: true });
    }
  }, [open, chatRoomId, navigate, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ✅ Validación SIMPLE - solo nickname
    if (!nickname.trim()) {
      setError('Ingresa tu nickname');
      return;
    }
    if (nickname.trim().length < 3) {
      setError('El nickname debe tener al menos 3 caracteres');
      return;
    }

    console.log('%c═══════════════════════════════════════════', 'color: #00ffff; font-weight: bold');
    console.log('%c🚀 INICIO - Proceso de entrada al chat (MODAL)', 'color: #00ffff; font-weight: bold; font-size: 16px');
    console.log('%c═══════════════════════════════════════════', 'color: #00ffff; font-weight: bold');
    console.time('⏱️ [MODAL] Desde click hasta navegación');

    setIsLoading(true);

    try {
      // ⚡ Avatar ALEATORIO de las 10 opciones
      const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
      console.log(`🎨 Avatar seleccionado: ${randomAvatar.split('seed=')[1]}`);

      // ⚡ NUEVO: Guardar datos temporales para el sistema de persistencia
      if (keepSession) {
        saveTempGuestData({
          nombre: nickname.trim(),
          avatar: randomAvatar
        });
        console.log('[GuestModal] ✅ Datos guardados para persistencia');
      }

      // ⚡ OPTIMISTIC NAVIGATION: Navegar INMEDIATAMENTE (antes de Firebase)
      // Esto elimina la fricción de espera - el usuario ve el chat al instante
      console.log('%c✅ NAVEGANDO INMEDIATAMENTE (optimistic)...', 'color: #00ff00; font-weight: bold; font-size: 14px');
      onClose();
      navigate(`/chat/${chatRoomId}`, { replace: true });

      // ⚡ Crear usuario guest en Firebase EN BACKGROUND (no bloquea navegación)
      console.time('⏱️ [MODAL] signInAsGuest completo');
      signInAsGuest(nickname.trim(), randomAvatar, keepSession)
        .then(() => {
          console.timeEnd('⏱️ [MODAL] signInAsGuest completo');
          console.log('%c✅ Usuario creado en background con persistencia', 'color: #888; font-style: italic');
        })
        .catch((error) => {
          console.error('%c❌ Error en background (no crítico):', 'color: #ff0000; font-weight: bold', error);
          // Si falla, el usuario ya está en el chat - puede intentar de nuevo
        });

      // Toast DESPUÉS de navegar (no bloquea)
      setTimeout(() => {
        toast({
          title: "¡Bienvenido! 🎉",
          description: `Hola ${nickname.trim()}`,
        });
        console.timeEnd('⏱️ [TOTAL] Entrada completa al chat');
        console.log('%c═══════════════════════════════════════════', 'color: #00ffff; font-weight: bold');
        console.log('%c✅ PROCESO COMPLETADO (MODAL)', 'color: #00ff00; font-weight: bold; font-size: 16px');
        console.log('%c═══════════════════════════════════════════', 'color: #00ffff; font-weight: bold');
      }, 100);
    } catch (error) {
      console.timeEnd('⏱️ [MODAL] Desde click hasta navegación');
      console.timeEnd('⏱️ [TOTAL] Entrada completa al chat');
      console.error('%c❌ ERROR EN ENTRADA (MODAL):', 'color: #ff0000; font-weight: bold; font-size: 14px', error);
      console.log('%c═══════════════════════════════════════════', 'color: #ff0000; font-weight: bold');

      setError(`Error al entrar: ${error.message || 'Intenta de nuevo.'}`);
      setIsLoading(false);
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
              Sin registro • Sin esperas • 100% Gratis
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
                  ✨ Avatar asignado automáticamente
                </p>
                
                {/* ✅ Checkbox "Mantener sesión" */}
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
                    id="keep-session-guest"
                    checked={keepSession}
                    onChange={(e) => setKeepSession(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <label
                    htmlFor="keep-session-guest"
                    style={{
                      fontSize: '14px',
                      color: '#555',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    Mantener sesión
                  </label>
                </div>
                <p style={{ fontSize: '11px', color: '#999', marginBottom: '20px', marginTop: '-12px' }}>
                  Si marcas esta opción, la próxima vez mantendrás el mismo avatar y nombre
                </p>
                
                <button
                  type="submit"
                  disabled={isLoading || !nickname.trim()}
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'white',
                    background: isLoading || !nickname.trim()
                      ? 'linear-gradient(135deg, #999 0%, #888 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: isLoading || !nickname.trim() ? 'not-allowed' : 'pointer',
                    opacity: isLoading || !nickname.trim() ? '0.6' : '1',
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
