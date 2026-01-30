/**
 * 🛡️ OpinStablesPanel – Gestión de OPINs estables (mínimo 20)
 * Panel admin: CRUD de OPINs que no expiran y siempre aparecen en el feed.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  getStableOpinPosts,
  createStableOpinPost,
  updateStableOpinPost,
  deleteStableOpinPost,
  seedStableOpinExamples,
  OPIN_MIN_STABLE,
  OPIN_COLORS,
} from '@/services/opinService';

const colorKeys = Object.keys(OPIN_COLORS);

export default function OpinStablesPanel() {
  const [stables, setStables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    text: '',
    color: 'purple',
    customUsername: '', // Para seeding con nombre genérico
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await getStableOpinPosts();
      setStables(list);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: e.message || 'No se pudieron cargar OPINs estables',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: '', text: '', color: 'purple', customUsername: '' });
    setFormOpen(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({
      title: p.title || '',
      text: p.text || '',
      color: p.color || 'purple',
      customUsername: '', // No se edita el username
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm({ title: '', text: '', color: 'purple', customUsername: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const { title, text, color, customUsername } = form;
    if (!text || text.trim().length < 10) {
      toast({
        title: 'Texto inválido',
        description: 'Mínimo 10 caracteres',
        variant: 'destructive',
      });
      return;
    }
    if (text.length > 500) {
      toast({
        title: 'Texto inválido',
        description: 'Máximo 500 caracteres',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateStableOpinPost(editingId, { title: title.trim(), text: text.trim(), color });
        toast({ title: 'OPIN estable actualizado' });
      } else {
        // Pasar customUsername para seeding
        await createStableOpinPost({
          title: title.trim(),
          text: text.trim(),
          color,
          customUsername: customUsername?.trim() || ''
        });
        toast({
          title: 'OPIN estable creado',
          description: customUsername ? `Con nombre: ${customUsername}` : undefined
        });
      }
      closeForm();
      await load();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'No se pudo guardar',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este OPIN estable?')) return;
    try {
      await deleteStableOpinPost(id);
      toast({ title: 'OPIN estable eliminado' });
      await load();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'No se pudo eliminar',
        variant: 'destructive',
      });
    }
  };

  const handleSeed = async () => {
    if (stables.length >= OPIN_MIN_STABLE) {
      toast({
        title: 'Ya hay suficientes',
        description: `Tienes ${stables.length} estables. Objetivo mínimo: ${OPIN_MIN_STABLE}.`,
        variant: 'destructive',
      });
      return;
    }
    setSeedLoading(true);
    try {
      const created = await seedStableOpinExamples();
      toast({
        title: 'OPINs de ejemplo creados',
        description: `Se crearon ${created} OPINs estables.`,
      });
      await load();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'No se pudieron crear ejemplos',
        variant: 'destructive',
      });
    } finally {
      setSeedLoading(false);
    }
  };

  const count = stables.length;
  const needMore = Math.max(0, OPIN_MIN_STABLE - count);
  const isValid = form.text.trim().length >= 10 && form.text.length <= 500 && (form.title?.length || 0) <= 50;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-bold text-foreground">OPIN estables</h2>
            <p className="text-sm text-muted-foreground">
              Mínimo {OPIN_MIN_STABLE} siempre visibles en el feed. No expiran. Los de usuarios aplican 24h.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Actualizar
          </Button>
          {count < OPIN_MIN_STABLE && (
            <Button variant="secondary" size="sm" onClick={handleSeed} disabled={seedLoading}>
              {seedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Generar {needMore} ejemplos
            </Button>
          )}
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Crear estable
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card">
        {count >= OPIN_MIN_STABLE ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        )}
        <span className="text-sm font-medium">
          {count} / {OPIN_MIN_STABLE} estables
          {needMore > 0 && (
            <span className="text-amber-500 ml-1">
              — Faltan {needMore} para el mínimo
            </span>
          )}
        </span>
      </div>

      {formOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-border bg-card space-y-4"
        >
          <h3 className="font-semibold text-foreground">
            {editingId ? 'Editar OPIN estable' : 'Nuevo OPIN estable'}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Username personalizado (solo al crear, para seeding) */}
            {!editingId && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Nombre de usuario (seeding)
                  <span className="text-muted-foreground font-normal ml-2">
                    — Dejar vacío para usar tu nombre
                  </span>
                </label>
                <Input
                  value={form.customUsername}
                  onChange={(e) => setForm((f) => ({ ...f, customUsername: e.target.value }))}
                  placeholder="Ej: Carlos_28, JuanMadrid, etc."
                  maxLength={30}
                  className="max-w-md"
                />
                <span className="text-xs text-muted-foreground">
                  Usa nombres genéricos para que el panel se vea activo
                </span>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Título (opcional)</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Busco amigos"
                maxLength={50}
                className="max-w-md"
              />
              <span className="text-xs text-muted-foreground">{form.title.length}/50</span>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Texto *</label>
              <Textarea
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                placeholder="10–500 caracteres"
                rows={4}
                maxLength={500}
                className="max-w-2xl resize-none"
              />
              <span className="text-xs text-muted-foreground">
                {form.text.length}/500 {form.text.trim().length < 10 && '(mín. 10)'}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {colorKeys.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: k }))}
                    className={`w-8 h-8 rounded-full border-2 transition ${
                      form.color === k
                        ? 'border-foreground ring-2 ring-offset-2 ring-offset-background ring-foreground/50'
                        : 'border-transparent hover:border-muted-foreground/50'
                    } ${OPIN_COLORS[k]?.bg || 'bg-muted'}`}
                    title={OPIN_COLORS[k]?.name}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={!isValid || saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingId ? 'Guardar' : 'Crear'}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
                Cancelar
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : stables.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border bg-muted/30">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">
            No hay OPINs estables. Crea al menos {OPIN_MIN_STABLE} o genera ejemplos.
          </p>
          <Button onClick={openCreate}>Crear estable</Button>
          {needMore > 0 && (
            <Button variant="secondary" className="ml-2" onClick={handleSeed} disabled={seedLoading}>
              {seedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Generar {OPIN_MIN_STABLE} ejemplos
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {stables.map((p, i) => {
            const cfg = OPIN_COLORS[p.color] || OPIN_COLORS.purple;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 rounded-xl border ${cfg.border} ${cfg.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.title && (
                      <span className="font-semibold text-foreground">{p.title}</span>
                    )}
                    <span className="text-sm text-muted-foreground">#{i + 1}</span>
                    {/* Mostrar username y badge si fue seeded */}
                    <span className="text-sm text-cyan-400 font-medium">@{p.username}</span>
                    {p.isSeeded && (
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                        seeded
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground/90 mt-0.5 line-clamp-2">{p.text}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Editar">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(p.id)}
                    title="Eliminar"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
