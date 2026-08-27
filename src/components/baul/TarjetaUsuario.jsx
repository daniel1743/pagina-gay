import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Clock01Icon,
  Comment01Icon,
  FavouriteIcon,
  FootprintsIcon,
  Location01Icon,
  SparklesIcon,
  UserIcon,
  UserStar01Icon,
} from '@hugeicons/core-free-icons';
import { obtenerFotoPrincipal } from '@/services/tarjetaService';
import { getBadgeConfig } from '@/services/badgeService';
import { useAuth } from '@/contexts/AuthContext';
import { getSafeAvatarSrc, handleAvatarImageError } from '@/utils/avatar';

const getTimestampMs = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const INTENT_LABELS = {
  conversar: 'Conversar',
  cita: 'Cita',
  amistad: 'Amistad',
  panorama: 'Panorama',
};

const formatExpiration = (value) => {
  const milliseconds = getTimestampMs(value);
  if (!milliseconds) return '';
  const date = new Date(milliseconds);
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' }).format(date);
};

const StatusLine = ({ estado }) => {
  const isOnline = estado === 'online';
  const isRecent = estado === 'reciente';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-white/75">
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]' : isRecent ? 'bg-amber-300' : 'bg-white/35'}`}
      />
      {isOnline ? 'Activo ahora' : isRecent ? 'Conectado recientemente' : 'Disponible cuando vuelva'}
    </span>
  );
};

const ActionIcon = ({ icon, size = 18 }) => (
  <HugeiconsIcon icon={icon} size={size} color="currentColor" strokeWidth={1.8} />
);

