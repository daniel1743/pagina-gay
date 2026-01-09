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
import { useAuth } from '@/contexts/AuthContext';
import { updateGuestName } from '@/utils/guestIdentity';
import { toast } from '@/components/ui/use-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  User,
  Edit3,
  Flag,
  LogIn,
  LogOut,
  Settings,
  Shield,
} from 'lucide-react';

export function AvatarMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showChangeNameModal, setShowChangeNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [isChangingName, setIsChangingName] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  if (!user) return null;

  const isGuest = user.isGuest || user.isAnonymous;

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

  const handleReport = () => {
    // TODO: Implementar sistema de denuncias
    toast({
      title: 'Denuncias',
      description: 'Sistema de denuncias próximamente disponible',
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all hover:scale-105">
            <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-white dark:ring-gray-800">
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

        <DropdownMenuContent align="end" className="w-56">
          {/* Nombre de perfil */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.username || 'Usuario'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {isGuest ? 'Invitado' : isAdmin ? 'Administrador' : user.email || 'Usuario registrado'}
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* ⚡ OPCIONES PARA INVITADOS */}
          {isGuest && (
            <>
              {/* Cambiar nombre */}
              <DropdownMenuItem onClick={() => setShowChangeNameModal(true)}>
                <Edit3 className="mr-2 h-4 w-4" />
                <span>Cambiar nombre</span>
              </DropdownMenuItem>

              {/* Hacer denuncia */}
              <DropdownMenuItem onClick={handleReport}>
                <Flag className="mr-2 h-4 w-4" />
                <span>Hacer denuncia</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Iniciar sesión */}
              <DropdownMenuItem onClick={handleGoToAuth}>
                <LogIn className="mr-2 h-4 w-4" />
                <span>Iniciar sesión</span>
              </DropdownMenuItem>
            </>
          )}

          {/* ⚡ OPCIONES PARA USUARIOS REGISTRADOS */}
          {!isGuest && (
            <>
              {/* Mi perfil */}
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Mi perfil</span>
              </DropdownMenuItem>

              {/* Panel de Admin (solo para admins) */}
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Panel de Admin</span>
                </DropdownMenuItem>
              )}
            </>
          )}

          <DropdownMenuSeparator />

          {/* Cerrar sesión (para todos) */}
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
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
    </>
  );
}
