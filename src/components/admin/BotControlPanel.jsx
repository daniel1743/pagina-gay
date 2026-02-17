import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, Bot, Users, MessageSquare, Settings, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllRooms } from '@/config/rooms';
import {
  startBots,
  stopBots,
  pauseBots,
  resumeBots,
  getBotStatus,
  setAutoDeactivate,
} from '@/services/botEngine';

const BotControlPanel = () => {
  const [selectedRoom, setSelectedRoom] = useState('admin-testing');
  const [status, setStatus] = useState(null);
  const [autoOff, setAutoOff] = useState(true);

  const rooms = getAllRooms().filter((room) => room.adminOnly === true);

  useEffect(() => {
    if (!rooms.find((room) => room.id === selectedRoom) && rooms[0]?.id) {
      setSelectedRoom(rooms[0].id);
    }
  }, [rooms, selectedRoom]);

  // Polling del estado cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      const s = getBotStatus(selectedRoom);
      setStatus(s);
    }, 2000);

    // Estado inicial
    setStatus(getBotStatus(selectedRoom));

    return () => clearInterval(interval);
  }, [selectedRoom]);

  const handleStart = useCallback(() => {
    const started = startBots(selectedRoom);
    if (!started) {
      console.warn(`[BOT PANEL] Inicio bloqueado en sala: ${selectedRoom}`);
    }
    setStatus(getBotStatus(selectedRoom));
  }, [selectedRoom]);

  const handlePause = useCallback(() => {
    pauseBots(selectedRoom);
    setStatus(getBotStatus(selectedRoom));
  }, [selectedRoom]);

  const handleResume = useCallback(() => {
    resumeBots(selectedRoom);
    setStatus(getBotStatus(selectedRoom));
  }, [selectedRoom]);

  const handleStop = useCallback(() => {
    stopBots(selectedRoom);
    setStatus(getBotStatus(selectedRoom));
  }, [selectedRoom]);

  const handleAutoOffToggle = useCallback(() => {
    const newVal = !autoOff;
    setAutoOff(newVal);
    setAutoDeactivate(selectedRoom, newVal);
  }, [autoOff, selectedRoom]);

  const isRunning = status?.status === 'running';
  const isPaused = status?.status === 'paused';
  const isStopped = status?.status === 'stopped' || !status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bot className="w-8 h-8 text-cyan-400" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Control de Bots</h2>
          <p className="text-sm text-muted-foreground">
            Sistema de conversaciones pregrabadas
          </p>
        </div>
      </div>

      {/* Selector de sala */}
      <div className="glass-effect rounded-xl p-4 border">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Sala objetivo
        </label>
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:border-primary focus:outline-none transition-colors"
        >
          {rooms.map(room => (
            <option key={room.id} value={room.id}>
              {room.name} {room.adminOnly ? '(Admin)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Botones de control */}
      <div className="grid grid-cols-3 gap-4">
        {/* ENCENDER */}
        <Button
          onClick={isRunning ? null : (isPaused ? handleResume : handleStart)}
          disabled={isRunning}
          className={`h-20 text-lg font-bold rounded-xl transition-all ${
            isRunning
              ? 'bg-green-900/50 text-green-400 border border-green-700 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-500 text-white'
          }`}
        >
          <Play className="w-6 h-6 mr-2" />
          {isPaused ? 'REANUDAR' : 'ENCENDER'}
        </Button>

        {/* PAUSAR */}
        <Button
          onClick={handlePause}
          disabled={!isRunning}
          className={`h-20 text-lg font-bold rounded-xl transition-all ${
            isPaused
              ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
              : !isRunning
              ? 'bg-yellow-900/30 text-yellow-600 cursor-not-allowed'
              : 'bg-yellow-600 hover:bg-yellow-500 text-black'
          }`}
        >
          <Pause className="w-6 h-6 mr-2" />
          PAUSAR
        </Button>

        {/* APAGAR */}
        <Button
          onClick={handleStop}
          disabled={isStopped}
          className={`h-20 text-lg font-bold rounded-xl transition-all ${
            isStopped
              ? 'bg-red-900/30 text-red-600 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
        >
          <Square className="w-6 h-6 mr-2" />
          APAGAR
        </Button>
      </div>

      {/* Estado en tiempo real */}
      <div className="glass-effect rounded-xl p-5 border space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-foreground">Estado en tiempo real</h3>
        </div>

        {/* Indicador de estado */}
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            isRunning ? 'bg-green-500 animate-pulse' :
            isPaused ? 'bg-yellow-500 animate-pulse' :
            'bg-red-500'
          }`} />
          <span className={`text-sm font-bold uppercase ${
            isRunning ? 'text-green-400' :
            isPaused ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {isRunning ? 'Ejecutando' : isPaused ? 'Pausado' : 'Detenido'}
          </span>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            icon={<Bot className="w-4 h-4" />}
            label="Bots activos"
            value={status?.activeBots || 0}
            color="text-cyan-400"
          />
          <MetricCard
            icon={<MessageSquare className="w-4 h-4" />}
            label="Conversaciones"
            value={status?.conversationsPlayed || 0}
            color="text-purple-400"
          />
          <MetricCard
            icon={<Activity className="w-4 h-4" />}
            label="Simultáneas"
            value={status?.activeConversations || 0}
            color="text-amber-400"
          />
          <MetricCard
            icon={<Users className="w-4 h-4" />}
            label="Usuarios reales"
            value={status?.realUserCount || 0}
            color="text-green-400"
          />
        </div>

        {/* Bots activos */}
        {status?.activeBotNames?.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Bots en línea:</p>
            <div className="flex flex-wrap gap-1.5">
              {status.activeBotNames.map(name => (
                <span
                  key={name}
                  className="px-2 py-0.5 bg-cyan-900/30 text-cyan-400 text-xs rounded-full border border-cyan-800"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Total disponible */}
        <p className="text-xs text-muted-foreground">
          {status?.totalConversationsAvailable || 0} conversaciones disponibles en la base de datos
        </p>
      </div>

      {/* Auto-desactivación */}
      <div className="glass-effect rounded-xl p-4 border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">
              Auto-desactivar con 10+ usuarios reales
            </span>
          </div>
          <button
            onClick={handleAutoOffToggle}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              autoOff ? 'bg-green-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                autoOff ? 'left-6' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

function MetricCard({ icon, label, value, color }) {
  return (
    <div className="bg-background/50 rounded-lg p-3 border border-border">
      <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export default BotControlPanel;
