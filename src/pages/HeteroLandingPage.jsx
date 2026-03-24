import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCanonical } from '@/hooks/useCanonical';
import { track, trackPageExit, trackPageView } from '@/services/eventTrackingService';

const LANDING_VARIANTS = {
  home: {
    canonicalPath: '/hetero',
    title: 'Chat Hetero Activo | Conoce Gente Real Ahora | Chactivo',
    description:
      'Chat hetero activo para conocer personas reales en tiempo real. Entra sin complicaciones y empieza a conversar.',
    intentBadge: 'Entrada simple',
    entryKey: 'hetero-home',
    hero: {
      h1: 'Conoce gente real hoy mismo',
      subtext:
        'Una entrada clara, sin ruido y con una sola accion: ver quien esta activo y empezar a conversar.',
      selectorTitle: 'Elige como quieres entrar',
      ctaPrimary: 'Entrar gratis',
      ctaSecondary: 'Ver como funciona',
    },
    selectorOptions: [
      {
        key: 'chat',
        label: 'Quiero chat',
        helper: 'Entrar directo a la sala activa',
        accent: 'sky',
      },
      {
        key: 'amistad',
        label: 'Quiero amistad',
        helper: 'Entrar con un tono mas social',
        accent: 'rose',
      },
    ],
    supportTitle: 'Una entrada mas clara para convertir mejor',
    supportText:
      'La sala ya tiene actividad. Esta landing solo quita friccion: eliges intencion, entras rapido y sigues dentro de Chactivo.',
    benefitCards: [
      { title: 'Actividad real', text: 'Personas conectadas en este momento.' },
      { title: 'Entrada directa', text: 'Sin bloques visuales que distraigan.' },
      { title: 'Privado interno', text: 'La conversion ocurre dentro de la plataforma.' },
    ],
    faq: [
      { question: '¿Es gratis entrar?', answer: 'Si. Puedes entrar y conversar sin pagar.' },
      {
        question: '¿A donde me lleva el boton?',
        answer: 'Al chat principal del vertical hetero, sin mezclarlo con otras rutas.',
      },
    ],
    relatedLinks: [
      { href: '/hetero/chat', label: 'Prefiero acceso directo' },
      { href: '/hetero/amistad', label: 'Prefiero una entrada amistad' },
    ],
  },
  chat: {
    canonicalPath: '/hetero/chat',
    title: 'Entrar al Chat Hetero Ahora | Acceso Directo | Chactivo',
    description:
      'Accede al chat hetero activo en segundos. Intencion directa, acceso inmediato y conversacion en tiempo real.',
    intentBadge: 'Acceso directo',
    entryKey: 'hetero-chat',
    hero: {
      h1: 'Entra al chat sin vueltas',
      subtext:
        'Si vienes con intencion directa, esta version te deja listo para entrar en segundos.',
      selectorTitle: 'Elige tu entrada',
      ctaPrimary: 'Entrar ahora',
      ctaSecondary: 'Ver como funciona',
    },
    selectorOptions: [
      {
        key: 'chat',
        label: 'Entrar directo',
        helper: 'Acceso rapido a la sala activa',
        accent: 'sky',
      },
      {
        key: 'amistad',
        label: 'Modo amistad',
        helper: 'Una entrada mas relajada antes de entrar',
        accent: 'rose',
      },
    ],
    supportTitle: 'Menos marketing, mas accion',
    supportText:
      'Esta variante baja texto y sube claridad. El objetivo es entrar rapido, conversar y mover la conversion al privado interno cuando aparezca match.',
    benefitCards: [
      { title: 'CTA unico', text: 'Una accion principal y una secundaria.' },
      { title: 'Menos friccion', text: 'Diseno corto y enfocado en decision.' },
      { title: 'Coherencia', text: 'Mismas rutas, mismo SEO, mejor UX.' },
    ],
    faq: [
      {
        question: '¿Por que esta pagina es tan simple?',
        answer: 'Porque la gente que entra aqui quiere decidir rapido y avanzar al chat.',
      },
      {
        question: '¿Sigue yendo a la misma sala?',
        answer: 'Si. El destino sigue siendo /chat/hetero-general.',
      },
    ],
    relatedLinks: [{ href: '/hetero/amistad', label: 'Ver entrada amistad' }],
  },
  amistad: {
    canonicalPath: '/hetero/amistad',
    title: 'Chat para Hacer Amigos y Conocer Gente | Chactivo',
    description:
      'Habla con personas reales sin presion. Entra a conversar, hacer amigos y conectar en tiempo real.',
    intentBadge: 'Amistad',
    entryKey: 'hetero-amistad',
    hero: {
      h1: 'Conoce gente sin presion',
      subtext:
        'Una entrada mas tranquila para quien busca conversar primero y ver si la conexion aparece despues.',
      selectorTitle: 'Elige como quieres conectar',
      ctaPrimary: 'Entrar y conversar',
      ctaSecondary: 'Ver como funciona',
    },
    selectorOptions: [
      {
        key: 'amistad',
        label: 'Conversar primero',
        helper: 'Entrar con un tono mas social',
        accent: 'rose',
      },
      {
        key: 'chat',
        label: 'Entrar directo',
        helper: 'Ir igual a la sala activa ahora',
        accent: 'sky',
      },
    ],
    supportTitle: 'La misma sala, una expectativa mejor ordenada',
    supportText:
      'No todo el mundo entra con la misma energia. Esta version encuadra mejor la intencion para generar conversaciones mas naturales.',
    benefitCards: [
      { title: 'Entrada suave', text: 'Reduce sensacion de presion al llegar.' },
      { title: 'Mejor contexto', text: 'Ayuda a ordenar la expectativa de la visita.' },
      { title: 'Mismo destino', text: 'No fragmenta la masa critica del chat.' },
    ],
    faq: [
      {
        question: '¿Es solo para hacer amigos?',
        answer: 'No. Es una entrada mas social, pero la sala sigue viva y abierta.',
      },
      {
        question: '¿Necesito registrarme antes?',
        answer: 'No. Puedes entrar rapido y decidir despues si completas perfil.',
      },
    ],
    relatedLinks: [{ href: '/hetero/chat', label: 'Quiero acceso directo' }],
  },
};

