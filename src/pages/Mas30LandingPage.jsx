import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  BubbleChatIcon,
  Clock01Icon,
  HeartIcon,
  Location01Icon,
  LockPasswordIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonical } from '@/hooks/useCanonical';

const benefits = [
  {
    title: 'Conversación con contexto',
    text: 'Una entrada temática para personas mayores de 30 que prefieren conversar antes de decidir el ritmo de la interacción.',
    icon: BubbleChatIcon,
    tone: 'cyan',
  },
  {
    title: 'Tú decides qué compartir',
    text: 'Puedes usar un alias y evitar publicar teléfono, correo, ubicación exacta o cualquier dato sensible en una sala pública.',
    icon: LockPasswordIcon,
    tone: 'violet',
  },
  {
    title: 'Actividad sin maquillaje',
    text: 'No mostramos bots, ratings ni contadores inventados. La respuesta depende de la participación real de la comunidad.',
    icon: UserGroupIcon,
    tone: 'emerald',
  },
];

const steps = [
  { number: '01', title: 'Entra al chat principal', text: 'Esta entrada +30 te lleva a la sala principal de Chile.' },
  { number: '02', title: 'Completa solo lo necesario', text: 'Elige tu alias y añade contexto únicamente si quieres recibir respuestas más útiles.' },
  { number: '03', title: 'Continúa con control', text: 'Si conectas con alguien, usa el privado y decide qué información compartir.' },
];

const faqs = [
  {
    question: '¿La sala es exclusivamente para mayores de 30?',
    answer: 'La página está orientada a personas mayores de 30 y funciona como una entrada temática hacia el chat principal. La etiqueta no sustituye una verificación de edad; no compartas documentos ni datos sensibles.',
  },
  {
    question: '¿Tengo que crear una cuenta?',
    answer: 'La disponibilidad del acceso depende del estado de autenticación y del backend configurado. Puedes comenzar usando un alias cuando la entrada pública lo permita; una cuenta registrada ayuda a conservar tu perfil entre dispositivos.',
  },
  {
    question: '¿Qué ocurre si no hay personas conectadas?',
    answer: 'La sala puede estar vacía o tener poca actividad. Chactivo no simula usuarios para aparentar movimiento; puedes revisar OPIN, volver más tarde o publicar una intención cuando la función esté habilitada para tu cuenta.',
  },
  {
    question: '¿Es anónimo y está cifrado?',
    answer: 'Puedes usar un alias, pero no prometemos anonimato total. El chat público no debe usarse para datos sensibles. No describimos la experiencia como cifrado de extremo a extremo porque esa capacidad debe verificarse en el backend.',
  },
  {
    question: '¿Hay eventos presenciales o una comunidad local?',
    answer: 'No damos por organizado ningún evento. Una actividad solo debe considerarse real cuando tenga fecha, organizador y condiciones verificables publicados por la comunidad.',
  },
];

const iconToneClasses = {
  cyan: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200',
  violet: 'border-violet-300/20 bg-violet-300/10 text-violet-200',
  emerald: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
};

