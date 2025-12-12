import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { createSanction, SANCTION_TYPES, SANCTION_REASONS } from '@/services/sanctionsService';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle, Ban, VolumeX, Shield } from 'lucide-react';

const SanctionUserModal = ({ isOpen, onClose, user, currentAdmin }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: SANCTION_TYPES.WARNING,
    reason: SANCTION_REASONS.SPAM,
    reasonDescription: '',
    duration: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let expiresAt = null;
      
      // Calcular fecha de expiración para bans temporales
      if (formData.type === SANCTION_TYPES.TEMP_BAN && formData.duration) {
        const days = parseInt(formData.duration);
        if (days > 0) {
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + days);
          expiresAt = expirationDate;
        }
      }

      await createSanction({
        userId: user.id,
        username: user.username,
        type: formData.type,
        reason: formData.reason,
        reasonDescription: formData.reasonDescription,
        duration: formData.duration ? parseInt(formData.duration) : null,
        expiresAt: expiresAt,
        issuedByUsername: currentAdmin?.username || 'Admin',
        notes: formData.notes,
      });

      toast({
        title: "Sanción Aplicada",
        description: `Se ha aplicado ${getSanctionTypeLabel(formData.type)} a ${user.username}`,
      });

      // Reset form
      setFormData({
        type: SANCTION_TYPES.WARNING,
        reason: SANCTION_REASONS.SPAM,
        reasonDescription: '',
        duration: '',
        notes: '',
      });

      onClose();
    } catch (error) {
      console.error('Error creating sanction:', error);
      toast({
        title: "Error",
        description: "No se pudo aplicar la sanción. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSanctionTypeLabel = (type) => {
    switch (type) {
      case SANCTION_TYPES.WARNING: return 'Advertencia';
      case SANCTION_TYPES.TEMP_BAN: return 'Suspensión Temporal';
      case SANCTION_TYPES.PERM_BAN: return 'Expulsión Permanente';
      case SANCTION_TYPES.MUTE: return 'Silenciar';
      case SANCTION_TYPES.RESTRICT: return 'Restricción';
      default: return 'Sanción';
    }
  };

  const getReasonLabel = (reason) => {
    switch (reason) {
      case SANCTION_REASONS.SPAM: return 'Spam';
      case SANCTION_REASONS.HARASSMENT: return 'Acoso/Hostigamiento';
      case SANCTION_REASONS.INAPPROPRIATE_CONTENT: return 'Contenido Inapropiado';
      case SANCTION_REASONS.PROFANITY: return 'Groserías/Insultos';
      case SANCTION_REASONS.FAKE_ACCOUNT: return 'Cuenta Falsa';
      case SANCTION_REASONS.VIOLENCE_THREATS: return 'Amenazas/Violencia';
      case SANCTION_REASONS.ILLEGAL_CONTENT: return 'Contenido Ilegal';
      case SANCTION_REASONS.OTHER: return 'Otra';
      default: return reason;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            Sancionar Usuario
          </DialogTitle>
          <DialogDescription>
            Aplicar sanción a: <span className="font-semibold">{user?.username}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Sanción</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SANCTION_TYPES.WARNING}>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-yellow-400" />
                    Advertencia
                  </div>
                </SelectItem>
                <SelectItem value={SANCTION_TYPES.MUTE}>
                  <div className="flex items-center gap-2">
                    <VolumeX className="w-4 h-4 text-orange-400" />
                    Silenciar (No puede enviar mensajes)
                  </div>
                </SelectItem>
                <SelectItem value={SANCTION_TYPES.TEMP_BAN}>
                  <div className="flex items-center gap-2">
                    <Ban className="w-4 h-4 text-red-400" />
                    Suspensión Temporal
                  </div>
                </SelectItem>
                <SelectItem value={SANCTION_TYPES.PERM_BAN}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Expulsión Permanente
                  </div>
                </SelectItem>
                <SelectItem value={SANCTION_TYPES.RESTRICT}>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    Restricción de Funciones
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === SANCTION_TYPES.TEMP_BAN && (
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (días)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="365"
                placeholder="Ej: 7, 30, 90"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                El usuario será suspendido por el número de días especificado
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Razón de la Sanción</Label>
            <Select
              value={formData.reason}
              onValueChange={(value) => setFormData({ ...formData, reason: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SANCTION_REASONS.SPAM}>Spam</SelectItem>
                <SelectItem value={SANCTION_REASONS.HARASSMENT}>Acoso/Hostigamiento</SelectItem>
                <SelectItem value={SANCTION_REASONS.INAPPROPRIATE_CONTENT}>Contenido Inapropiado</SelectItem>
                <SelectItem value={SANCTION_REASONS.PROFANITY}>Groserías/Insultos</SelectItem>
                <SelectItem value={SANCTION_REASONS.FAKE_ACCOUNT}>Cuenta Falsa</SelectItem>
                <SelectItem value={SANCTION_REASONS.VIOLENCE_THREATS}>Amenazas/Violencia</SelectItem>
                <SelectItem value={SANCTION_REASONS.ILLEGAL_CONTENT}>Contenido Ilegal</SelectItem>
                <SelectItem value={SANCTION_REASONS.OTHER}>Otra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reasonDescription">Descripción Detallada</Label>
            <Textarea
              id="reasonDescription"
              placeholder="Describe en detalle la violación de normas..."
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

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Aplicar Sanción
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SanctionUserModal;

