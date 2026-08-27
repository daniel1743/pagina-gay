import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  BubbleChatIcon,
  Clock01Icon,
  EarthIcon,
  HeartIcon,
  LockPasswordIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonical } from '@/hooks/useCanonical';
import ChatDemo from '@/components/landing/ChatDemo';
import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';

const destinations = [
  { href: '/santiago', label: 'Santiago', description: 'Entrada local para la comunidad de Santiago.' },
  { href: '/mas-30', label: 'Mayores de 30', description: 'Una entrada temática para conversación madura.' },
  { href: '/opin', label: 'OPIN', description: 'Lee publicaciones e intenciones de la comunidad.' },
];

const principles = [
  {
    title: 'Actividad real',
    text: 'No rellenamos el chat con bots, perfiles ni mensajes inventados. Si la sala está tranquila, lo verás así.',
    icon: UserGroupIcon,
  },
  {
    title: 'Privacidad clara',
    text: 'Puedes usar un alias y decidir qué compartir. Evita publicar teléfono, correo, GPS o información sensible.',
    icon: LockPasswordIcon,
  },
  {
    title: 'Conversación primero',
    text: 'Chactivo concentra chat, publicaciones y continuidad privada sin obligarte a completar un perfil largo antes de entrar.',
    icon: BubbleChatIcon,
  },
];

const GlobalLandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showGuestNicknameModal, setShowGuestNicknameModal] = useState(false);

  useCanonical(location.pathname === '/' ? '/' : '/global');

  useEffect(() => {
    const previousTitle = document.title;
    const existingDescription = document.querySelector('meta[name="description"]');
    const previousDescription = existingDescription?.getAttribute('content') || '';
    const description = existingDescription || document.createElement('meta');

    document.title = 'Chat Gay Online en Chile | Conversa en Vivo | Chactivo';
    if (!existingDescription) {
      description.name = 'description';
      document.head.appendChild(description);
    }
    description.content = 'Chat gay online para conversar con la comunidad en Chile. Entra desde tu navegador, usa un alias y revisa la actividad real disponible.';

    return () => {
      document.title = previousTitle;
      if (existingDescription) {
        existingDescription.setAttribute('content', previousDescription);
      } else if (description.isConnected) {
        description.remove();
      }
    };
  }, []);

  const handleEnterChat = () => {
    if (user) {
      navigate('/chat/principal');
      return;
    }
    setShowGuestNicknameModal(true);
  };

  const handleGuestReady = () => {
    setShowGuestNicknameModal(false);
    navigate('/chat/principal', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-violet-950/80 to-cyan-950/70 px-5 py-12 shadow-2xl shadow-violet-950/20 sm:px-10 sm:py-16 lg:px-16"
        >
          <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-fuchsia-400/10 blur-3xl" aria-hidden="true" />
          <div className="relative max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-sm font-medium text-cyan-100">
              <HugeiconsIcon icon={EarthIcon} size={16} color="currentColor" aria-hidden="true" />
              Comunidad gay online en Chile
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">Conversaciones reales, sin vueltas</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-xl sm:leading-8">
              Entra al chat principal desde tu navegador, revisa qué actividad existe y decide cómo continuar. Chactivo no necesita aparentar una comunidad: necesita ayudarte a encontrar una conversación útil.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={handleEnterChat}
                className="min-h-12 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-6 text-base font-bold text-slate-950 shadow-lg shadow-fuchsia-500/20 hover:from-fuchsia-400 hover:to-cyan-300"
              >
                Entrar al chat principal
                <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="currentColor" className="ml-2" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/opin')}
                className="min-h-12 rounded-xl border-white/20 bg-white/5 px-6 text-base font-semibold text-white hover:bg-white/10"
              >
                Explorar OPIN
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2"><HugeiconsIcon icon={Clock01Icon} size={16} color="currentColor" aria-hidden="true" />Actividad según participación real</span>
              <span className="inline-flex items-center gap-2"><HugeiconsIcon icon={HeartIcon} size={16} color="currentColor" aria-hidden="true" />El ritmo lo decides tú</span>
            </div>
          </div>
        </motion.section>

        <section aria-labelledby="principles-title" className="mt-14 sm:mt-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Qué encontrarás</p>
            <h2 id="principles-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Una entrada clara para una comunidad que todavía está creciendo</h2>
            <p className="mt-4 leading-7 text-muted-foreground">La experiencia debe ser útil aunque haya poca actividad. Por eso mostramos los límites, las normas y el siguiente paso en lugar de prometer cifras que no podemos demostrar.</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {principles.map((principle) => (
              <article key={principle.title} className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm transition-colors hover:border-cyan-300/30">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                  <HugeiconsIcon icon={principle.icon} size={22} color="currentColor" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{principle.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{principle.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 sm:mt-16">
          <ChatDemo onJoinClick={handleEnterChat} title="Antes de entrar" />
        </section>

        <section aria-labelledby="destinations-title" className="mt-16 sm:mt-20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">Explora el ecosistema</p>
              <h2 id="destinations-title" className="mt-2 text-3xl font-bold tracking-tight">Elige la entrada que más te sirva</h2>
            </div>
            <a href="/faq" className="text-sm font-semibold text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline">Ver preguntas frecuentes</a>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {destinations.map((destination) => (
              <a key={destination.href} href={destination.href} className="group rounded-2xl border border-border/70 bg-card/40 p-5 transition hover:-translate-y-0.5 hover:border-violet-300/30 hover:bg-card/70">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold">{destination.label}</h3>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="currentColor" className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" aria-hidden="true" />
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{destination.description}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-500/10 via-card/60 to-cyan-400/10 p-7 text-center sm:mt-20 sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">¿Quieres conversar ahora?</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">Entra, revisa la actividad disponible y vuelve cuando quieras. La comunidad real no necesita un contador para merecer un espacio bien cuidado.</p>
          <Button
            type="button"
            onClick={handleEnterChat}
            className="mt-7 min-h-12 rounded-xl bg-foreground px-7 text-base font-bold text-background hover:bg-foreground/90"
          >
            Ir al chat principal
            <HugeiconsIcon icon={ArrowRight01Icon} size={19} color="currentColor" className="ml-2" aria-hidden="true" />
          </Button>
        </section>
      </main>

      <GuestUsernameModal
        open={showGuestNicknameModal}
        onClose={() => setShowGuestNicknameModal(false)}
        chatRoomId="principal"
        openSource="user"
        onGuestReady={handleGuestReady}
      />
    </div>
  );
};

export default GlobalLandingPage;
