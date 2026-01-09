/**
 * useGuestIdentity - Hook personalizado para gestionar identidad de invitados
 *
 * Proporciona una interfaz reactiva para trabajar con la identidad persistente
 * de usuarios invitados.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getGuestIdentity,
  createGuestIdentity,
  updateGuestName,
  updateGuestAvatar,
  clearGuestIdentity,
  hasGuestIdentity,
  linkGuestToFirebase,
  migrateLegacyGuestData,
} from '@/utils/guestIdentity';

export function useGuestIdentity() {
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar identidad al montar
  useEffect(() => {
    // Migrar datos legacy si existen
    migrateLegacyGuestData();

    // Cargar identidad
    const current = getGuestIdentity();
    setIdentity(current);
    setLoading(false);
  }, []);

  // Crear nueva identidad
  const create = useCallback((data) => {
    const newIdentity = createGuestIdentity(data);
    setIdentity(newIdentity);
    return newIdentity;
  }, []);

  // Actualizar nombre
  const changeName = useCallback((nuevoNombre) => {
    const updated = updateGuestName(nuevoNombre);
    if (updated) {
      setIdentity(updated);
    }
    return updated;
  }, []);

  // Actualizar avatar
  const changeAvatar = useCallback((nuevoAvatar) => {
    const updated = updateGuestAvatar(nuevoAvatar);
    if (updated) {
      setIdentity(updated);
    }
    return updated;
  }, []);

  // Vincular con Firebase
  const linkFirebase = useCallback((firebaseUid) => {
    const updated = linkGuestToFirebase(firebaseUid);
    if (updated) {
      setIdentity(updated);
    }
    return updated;
  }, []);

  // Limpiar identidad (logout)
  const clear = useCallback(() => {
    clearGuestIdentity();
    setIdentity(null);
  }, []);

  // Recargar desde localStorage
  const reload = useCallback(() => {
    const current = getGuestIdentity();
    setIdentity(current);
  }, []);

  return {
    identity,
    loading,
    exists: hasGuestIdentity(),
    create,
    changeName,
    changeAvatar,
    linkFirebase,
    clear,
    reload,
  };
}
