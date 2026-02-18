import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Eye,
  EyeOff,
  GripVertical,
  Megaphone,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import FeaturedChannelCard from '@/components/featured/FeaturedChannelCard';
import {
  createFeaturedAd,
  deleteFeaturedAd,
  normalizeReorderedAds,
  reorderFeaturedAds,
  subscribeFeaturedAdsAdmin,
  toggleFeaturedAdActive,
  updateFeaturedAd,
} from '@/services/featuredAdsService';
import { sanitizeFeaturedAdInput, validateFeaturedAd } from '@/utils/embeds';

const PLATFORM_OPTIONS = [
  { value: 'telegram', label: 'Telegram' },
  { value: 'x', label: 'X' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'other', label: 'Otro' },
];

const MEDIA_OPTIONS = [
  { value: 'none', label: 'Sin preview' },
  { value: 'image', label: 'Imagen' },
  { value: 'x_embed', label: 'Embed X/Twitter' },
  { value: 'iframe', label: 'Iframe generico' },
];

const toInputDatetimeValue = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const parseDatetimeLocal = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getDefaultForm = (adsLength = 0) => ({
  title: '',
  description: '',
  platform: 'telegram',
  ctaText: 'Ver',
  url: '',
  mediaType: 'none',
  mediaUrl: '',
  blurEnabled: true,
  blurStrength: 14,
  badge: '',
  isActive: true,
  sortOrder: adsLength + 1,
  startsAt: '',
  endsAt: '',
});

const mapAdToForm = (ad) => ({
  title: ad.title || '',
  description: ad.description || '',
  platform: ad.platform || 'telegram',
  ctaText: ad.ctaText || 'Ver',
  url: ad.url || '',
  mediaType: ad.mediaType || 'none',
  mediaUrl: ad.mediaUrl || '',
  blurEnabled: Boolean(ad.blurEnabled),
  blurStrength: Number(ad.blurStrength || 14),
  badge: ad.badge || '',
  isActive: Boolean(ad.isActive),
  sortOrder: Number(ad.sortOrder || 1),
  startsAt: toInputDatetimeValue(ad.startsAt),
  endsAt: toInputDatetimeValue(ad.endsAt),
});

