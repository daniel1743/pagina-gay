/**
 * 📅 PANEL ADMIN DE EVENTOS
 * Crear y gestionar eventos programados con salas automáticas
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Trash2,
  Plus,
  Users,
  Radio,
  CheckCircle,
  BarChart3,
  RefreshCw,
  MessageSquare,
  Activity,
  AlertCircle,
} from 'lucide-react';
import {
  crearEvento,
  obtenerTodosLosEventos,
  desactivarEvento,
  obtenerMetricasEventos,
} from '@/services/eventosService';
import { getEstadoEvento, formatFechaEvento } from '@/utils/eventosUtils';

const ESTADO_STYLES = {
  activo: 'bg-green-500/20 text-green-300 border-green-500/40',
  programado: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  finalizado: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
};

const ESTADO_ICONS = {
  activo: <Radio className="w-3 h-3 animate-pulse" />,
  programado: <Clock className="w-3 h-3" />,
  finalizado: <CheckCircle className="w-3 h-3" />,
};

const TRAFICO_STYLES = {
  'sin-trafico': 'bg-gray-500/20 text-gray-300 border-gray-500/40',
  bajo: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  medio: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  alto: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
};

const TRAFICO_LABELS = {
  'sin-trafico': 'Sin tráfico',
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
};

const INTERES_STYLES = {
  'sin-interes': 'bg-red-500/20 text-red-300 border-red-500/40',
  bajo: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  medio: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  alto: 'bg-green-500/20 text-green-300 border-green-500/40',
};

const INTERES_LABELS = {
  'sin-interes': 'Sin interés',
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
};

const EMPTY_METRICAS = {
  participantes: 0,
  mensajes: 0,
  respuestas: 0,
  conexionesActivas: 0,
  tasaRespuesta: 0,
  mensajesPorHora: 0,
  traficoNivel: 'sin-trafico',
  interesNivel: 'sin-interes',
  huboInteres: false,
  ultimaActividadMs: 0,
};

const formatUltimaActividad = (timestampMs) => {
  if (!timestampMs) return 'Sin actividad';
  return new Date(timestampMs).toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminEventosPanel() {
  const [eventos, setEventos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isLoadingMetricas, setIsLoadingMetricas] = useState(false);
  const [metricasPorEvento, setMetricasPorEvento] = useState({});
  const [eventoSeleccionadoId, setEventoSeleccionadoId] = useState(null);

  // Form state
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaStr, setFechaStr] = useState('');
  const [horaStr, setHoraStr] = useState('22:00');
  const [duracion, setDuracion] = useState(60);

  const cargarMetricas = async (eventosData) => {
    if (!Array.isArray(eventosData) || eventosData.length === 0) {
      setMetricasPorEvento({});
      setIsLoadingMetricas(false);
      return;
    }

    setIsLoadingMetricas(true);
    try {
      const metricasMap = await obtenerMetricasEventos(eventosData);
      setMetricasPorEvento(metricasMap);
    } finally {
      setIsLoadingMetricas(false);
    }
  };

  // Cargar eventos
  const cargarEventos = async () => {
    setIsLoading(true);
    try {
      const data = await obtenerTodosLosEventos();
      setEventos(data);
      setEventoSeleccionadoId((prev) => (
        prev && data.some((evento) => evento.id === prev) ? prev : (data[0]?.id || null)
      ));
      await cargarMetricas(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  // Crear evento
  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !fechaStr || !horaStr) return;

    setIsCreating(true);
    try {
      const fechaInicio = new Date(`${fechaStr}T${horaStr}:00`);
      if (isNaN(fechaInicio.getTime())) throw new Error('Fecha inválida');
      if (fechaInicio.getTime() < Date.now()) throw new Error('La fecha debe ser futura');

      await crearEvento({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        fechaInicio,
        duracionMinutos: duracion,
      });

      // Reset form
      setNombre('');
      setDescripcion('');
      setFechaStr('');
      setHoraStr('22:00');
      setDuracion(60);
      setShowForm(false);
      await cargarEventos();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Desactivar evento
  const handleDesactivar = async (eventoId) => {
    if (!confirm('¿Desactivar este evento?')) return;
    await desactivarEvento(eventoId);
    await cargarEventos();
  };

  // Fecha mínima: hoy
  const hoy = new Date().toISOString().split('T')[0];

  const eventoSeleccionado = useMemo(() => (
    eventos.find((evento) => evento.id === eventoSeleccionadoId) || null
  ), [eventos, eventoSeleccionadoId]);

  const metricasSeleccionadas = useMemo(() => (
    eventoSeleccionado
      ? (metricasPorEvento[eventoSeleccionado.id] || EMPTY_METRICAS)
      : EMPTY_METRICAS
  ), [eventoSeleccionado, metricasPorEvento]);

  const resumenDashboard = useMemo(() => {
    const listaMetricas = eventos
      .map((evento) => metricasPorEvento[evento.id])
      .filter(Boolean);

    if (listaMetricas.length === 0) {
      return {
        eventosAnalizados: eventos.length,
        participantes: 0,
        mensajes: 0,
        respuestas: 0,
        conexionesActivas: 0,
        eventosSinInteres: eventos.length,
      };
    }

    return listaMetricas.reduce((acc, m) => ({
      eventosAnalizados: acc.eventosAnalizados + 1,
      participantes: acc.participantes + (m.participantes || 0),
      mensajes: acc.mensajes + (m.mensajes || 0),
      respuestas: acc.respuestas + (m.respuestas || 0),
      conexionesActivas: acc.conexionesActivas + (m.conexionesActivas || 0),
      eventosSinInteres: acc.eventosSinInteres + (m.huboInteres ? 0 : 1),
    }), {
      eventosAnalizados: 0,
      participantes: 0,
      mensajes: 0,
      respuestas: 0,
      conexionesActivas: 0,
      eventosSinInteres: 0,
    });
  }, [eventos, metricasPorEvento]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Eventos Programados
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Crea eventos que abren salas automáticas en el horario programado
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarEventos}
            disabled={isLoading || isLoadingMetricas}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/50 text-gray-200 hover:bg-gray-700 border border-gray-600/50 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${(isLoading || isLoadingMetricas) ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nuevo Evento
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleCrear}
          className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/50 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre del evento *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Noche de Confesiones"
                maxLength={80}
                required
                className="w-full px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción breve del evento"
                maxLength={200}
                className="w-full px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Fecha *</label>
              <input
                type="date"
                value={fechaStr}
                onChange={(e) => setFechaStr(e.target.value)}
                min={hoy}
                required
                className="w-full px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Hora *</label>
              <input
                type="time"
                value={horaStr}
                onChange={(e) => setHoraStr(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Duración (min)</label>
              <select
                value={duracion}
                onChange={(e) => setDuracion(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white text-sm focus:outline-none focus:border-cyan-500/50"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={60}>1 hora</option>
                <option value={120}>2 horas</option>
                <option value={180}>3 horas</option>
                <option value={360}>6 horas</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isCreating || !nombre.trim() || !fechaStr}
              className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? 'Creando...' : 'Crear Evento'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </motion.form>
      )}

      {/* Lista de eventos */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Cargando eventos...</div>
      ) : eventos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No hay eventos creados</p>
          <p className="text-xs mt-1">Crea el primer evento para activar las salas programadas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {eventos.map((evento) => {
            const estado = getEstadoEvento(evento);
            return (
              <div
                key={evento.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40 border border-gray-700/40 hover:border-gray-600/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-white truncate">{evento.nombre}</h4>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${ESTADO_STYLES[estado]}`}>
                      {ESTADO_ICONS[estado]}
                      {estado}
                    </span>
                  </div>
                  {evento.descripcion && (
                    <p className="text-xs text-gray-400 truncate mb-1">{evento.descripcion}</p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatFechaEvento(evento.fechaInicio)} · {evento.duracionMinutos}min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {metricasPorEvento[evento.id]?.participantes ?? evento.asistentesCount ?? 0}
                    </span>
                    <span className="text-gray-600">Sala: {evento.roomId}</span>
                  </div>
                </div>

                {evento.activo && (
                  <button
                    onClick={() => handleDesactivar(evento.id)}
                    className="ml-3 p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Desactivar evento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dashboard por evento */}
      <div className="pt-4 border-t border-gray-700/50 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Dashboard de Rendimiento por Evento
            </h4>
            <p className="text-xs text-gray-400 mt-1">
              Participantes, mensajes, tráfico, respuestas, conexiones e interés por cada evento
            </p>
          </div>
        </div>

        {eventos.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Crea eventos para habilitar el dashboard.
          </div>
        ) : isLoadingMetricas && Object.keys(metricasPorEvento).length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Calculando métricas de eventos...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/40">
                <p className="text-[11px] text-gray-400">Eventos</p>
                <p className="text-lg font-bold text-white">{resumenDashboard.eventosAnalizados}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/40">
                <p className="text-[11px] text-gray-400">Participantes</p>
                <p className="text-lg font-bold text-cyan-300">{resumenDashboard.participantes}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/40">
                <p className="text-[11px] text-gray-400">Mensajes</p>
                <p className="text-lg font-bold text-blue-300">{resumenDashboard.mensajes}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/40">
                <p className="text-[11px] text-gray-400">Respuestas</p>
                <p className="text-lg font-bold text-emerald-300">{resumenDashboard.respuestas}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/40">
                <p className="text-[11px] text-gray-400">Conexiones activas</p>
                <p className="text-lg font-bold text-purple-300">{resumenDashboard.conexionesActivas}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/40">
                <p className="text-[11px] text-gray-400">Sin interés</p>
                <p className="text-lg font-bold text-red-300">{resumenDashboard.eventosSinInteres}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {eventos.map((evento) => {
                const selected = evento.id === eventoSeleccionadoId;
                return (
                  <button
                    key={evento.id}
                    onClick={() => setEventoSeleccionadoId(evento.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      selected
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50'
                        : 'bg-gray-800/40 text-gray-300 border-gray-700/50 hover:border-gray-600/60'
                    }`}
                  >
                    {evento.nombre}
                  </button>
                );
              })}
            </div>

            {eventoSeleccionado && (
              <motion.div
                key={eventoSeleccionado.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/40 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-semibold text-white">{eventoSeleccionado.nombre}</h5>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatFechaEvento(eventoSeleccionado.fechaInicio)} · Sala {eventoSeleccionado.roomId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${TRAFICO_STYLES[metricasSeleccionadas.traficoNivel] || TRAFICO_STYLES['sin-trafico']}`}>
                      Tráfico: {TRAFICO_LABELS[metricasSeleccionadas.traficoNivel] || 'Sin tráfico'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${INTERES_STYLES[metricasSeleccionadas.interesNivel] || INTERES_STYLES['sin-interes']}`}>
                      Interés: {INTERES_LABELS[metricasSeleccionadas.interesNivel] || 'Sin interés'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-gray-900/40 border border-gray-700/40">
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Participantes
                    </p>
                    <p className="text-base font-bold text-white mt-1">{metricasSeleccionadas.participantes}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-900/40 border border-gray-700/40">
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Mensajes
                    </p>
                    <p className="text-base font-bold text-white mt-1">{metricasSeleccionadas.mensajes}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-900/40 border border-gray-700/40">
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Respuestas
                    </p>
                    <p className="text-base font-bold text-white mt-1">{metricasSeleccionadas.respuestas}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-900/40 border border-gray-700/40">
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Conexiones activas
                    </p>
                    <p className="text-base font-bold text-white mt-1">{metricasSeleccionadas.conexionesActivas}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-900/40 border border-gray-700/40">
                    <p className="text-[11px] text-gray-400">Tasa de respuesta</p>
                    <p className="text-base font-bold text-white mt-1">{metricasSeleccionadas.tasaRespuesta}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-900/40 border border-gray-700/40">
                    <p className="text-[11px] text-gray-400">Mensajes por hora</p>
                    <p className="text-base font-bold text-white mt-1">{metricasSeleccionadas.mensajesPorHora}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-900/40 border border-gray-700/40">
                    <p className="text-[11px] text-gray-400">Última actividad</p>
                    <p className="text-xs font-medium text-gray-200 mt-1">{formatUltimaActividad(metricasSeleccionadas.ultimaActividadMs)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-900/40 border border-gray-700/40">
                    <p className="text-[11px] text-gray-400">Resultado</p>
                    <p className={`text-xs font-semibold mt-1 ${metricasSeleccionadas.huboInteres ? 'text-emerald-300' : 'text-red-300'}`}>
                      {metricasSeleccionadas.huboInteres ? 'Sí hubo interés en el evento' : 'No hubo interés en el evento'}
                    </p>
                  </div>
                </div>

                {!metricasSeleccionadas.huboInteres && (
                  <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Este evento no registró interés ni actividad. Puedes revisar horario, nombre del evento o difusión previa.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
