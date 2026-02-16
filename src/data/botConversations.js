import { BOT_PROFILES } from '@/config/botProfiles';

const USERNAMES = BOT_PROFILES.map((p) => p.username);

const TAG_DEFS = [
  { tag: 'casual', start: 1, end: 80 },
  { tag: 'coqueteo', start: 81, end: 140 },
  { tag: 'morboso', start: 141, end: 180 },
  { tag: 'curioso', start: 181, end: 200 },
  { tag: 'casual', start: 201, end: 220 },
];

const TEXT_BANK = {
  casual: {
    openers: [
      'wena cabros como va la noche',
      'quien de stgo centro despierto',
      'salio gym hoy o puro flojeo',
      'alguno cacha un lugar piola pa juntarse',
      'ando viendo si sale algo tranqui',
      'como estuvo el finde por sus barrios',
      'hay gente de provi o nunoa por aca',
      'reci en llegando al chat, que se cuenta',
    ],
    replies: [
      'yo ando por maipu ahora',
      'aca en la florida, todo calmado',
      'salio sus pesas y despues ducha',
      'toy tomando once todavia jaja',
      'si sale algo avisen de una',
      'en puente alto esta helado wn',
      'la micro hoy venia llena ctm',
      'andaba en pega todo el dia',
      'me tinca algo cerca del metro',
      'quien va al gym de noche igual',
      'aca puro modo casa y chat',
      'hoy no hubo trafico por milagro',
    ],
  },
  coqueteo: {
    openers: [
      'quien anda con ganas de conversar rico',
      'hay alguien coqueto por aca o puro timido',
      'me salio match en baul pero quiero charla real',
      'activo o pasivo, como andan hoy',
      'quien prende rapido en este chat',
      'andamos en mood coqueteo suave',
      'busco wena conversa y despues vemos',
      'a ver quien se atreve a tirar talla',
    ],
    replies: [
      'depende de la quimica po',
      'yo primero converso y despues fluyo',
      'foto no, pero descripcion si jaja',
      'me gustan directos pero con respeto',
      'si hay onda se nota altiro',
      'quien de ustedes es mas jugado',
      'wena esa, suena tentador',
      'en persona soy menos timido',
      'manda una frase y te digo',
      'si me haces reir ya sumaste',
      'voy sin filtro pero buena onda',
      'y si armamos grupo chico pa hablar',
    ],
  },
  morboso: {
    openers: [
      'quien anda morboso esta hora',
      'hoy ando directo, sin tanta vuelta',
      'busco charla hot y concreta',
      'alguno con ganas reales o puro bla bla',
      'se vale hablar sucio o muy temprano',
      'si hay morbo real me quedo despierto',
      'quien esta solo y prendido ahora',
      'ando buscando plan de noche corto',
    ],
    replies: [
      'yo ando con ganas igual',
      'si sale algo voy de una',
      'habla claro que te gusta',
      'me gusta cuando son directos',
      'podemos partir suave y ver',
      'si hay confianza se pone mejor',
      'yo prefiero plan discreto',
      'nada de ghosteo despues eso si',
      'con respeto pero caliente, asi si',
      'manda ubicacion general nomas',
      'si se da, se da hoy',
      'jajaja ya me dejaron pensando',
    ],
  },
  curioso: {
    openers: [
      'hola, soy nuevo en esto y cacho poco',
      'primera vez hablando asi en chat',
      'alguna recomendacion para no pasar verguenza',
      'como se presenta uno aca sin sonar raro',
      'quiero conocer gente pero voy lento',
      'soy primerizo, consejos honestos',
      'me da plancha hablar, ayuda',
      'como filtran cuando alguien no da confianza',
    ],
    replies: [
      'gracias por responder buena onda',
      'ya, eso me sirve caleta',
      'entonces mejor ir de frente no mas',
      'igual me da nervio pero voy',
      'bacan que no juzguen aca',
      'aplico eso en opin tambien',
      'entendido, primero conversar y cachar',
      'siempre con cuidado obvio',
      'me quedo mas tranquilo con eso',
      'vale por el dato, en serio',
      'de a poco nomas entonces',
      'ya me siento menos perdido',
    ],
  },
};

const seeded = (a, b) => {
  const x = (a * 9301 + b * 49297 + 233280) % 233280;
  return x / 233280;
};

const pick = (arr, a, b) => arr[Math.floor(seeded(a, b) * arr.length)];

const pickParticipants = (id) => {
  const count = 3 + (Math.floor(seeded(id, 7) * 1000) % 3); // 3-5
  const start = Math.floor(seeded(id, 11) * USERNAMES.length);
  const participants = [];

  for (let i = 0; i < count; i++) {
    const idx = (start + i * 3 + (id % 5)) % USERNAMES.length;
    const name = USERNAMES[idx];
    if (!participants.includes(name)) {
      participants.push(name);
    }
  }

  // fallback por si hay duplicado en listas chicas
  let cursor = 0;
  while (participants.length < count) {
    const candidate = USERNAMES[(start + cursor) % USERNAMES.length];
    if (!participants.includes(candidate)) participants.push(candidate);
    cursor++;
  }

  return participants;
};

const buildMessages = (id, tag, participants) => {
  const bank = TEXT_BANK[tag];
  const totalMessages = 10 + (Math.floor(seeded(id, 23) * 1000) % 9); // 10-18
  const messages = [];

  messages.push({
    from: participants[0],
    text: pick(bank.openers, id, 31),
    delayMs: 0,
  });

  for (let i = 1; i < totalMessages; i++) {
    const from = participants[i % participants.length];
    const mentionTarget = participants[(i + 1) % participants.length];
    const base = pick(bank.replies, id, 31 + i);

    const withVariation = i % 4 === 0
      ? `${base} ${mentionTarget ? '' : ''}`.trim()
      : base;

    const delayMs = 3000 + (Math.floor(seeded(id, 101 + i) * 100000) % 12001); // 3-15s

    messages.push({
      from,
      text: withVariation,
      delayMs,
    });
  }

  return messages;
};

const buildConversation = (id, tag) => {
  const participants = pickParticipants(id);
  return {
    id,
    participants,
    messages: buildMessages(id, tag, participants),
    tags: [tag],
  };
};

const conversations = [];
for (const def of TAG_DEFS) {
  for (let id = def.start; id <= def.end; id++) {
    conversations.push(buildConversation(id, def.tag));
  }
}

export const BOT_CONVERSATIONS = conversations;

export const getConversationsByTag = (tag) =>
  BOT_CONVERSATIONS.filter((c) => c.tags.includes(tag));

export const getRandomConversationByTag = (tag) => {
  const list = getConversationsByTag(tag);
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
};
