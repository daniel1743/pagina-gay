import React from 'react';

/**
 * 👻 COMPONENTE: AuthorBadge
 *
 * Muestra el nombre de un autor con tratamiento especial para usuarios anónimos.
 * - Si el usuario es "Usuario X" o "Usuario Anónimo" → Muestra 👻 + nombre en morado
 * - Si es usuario registrado → Muestra nombre normal
 *
 * @param {string} name - Nombre del autor a mostrar
 * @param {string} className - Clases CSS adicionales para personalización
 */
const AuthorBadge = ({ name, className = "" }) => {
  const authorName = name || 'Usuario Anónimo';
  // Detecta si es "Usuario X" (donde X es número) o "Usuario Anónimo"
  const isUsuarioX = /^Usuario\s+\d+$/i.test(authorName) || authorName === 'Usuario Anónimo';

  if (isUsuarioX) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="text-base">👻</span>
        <span className="font-semibold text-purple-300">{authorName}</span>
      </div>
    );
  }

  return <span className={`font-semibold ${className}`}>{authorName}</span>;
};

export default AuthorBadge;
