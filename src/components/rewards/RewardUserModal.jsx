import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createReward, REWARD_TYPES, REWARD_REASONS } from '@/services/rewardsService';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Gift, Award, Star, Crown, Shield, Zap } from 'lucide-react';

const RewardUserModal = ({ isOpen, onClose, user, currentAdmin, onRewardCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: REWARD_TYPES.PREMIUM_1_MONTH,
    reason: REWARD_REASONS.TOP_ACTIVE,
    reasonDescription: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createReward({
        userId: user.id,
        username: user.username,
        type: formData.type,
        reason: formData.reason,
        reasonDescription: formData.reasonDescription,
        issuedByUsername: currentAdmin?.username || 'Admin',
        notes: formData.notes,
        metrics: user.metrics || {},
      });

      toast({
        title: "🎉 Recompensa Otorgada",
        description: `Se ha premiado a ${user.username} con ${getRewardTypeLabel(formData.type)}`,
      });

      // Reset form
      setFormData({
        type: REWARD_TYPES.PREMIUM_1_MONTH,
        reason: REWARD_REASONS.TOP_ACTIVE,
        reasonDescription: '',
        notes: '',
      });

      // Llamar callback si existe
      if (onRewardCreated) {
        onRewardCreated();
      }

      onClose();
    } catch (error) {
      console.error('Error creating reward:', error);
      toast({
        title: "Error",
        description: "No se pudo otorgar la recompensa. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRewardTypeLabel = (type) => {
    switch (type) {
      case REWARD_TYPES.PREMIUM_1_MONTH: return 'Premium 1 Mes';
      case REWARD_TYPES.VERIFIED_1_MONTH: return 'Verificación 1 Mes';
      case REWARD_TYPES.SPECIAL_AVATAR: return 'Avatar Especial 1 Mes';
      case REWARD_TYPES.FEATURED_USER: return 'Usuario Destacado';
      case REWARD_TYPES.MODERATOR_1_MONTH: return 'Moderador 1 Mes';
      case REWARD_TYPES.PRO_USER: return 'Usuario PRO (Paquete Completo)';
      default: return 'Recompensa';
    }
  };

  const getReasonLabel = (reason) => {
    switch (reason) {
      case REWARD_REASONS.TOP_ACTIVE: return 'Usuario Más Activo';
      case REWARD_REASONS.TOP_MESSAGES: return 'Más Mensajes';
      case REWARD_REASONS.TOP_FORUM: return 'Más Participación en Foro';
      case REWARD_REASONS.HELPFUL: return 'Usuario Servicial';
      case REWARD_REASONS.COMMUNITY_BUILDER: return 'Constructor de Comunidad';
      case REWARD_REASONS.AMBASSADOR: return 'Embajador';
      case REWARD_REASONS.PRO_RECOGNITION: return 'Reconocimiento PRO';
      case REWARD_REASONS.OTHER: return 'Otra';
      default: return reason;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-green-400" />
            Premiar Usuario
          </DialogTitle>
          <DialogDescription>
            Otorgar recompensa a: <span className="font-semibold text-green-400">{user?.username}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4 space-y-4">
            {/* Métricas del usuario */}
            {user?.metrics && (
              <div className="glass-effect p-4 rounded-lg border border-green-500/30">
                <h4 className="text-sm font-semibold mb-2 text-green-400">Métricas del Usuario:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Mensajes:</span>
                    <span className="ml-2 font-semibold">{user.metrics.messagesCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Threads:</span>
                    <span className="ml-2 font-semibold">{user.metrics.threadsCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Respuestas:</span>
                    <span className="ml-2 font-semibold">{user.metrics.repliesCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tiempo activo:</span>
                    <span className="ml-2 font-semibold">{user.metrics.totalActiveTime || 0} min</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Score de actividad:</span>
                    <span className="ml-2 font-semibold text-green-400">{user.metrics.activityScore || 0}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Recompensa</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={REWARD_TYPES.PREMIUM_1_MONTH}>
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      Premium por 1 Mes
                    </div>
                  </SelectItem>
                  <SelectItem value={REWARD_TYPES.VERIFIED_1_MONTH}>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-400" />
                      Verificación por 1 Mes
                    </div>
                  </SelectItem>
                  <SelectItem value={REWARD_TYPES.SPECIAL_AVATAR}>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-purple-400" />
                      Avatar Especial por 1 Mes
                    </div>
                  </SelectItem>
                  <SelectItem value={REWARD_TYPES.FEATURED_USER}>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-pink-400" />
                      Usuario Destacado
                    </div>
                  </SelectItem>
                  <SelectItem value={REWARD_TYPES.MODERATOR_1_MONTH}>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      Moderador por 1 Mes
                    </div>
                  </SelectItem>
                  <SelectItem value={REWARD_TYPES.PRO_USER}>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      PRO (2da foto + tarjeta destacada + arcoíris + badge)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Razón de la Recompensa</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData({ ...formData, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={REWARD_REASONS.TOP_ACTIVE}>Usuario Más Activo</SelectItem>
                  <SelectItem value={REWARD_REASONS.TOP_MESSAGES}>Más Mensajes</SelectItem>
                  <SelectItem value={REWARD_REASONS.TOP_FORUM}>Más Participación en Foro</SelectItem>
                  <SelectItem value={REWARD_REASONS.HELPFUL}>Usuario Servicial</SelectItem>
                  <SelectItem value={REWARD_REASONS.COMMUNITY_BUILDER}>Constructor de Comunidad</SelectItem>
                  <SelectItem value={REWARD_REASONS.AMBASSADOR}>Embajador</SelectItem>
                  <SelectItem value={REWARD_REASONS.PRO_RECOGNITION}>Reconocimiento PRO</SelectItem>
                  <SelectItem value={REWARD_REASONS.OTHER}>Otra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reasonDescription">Descripción del Mérito</Label>
              <Textarea
                id="reasonDescription"
                placeholder="Describe por qué este usuario merece esta recompensa..."
                value={formData.reasonDescription}
                onChange={(e) => setFormData({ ...formData, reasonDescription: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas Internas (Opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales para otros admins..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t bg-background/95 backdrop-blur">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-green-500 hover:bg-green-600" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Otorgando...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Enviar premio
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RewardUserModal;