const Mas30LandingPage = () => {
  useCanonical('/mas-30');

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user && !user.isGuest && !user.isAnonymous) {
      navigate('/chat/principal', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.getAttribute('content') || '';
    const metaDescription = description || document.createElement('meta');

    document.title = 'Chat Gay Mayores de 30 en Chile | Chactivo';
    if (!description) {
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = 'Entrada temática al chat gay de Chile para personas mayores de 30. Conversa desde tu navegador, usa un alias y revisa la actividad real de la comunidad.';

    return () => {
      document.title = previousTitle;
      if (!description && metaDescription.isConnected) metaDescription.remove();
      else if (description) metaDescription.setAttribute('content', previousDescription);
    };
  }, []);

  const handleEnterChat = () => {
    if (user && !user.isGuest && !user.isAnonymous) {
      navigate('/chat/principal');
      return;
    }
    navigate('/auth', { state: { redirectTo: '/chat/principal' } });
  };

  const handleRegister = () => {
    navigate('/auth', { state: { redirectTo: '/chat/principal' } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950/70 px-5 py-12 shadow-2xl shadow-violet-950/20 sm:px-10 sm:py-16 lg:px-16"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" aria-hidden="true" />
          <div className="relative max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-sm font-medium text-cyan-100">
              <HugeiconsIcon icon={SparklesIcon} size={16} color="currentColor" aria-hidden="true" />
              Entrada temática para conversar sin presión
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl">
              Chat gay para mayores de 30 en Chile
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-xl sm:leading-8">
              Entra al chat principal desde una página pensada para quienes valoran una conversación más clara, un alias y controles sencillos sobre lo que comparten.
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
                onClick={handleRegister}
                className="min-h-12 rounded-xl border-white/20 bg-white/5 px-6 text-base font-semibold text-white hover:bg-white/10"
              >
                Reservar mi nombre
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2"><HugeiconsIcon icon={Clock01Icon} size={16} color="currentColor" aria-hidden="true" />Actividad según participación real</span>
              <span className="inline-flex items-center gap-2"><HugeiconsIcon icon={Location01Icon} size={16} color="currentColor" aria-hidden="true" />Chile y sus ciudades</span>
            </div>
          </div>
        </motion.section>

        <section aria-labelledby="why-title" className="mt-14 sm:mt-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Una entrada más honesta</p>
            <h2 id="why-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Habla con contexto, no con promesas vacías</h2>
            <p className="mt-4 leading-7 text-muted-foreground">No prometemos que siempre habrá respuestas ni usamos actividad automatizada para llenar la pantalla. Sí podemos ayudarte a llegar más rápido a la conversación y a cuidar lo que compartes.</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm transition-colors hover:border-cyan-300/30">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${iconToneClasses[benefit.tone]}`}>
                  <HugeiconsIcon icon={benefit.icon} size={22} color="currentColor" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{benefit.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="how-title" className="mt-16 rounded-3xl border border-border/70 bg-card/40 p-6 sm:mt-20 sm:p-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">Cómo empezar</p>
              <h2 id="how-title" className="mt-2 text-3xl font-bold tracking-tight">Tres pasos, sin recorrido confuso</h2>
            </div>
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><HugeiconsIcon icon={HeartIcon} size={17} color="currentColor" aria-hidden="true" />El ritmo lo decides tú</span>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="border-l border-cyan-300/30 pl-5">
                <span className="text-sm font-bold text-cyan-300">{step.number}</span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5 text-sm leading-6 text-amber-100/80">
            <strong className="text-amber-100">Si la sala está tranquila:</strong> es un estado real, no un error que debamos ocultar. Puedes revisar OPIN, volver más tarde o iniciar una conversación con un mensaje que explique qué buscas.
          </div>
        </section>

        <section aria-labelledby="faq-title" className="mt-16 sm:mt-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Preguntas frecuentes</p>
            <h2 id="faq-title" className="mt-2 text-3xl font-bold tracking-tight">Lo que conviene saber antes de entrar</h2>
          </div>
          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-border/70 bg-card/40 px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
                  {faq.question}
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="currentColor" className="shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />
                </summary>
                <p className="mt-3 max-w-3xl pr-8 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-500/10 via-card/60 to-cyan-400/10 p-7 text-center sm:mt-20 sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">¿Quieres conversar ahora?</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">Entra a la sala principal y revisa el estado real de la comunidad. Si no hay actividad, no verás perfiles ni mensajes inventados.</p>
          <Button
            type="button"
            onClick={handleEnterChat}
            className="mt-7 min-h-12 rounded-xl bg-foreground px-7 text-base font-bold text-background hover:bg-foreground/90"
          >
            Ir al chat principal
            <HugeiconsIcon icon={ArrowRight01Icon} size={19} color="currentColor" className="ml-2" aria-hidden="true" />
          </Button>
          <div className="mt-5 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <a href="/opin" className="underline-offset-4 hover:text-foreground hover:underline">Leer OPIN</a>
            <a href="/faq" className="underline-offset-4 hover:text-foreground hover:underline">Ver la FAQ general</a>
            <a href="/normas-comunidad" className="underline-offset-4 hover:text-foreground hover:underline">Leer las normas</a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Mas30LandingPage;
