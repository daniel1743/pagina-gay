/**
 * Vista pública del perfil de un usuario
 * Muestra foto, nombre, rol, intereses, actividad social y datos públicos del baúl.
 * Reutilizable en página /profile/:userId, modal desde chat, tarjeta, etc.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CheckCircle,
  Shield,
  Crown,
  MapPin,
  Users,
  Eye,
  Heart,
  MessageSquare,
  Flame,
  Sparkles,
  CalendarDays,
} from 'lucide-react';

const formatCompact = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return '0';
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
  return String(number);
};

const formatSince = (timestampMs) => {
  if (!timestampMs) return null;
  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('es-CL', { year: 'numeric', month: 'short' });
};

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-border/70 bg-secondary/35 px-3 py-3">
    <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
    <p className="mt-1 text-xl font-semibold text-foreground">{formatCompact(value)}</p>
  </div>
);

const PublicProfileView = ({
  profile,
  isLoading = false,
  onClose,
  showCloseButton = false,
  onOpenFriendProfile,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-24 h-24 rounded-full bg-muted animate-pulse mb-4" />
        <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 px-4 text-muted-foreground">
        <p>Este perfil no está disponible o el usuario lo ha ocultado.</p>
      </div>
    );
  }

  const roleValue = (profile.role || '').toString().toLowerCase();
  const isAdminRole = roleValue === 'admin' || roleValue === 'administrator' || roleValue === 'superadmin';
  const displayRole = profile.profileRole
    || (!['admin', 'administrator', 'superadmin', 'support', 'user'].includes(roleValue) ? profile.role : '')
    || '';
  const stats = profile?.stats || {};
  const baul = profile?.baul || {};
  const friendsPreview = Array.isArray(profile?.friendsPreview) ? profile.friendsPreview.slice(0, 8) : [];
  const interests = Array.isArray(profile?.interests) ? profile.interests : [];
  const recentOpinPosts = Array.isArray(profile?.recentOpinPosts) ? profile.recentOpinPosts.slice(0, 3) : [];
  const memberSince = formatSince(profile?.createdAtMs);
  const displayBio = profile?.description || baul?.bio || 'Este usuario aún no agregó una descripción.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5"
    >
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cerrar"
        >
          <span className="text-xl">×</span>
        </button>
      )}

      <section className="rounded-2xl border border-cyan-500/25 overflow-hidden bg-gradient-to-br from-[#13182f] via-[#1b1a3a] to-[#13203a]">
        <div className="h-24 bg-[radial-gradient(circle_at_15%_20%,rgba(0,255,255,0.2),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(255,0,132,0.2),transparent_45%)]" />
        <div className="px-5 pb-5 -mt-12">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className={`rounded-full ${
              isAdminRole ? 'admin-avatar-ring' : profile.verified ? 'verified-avatar-ring' : profile.isPremium ? 'premium-avatar-ring' : ''
            }`}>
              <Avatar className="w-24 h-24 md:w-28 md:h-28">
                <AvatarImage src={profile.avatar} alt={profile.username} />
                <AvatarFallback className="text-2xl bg-[#413e62] text-white">
                  {profile.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex flex-wrap items-center gap-2">
                {profile.username}
                {profile.isPremium && <Crown className="w-5 h-5 text-amber-300" />}
                {profile.verified && <CheckCircle className="w-5 h-5 text-[#1DA1F2]" />}
              </h1>

              <div className="flex flex-wrap gap-2 text-xs">
                {displayRole && (
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-200 border border-cyan-400/25">
                    {displayRole}
                  </span>
                )}
                {baul?.rol && (
                  <span className="px-2.5 py-1 rounded-full bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/25">
                    {baul.rol}
                  </span>
                )}
                {profile.verified && (
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-200 border border-blue-400/25 inline-flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Verificado
                  </span>
                )}
                {memberSince && (
                  <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border inline-flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" /> Miembro desde {memberSince}
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm md:text-base text-slate-200/90 leading-relaxed">
            “{displayBio}”
          </p>
          {profile.estado && (
            <p className="mt-2 text-sm text-cyan-300 font-medium">{profile.estado}</p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Amigos" value={stats.favoritesCount} />
        <StatCard icon={Sparkles} label="Intereses" value={stats.interestsCount} />
        <StatCard icon={MessageSquare} label="Notas OPIN" value={stats.opinPostsCount} />
        <StatCard icon={Eye} label="Vistas" value={stats.opinViews || stats.profileViews} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card/40 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300 mb-3">Intereses y gustos</h3>
          {interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="bg-accent text-foreground px-3 py-1.5 text-sm rounded-full border border-border/60"
                >
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aún no hay intereses públicos configurados.</p>
          )}

          {(baul?.buscando || baul?.ubicacionTexto || baul?.edad) && (
            <div className="mt-4 pt-4 border-t border-border/70 space-y-2 text-sm">
              {baul?.buscando && (
                <p className="text-foreground/90"><span className="text-cyan-300 font-medium">Busca:</span> {baul.buscando}</p>
              )}
              {baul?.ubicacionTexto && (
                <p className="text-foreground/90 inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-cyan-300" />
                  {baul.ubicacionTexto}
                </p>
              )}
              {baul?.edad && (
                <p className="text-foreground/90"><span className="text-cyan-300 font-medium">Edad:</span> {baul.edad} años</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/40 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300 mb-3">Conexiones</h3>
          {friendsPreview.length > 0 ? (
            <div className="space-y-2">
              {friendsPreview.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => onOpenFriendProfile?.(friend.id)}
                  className="w-full flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/25 hover:bg-secondary/45 px-3 py-2 transition-colors text-left"
                >
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={friend.avatar} alt={friend.username} />
                    <AvatarFallback className="bg-muted text-foreground text-xs">
                      {friend.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">{friend.username}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {friend.role || (friend.isPremium ? 'Premium' : 'Miembro')}
                    </p>
                  </div>
                  {friend.verified && <CheckCircle className="w-4 h-4 text-blue-300" />}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Este usuario aún no muestra amistades públicas.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Actividad reciente</h3>
          <div className="text-xs text-muted-foreground inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-pink-300" /> {formatCompact(stats.opinLikes)}</span>
            <span className="inline-flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-cyan-300" /> {formatCompact(stats.opinComments)}</span>
            <span className="inline-flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-300" /> {formatCompact(baul?.likesRecibidos)}</span>
          </div>
        </div>

        {recentOpinPosts.length > 0 ? (
          <div className="space-y-2">
            {recentOpinPosts.map((post) => (
              <article
                key={post.id}
                className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5"
              >
                <p className="text-sm text-foreground/95 leading-relaxed line-clamp-2">
                  {post.text || 'Nota sin texto'}
                </p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {formatCompact(post.likeCount)}</span>
                  <span className="inline-flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {formatCompact(post.commentCount)}</span>
                  <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {formatCompact(post.viewCount)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía no hay notas públicas recientes en OPIN.</p>
        )}
      </section>

      {baul?.bio && (
        <section className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-fuchsia-300 mb-2">Más sobre su perfil de baúl</h3>
          <p className="text-sm text-foreground/90 leading-relaxed">{baul.bio}</p>
        </section>
      )}

    </motion.div>
  );
};

export default PublicProfileView;
