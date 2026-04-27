/**
 * AvatarMenu - Menú desplegable con avatar del usuario
 *
 * Muestra el avatar en la esquina superior derecha y un dropdown con opciones:
 * - Nombre de perfil
 * - Cambiar nombre
 * - Hacer denuncia
 * - Iniciar sesión (si es invitado)
 * - Cerrar sesión
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { updateGuestName } from '@/utils/guestIdentity';
import { toast } from '@/components/ui/use-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import AvatarSelector from '@/components/profile/AvatarSelector';
import {
  canRequestPush,
  getPushInterestPreferences,
  isPushEnabled,
  requestNotificationPermission,
  savePushInterestPreferences,
} from '@/services/pushNotificationService';
import {
  User,
  Edit3,
  Flag,
  LogIn,
  LogOut,
  Shield,
  Home,
  Bell,
  Camera,
} from 'lucide-react';

const INTEREST_OPTIONS = [
  { key: 'more_people_connected', label: 'Más personas conectadas' },
  { key: 'more_room_activity', label: 'Más actividad en sala' },
  { key: 'direct_messages', label: 'Cuando me escriban' },
  { key: 'profile_views', label: 'Cuando vean mi perfil' },
  { key: 'opin_comments', label: 'Cuando comenten mi OPIN' },
  { key: 'baul_card_views', label: 'Cuando vean mi tarjeta Baúl' },
];

export function AvatarMenu() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [showChangeNameModal, setShowChangeNameModal] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [newName, setNewName] = useState('');
  const [isChangingName, setIsChangingName] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [preferences, setPreferences] = useState(() => getPushInterestPreferences(user?.id || null));
  const [isRequestingPush, setIsRequestingPush] = useState(false);
  const [pushGranted, setPushGranted] = useState(() => isPushEnabled());

  const isGuest = Boolean(user?.isGuest || user?.isAnonymous);
  const userId = user?.id || null;
  const menuItemClassName = 'h-11 rounded-[14px] px-3 text-[14px] font-medium text-slate-900 outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900';

  useEffect(() => {
    const merged = {
      ...getPushInterestPreferences(userId),
      ...(user?.pushInterestPreferences || {}),
    };
    setPreferences(merged);
    setPushGranted(isPushEnabled());
  }, [userId, user?.pushInterestPreferences]);

  // Verificar si el usuario es admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user || user.isGuest || user.isAnonymous) {
        setIsAdmin(false);
        return;
      }

      // Primero verificar si ya está en el objeto user
      if (user.role === 'admin' || user.role === 'administrator' || user.role === 'superAdmin') {
        setIsAdmin(true);
        return;
      }

      // Si no está, consultar Firestore directamente
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role;
          setIsAdmin(role === 'admin' || role === 'administrator' || role === 'superAdmin');
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('[AvatarMenu] Error checking admin role:', error);
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, [user]);

  const handleChangeName = async () => {
    if (!newName.trim() || newName.trim().length < 3) {
      toast({
        title: 'Error',
        description: 'El nombre debe tener al menos 3 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingName(true);

    try {
      // Si es invitado, actualizar localStorage
      if (isGuest) {
        updateGuestName(newName.trim());
      }

      // TODO: Actualizar en Firestore para usuarios registrados
      // await updateUserProfile(user.id, { username: newName.trim() });

      toast({
        title: 'Nombre actualizado',
        description: `Tu nuevo nombre es: ${newName.trim()}`,
      });

      setShowChangeNameModal(false);
      setNewName('');

      // Recargar para aplicar cambios
      window.location.reload();
    } catch (error) {
      console.error('[AvatarMenu] Error cambiando nombre:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el nombre',
        variant: 'destructive',
      });
    } finally {
      setIsChangingName(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/landing', { replace: true });
      toast({
        title: 'Sesión cerrada',
        description: 'Has salido del chat',
      });
    } catch (error) {
      console.error('[AvatarMenu] Error cerrando sesión:', error);
    }
  };

  const handleGoToAuth = () => {
    navigate('/auth');
  };

  const handleGoHome = () => {
    navigate(isGuest ? '/landing' : '/home');
  };

  const handleOpenProfile = () => {
    if (isGuest) {
      toast({
        title: 'Crea tu perfil para verlo completo',
        description: 'Regístrate para acceder a tu perfil, foto y edición completa.',
      });
      navigate('/auth');
      return;
    }
    navigate('/profile');
  };

  const handleEditProfile = () => {
    if (isGuest) {
      handleGoToAuth();
      return;
    }
    navigate('/profile');
  };

  const handleChangePhoto = () => {
    if (isGuest) {
      toast({
        title: 'Crea tu cuenta para personalizar tu perfil',
        description: 'Necesitas registrarte para cambiar tu foto.',
      });
      navigate('/auth');
      return;
    }
    setShowAvatarSelector(true);
  };

  const requireRegisteredUser = () => {
    if (!isGuest) return true;
    toast({
      title: 'Regístrate para personalizar avisos',
      description: 'Los avisos por intereses se guardan en tu cuenta.',
      duration: 4500,
      action: {
        label: 'Crear cuenta',
        onClick: () => navigate('/auth'),
      },
    });
    return false;
  };

  const ensurePushPermission = async () => {
    if (isPushEnabled()) {
      setPushGranted(true);
      return true;
    }
    if (!canRequestPush()) {
      toast({
        title: 'Activa notificaciones en tu navegador',
        description: 'El permiso está bloqueado. Debes habilitarlo en configuración del sitio.',
        variant: 'destructive',
      });
      return false;
    }

    setIsRequestingPush(true);
    try {
      const token = await requestNotificationPermission();
      const granted = Boolean(token) || isPushEnabled();
      setPushGranted(granted);
      if (!granted) {
        toast({
          title: 'Notificaciones no activadas',
          description: 'Acepta el permiso para recibir avisos en teléfono y desktop.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Notificaciones activadas',
          description: 'Ahora puedes elegir exactamente qué avisos quieres recibir.',
        });
      }
      return granted;
    } finally {
      setIsRequestingPush(false);
    }
  };

  const updatePreference = async (key, checked) => {
    if (!requireRegisteredUser()) return;
    const nextEnabled = checked === true;

    if (nextEnabled) {
      const canUsePush = await ensurePushPermission();
      if (!canUsePush) return;
    }

    const next = { ...preferences, [key]: nextEnabled };
    setPreferences(next);
    await savePushInterestPreferences(next, userId);
  };

  const handleReport = () => {
    // TODO: Implementar sistema de denuncias
    toast({
      title: 'Denuncias',
      description: 'Sistema de denuncias próximamente disponible',
      });
  };

  if (!user) return null;

  return (
    <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
          <button className="relative rounded-full transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2">
            <Avatar className="h-9 w-9 cursor-pointer border border-border/60 bg-background shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
              <AvatarImage
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                alt={user.username || 'Usuario'}
              />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {(user.username || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Indicador de invitado */}
            {isGuest && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-orange-500 rounded-full border-2 border-white dark:border-gray-800" />
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-[248px] rounded-[22px] border border-slate-200 bg-white p-1.5 text-slate-900 shadow-[0_24px_56px_rgba(15,23,42,0.16)]"
        >
          {/* Nombre de perfil */}
          <DropdownMenuLabel className="px-3 py-3 font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-[14px] font-semibold leading-none text-slate-900">{user.username || 'Usuario'}</p>
              <p className="text-[11px] leading-none text-slate-500">
                {isGuest ? 'Invitado' : isAdmin ? 'Administrador' : user.email || 'Usuario registrado'}
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleGoHome} className={menuItemClassName}>
            <Home className="mr-2 h-4 w-4" />
            <span>Ir a inicio</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleOpenProfile} className={menuItemClassName}>
            <User className="mr-2 h-4 w-4" />
            <span>{isGuest ? 'Crear perfil' : 'Mi perfil'}</span>
          </DropdownMenuItem>

          {/* ⚡ OPCIONES PARA INVITADOS */}
          {isGuest && (
            <>
              {/* Cambiar nombre */}
              <DropdownMenuItem onClick={() => setShowChangeNameModal(true)} className={menuItemClassName}>
                <Edit3 className="mr-2 h-4 w-4" />
                <span>Cambiar nombre</span>
              </DropdownMenuItem>

              {/* Hacer denuncia */}
              <DropdownMenuItem onClick={handleReport} className={menuItemClassName}>
                <Flag className="mr-2 h-4 w-4" />
                <span>Hacer denuncia</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Iniciar sesión */}
              <DropdownMenuItem onClick={handleGoToAuth} className={menuItemClassName}>
                <LogIn className="mr-2 h-4 w-4" />
                <span>Iniciar sesión</span>
              </DropdownMenuItem>
            </>
          )}

          {/* ⚡ OPCIONES PARA USUARIOS REGISTRADOS */}
          {!isGuest && (
            <>
              <DropdownMenuItem onClick={handleEditProfile} className={menuItemClassName}>
                <Edit3 className="mr-2 h-4 w-4" />
                <span>Editar perfil</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleChangePhoto} className={menuItemClassName}>
                <Camera className="mr-2 h-4 w-4" />
                <span>Cambiar foto</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setShowNotificationSettings(true)} className={menuItemClassName}>
                <Bell className="mr-2 h-4 w-4" />
                <span>Ajustes de notificaciones</span>
              </DropdownMenuItem>

              {/* Panel de Admin (solo para admins) */}
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate('/admin')} className={menuItemClassName}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Panel de Admin</span>
                </DropdownMenuItem>
              )}
            </>
          )}

          <DropdownMenuSeparator />

          {/* Cerrar sesión (para todos) */}
          <DropdownMenuItem onClick={handleLogout} className={`${menuItemClassName} text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700 dark:text-red-400 dark:hover:text-red-300`}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de cambio de nombre */}
      <Dialog open={showChangeNameModal} onOpenChange={setShowChangeNameModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cambiar nombre</DialogTitle>
            <DialogDescription>
              Ingresa tu nuevo nombre. Será visible para todos los demás usuarios.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={user.username || 'Tu nuevo nombre'}
                className="col-span-3"
                maxLength={20}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowChangeNameModal(false)}
              disabled={isChangingName}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangeName}
              disabled={isChangingName || !newName.trim() || newName.trim().length < 3}
            >
              {isChangingName ? 'Cambiando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!isGuest && (
        <AvatarSelector
          isOpen={showAvatarSelector}
          onClose={() => setShowAvatarSelector(false)}
          currentAvatar={user.avatar}
          onSelect={async (newAvatar) => {
            await updateProfile({ avatar: newAvatar });
            setShowAvatarSelector(false);
          }}
        />
      )}

      <Dialog open={showNotificationSettings} onOpenChange={setShowNotificationSettings}>
        <DialogContent className="sm:max-w-[460px] rounded-3xl border border-border/90 bg-popover text-popover-foreground shadow-[0_24px_64px_rgba(15,23,42,0.24)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Ajustes de notificaciones
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Elige qué avisos quieres recibir. Este panel ahora usa una superficie opaca y legible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-2xl border border-border/80 bg-card px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {pushGranted ? 'Push activo en este dispositivo' : 'Activar notificaciones push'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Permite recibir avisos en mobile y desktop.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isRequestingPush}
                  onClick={() => {
                    if (!requireRegisteredUser()) return;
                    ensurePushPermission().catch(() => {});
                  }}
                  className="magenta-gradient text-white"
                >
                  {pushGranted ? 'Activo' : isRequestingPush ? 'Activando...' : 'Activar'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {INTEREST_OPTIONS.map((option) => (
                <div
                  key={option.key}
                  className="flex items-center justify-between rounded-2xl border border-border/80 bg-card px-4 py-3"
                >
                  <div className="pr-3">
                    <p className="text-sm font-medium text-foreground">{option.label}</p>
                  </div>
                  <Switch
                    checked={preferences[option.key] !== false}
                    onCheckedChange={(checked) => {
                      updatePreference(option.key, checked).catch(() => {});
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
