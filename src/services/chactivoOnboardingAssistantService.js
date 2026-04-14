const BASE_TOPICS = [
  {
    key: 'how_it_works',
    label: 'Como funciona',
    shortLabel: 'Sistema',
  },
  {
    key: 'private_chat',
    label: 'Abrir privado',
    shortLabel: 'Privado',
  },
  {
    key: 'nearby_people',
    label: 'Gente cerca',
    shortLabel: 'Cerca',
  },
  {
    key: 'report_safety',
    label: 'Denunciar',
    shortLabel: 'Seguridad',
  },
  {
    key: 'message_blocked',
    label: 'Mensaje bloqueado',
    shortLabel: 'Bloqueo',
  },
];

const ROLE_LABEL_BY_VALUE = {
  activo: 'Activo',
  pasivo: 'Pasivo',
  versatil: 'Versatil',
};

const DEFAULT_COMUNA = 'Santiago Centro';

const buildRoleLabel = (selectedRole = '') => (
  ROLE_LABEL_BY_VALUE[String(selectedRole || '').trim().toLowerCase()] || 'Versatil'
);

const buildComunaLabel = (selectedComuna = '') => (
  String(selectedComuna || '').trim() || DEFAULT_COMUNA
);

const buildExampleMessage = ({ selectedRole, selectedComuna, includePlace = true } = {}) => {
  const roleLabel = buildRoleLabel(selectedRole);
  const comunaLabel = buildComunaLabel(selectedComuna);
  const parts = [`${roleLabel} en ${comunaLabel}`];

  if (includePlace) {
    parts.push('me muevo');
  }

  parts.push('busco ahora');
  return parts.join(', ');
};

const withGuestAction = (actions = [], isGuest = false) => {
  if (!isGuest) return actions;
  return [
    {
      key: 'request_nickname',
      label: 'Elegir nickname',
    },
    ...actions,
  ];
};

export const getChactivoAssistantTopics = () => BASE_TOPICS;

export const getChactivoAssistantReply = (
  topicKey,
  {
    isGuest = false,
    selectedRole = '',
    selectedComuna = '',
  } = {}
) => {
  const safeTopicKey = String(topicKey || 'how_it_works').trim() || 'how_it_works';
  const exampleMessage = buildExampleMessage({ selectedRole, selectedComuna });
  const comunaLabel = buildComunaLabel(selectedComuna);
  const roleLabel = buildRoleLabel(selectedRole);

  const replyByTopic = {
    how_it_works: {
      title: 'Entrada rapida, cierre en privado',
      summary: 'La sala principal sirve para ubicar gente rapido. Si conectas con alguien, mueve la conversacion a privado dentro de Chactivo.',
      bullets: [
        'Presentate con rol, comuna y si tienes lugar o te mueves.',
        'Mientras mas concreto seas, mas facil es recibir respuesta util.',
        'No publiques datos personales en abierto.',
      ],
      exampleMessage,
      quickActions: withGuestAction([
        { key: 'fill_example', label: 'Usar ejemplo' },
        { key: 'open_comuna_selector', label: 'Elegir comuna' },
      ], isGuest),
    },
    private_chat: {
      title: 'El privado va despues de la señal inicial',
      summary: 'Primero genera contexto en sala. Luego abre privado desde el perfil o la accion del usuario cuando ya exista interes real.',
      bullets: [
        'No uses el principal para soltar datos sensibles o coordinar todo.',
        'Invitados pueden entrar rapido, pero el flujo mejora cuando ya tienen nickname claro.',
        'Si el otro usuario responde, ahi vale mover la charla a privado.',
      ],
      exampleMessage: `${roleLabel} en ${comunaLabel}, me muevo, si conectamos abrimos privado`,
      quickActions: withGuestAction([
        { key: 'fill_example', label: 'Escribir asi' },
      ], isGuest),
    },
    nearby_people: {
      title: 'Ubicacion primero, ruido despues',
      summary: 'La forma mas efectiva de encontrar gente cerca es marcar comuna y escribir que buscas ahora mismo.',
      bullets: [
        `Si estas en ${comunaLabel}, dilo de forma directa desde el primer mensaje.`,
        'Usa la comuna, el rol y la disponibilidad para filtrar mejor.',
        'Si solo escribes hola, te mezclas con el ruido del lobby.',
      ],
      exampleMessage: `${roleLabel} en ${comunaLabel}, me muevo, busco cerca ahora`,
      quickActions: withGuestAction([
        { key: 'open_comuna_selector', label: 'Marcar comuna' },
        { key: 'fill_example', label: 'Usar mensaje local' },
      ], isGuest),
    },
    report_safety: {
      title: 'Seguridad primero',
      summary: 'Si ves menores, drogas, odio, violencia o acoso, no sigas la conversacion. Reporta y corta el contacto.',
      bullets: [
        'No negocies con perfiles que insinuan menor de edad.',
        'No saques la conversacion a otras apps desde el chat publico.',
        'Si algo se ve raro, denuncia antes de responder.',
      ],
      quickActions: withGuestAction([
        { key: 'dismiss_assistant', label: 'Entendido' },
      ], isGuest),
    },
    message_blocked: {
      title: 'Bloqueo no siempre significa error tecnico',
      summary: 'Tu mensaje puede frenarse por spam, menores, drogas, odio, violencia o intento de sacar la conversacion fuera de la plataforma.',
      bullets: [
        'Evita repetir lo mismo varias veces seguidas.',
        'No compartas telefonos, redes, correos ni invitaciones a apps externas en publico.',
        'Reescribe con rol, comuna y disponibilidad, sin terminos de riesgo.',
      ],
      exampleMessage,
      quickActions: withGuestAction([
        { key: 'fill_example', label: 'Reescribir seguro' },
      ], isGuest),
    },
  };

  return {
    topicKey: safeTopicKey,
    ...(replyByTopic[safeTopicKey] || replyByTopic.how_it_works),
  };
};