const AdminFeaturedAdsPanel = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAdId, setEditingAdId] = useState(null);
  const [formData, setFormData] = useState(getDefaultForm());
  const [formErrors, setFormErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeFeaturedAdsAdmin(
      (items) => {
        setAds(items);
        setErrorMessage('');
        setLoading(false);
      },
      (error) => {
        console.error('[ADMIN_FEATURED_ADS] error:', error);
        setErrorMessage('No se pudieron cargar los anuncios.');
        setLoading(false);
      }
    );
    return () => unsubscribe?.();
  }, []);

  const sortedAds = useMemo(
    () => [...ads].sort((a, b) => (a.sortOrder || 9999) - (b.sortOrder || 9999)),
    [ads]
  );

  const openCreate = () => {
    setEditingAdId(null);
    setFormData(getDefaultForm(sortedAds.length));
    setFormErrors([]);
    setIsFormOpen(true);
  };

  const openEdit = (ad) => {
    setEditingAdId(ad.id);
    setFormData(mapAdToForm(ad));
    setFormErrors([]);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingAdId(null);
    setFormData(getDefaultForm(sortedAds.length));
    setFormErrors([]);
  };

  const persistOrder = async (nextAds) => {
    const orderedIds = nextAds.map((ad) => ad.id);
    await reorderFeaturedAds(orderedIds);
  };

  const handleDropOn = async (targetId) => {
    if (!draggingId || draggingId === targetId) return;
    const next = normalizeReorderedAds(sortedAds, draggingId, targetId);
    setDraggingId(null);
    setAds(next);
    try {
      await persistOrder(next);
      toast({ title: 'Orden actualizado', description: 'Se guardo el nuevo orden.' });
    } catch (error) {
      console.error('[ADMIN_FEATURED_ADS] Error guardando orden:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el orden.',
        variant: 'destructive',
      });
    }
  };

  const moveAd = async (adId, direction) => {
    const index = sortedAds.findIndex((ad) => ad.id === adId);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedAds.length) return;

    const next = [...sortedAds];
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);
    const normalized = next.map((ad, idx) => ({ ...ad, sortOrder: idx + 1 }));
    setAds(normalized);
    try {
      await persistOrder(normalized);
    } catch (error) {
      console.error('[ADMIN_FEATURED_ADS] Error moviendo anuncio:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el orden.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (ad) => {
    try {
      await toggleFeaturedAdActive(ad.id, !ad.isActive);
    } catch (error) {
      console.error('[ADMIN_FEATURED_ADS] Error toggle active:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del anuncio.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (ad) => {
    const confirmed = window.confirm(`Eliminar anuncio "${ad.title}"?`);
    if (!confirmed) return;
    try {
      await deleteFeaturedAd(ad.id);
      toast({ title: 'Anuncio eliminado', description: 'Se elimino correctamente.' });
    } catch (error) {
      console.error('[ADMIN_FEATURED_ADS] Error delete:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el anuncio.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFormErrors([]);

    const payload = sanitizeFeaturedAdInput({
      ...formData,
      startsAt: parseDatetimeLocal(formData.startsAt),
      endsAt: parseDatetimeLocal(formData.endsAt),
    });
    const validation = validateFeaturedAd(payload);

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setIsSaving(false);
      return;
    }

    try {
      if (editingAdId) {
        await updateFeaturedAd(editingAdId, payload);
        toast({ title: 'Anuncio actualizado', description: 'Cambios guardados.' });
      } else {
        await createFeaturedAd(payload);
        toast({ title: 'Anuncio creado', description: 'Nuevo canal destacado agregado.' });
      }
      closeForm();
    } catch (error) {
      console.error('[ADMIN_FEATURED_ADS] Error guardando anuncio:', error);
      setFormErrors([error?.message || 'No se pudo guardar el anuncio.']);
    } finally {
      setIsSaving(false);
    }
  };

  const previewAd = useMemo(
    () => ({
      id: editingAdId || 'preview',
      ...sanitizeFeaturedAdInput({
        ...formData,
        startsAt: parseDatetimeLocal(formData.startsAt),
        endsAt: parseDatetimeLocal(formData.endsAt),
      }),
      clickCount: 0,
    }),
    [editingAdId, formData]
  );

  return (
    <div className="space-y-6">
      <div className="glass-effect rounded-2xl border border-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-cyan-400" />
              Canales Destacados
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              CRUD completo, orden manual, activacion y programacion.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Crear anuncio
          </Button>
        </div>

        {loading && (
          <div className="py-10 text-center text-muted-foreground">Cargando anuncios...</div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && sortedAds.length === 0 && (
          <div className="rounded-xl border border-border/50 bg-secondary/20 p-6 text-center text-muted-foreground">
            No hay anuncios creados. Agrega el primero.
          </div>
        )}

        {!loading && !errorMessage && sortedAds.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full min-w-[1024px] text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left py-3 px-3">Orden</th>
                  <th className="text-left py-3 px-3">Estado</th>
                  <th className="text-left py-3 px-3">Titulo</th>
                  <th className="text-left py-3 px-3">Plataforma</th>
                  <th className="text-left py-3 px-3">Media</th>
                  <th className="text-left py-3 px-3">Programacion</th>
                  <th className="text-left py-3 px-3">Clicks</th>
                  <th className="text-left py-3 px-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedAds.map((ad) => (
                  <tr
                    key={ad.id}
                    draggable
                    onDragStart={() => setDraggingId(ad.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDropOn(ad.id)}
                    className="border-t border-border/40 hover:bg-muted/20"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        <span className="font-semibold">{ad.sortOrder}</span>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveAd(ad.id, 'up')}>
                            <span className="text-xs">↑</span>
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveAd(ad.id, 'down')}>
                            <span className="text-xs">↓</span>
                          </Button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Switch checked={ad.isActive} onCheckedChange={() => handleToggleActive(ad)} />
                        <span className={ad.isActive ? 'text-emerald-400' : 'text-muted-foreground'}>
                          {ad.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium">{ad.title}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[220px]">{ad.description}</div>
                    </td>
                    <td className="py-3 px-3 uppercase text-xs">{ad.platform}</td>
                    <td className="py-3 px-3">{ad.mediaType}</td>
                    <td className="py-3 px-3">
                      <div className="text-xs text-muted-foreground">
                        {ad.startsAt ? `Inicio: ${new Date(ad.startsAt).toLocaleString('es-CL')}` : 'Sin inicio'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ad.endsAt ? `Fin: ${new Date(ad.endsAt).toLocaleString('es-CL')}` : 'Sin fin'}
                      </div>
                    </td>
                    <td className="py-3 px-3">{ad.clickCount || 0}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(ad)}>
                          <Pencil className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(ad)}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={(next) => !next && closeForm()}>
        <DialogContent className="max-w-5xl w-[96vw] max-h-[92vh]">
          <DialogHeader>
            <DialogTitle>{editingAdId ? 'Editar anuncio' : 'Crear anuncio'}</DialogTitle>
            <DialogDescription>
              Completa los campos y revisa la vista previa antes de guardar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto pr-1">
            <div className="space-y-4">
              <section className="rounded-xl border border-border/50 p-4 space-y-3">
                <h3 className="font-semibold">Datos basicos</h3>
                <div className="space-y-2">
                  <Label htmlFor="ad-title">Titulo</Label>
                  <Input
                    id="ad-title"
                    value={formData.title}
                    maxLength={40}
                    onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ad-description">Descripcion</Label>
                  <Textarea
                    id="ad-description"
                    value={formData.description}
                    maxLength={80}
                    rows={2}
                    onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Plataforma</Label>
                    <Select value={formData.platform} onValueChange={(value) => setFormData((prev) => ({ ...prev, platform: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORM_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ad-badge">Badge (opcional)</Label>
                    <Input
                      id="ad-badge"
                      value={formData.badge}
                      maxLength={16}
                      onChange={(event) => setFormData((prev) => ({ ...prev, badge: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ad-cta">Texto CTA</Label>
                    <Input
                      id="ad-cta"
                      value={formData.ctaText}
                      maxLength={16}
                      onChange={(event) => setFormData((prev) => ({ ...prev, ctaText: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ad-order">Orden</Label>
                    <Input
                      id="ad-order"
                      type="number"
                      min={1}
                      value={formData.sortOrder}
                      onChange={(event) => setFormData((prev) => ({ ...prev, sortOrder: Number(event.target.value || 1) }))}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border/50 p-4 space-y-3">
                <h3 className="font-semibold">Enlace y preview</h3>

                <div className="space-y-2">
                  <Label htmlFor="ad-url">URL destino</Label>
                  <Input
                    id="ad-url"
                    type="url"
                    value={formData.url}
                    onChange={(event) => setFormData((prev) => ({ ...prev, url: event.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de media</Label>
                  <Select value={formData.mediaType} onValueChange={(value) => setFormData((prev) => ({ ...prev, mediaType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDIA_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.mediaType !== 'none' && (
                  <div className="space-y-2">
                    <Label htmlFor="ad-media-url">Media URL</Label>
                    <Input
                      id="ad-media-url"
                      value={formData.mediaUrl}
                      onChange={(event) => setFormData((prev) => ({ ...prev, mediaUrl: event.target.value }))}
                      required
                    />
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-border/50 p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-cyan-400" />
                  Seguridad y programacion
                </h3>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label className="text-sm">Estado activo</Label>
                    <p className="text-xs text-muted-foreground">Solo activos se muestran en el chat.</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(value) => setFormData((prev) => ({ ...prev, isActive: value }))}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {formData.blurEnabled ? <EyeOff className="w-4 h-4 text-yellow-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
                    <div>
                      <Label className="text-sm">Blur en preview +18</Label>
                      <p className="text-xs text-muted-foreground">Por defecto activo para contenido sensible.</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.blurEnabled}
                    onCheckedChange={(value) => setFormData((prev) => ({ ...prev, blurEnabled: value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ad-blur-strength">Intensidad blur: {formData.blurStrength}px</Label>
                  <Input
                    id="ad-blur-strength"
                    type="range"
                    min={6}
                    max={20}
                    value={formData.blurStrength}
                    onChange={(event) => setFormData((prev) => ({ ...prev, blurStrength: Number(event.target.value) }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ad-starts-at">Inicio (opcional)</Label>
                    <Input
                      id="ad-starts-at"
                      type="datetime-local"
                      value={formData.startsAt}
                      onChange={(event) => setFormData((prev) => ({ ...prev, startsAt: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ad-ends-at">Fin (opcional)</Label>
                    <Input
                      id="ad-ends-at"
                      type="datetime-local"
                      value={formData.endsAt}
                      onChange={(event) => setFormData((prev) => ({ ...prev, endsAt: event.target.value }))}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-4">
              <section className="rounded-xl border border-border/50 p-4">
                <h3 className="font-semibold mb-3">Vista previa</h3>
                <FeaturedChannelCard ad={previewAd} disableLink showClicks />
              </section>

              {formErrors.length > 0 && (
                <section className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 space-y-1">
                  {formErrors.map((error) => (
                    <p key={error} className="text-xs text-red-300">{error}</p>
                  ))}
                </section>
              )}

              <section className="rounded-xl border border-border/50 p-4 text-xs text-muted-foreground space-y-1">
                <p>Allowlist embeds: x.com, twitter.com, youtube.com, youtu.be, player.vimeo.com.</p>
                <p>Para contenido sensible usa blur activado por defecto.</p>
                <p>Puedes reordenar arrastrando filas o con flechas.</p>
              </section>
            </div>
          </form>

          <DialogFooter className="pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar anuncio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFeaturedAdsPanel;

