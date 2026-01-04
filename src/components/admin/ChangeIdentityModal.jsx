import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

/**
 * 🎭 MODAL: Cambiar Identidad del Admin
 * Permite al admin cambiar temporalmente su nombre y avatar para participar en conversaciones
 */
const ChangeIdentityModal = ({ isOpen, onClose, onChangeIdentity, currentUser }) => {
  const [tempUsername, setTempUsername] = useState('');
  const [tempAvatar, setTempAvatar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lista de avatares predefinidos para selección rápida
  const quickAvatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=admin1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=admin2',
    'https://api.dicebear.com/7.x/bottts/svg?seed=robot1',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=pixel1',
    'https://api.dicebear.com/7.x/identicon/svg?seed=id1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    'https://api.dicebear.com/7.x/bottts/svg?seed=bot2',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=retro1',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tempUsername.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const avatarUrl = tempAvatar.trim() || quickAvatars[0];

      await onChangeIdentity({
        username: tempUsername.trim(),
        avatar: avatarUrl,
      });

      // Limpiar y cerrar
      setTempUsername('');
      setTempAvatar('');
      onClose();
    } catch (error) {
      console.error('[CHANGE IDENTITY] Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-purple-900 via-gray-900 to-gray-900 border-2 border-purple-500/30 text-white">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
            <UserCircle2 className="w-6 h-6 text-purple-400" />
            Cambiar Identidad Temporal
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Cambia tu nombre y avatar para participar en conversaciones como otro usuario.
            <span className="block mt-2 text-yellow-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Seguirás siendo admin con todos tus permisos
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Nombre Actual */}
          <div className="bg-white/5 rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Identidad Actual:</p>
                <p className="text-lg font-semibold text-white">{currentUser?.username || 'Admin'}</p>
              </div>
              <img
                src={currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'}
                alt="Avatar actual"
                className="w-12 h-12 rounded-full border-2 border-purple-500"
              />
            </div>
          </div>

          {/* Nuevo Nombre */}
          <div className="space-y-2">
            <Label htmlFor="temp-username" className="text-white font-semibold">
              Nuevo Nombre:
            </Label>
            <Input
              id="temp-username"
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="Ej: Carlos23, Usuario123, etc."
              maxLength={20}
              className="bg-white/10 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500"
              required
              autoFocus
            />
            <p className="text-xs text-gray-400">
              Este nombre aparecerá en el chat en lugar de tu nombre de admin
            </p>
          </div>

          {/* Nuevo Avatar */}
          <div className="space-y-2">
            <Label htmlFor="temp-avatar" className="text-white font-semibold">
              URL del Avatar (opcional):
            </Label>
            <Input
              id="temp-avatar"
              type="text"
              value={tempAvatar}
              onChange={(e) => setTempAvatar(e.target.value)}
              placeholder="https://..."
              className="bg-white/10 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500"
            />
          </div>

          {/* Avatares Rápidos */}
          <div className="space-y-2">
            <Label className="text-white font-semibold">Avatares Rápidos:</Label>
            <div className="grid grid-cols-8 gap-2">
              {quickAvatars.map((avatarUrl, index) => (
                <motion.button
                  key={index}
                  type="button"
                  onClick={() => setTempAvatar(avatarUrl)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-12 h-12 rounded-full border-2 transition-all ${
                    tempAvatar === avatarUrl
                      ? 'border-purple-500 ring-2 ring-purple-400'
                      : 'border-gray-600 hover:border-purple-400'
                  }`}
                >
                  <img
                    src={avatarUrl}
                    alt={`Avatar ${index + 1}`}
                    className="w-full h-full rounded-full"
                  />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {tempUsername.trim() && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30"
            >
              <p className="text-sm text-gray-400 mb-2">Vista Previa:</p>
              <div className="flex items-center gap-3">
                <img
                  src={tempAvatar.trim() || quickAvatars[0]}
                  alt="Preview"
                  className="w-10 h-10 rounded-full border-2 border-purple-500"
                />
                <div>
                  <p className="font-semibold text-white">{tempUsername.trim()}</p>
                  <p className="text-xs text-gray-400">Aparecerás así en el chat</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Advertencia */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Eye className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-400">Importante:</p>
                <ul className="text-xs text-gray-300 mt-1 space-y-1">
                  <li>• Solo TÚ verás que sigues siendo admin</li>
                  <li>• Los usuarios te verán como "{tempUsername.trim() || 'nuevo usuario'}"</li>
                  <li>• Podrás restaurar tu identidad cuando quieras</li>
                  <li>• Tus permisos de admin se mantienen activos</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!tempUsername.trim() || isSubmitting}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Aplicando...
                </>
              ) : (
                <>
                  <UserCircle2 className="w-4 h-4 mr-2" />
                  Cambiar Identidad
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeIdentityModal;
