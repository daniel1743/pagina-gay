import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  BubbleChatIcon,
  Clock01Icon,
  Location01Icon,
  LockPasswordIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonical } from '@/hooks/useCanonical';
import ChatDemo from '@/components/landing/ChatDemo';

const localContext = [
  {
    title: 'Santiago como contexto',
    text: 'Una entrada local para quienes están en Santiago o la Región Metropolitana, sin convertir comuna o barrio en una ubicación exacta.',
    icon: Location01Icon,
  },
  {
    title: 'Conversación antes que catálogo',
    text: 'Llegas a una sala de conversación. No mostramos un mapa de perfiles ni actividad de barrios si no existe una fuente real y autorizada.',
    icon: BubbleChatIcon,
  },
  {
    title: 'Privacidad por decisión',
    text: 'Puedes usar un alias y compartir solo el contexto que te haga sentir cómodo. Nunca publiques dirección, GPS, teléfono o correo.',
    icon: LockPasswordIcon,
  },
];

const SantiagoLandingPage = () => {
  useCanonical('/santiago');

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user && !user.isGuest && !user.isAnonymous) {
      navigate('/chat/principal', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const previousTitle = document.title;
    const existingDescription = document.querySelector('meta[name="description"]');
    const previousDescription = existingDescription?.getAttribute('content') || '';
    const description = existingDescription || document.createElement('meta');

    document.title = 'Chat Gay Santiago | Conversa con la Comunidad | Chactivo';
    if (!existingDescription) {
      description.name = 'description';
      document.head.appendChild(description);
    }
    description.content = 'Entrada local al chat gay de Santiago y la Región Metropolitana. Conversa desde tu navegador y revisa la actividad real disponible en Chactivo.';

    return () => {
      document.title = previousTitle;
      if (existingDescription) existingDescription.setAttribute('content', previousDescription);
      else if (description.isConnected) description.remove();
    };
  }, []);

  const handleEnterChat = () => {
    if (user) {
      navigate('/chat/principal');
      return;
    }
    navigate('/auth', { state: { redirectTo: '/chat/principal' } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-cyan-950/80 to-violet-950/80 px-5 py-12 shadow-2xl shadow-cyan-950/20 sm:px-10 sm:py-16 lg:px-16"
        >
          <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-violet-400/10 blur-3xl" aria-hidden="true" />
          <div className="relative max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-sm font-medium text-cyan-100">
              <HugeiconsIcon icon={Location01Icon} size={16} color="currentColor" aria-hidden="true" />
              Entrada local para Santiago y la RM
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">Chat gay en Santiago, con contexto local</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-xl sm:leading-8">
              Entra a la conversación principal de Chactivo desde una página pensada para Santiago. La ubicación sirve como contexto general, no como un mapa de personas ni como una promesa de actividad permanente.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={handleEnterChat}
                className="min-h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 text-base font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-300 hover:to-fuchsia-400"
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
                Ver OPIN
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2"><HugeiconsIcon icon={Clock01Icon} size={16} color="currentColor" aria-hidden="true" />Actividad según participación real</span>
              <span className="inline-flex items-center gap-2"><HugeiconsIcon icon={SparklesIcon} size={16} color="currentColor" aria-hidden="true" />Sin ubicación exacta</span>
            </div>
          </div>
        </motion.section>

        <section className="mt-12 sm:mt-16">
          <ChatDemo onJoinClick={handleEnterChat} title="Qué puedes esperar al entrar" />
        </section>

        <section aria-labelledby="local-context-title" className="mt-16 sm:mt-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Santiago sin exageraciones</p>
            <h2 id="local-context-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Local no significa invadir tu privacidad</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Una página regional debe orientar, no fabricar un mapa social. La comunidad decide qué publica y cada persona controla lo que comparte.</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {localContext.map((item) => (
              <article key={item.title} className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm transition-colors hover:border-cyan-300/30">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                  <HugeiconsIcon icon={item.icon} size={22} color="currentColor" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="local-steps-title" className="mt-16 rounded-3xl border border-border/70 bg-card/40 p-6 sm:mt-20 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">Cómo usar esta entrada</p>
          <h2 id="local-steps-title" className="mt-2 text-3xl font-bold tracking-tight">Santiago es el contexto; la conversación es el producto</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="border-l border-cyan-300/30 pl-5"><span className="text-sm font-bold text-cyan-300">01</span><h3 className="mt-2 text-lg font-semibold">Llega con una intención</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Puedes saludar, conversar o explicar qué buscas sin publicar datos personales.</p></div>
            <div className="border-l border-cyan-300/30 pl-5"><span className="text-sm font-bold text-cyan-300">02</span><h3 className="mt-2 text-lg font-semibold">Observa la actividad real</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Si hay poca participación, la interfaz lo muestra sin perfiles ni mensajes de relleno.</p></div>
            <div className="border-l border-cyan-300/30 pl-5"><span className="text-sm font-bold text-cyan-300">03</span><h3 className="mt-2 text-lg font-semibold">Continúa con control</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Usa bloqueo y reporte cuando estén disponibles y decide con calma si pasas a privado.</p></div>
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-500/10 via-card/60 to-cyan-400/10 p-7 text-center sm:mt-20 sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">¿Quieres conversar con la comunidad de Santiago?</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">Entra a la sala principal y comprueba el estado real. Volver más tarde también es una opción válida cuando la comunidad está tranquila.</p>
          <Button type="button" onClick={handleEnterChat} className="mt-7 min-h-12 rounded-xl bg-foreground px-7 text-base font-bold text-background hover:bg-foreground/90">
            Ir al chat principal
            <HugeiconsIcon icon={ArrowRight01Icon} size={19} color="currentColor" className="ml-2" aria-hidden="true" />
          </Button>
        </section>
      </main>
    </div>
  );
};

export default SantiagoLandingPage;
