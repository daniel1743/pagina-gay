import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  ADMIN_SEEDED_ROOM_ID,
  applyPresenceConversationPreset,
  getDefaultAdminSeededConfig,
  saveAdminSeededIdentity,
  sendAdminSeededMessage,
  subscribeAdminSeededChatConfig,
  syncAdminSeededPresence,
} from '@/services/adminSeededChatService';
import { Lock, MessageSquare, Save, Send, Users, UserSquare2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ROLE_OPTIONS = [
  'Activo',
  'Pasivo',
  'Versátil Act',
  'Versátil Pasivo',
  'Inter',
  'Hetero Curioso',
  'Solo Ver',
];

const buildAvatarUrl = (username = 'Usuario', customAvatar = '') => (
  customAvatar?.trim()
    ? customAvatar.trim()
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username || 'usuario')}`
);

const updateIdentityInConfig = (config, slotType, slotIndex, patch) => {
  const key = slotType === 'presence' ? 'presences' : 'operators';
  return {
    ...config,
    [key]: (config[key] || []).map((item) => (
      item.slotIndex === slotIndex ? { ...item, ...patch } : item
    )),
  };
};

const getIdentityFromConfig = (config, slotType, slotIndex) => {
  const key = slotType === 'presence' ? 'presences' : 'operators';
  return (config[key] || []).find((item) => item.slotIndex === slotIndex);
};

const getPresencePairMembers = (presences, presetIndex) => {
  const leftSlot = ((presetIndex - 1) * 2) + 1;
  return [
    presences.find((item) => item.slotIndex === leftSlot),
    presences.find((item) => item.slotIndex === leftSlot + 1),
  ];
};

const AdminSeededChatPanel = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState(() => getDefaultAdminSeededConfig());
  const [loading, setLoading] = useState(true);
  const [operatorMessages, setOperatorMessages] = useState({
    1: '',
    2: '',
    3: '',
  });
  const [presenceMessages, setPresenceMessages] = useState({
    1: '',
    2: '',
    3: '',
    4: '',
    5: '',
    6: '',
  });
  const [savingKey, setSavingKey] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeAdminSeededChatConfig(
      ADMIN_SEEDED_ROOM_ID,
      (nextConfig) => {
        setConfig(nextConfig);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe?.();
  }, []);

  const pairStates = useMemo(() => (
    [1, 2, 3].map((presetIndex) => {
      const [left, right] = getPresencePairMembers(config.presences, presetIndex);
      const active = Boolean(
        left?.enabled &&
        right?.enabled &&
        left?.status === 'private' &&
        right?.status === 'private'
      );
      return {
        presetIndex,
        active,
        label: `${left?.username || `Presencia ${((presetIndex - 1) * 2) + 1}`} + ${right?.username || `Presencia ${((presetIndex - 1) * 2) + 2}`}`,
      };
    })
  ), [config.presences]);

  const handleLocalFieldChange = (slotType, slotIndex, field, value) => {
    setConfig((prev) => updateIdentityInConfig(prev, slotType, slotIndex, { [field]: value }));
  };

  const persistIdentity = async (slotType, slotIndex, successDescription) => {
    const identity = getIdentityFromConfig(config, slotType, slotIndex);
    if (!identity) return;

    const trimmedName = String(identity.username || '').trim();
    if (!trimmedName) {
      toast({
        title: 'Nombre requerido',
        description: 'Define un nombre antes de guardar este perfil.',
        variant: 'destructive',
      });
      return;
    }

    const key = `${slotType}_${slotIndex}`;
    setSavingKey(key);
    try {
      const payload = {
        ...identity,
        username: trimmedName,
        avatar: identity.avatar || '',
        useCustomAvatar: Boolean(identity.avatar),
      };
      const nextConfig = updateIdentityInConfig(config, slotType, slotIndex, payload);
      setConfig(nextConfig);
      await saveAdminSeededIdentity(ADMIN_SEEDED_ROOM_ID, slotType, slotIndex, payload);
      await syncAdminSeededPresence(ADMIN_SEEDED_ROOM_ID, nextConfig);
      toast({
        title: 'Perfil actualizado',
        description: successDescription,
      });
    } catch (error) {
      console.error('[ADMIN SEEDED] Error guardando identidad:', error);
      toast({
        title: 'No se pudo guardar',
        description: error?.message || 'Intenta nuevamente en unos segundos.',
        variant: 'destructive',
      });
    } finally {
      setSavingKey('');
    }
  };

  const handleOperatorMessageChange = (slotIndex, value) => {
    setOperatorMessages((prev) => ({ ...prev, [slotIndex]: value }));
  };

  const handlePresenceMessageChange = (slotIndex, value) => {
    setPresenceMessages((prev) => ({ ...prev, [slotIndex]: value }));
  };

  const handleSendOperatorMessage = async (operator) => {
    const content = String(operatorMessages[operator.slotIndex] || '').trim();
    if (!content) {
      toast({
        title: 'Mensaje vacío',
        description: 'Escribe algo antes de enviar.',
        variant: 'destructive',
      });
      return;
    }

    if (!String(operator.username || '').trim()) {
      toast({
        title: 'Nombre requerido',
        description: 'Primero define el nombre del operador.',
        variant: 'destructive',
      });
      return;
    }

    const operatorKey = `operator_send_${operator.slotIndex}`;
    setSavingKey(operatorKey);

    try {
      let nextConfig = config;
      if (!operator.enabled) {
        nextConfig = updateIdentityInConfig(config, 'operator', operator.slotIndex, { enabled: true });
        setConfig(nextConfig);
        await saveAdminSeededIdentity(ADMIN_SEEDED_ROOM_ID, 'operator', operator.slotIndex, {
          ...operator,
          enabled: true,
        });
        await syncAdminSeededPresence(ADMIN_SEEDED_ROOM_ID, nextConfig);
      }

      await sendAdminSeededMessage(ADMIN_SEEDED_ROOM_ID, {
        ...operator,
        enabled: true,
      }, content, user);

      setOperatorMessages((prev) => ({ ...prev, [operator.slotIndex]: '' }));
      toast({
        title: 'Mensaje enviado',
        description: `${operator.username} escribió en la sala principal.`,
      });
    } catch (error) {
      console.error('[ADMIN SEEDED] Error enviando mensaje:', error);
      toast({
        title: 'No se pudo enviar',
        description: error?.message || 'Revisa reglas o conexión.',
        variant: 'destructive',
      });
    } finally {
      setSavingKey('');
    }
  };

  const handleSendPresenceMessage = async (presence) => {
    const content = String(presenceMessages[presence.slotIndex] || '').trim();
    if (!content) {
      toast({
        title: 'Mensaje vacío',
        description: 'Escribe algo antes de enviar.',
        variant: 'destructive',
      });
      return;
    }

    if (!String(presence.username || '').trim()) {
      toast({
        title: 'Nombre requerido',
        description: 'Primero define el nombre de esta presencia.',
        variant: 'destructive',
      });
      return;
    }

    const presenceKey = `presence_send_${presence.slotIndex}`;
    setSavingKey(presenceKey);

    try {
      const nextPresence = {
        ...presence,
        enabled: true,
      };
      const nextConfig = updateIdentityInConfig(config, 'presence', presence.slotIndex, nextPresence);
      setConfig(nextConfig);

      await saveAdminSeededIdentity(ADMIN_SEEDED_ROOM_ID, 'presence', presence.slotIndex, nextPresence);
      await syncAdminSeededPresence(ADMIN_SEEDED_ROOM_ID, nextConfig);
      await sendAdminSeededMessage(ADMIN_SEEDED_ROOM_ID, nextPresence, content, user);

      setPresenceMessages((prev) => ({ ...prev, [presence.slotIndex]: '' }));
      toast({
        title: 'Mensaje enviado',
        description: `${presence.username} escribió en la sala principal.`,
      });
    } catch (error) {
      console.error('[ADMIN SEEDED] Error enviando mensaje de presencia:', error);
      toast({
        title: 'No se pudo enviar',
        description: error?.message || 'Revisa reglas o conexión.',
        variant: 'destructive',
      });
    } finally {
      setSavingKey('');
    }
  };

  const handlePresetToggle = async (presetIndex, enabled) => {
    const presetKey = `preset_${presetIndex}`;
    setSavingKey(presetKey);
    try {
      const nextConfig = await applyPresenceConversationPreset(
        ADMIN_SEEDED_ROOM_ID,
        config,
        presetIndex,
        enabled
      );
      setConfig(nextConfig);
      toast({
        title: enabled ? 'Simulación privada activa' : 'Simulación privada detenida',
        description: `Conversación ${presetIndex} ${enabled ? 'encendida' : 'apagada'}.`,
      });
    } catch (error) {
      console.error('[ADMIN SEEDED] Error aplicando preset:', error);
      toast({
        title: 'No se pudo cambiar el preset',
        description: error?.message || 'Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setSavingKey('');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-cyan-500/20 bg-slate-950/40 p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-cyan-300" />
              Operadores y presencias asistidas
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Tres operadores manuales para escribir desde admin y seis presencias visuales para ambientar la sala sin tocar métricas ni ranking.
            </p>
          </div>

          <Badge className="border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
            Sala: principal
          </Badge>
        </div>
      </motion.div>

      <Card className="border-fuchsia-500/20 bg-slate-950/35">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-fuchsia-300" />
            Simulaciones privadas por pares
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {pairStates.map((pair) => (
            <div
              key={pair.presetIndex}
              className="rounded-2xl border border-fuchsia-500/20 bg-background/30 p-4"
            >
              <p className="text-sm font-semibold text-white">
                Conversación {pair.presetIndex}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {pair.label}
              </p>
              <Button
                type="button"
                onClick={() => handlePresetToggle(pair.presetIndex, !pair.active)}
                disabled={savingKey === `preset_${pair.presetIndex}`}
                className={`mt-3 w-full ${
                  pair.active
                    ? 'bg-fuchsia-600 hover:bg-fuchsia-700'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                {pair.active ? 'Apagar simulación' : 'Activar simulación'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {config.operators.map((operator) => {
          const avatarSrc = buildAvatarUrl(operator.username || `Operador ${operator.slotIndex}`, operator.avatar);
          const saveKey = `operator_${operator.slotIndex}`;
          const sendKey = `operator_send_${operator.slotIndex}`;

          return (
            <Card key={operator.id} className="border-cyan-500/20 bg-slate-950/35">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <UserSquare2 className="w-5 h-5 text-cyan-300" />
                  Operador {operator.slotIndex}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/15 bg-background/30 p-3">
                  <Avatar className="h-12 w-12 border border-cyan-400/30">
                    <AvatarImage src={avatarSrc} alt={operator.username || 'Operador'} />
                    <AvatarFallback>
                      {(operator.username || `O${operator.slotIndex}`).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {operator.username || `Operador ${operator.slotIndex}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {operator.enabled ? 'Visible en sala' : 'Oculto'}
                    </p>
                  </div>
                  <Switch
                    checked={operator.enabled}
                    onCheckedChange={(checked) => handleLocalFieldChange('operator', operator.slotIndex, 'enabled', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Nombre</label>
                  <Input
                    value={operator.username}
                    onChange={(event) => handleLocalFieldChange('operator', operator.slotIndex, 'username', event.target.value)}
                    placeholder={`Operador ${operator.slotIndex}`}
                    className="border-cyan-500/20 bg-background/40"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Rol</label>
                    <Select
                      value={operator.roleBadge}
                      onValueChange={(value) => handleLocalFieldChange('operator', operator.slotIndex, 'roleBadge', value)}
                    >
                      <SelectTrigger className="border-cyan-500/20 bg-background/40">
                        <SelectValue placeholder="Rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Foto URL opcional</label>
                    <Input
                      value={operator.avatar}
                      onChange={(event) => handleLocalFieldChange('operator', operator.slotIndex, 'avatar', event.target.value)}
                      placeholder="https://..."
                      className="border-cyan-500/20 bg-background/40"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => persistIdentity('operator', operator.slotIndex, `Operador ${operator.slotIndex} sincronizado con la sala.`)}
                    disabled={savingKey === saveKey}
                    className="flex-1 border-cyan-500/25 bg-cyan-500/5 text-cyan-100 hover:bg-cyan-500/10"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                  </Button>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/25 p-3">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                    Mensaje manual
                  </label>
                  <Textarea
                    value={operatorMessages[operator.slotIndex] || ''}
                    onChange={(event) => handleOperatorMessageChange(operator.slotIndex, event.target.value)}
                    placeholder="Escribe como este operador..."
                    className="min-h-[120px] border-cyan-500/20 bg-background/40"
                  />
                  <Button
                    type="button"
                    onClick={() => handleSendOperatorMessage(operator)}
                    disabled={savingKey === sendKey}
                    className="mt-3 w-full bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Enviar al chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-amber-500/20 bg-slate-950/35">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-300" />
            Presencias asistidas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {config.presences.map((presence) => {
            const avatarSrc = buildAvatarUrl(presence.username || `Presencia ${presence.slotIndex}`, presence.avatar);
            const saveKey = `presence_${presence.slotIndex}`;
            const sendKey = `presence_send_${presence.slotIndex}`;
            return (
              <div
                key={presence.id}
                className="rounded-2xl border border-amber-500/15 bg-background/25 p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 border border-amber-400/30">
                    <AvatarImage src={avatarSrc} alt={presence.username || 'Presencia'} />
                    <AvatarFallback>
                      {(presence.username || `P${presence.slotIndex}`).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {presence.username || `Presencia ${presence.slotIndex}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {presence.enabled ? (presence.status === 'private' ? 'En privado' : 'Online') : 'Oculta'}
                    </p>
                  </div>
                  <Switch
                    checked={presence.enabled}
                    onCheckedChange={(checked) => handleLocalFieldChange('presence', presence.slotIndex, 'enabled', checked)}
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Nombre</label>
                  <Input
                    value={presence.username}
                    onChange={(event) => handleLocalFieldChange('presence', presence.slotIndex, 'username', event.target.value)}
                    placeholder={`Presencia ${presence.slotIndex}`}
                    className="border-amber-500/20 bg-background/40"
                  />
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Rol</label>
                    <Select
                      value={presence.roleBadge}
                      onValueChange={(value) => handleLocalFieldChange('presence', presence.slotIndex, 'roleBadge', value)}
                    >
                      <SelectTrigger className="border-amber-500/20 bg-background/40">
                        <SelectValue placeholder="Rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Estado</label>
                    <Select
                      value={presence.status}
                      onValueChange={(value) => handleLocalFieldChange('presence', presence.slotIndex, 'status', value)}
                    >
                      <SelectTrigger className="border-amber-500/20 bg-background/40">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="private">En privado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Foto URL opcional</label>
                  <Input
                    value={presence.avatar}
                    onChange={(event) => handleLocalFieldChange('presence', presence.slotIndex, 'avatar', event.target.value)}
                    placeholder="https://..."
                    className="border-amber-500/20 bg-background/40"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => persistIdentity('presence', presence.slotIndex, `Presencia ${presence.slotIndex} actualizada.`)}
                  disabled={savingKey === saveKey}
                  className="mt-4 w-full border-amber-500/25 bg-amber-500/5 text-amber-100 hover:bg-amber-500/10"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Guardar presencia
                </Button>

                <div className="mt-4 rounded-2xl border border-border/60 bg-background/25 p-3">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                    Mensaje manual a sala
                  </label>
                  <Textarea
                    value={presenceMessages[presence.slotIndex] || ''}
                    onChange={(event) => handlePresenceMessageChange(presence.slotIndex, event.target.value)}
                    placeholder="Ej: hola"
                    className="min-h-[96px] border-amber-500/20 bg-background/40"
                  />
                  <Button
                    type="button"
                    onClick={() => handleSendPresenceMessage(presence)}
                    disabled={savingKey === sendKey}
                    className="mt-3 w-full bg-amber-600 hover:bg-amber-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Enviar a la sala
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {loading && (
        <div className="rounded-2xl border border-border/60 bg-background/25 p-4 text-sm text-slate-300">
          Cargando configuración seeded...
        </div>
      )}
    </div>
  );
};

export default AdminSeededChatPanel;
