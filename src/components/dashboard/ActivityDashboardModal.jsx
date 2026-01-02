import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { BarChart3, MessageSquare, Users, Heart, MessageCircle, TrendingUp, Loader2 } from 'lucide-react';
import { getUserActivityStats } from '@/services/activityService';

const ActivityDashboardModal = ({ isOpen, onClose, userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      getUserActivityStats(userId)
        .then(data => {
          setStats(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error loading activity stats:', error);
          setLoading(false);
        });
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-hide bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white border border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            Tu Actividad Hoy
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Estadísticas de tu actividad en Chactivo
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : stats ? (
          <div className="space-y-4 mt-4">
            {/* Grid de Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mensajes Enviados */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-effect rounded-xl p-4 border border-purple-500/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold text-slate-200">Mensajes Enviados</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-400">{stats.messagesSent || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Mensajes en salas públicas hoy</p>
              </motion.div>

              {/* Personas con las que Interactuó */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-effect rounded-xl p-4 border border-cyan-500/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    <span className="font-semibold text-slate-200">Interacciones</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-cyan-400">{stats.uniqueInteractions || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Personas diferentes con las que hablaste</p>
              </motion.div>

              {/* Popularidad (Favoritos) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-effect rounded-xl p-4 border border-pink-500/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-400" />
                    <span className="font-semibold text-slate-200">Popularidad</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-pink-400">{stats.favoriteCount || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Usuarios que te agregaron a favoritos</p>
              </motion.div>

              {/* Conversaciones Privadas */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-effect rounded-xl p-4 border border-green-500/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-slate-200">Chats Privados</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-400">{stats.privateChatsCount || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Conversaciones privadas activas</p>
              </motion.div>
            </div>

            {/* Persona con la que más habló */}
            {stats.topConversationPartner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-effect rounded-xl p-4 border border-yellow-500/30"
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold text-slate-200">Conversación Más Activa</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                    {stats.topConversationPartner.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg text-white">{stats.topConversationPartner.username || 'Usuario'}</p>
                    <p className="text-sm text-slate-400">
                      {stats.topConversationPartner.messageCount || 0} mensajes intercambiados
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {!stats.topConversationPartner && (
              <div className="text-center py-8 text-slate-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay conversaciones activas aún</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <p>No se pudieron cargar las estadísticas</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ActivityDashboardModal;

