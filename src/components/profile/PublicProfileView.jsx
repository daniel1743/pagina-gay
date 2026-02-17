/**
 * Vista pública del perfil de un usuario
 * Muestra foto, nombre, rol, intereses, descripción y estado.
 * Reutilizable en página /profile/:userId, modal desde chat, tarjeta, etc.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, Shield } from 'lucide-react';

const PublicProfileView = ({ profile, isLoading = false, onClose, showCloseButton = false }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-24 h-24 rounded-full bg-muted animate-pulse mb-4" />
        <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 px-4 text-muted-foreground">
        <p>Este perfil no está disponible o el usuario lo ha ocultado.</p>
      </div>
    );
  }

  const roleValue = (profile.role || '').toString().toLowerCase();
  const isAdminRole = roleValue === 'admin' || roleValue === 'administrator' || roleValue === 'superadmin';
  const displayRole = profile.profileRole || (!['admin', 'administrator', 'superadmin', 'support', 'user'].includes(roleValue) ? profile.role : '') || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col"
    >
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cerrar"
        >
          <span className="text-xl">×</span>
        </button>
      )}

      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
        <div className="relative flex-shrink-0">
          <div className={`rounded-full ${
            isAdminRole ? 'admin-avatar-ring' :
            profile.verified ? 'verified-avatar-ring' :
            profile.isPremium ? 'premium-avatar-ring' : ''
          }`}>
            <Avatar className="w-28 h-28 md:w-36 md:h-36">
              <AvatarImage src={profile.avatar} alt={profile.username} />
              <AvatarFallback className="text-3xl bg-[#413e62] text-white">
                {profile.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center justify-center md:justify-start gap-2">
            {profile.username}
            {(profile.isPremium || isAdminRole) && (
              <CheckCircle className="w-5 h-5 text-[#FFD700]" />
            )}
            {profile.verified && !profile.isPremium && !isAdminRole && (
              <CheckCircle className="w-5 h-5 text-[#1DA1F2]" />
            )}
          </h1>

          <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
            {profile.verified && (
              <span className="bg-[#1DA1F2]/20 text-[#1DA1F2] px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Verificado
              </span>
            )}
          </div>

          {profile.description && (
            <p className="text-muted-foreground mb-2 text-sm md:text-base">
              "{profile.description}"
            </p>
          )}

          {profile.estado && (
            <p className="text-sm font-medium text-cyan-400 mb-3">{profile.estado}</p>
          )}

          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {displayRole && (
              <span className="bg-accent text-cyan-600 dark:text-cyan-300 px-3 py-1 text-sm rounded-full font-medium">
                {displayRole}
              </span>
            )}
            {profile.interests?.map((interest) => (
              <span
                key={interest}
                className="bg-accent text-foreground px-3 py-1 text-sm rounded-full"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PublicProfileView;
