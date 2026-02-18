import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Crown, Search, ShieldCheck, Trash2, UserPlus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { searchUsers } from '@/services/userService';
import { getTop20ActiveUsers } from '@/services/rewardsService';
import {
  reorderTopParticipants,
  removeTopParticipant,
  setParticipantPinnedRank,
  subscribeTopParticipantsAdmin,
  syncTopParticipantsFromActivity,
  updateTopParticipant,
  upsertTopParticipant,
} from '@/services/topParticipantsService';

const AdminTopParticipantsPanel = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeTopParticipantsAdmin(
      (items) => {
        setParticipants(items);
        setLoading(false);
      },
      () => {
        setParticipants([]);
        setLoading(false);
      }
    );

    return () => unsubscribe?.();
  }, []);

  const sortedParticipants = useMemo(
    () => [...participants].sort((a, b) => a.sortOrder - b.sortOrder),
    [participants]
  );

  const handleSyncFromActivity = async () => {
    setSyncing(true);
    try {
      const topUsers = await getTop20ActiveUsers();
      await syncTopParticipantsFromActivity(topUsers);
      toast({
        title: 'Top sincronizado',
        description: 'Se actualizaron los participantes desde actividad real.',
      });
    } catch (error) {
      console.error('[ADMIN_TOP_PARTICIPANTS] sync error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo sincronizar el Top de actividad.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchTerm.trim()) return;
    setSearchingUsers(true);
    try {
      const results = await searchUsers(searchTerm.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('[ADMIN_TOP_PARTICIPANTS] search error:', error);
      setSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleAddParticipant = async (user) => {
    try {
      const nextSortOrder = sortedParticipants.length + 1;
      await upsertTopParticipant({
        userId: user.id,
        username: user.username || 'Usuario',
        avatar: user.avatar || '',
        isActive: true,
        sortOrder: nextSortOrder,
        pinnedRank: null,
        blurEnabled: true,
        source: 'manual',
      });
      toast({ title: 'Usuario agregado', description: `${user.username || user.id} ahora aparece en tarjetas.` });
    } catch (error) {
      console.error('[ADMIN_TOP_PARTICIPANTS] add error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el usuario.',
        variant: 'destructive',
      });
    }
  };

  const handleMove = async (userId, direction) => {
    const index = sortedParticipants.findIndex((item) => item.userId === userId);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedParticipants.length) return;

    const next = [...sortedParticipants];
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);

    try {
      await reorderTopParticipants(next.map((entry) => entry.userId));
    } catch (error) {
      console.error('[ADMIN_TOP_PARTICIPANTS] reorder error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el orden.',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (userId) => {
    const confirmed = window.confirm('¿Eliminar este participante del panel destacado?');
    if (!confirmed) return;

    try {
      await removeTopParticipant(userId);
      toast({ title: 'Eliminado', description: 'Participante removido del listado.' });
    } catch (error) {
      console.error('[ADMIN_TOP_PARTICIPANTS] remove error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el participante.',
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="space-y-6">
      <div className="glass-effect p-6 rounded-xl border border-border/70">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-400" />
              Top Participantes (Sidebar)
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Se muestra entre Baúl e Iniciar Sesión. Top 1/2/3 sin blur; resto con blur editable.
            </p>
          </div>
          <Button
            onClick={handleSyncFromActivity}
            disabled={syncing}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            <Zap className="w-4 h-4 mr-2" />
            {syncing ? 'Sincronizando...' : 'Sincronizar desde actividad'}
          </Button>
        </div>
      </div>

      <div className="glass-effect p-6 rounded-xl border border-border/70">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-emerald-400" />
          Agregar usuario manual
        </h3>
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Buscar por username o ID..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSearchUsers();
            }}
            className="bg-background border-input"
          />
          <Button onClick={handleSearchUsers} disabled={searchingUsers || !searchTerm.trim()}>
            <Search className="w-4 h-4 mr-2" />
            {searchingUsers ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-1">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-card/50 px-3 py-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={result.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.username || result.id}`}
                    alt={result.username || result.id}
                    className="w-8 h-8 rounded-full border border-border/70"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{result.username || 'Usuario'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">ID: {result.id}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => handleAddParticipant(result)}>
                  Agregar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-effect p-6 rounded-xl border border-border/70">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          Editor de posiciones y blur
        </h3>

        {loading ? (
          <div className="text-sm text-muted-foreground py-4">Cargando participantes...</div>
        ) : sortedParticipants.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">
            No hay participantes configurados todavía.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedParticipants.map((item, index) => (
              <div
                key={item.userId}
                className="rounded-xl border border-border/70 bg-card/60 p-3 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={item.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username || item.userId}`}
                      alt={item.username || item.userId}
                      className="w-9 h-9 rounded-full border border-border/70"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{item.username}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Score: {item.activityScore || 0} | Mensajes: {item.messagesCount || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleMove(item.userId, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleMove(item.userId, 'down')}
                      disabled={index === sortedParticipants.length - 1}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-300"
                      onClick={() => handleRemove(item.userId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Top fijo</label>
                    <Select
                      value={item.pinnedRank ? String(item.pinnedRank) : 'none'}
                      onValueChange={async (value) => {
                        try {
                          await setParticipantPinnedRank(item.userId, value === 'none' ? null : Number(value));
                        } catch (error) {
                          console.error('[ADMIN_TOP_PARTICIPANTS] rank error:', error);
                          toast({
                            title: 'Error',
                            description: 'No se pudo actualizar la posición fija.',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin fijar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin fijar</SelectItem>
                        <SelectItem value="1">Top 1</SelectItem>
                        <SelectItem value="2">Top 2</SelectItem>
                        <SelectItem value="3">Top 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Orden manual</label>
                    <Input
                      type="number"
                      min="1"
                      defaultValue={item.sortOrder || 1}
                      onBlur={async (event) => {
                        const nextOrder = Number(event.target.value || 1);
                        try {
                          await updateTopParticipant(item.userId, { sortOrder: nextOrder });
                        } catch (error) {
                          console.error('[ADMIN_TOP_PARTICIPANTS] sort update error:', error);
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Activo</span>
                    <Switch
                      checked={Boolean(item.isActive)}
                      onCheckedChange={async (checked) => {
                        try {
                          await updateTopParticipant(item.userId, { isActive: checked });
                        } catch (error) {
                          console.error('[ADMIN_TOP_PARTICIPANTS] active update error:', error);
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Blur tarjeta</span>
                    <Switch
                      checked={Boolean(item.blurEnabled)}
                      onCheckedChange={async (checked) => {
                        try {
                          await updateTopParticipant(item.userId, { blurEnabled: checked });
                        } catch (error) {
                          console.error('[ADMIN_TOP_PARTICIPANTS] blur update error:', error);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminTopParticipantsPanel;
