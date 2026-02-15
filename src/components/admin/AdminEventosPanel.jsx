/**
 * 📅 PANEL ADMIN DE EVENTOS
 * Crear y gestionar eventos programados con salas automáticas
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Trash2, Plus, Users, Radio, CheckCircle, AlertCircle } from 'lucide-react';
import { crearEvento, obtenerTodosLosEventos, desactivarEvento } from '@/services/eventosService';
import { getEstadoEvento, formatFechaEvento, toMs } from '@/utils/eventosUtils';

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

export default function AdminEventosPanel() {
  const [eventos, setEventos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaStr, setFechaStr] = useState('');
  const [horaStr, setHoraStr] = useState('22:00');
  const [duracion, setDuracion] = useState(60);

  // Cargar eventos
  const cargarEventos = async () => {
    setIsLoading(true);
    const data = await obtenerTodosLosEventos();
    setEventos(data);
    setIsLoading(false);
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
      cargarEventos();
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
    cargarEventos();
  };

  // Fecha mínima: hoy
  const hoy = new Date().toISOString().split('T')[0];

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
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo Evento
        </button>
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
                      {evento.asistentesCount || 0}
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
    </div>
  );
}