const NAV_LINKS = [
  { href: '/hetero', label: 'Inicio' },
  { href: '/hetero/chat', label: 'Chat' },
  { href: '/hetero/amistad', label: 'Amistad' },
];

const SUPPORT_PILLS = [
  'Sala activa ahora',
  'Entrada rapida',
  'Privado interno',
];

const HETERO_INDEXING_ENABLED = false;

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Elige tu intencion',
    text: 'Define si vienes por chat directo o por una entrada mas social.',
  },
  {
    title: 'Entra a la sala',
    text: 'Accedes a la misma sala activa, sin pasos innecesarios.',
  },
  {
    title: 'Conecta dentro de Chactivo',
    text: 'Si hay quimica, das el salto al privado interno.',
  },
];

const upsertMetaTag = (selector, createTag) => {
  let tag = document.querySelector(selector);
  if (!tag) {
    tag = createTag();
    document.head.appendChild(tag);
  }
  return tag;
};

const HeteroLandingPage = ({ variant = 'home' }) => {
  const navigate = useNavigate();
  const pageStartRef = useRef(Date.now());
  const howItWorksRef = useRef(null);
  const currentVariant = LANDING_VARIANTS[variant] || LANDING_VARIANTS.home;
  const defaultSelection = currentVariant.selectorOptions[0]?.key || 'chat';
  const [selectedIntent, setSelectedIntent] = useState(defaultSelection);

  useCanonical(currentVariant.canonicalPath);

  useEffect(() => {
    setSelectedIntent(defaultSelection);
  }, [defaultSelection]);

  const selectedOption = useMemo(
    () => currentVariant.selectorOptions.find((option) => option.key === selectedIntent) || currentVariant.selectorOptions[0],
    [currentVariant.selectorOptions, selectedIntent]
  );

  const chatTarget = useMemo(() => {
    const intentSuffix = selectedOption?.key ? `-${selectedOption.key}` : '';
    return `/chat/hetero-general?entry=${encodeURIComponent(`${currentVariant.entryKey}${intentSuffix}`)}`;
  }, [currentVariant.entryKey, selectedOption?.key]);

  useEffect(() => {
    document.title = currentVariant.title;

    const descriptionTag = upsertMetaTag('meta[name="description"]', () => {
      const tag = document.createElement('meta');
      tag.setAttribute('name', 'description');
      return tag;
    });
    descriptionTag.setAttribute('content', currentVariant.description);

    const robotsTag = upsertMetaTag('meta[name="robots"]', () => {
      const tag = document.createElement('meta');
      tag.setAttribute('name', 'robots');
      return tag;
    });
    robotsTag.setAttribute(
      'content',
      HETERO_INDEXING_ENABLED ? 'index, follow, max-image-preview:large' : 'noindex, nofollow, noarchive, nosnippet'
    );

    const ogTitle = upsertMetaTag('meta[property="og:title"]', () => {
      const tag = document.createElement('meta');
      tag.setAttribute('property', 'og:title');
      return tag;
    });
    ogTitle.setAttribute('content', currentVariant.title);

    const ogDescription = upsertMetaTag('meta[property="og:description"]', () => {
      const tag = document.createElement('meta');
      tag.setAttribute('property', 'og:description');
      return tag;
    });
    ogDescription.setAttribute('content', currentVariant.description);

    const ogUrl = upsertMetaTag('meta[property="og:url"]', () => {
      const tag = document.createElement('meta');
      tag.setAttribute('property', 'og:url');
      return tag;
    });
    ogUrl.setAttribute('content', `https://chactivo.com${currentVariant.canonicalPath}`);

    const twitterTitle = upsertMetaTag('meta[name="twitter:title"]', () => {
      const tag = document.createElement('meta');
      tag.setAttribute('name', 'twitter:title');
      return tag;
    });
    twitterTitle.setAttribute('content', currentVariant.title);

    const twitterDescription = upsertMetaTag('meta[name="twitter:description"]', () => {
      const tag = document.createElement('meta');
      tag.setAttribute('name', 'twitter:description');
      return tag;
    });
    twitterDescription.setAttribute('content', currentVariant.description);

    const webpageSchemaId = 'schema-webpage-hetero';
    const breadcrumbSchemaId = 'schema-breadcrumb-hetero';
    document.getElementById(webpageSchemaId)?.remove();
    document.getElementById(breadcrumbSchemaId)?.remove();

    if (HETERO_INDEXING_ENABLED) {
      const webpageSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': `https://chactivo.com${currentVariant.canonicalPath}#webpage`,
        url: `https://chactivo.com${currentVariant.canonicalPath}`,
        name: currentVariant.title,
        description: currentVariant.description,
        inLanguage: 'es',
        isPartOf: {
          '@type': 'WebSite',
          '@id': 'https://chactivo.com/#website',
        },
      };

      const breadcrumbItems = [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://chactivo.com/' },
        { '@type': 'ListItem', position: 2, name: 'Hetero', item: 'https://chactivo.com/hetero' },
      ];
      if (variant !== 'home') {
        breadcrumbItems.push({
          '@type': 'ListItem',
          position: 3,
          name: currentVariant.intentBadge,
          item: `https://chactivo.com${currentVariant.canonicalPath}`,
        });
      }

      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems,
      };

      const webpageScript = document.createElement('script');
      webpageScript.type = 'application/ld+json';
      webpageScript.id = webpageSchemaId;
      webpageScript.textContent = JSON.stringify(webpageSchema);
      document.head.appendChild(webpageScript);

      const breadcrumbScript = document.createElement('script');
      breadcrumbScript.type = 'application/ld+json';
      breadcrumbScript.id = breadcrumbSchemaId;
      breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);
      document.head.appendChild(breadcrumbScript);
    }

    return () => {
      document.getElementById(webpageSchemaId)?.remove();
      document.getElementById(breadcrumbSchemaId)?.remove();
    };
  }, [currentVariant, variant]);

  useEffect(() => {
    trackPageView(currentVariant.canonicalPath, currentVariant.title).catch(() => {});
    track('hetero_landing_view', {
      landing_variant: variant,
      path: currentVariant.canonicalPath,
    }).catch(() => {});

    return () => {
      const timeOnPage = Math.max(0, Math.round((Date.now() - pageStartRef.current) / 1000));
      trackPageExit(currentVariant.canonicalPath, timeOnPage).catch(() => {});
    };
  }, [currentVariant.canonicalPath, currentVariant.title, variant]);

  const handleEnterChat = () => {
    track('hetero_landing_cta_click', {
      landing_variant: variant,
      target_room: 'hetero-general',
      selected_intent: selectedIntent,
    }).catch(() => {});
    navigate(chatTarget);
  };

  const handleSeeHowWorks = () => {
    track('hetero_landing_secondary_cta_click', {
      landing_variant: variant,
      action: 'see_how_it_works',
      selected_intent: selectedIntent,
    }).catch(() => {});
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#f8f1ea] text-slate-900">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(250,244,238,0.96)_0%,rgba(255,255,255,0.82)_46%,rgba(237,246,255,0.92)_100%)]" />
        <div className="absolute left-[-10%] top-16 h-64 w-64 rounded-full bg-sky-200/70 blur-3xl" />
        <div className="absolute bottom-10 right-[-8%] h-72 w-72 rounded-full bg-rose-200/70 blur-3xl" />
        <div className="absolute inset-y-20 left-0 hidden w-1/4 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.24),rgba(255,255,255,0))] lg:block" />
        <div className="absolute inset-y-16 right-0 hidden w-1/4 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.18),rgba(255,255,255,0))] lg:block" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
          <header className="flex flex-col gap-4 rounded-[26px] border border-white/70 bg-white/70 px-5 py-4 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
            <a href="/hetero" className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#38bdf8,#f472b6)] text-lg font-bold text-white shadow-[0_10px_25px_rgba(56,189,248,0.28)]">
                C
              </span>
              <span className="text-lg font-semibold tracking-tight text-slate-900">
                Chactivo Hetero
              </span>
            </a>

            <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
              {NAV_LINKS.map((link) => {
                const isActive = currentVariant.canonicalPath === link.href;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`rounded-full px-4 py-2 transition ${
                      isActive ? 'bg-slate-900 text-white' : 'hover:bg-slate-900/6'
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}
              <button
                type="button"
                onClick={handleEnterChat}
                className="rounded-full bg-slate-900 px-5 py-2.5 font-semibold text-white transition hover:bg-slate-800"
              >
                Entrar
              </button>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
            <div className="max-w-xl">
              <span className="inline-flex rounded-full border border-slate-900/10 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700 shadow-sm">
                {currentVariant.intentBadge}
              </span>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {currentVariant.hero.h1}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-8 text-slate-700 sm:text-lg">
                {currentVariant.hero.subtext}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {SUPPORT_PILLS.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <p className="mt-8 text-sm leading-7 text-slate-600">
                {currentVariant.supportText}
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-8 top-6 hidden h-24 w-24 rounded-[28px] bg-sky-100/85 shadow-[0_20px_45px_rgba(56,189,248,0.15)] lg:block" />
              <div className="absolute -right-6 bottom-10 hidden h-28 w-28 rounded-[32px] bg-rose-100/85 shadow-[0_20px_45px_rgba(244,114,182,0.18)] lg:block" />

              <article className="relative mx-auto max-w-xl rounded-[34px] border border-white/75 bg-white/86 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:p-8">
                <p className="text-sm font-medium text-slate-500">
                  Para empezar, dinos con que energia quieres entrar:
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {currentVariant.hero.selectorTitle}
                </h2>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {currentVariant.selectorOptions.map((option) => {
                    const isSelected = selectedIntent === option.key;
                    const toneClasses = option.accent === 'rose'
                      ? 'border-rose-200 bg-rose-50 text-rose-700 shadow-[0_14px_30px_rgba(244,114,182,0.16)]'
                      : 'border-sky-200 bg-sky-50 text-sky-700 shadow-[0_14px_30px_rgba(56,189,248,0.16)]';

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setSelectedIntent(option.key)}
                        className={`rounded-[22px] border px-5 py-5 text-left transition ${
                          isSelected
                            ? toneClasses
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-base font-semibold">{option.label}</span>
                        <span className="mt-1 block text-sm leading-6 text-inherit/80">
                          {option.helper}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleEnterChat}
                  className="mt-7 w-full rounded-full bg-[linear-gradient(135deg,#38bdf8,#0ea5e9)] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_35px_rgba(14,165,233,0.3)] transition hover:brightness-105"
                >
                  {selectedIntent === 'amistad' ? 'Entrar con tono amistad' : currentVariant.hero.ctaPrimary}
                </button>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                  <button
                    type="button"
                    onClick={handleSeeHowWorks}
                    className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-950"
                  >
                    {currentVariant.hero.ctaSecondary}
                  </button>
                  <a
                    href={currentVariant.relatedLinks[0]?.href || '/hetero'}
                    className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-950"
                  >
                    {currentVariant.relatedLinks[0]?.label || 'Ver mas'}
                  </a>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              {currentVariant.supportTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-700">
              {currentVariant.supportText}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {currentVariant.benefitCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"
                >
                  <h3 className="text-sm font-semibold text-slate-950">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.text}</p>
                </article>
              ))}
            </div>
          </article>

          <article
            ref={howItWorksRef}
            className="rounded-[28px] border border-slate-200/80 bg-[#fffaf7] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-8"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Como funciona
            </h2>
            <div className="mt-5 space-y-4">
              {HOW_IT_WORKS_STEPS.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-[22px] border border-slate-200 bg-white px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Paso {index + 1}
                  </p>
                  <h3 className="mt-2 text-sm font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
                </article>
              ))}
            </div>
          </article>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Preguntas frecuentes
            </h2>
            <div className="mt-5 space-y-3">
              {currentVariant.faq.map((item) => (
                <article key={item.question} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-950">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200/80 bg-slate-950 p-6 text-slate-50 shadow-[0_20px_60px_rgba(15,23,42,0.12)] sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              Una sola accion clara
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              Esta landing deja de parecer una vitrina pesada y pasa a sentirse como una puerta de entrada real. Menos decoracion, mas claridad, mejor encuadre de intencion.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {currentVariant.relatedLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <button
              type="button"
              onClick={handleEnterChat}
              className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Entrar al chat ahora
            </button>
          </article>
        </div>
      </section>
    </div>
  );
};

export default HeteroLandingPage;
