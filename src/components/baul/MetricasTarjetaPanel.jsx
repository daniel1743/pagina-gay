/**
 * MetricasTarjetaPanel - Métricas internas de la tarjeta
 *
 * Muestra: quién te vio, quién te escribió, quién te dio like,
 * popularidad, mensajes. Cada fila permite visitar la tarjeta e interactuar.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  MessageSquare,
  Eye,
  ChevronRight,
  Footprints,
  TrendingUp,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { obtenerMetricasTarjeta, obtenerTarjeta, obtenerFotoPrincipal } from '@/services/tarjetaService';
import MensajeTarjetaModal from './MensajeTarjetaModal';
import { useAuth } from '@/contexts/AuthContext';

const formatearTiempo = (timestamp) => {
  if (!timestamp) return '';
  const fecha = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const ahora = new Date();
  const diffMs = ahora - fecha;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMs / 3600000);
  const diffDias = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHoras < 24) return `${diffHoras}h`;
  if (diffDias < 7) return `${diffDias}d`;
  return fecha.toLocaleDateString();
};

/** Fila de persona - clickeable para abrir tarjeta e interactuar */
const FilaPersona = ({ userId, username, avatar, subtitle, icono, iconColor, onVerTarjeta }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!userId || !onVerTarjeta) return;
    setLoading(true);
    try {
      const tarjeta = await obtenerTarjeta(userId);
      if (tarjeta) onVerTarjeta(tarjeta);
    } catch (err) {
      console.warn('[METRICAS] Error cargando tarjeta:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition-colors"
      onClick={handleClick}
    >
      {loading ? (
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin flex-shrink-0" />
      ) : (
        <>
          {avatar ? (
            <img src={avatar} alt={username} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              {username?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{username || 'Usuario'}</p>
            {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
          </div>
          {icono && <div className={iconColor || 'text-gray-400'}>{icono}</div>}
          <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
        </>
      )}
    </motion.div>
  );
};

const MetricasTarjetaPanel = ({ isOpen, onClose, onRefresh }) => {
  const { user } = useAuth();
  const miUserId = user?.id;
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState(null);
  const [mostrarMensajeModal, setMostrarMensajeModal] = useState(false);

  useEffect(() => {
    if (!isOpen || !miUserId) return;
    setLoading(true);
    obtenerMetricasTarjeta(miUserId)
      .then(setMetricas)
      .catch((err) => {
        console.error('[METRICAS] Error:', err);
        setMetricas(null);
      })
      .finally(() => setLoading(false));
  }, [isOpen, miUserId, onRefresh]);

  const handleVerTarjeta = (tarjeta) => {
    setTarjetaSeleccionada(tarjeta);
    setMostrarMensajeModal(true);
  };

  if (!isOpen) return null;

  const { totales, popularidad, teVieronIds, teEscribieron, teDieronLike, tePasaron } = metricas || {};

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Mis métricas</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
              </div>
            ) : !metricas ? (
              <p className="text-gray-400 text-center py-8">No se pudieron cargar las métricas</p>
            ) : (
              <>
                {/* Popularidad */}
                <section>
                  <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Tu popularidad
                  </h3>
                  <div className="rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-white">{popularidad?.nivel}</p>
                        <p className="text-xs text-gray-400">Score: {popularidad?.score}</p>
                      </div>
                      <div className="text-right text-xs text-gray-400 space-y-1">
                        <p>♥ {totales?.likes || 0} likes</p>
                        <p>👁 {(totales?.vistas || 0)} vistas</p>
                        <p>✉ {totales?.mensajes || 0} mensajes</p>
                        <p>👣 {totales?.huellas || 0} pasaron</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Quién te escribió */}
                <section>
                  <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Quién te escribió ({teEscribieron?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {(!teEscribieron || teEscribieron.length === 0) ? (
                      <p className="text-sm text-gray-500 py-2">Aún no tienes mensajes</p>
                    ) : (
                      teEscribieron.slice(0, 15).map((a) => (
                        <FilaPersona
                          key={a.id || a.deUserId}
                          userId={a.deUserId}
                          username={a.deUsername}
                          avatar={a.avatar}
                          subtitle={a.mensaje ? `"${a.mensaje.slice(0, 40)}${a.mensaje.length > 40 ? '...' : ''}"` : null}
                          icono={<MessageSquare className="w-4 h-4" />}
                          iconColor="text-cyan-400"
                          onVerTarjeta={handleVerTarjeta}
                        />
                      ))
                    )}
                  </div>
                </section>

                {/* Quién te dio like */}
                <section>
                  <h3 className="text-sm font-semibold text-pink-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Quién te dio like ({teDieronLike?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {(!teDieronLike || teDieronLike.length === 0) ? (
                      <p className="text-sm text-gray-500 py-2">Aún nadie te ha dado like</p>
                    ) : (
                      teDieronLike.slice(0, 15).map((a) => (
                        <FilaPersona
                          key={a.id || a.deUserId}
                          userId={a.deUserId}
                          username={a.deUsername}
                          avatar={a.avatar}
                          subtitle={formatearTiempo(a.timestamp)}
                          icono={<Heart className="w-4 h-4 fill-current" />}
                          iconColor="text-pink-500"
                          onVerTarjeta={handleVerTarjeta}
                        />
                      ))
                    )}
                  </div>
                </section>

                {/* Quién te vio / visitó */}
                <section>
                  <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Quién te vio ({teVieronIds?.length || 0})
                  </h3>
                  <TeVieronLista
                    teVieronIds={teVieronIds}
                    teVisitaron={metricas?.teVisitaron}
                    miUserId={miUserId}
                    onVerTarjeta={handleVerTarjeta}
                  />
                </section>

                {/* Quién pasó por aquí */}
                <section>
                  <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Footprints className="w-4 h-4" />
                    Pasaron por tu perfil ({tePasaron?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {(!tePasaron || tePasaron.length === 0) ? (
                      <p className="text-sm text-gray-500 py-2">Aún nadie ha pasado por aquí</p>
                    ) : (
                      tePasaron.slice(0, 10).map((a) => (
                        <FilaPersona
                          key={a.id || a.deUserId}
                          userId={a.deUserId}
                          username={a.deUsername}
                          avatar={a.avatar}
                          subtitle={formatearTiempo(a.timestamp)}
                          icono={<Footprints className="w-4 h-4" />}
                          iconColor="text-amber-500"
                          onVerTarjeta={handleVerTarjeta}
                        />
                      ))
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        </motion.div>

        {mostrarMensajeModal && tarjetaSeleccionada && (
          <MensajeTarjetaModal
            isOpen={mostrarMensajeModal}
            onClose={() => {
              setMostrarMensajeModal(false);
              setTarjetaSeleccionada(null);
              onRefresh?.();
            }}
            tarjeta={tarjetaSeleccionada}
            miUserId={miUserId}
            miUsername={user?.username || user?.displayName || 'Usuario'}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

/** Lista de quién te vio - combina visitas y impresiones */
const TeVieronLista = ({ teVieronIds, teVisitaron, miUserId, onVerTarjeta }) => {
  const [tarjetas, setTarjetas] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = Array.isArray(teVieronIds) ? teVieronIds : [];
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const results = await Promise.all(ids.map((id) => obtenerTarjeta(id)));
      if (!cancelled) {
        const map = {};
        ids.forEach((id, i) => {
          if (results[i]) map[id] = results[i];
        });
        setTarjetas(map);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [teVieronIds && teVieronIds.length]);

  if (loading && teVieronIds?.length > 0) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!teVieronIds?.length) {
    return <p className="text-sm text-gray-500 py-2">Aún nadie ha visto tu tarjeta</p>;
  }

  const unicos = [...new Set(teVieronIds)].filter((id) => id !== miUserId);

  return (
    <div className="space-y-2">
      {unicos.slice(0, 15).map((userId) => {
        const t = tarjetas[userId];
        return (
          <FilaPersona
            key={userId}
            userId={userId}
            username={t?.nombre || t?.odIdUsuariNombre || 'Usuario'}
            avatar={t ? obtenerFotoPrincipal(t) : null}
            icono={<Eye className="w-4 h-4" />}
            iconColor="text-purple-400"
            onVerTarjeta={onVerTarjeta}
          />
        );
      })}
    </div>
  );
};

export default MetricasTarjetaPanel;