const TarjetaUsuario = ({
  tarjeta,
  onLike,
  onMensaje,
  onDejarHuella,
  onImpresion,
  onVerPerfil,
  esMiTarjeta = false,
  yaLeDiLike = false,
  yaDejeHuella = false,
  isLoading = false,
  isLoadingHuella = false,
  interactionLocked = false,
  onLockedAction,
  previewLocked = false,
  onPreviewLockedAction,
}) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(Boolean(yaLeDiLike));
  const [dejeHuella, setDejeHuella] = useState(Boolean(yaDejeHuella));
  const [showingSecondPhoto, setShowingSecondPhoto] = useState(false);
  const cardRef = useRef(null);
  const impressionSentRef = useRef(false);

  const cardId = tarjeta?.odIdUsuari || tarjeta?.id || 'unknown';
  const isPreviewLocked = Boolean(previewLocked && !esMiTarjeta);
  const estadoActual = tarjeta?.estadoReal || tarjeta?.estado || 'offline';
  const photo = showingSecondPhoto && tarjeta?.fotoUrl2 ? tarjeta.fotoUrl2 : obtenerFotoPrincipal(tarjeta);
  const hasPhoto = Boolean(photo);
  const hasSecondPhoto = Boolean(tarjeta?.fotoUrl2);
  const isSensitive = Boolean(
    tarjeta?.fotoSensible || tarjeta?.contenidoSensible || tarjeta?.isExplicit || tarjeta?.explicit || tarjeta?.nsfw || tarjeta?.isSensitive
  );
  const viewerKey = user?.id || user?.guestId || 'anon';
  const revealKey = `baul_blur_reveal:${viewerKey}:${cardId}`;
  const [revealed, setRevealed] = useState(() => sessionStorage.getItem(revealKey) === '1');
  const expirationMs = getTimestampMs(tarjeta?.intencionExpiracion);
  const hasIntent = Boolean(String(tarjeta?.intencion || tarjeta?.buscando || tarjeta?.intencionFrase || '').trim());
  const intentIsActive = hasIntent && (!expirationMs || expirationMs > Date.now());
  const expiresSoon = intentIsActive && expirationMs && expirationMs - Date.now() <= 24 * 60 * 60 * 1000;
  const intentLabel = INTENT_LABELS[tarjeta?.intencion] || (tarjeta?.buscando ? 'Busca' : 'Intención');
  const intentText = tarjeta?.intencionFrase || tarjeta?.buscando || '';
  const isProUser = Boolean(tarjeta?.isProUser || tarjeta?.canUploadSecondPhoto || tarjeta?.hasFeaturedCard || tarjeta?.hasRainbowBorder || tarjeta?.hasProBadge);
  const displayAge = tarjeta?.mostrarEdad !== false && tarjeta?.edad;
  const locationLabel = tarjeta?.comuna || tarjeta?.ubicacionTexto;

  useEffect(() => setLiked(Boolean(yaLeDiLike)), [yaLeDiLike]);
  useEffect(() => setDejeHuella(Boolean(yaDejeHuella)), [yaDejeHuella]);
  useEffect(() => setRevealed(sessionStorage.getItem(revealKey) === '1'), [revealKey]);

  useEffect(() => {
    if (!onImpresion || esMiTarjeta || !cardRef.current) return undefined;
    const element = cardRef.current;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.2) && !impressionSentRef.current) {
        impressionSentRef.current = true;
        onImpresion(tarjeta);
      }
    }, { threshold: 0.2, rootMargin: '50px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [esMiTarjeta, onImpresion, tarjeta]);

  const handleLike = async (event) => {
    event.stopPropagation();
    if (esMiTarjeta || isLoading) return;
    if (isPreviewLocked) return onPreviewLockedAction?.('like');
    if (interactionLocked) return onLockedAction?.('like');
    const nextLiked = !liked;
    const success = await onLike?.(tarjeta, nextLiked);
    if (success) setLiked(nextLiked);
  };

  const handleFootprint = async (event) => {
    event.stopPropagation();
    if (esMiTarjeta || dejeHuella || isLoadingHuella) return;
    if (isPreviewLocked) return onPreviewLockedAction?.('huella');
    if (interactionLocked) return onLockedAction?.('huella');
    const result = await onDejarHuella?.(tarjeta);
    if (result) setDejeHuella(true);
  };

  const handleMessage = (event) => {
    event.stopPropagation();
    if (esMiTarjeta) return;
    if (isPreviewLocked) return onPreviewLockedAction?.('chat');
    if (interactionLocked) return onLockedAction?.('chat');
    onMensaje?.(tarjeta);
  };

  const handleProfile = () => {
    if (isPreviewLocked) return onPreviewLockedAction?.('ver_perfil');
    onVerPerfil?.(tarjeta);
  };

  const handleReveal = (event) => {
    event.stopPropagation();
    sessionStorage.setItem(revealKey, '1');
    setRevealed(true);
  };

  const shouldBlur = (isSensitive && !esMiTarjeta && !revealed) || isPreviewLocked;
  const badgeConfig = tarjeta?.badge && tarjeta.badge !== 'Nuevo' ? getBadgeConfig(tarjeta.badge) : null;

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleProfile}
      className={`group relative overflow-hidden rounded-[1.5rem] border bg-[#101936] text-white shadow-[0_20px_55px_rgba(3,8,28,0.28)] transition-all hover:-translate-y-1 hover:border-cyan-300/35 hover:shadow-[0_25px_65px_rgba(3,8,28,0.42)] ${esMiTarjeta ? 'border-cyan-300/55 ring-1 ring-cyan-300/20' : 'border-white/10'}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-[#1b2d5a] via-[#121c3b] to-[#0b1025]">
        {hasPhoto ? (
          <img
            src={getSafeAvatarSrc(photo)}
            alt={`Foto de ${tarjeta?.nombre || 'usuario'}`}
            onError={handleAvatarImageError}
            loading="lazy"
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] ${shouldBlur ? 'scale-[1.08] blur-[18px] brightness-50 saturate-0' : ''}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-cyan-200/45"><ActionIcon icon={UserIcon} size={54} /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080d20] via-[#0b1025]/10 to-transparent" />

        {isPreviewLocked && (
          <button type="button" onClick={(event) => { event.stopPropagation(); onPreviewLockedAction?.('ver_perfil'); }} className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-[#07102a]/75 px-5 text-center backdrop-blur-sm">
            <ActionIcon icon={UserStar01Icon} size={28} />
            <span className="text-sm font-semibold">Conoce este perfil</span>
            <span className="text-xs text-cyan-100/75">Crea tu cuenta para desbloquearlo</span>
          </button>
        )}
        {isSensitive && !esMiTarjeta && !revealed && !isPreviewLocked && (
          <button type="button" onClick={handleReveal} className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 px-5 text-center text-sm font-semibold">
            Tocar para ver
          </button>
        )}

        {hasSecondPhoto && !shouldBlur && (
          <div className="absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-between px-2">
            <button type="button" aria-label="Ver foto anterior" onClick={(event) => { event.stopPropagation(); setShowingSecondPhoto(false); }} className="rounded-full bg-black/45 p-2 text-white/90 backdrop-blur hover:bg-black/65"><ActionIcon icon={ArrowLeft01Icon} size={16} /></button>
            <button type="button" aria-label="Ver segunda foto" onClick={(event) => { event.stopPropagation(); setShowingSecondPhoto(true); }} className="rounded-full bg-black/45 p-2 text-white/90 backdrop-blur hover:bg-black/65"><ActionIcon icon={ArrowRight01Icon} size={16} /></button>
          </div>
        )}

        <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {esMiTarjeta && <span className="rounded-full border border-cyan-200/30 bg-cyan-300/20 px-2.5 py-1 text-[11px] font-bold text-cyan-100">Tu tarjeta</span>}
            {!esMiTarjeta && estadoActual === 'online' && <span className="rounded-full border border-emerald-200/20 bg-emerald-400/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">Activo ahora</span>}
            {isProUser && <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/25 bg-amber-400/20 px-2.5 py-1 text-[11px] font-semibold text-amber-100"><ActionIcon icon={SparklesIcon} size={13} />Destacado</span>}
          </div>
          {hasSecondPhoto && <span className="rounded-full bg-black/40 px-2 py-1 text-[11px] text-white/80">{showingSecondPhoto ? '2/2' : '1/2'}</span>}
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-2xl font-bold tracking-tight">{tarjeta?.nombre || 'Usuario'}{displayAge ? <span className="ml-1.5 text-lg font-medium text-white/70">{tarjeta.edad}</span> : null}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {tarjeta?.rol && <span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-semibold text-white/85">{tarjeta.rol}</span>}
                {badgeConfig && <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badgeConfig.bg} ${badgeConfig.color} ${badgeConfig.border}`}>{tarjeta.badge}</span>}
              </div>
            </div>
            <StatusLine estado={estadoActual} />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/65">
          {locationLabel && <span className="inline-flex items-center gap-1.5"><ActionIcon icon={Location01Icon} size={15} />{locationLabel}</span>}
          {tarjeta?.horariosConexion && <span className="inline-flex items-center gap-1.5"><ActionIcon icon={Clock01Icon} size={15} />Horarios declarados</span>}
        </div>

        {hasIntent && (
          <div className={`rounded-2xl border p-3 ${intentIsActive ? 'border-fuchsia-300/20 bg-fuchsia-300/8' : 'border-white/10 bg-white/5 opacity-70'}`}>
            <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-fuchsia-100/80">
              <span>{intentLabel}</span>
              {intentIsActive && expirationMs ? <span className={`inline-flex items-center gap-1 normal-case tracking-normal ${expiresSoon ? 'text-amber-200' : 'text-white/55'}`}><ActionIcon icon={Calendar03Icon} size={14} />Hasta {formatExpiration(tarjeta.intencionExpiracion)}</span> : <span className="normal-case tracking-normal text-white/45">Intención vencida</span>}
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/90">{intentText}</p>
          </div>
        )}

        {tarjeta?.bio && <p className="line-clamp-2 text-sm leading-5 text-white/65">{tarjeta.bio}</p>}

        {!esMiTarjeta ? (
          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <button type="button" onClick={handleLike} disabled={isLoading} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${liked ? 'bg-fuchsia-400 text-[#160c30] shadow-[0_8px_25px_rgba(232,121,249,0.25)]' : 'border border-fuchsia-300/25 bg-fuchsia-300/10 text-fuchsia-100 hover:bg-fuchsia-300/20'} disabled:cursor-wait disabled:opacity-60`} aria-label={liked ? 'Quitar interés' : 'Mostrar interés'}>
              <ActionIcon icon={FavouriteIcon} size={18} />{liked ? 'Te interesa' : 'Me interesa'}
            </button>
            <button type="button" onClick={handleMessage} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 text-cyan-100 transition hover:bg-cyan-300/20" aria-label="Abrir chat privado"><ActionIcon icon={Comment01Icon} size={19} /></button>
            <button type="button" onClick={handleFootprint} disabled={dejeHuella || isLoadingHuella} className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-3 transition ${dejeHuella ? 'border-amber-200/20 bg-amber-300/15 text-amber-100' : 'border-white/10 bg-white/5 text-white/65 hover:border-amber-200/30 hover:text-amber-100'} disabled:cursor-default disabled:opacity-70`} aria-label={dejeHuella ? 'Ya pasaste por aquí' : 'Pasé por aquí'}><ActionIcon icon={FootprintsIcon} size={19} /></button>
          </div>
        ) : (
          <button type="button" onClick={handleProfile} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20"><ActionIcon icon={UserStar01Icon} size={18} />Editar tarjeta</button>
        )}
      </div>
    </motion.article>
  );
};

export default TarjetaUsuario;
