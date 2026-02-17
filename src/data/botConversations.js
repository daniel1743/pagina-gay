import { BOT_PROFILES } from '@/config/botProfiles';

const USERNAMES = BOT_PROFILES.map((profile) => profile.username);
const PROFILE_BY_USERNAME = new Map(BOT_PROFILES.map((profile) => [profile.username, profile]));

const TAG_DISTRIBUTION = [
  { tag: 'casual', count: 40 },
  { tag: 'coqueteo', count: 30 },
  { tag: 'morboso', count: 20 },
  { tag: 'curioso', count: 10 },
];

const TAG_FLOW_VARIANTS = {
  casual: [
    ['open', 'checkin', 'rolePing', 'roleReply', 'zonePing', 'zoneReply', 'intent', 'invite', 'boundary', 'close'],
    ['open', 'zonePing', 'zoneReply', 'checkin', 'rolePing', 'roleReply', 'intent', 'chemistry', 'invite', 'close'],
  ],
  coqueteo: [
    ['open', 'vibe', 'rolePing', 'roleReply', 'tease', 'chemistry', 'intent', 'invite', 'boundary', 'close'],
    ['open', 'rolePing', 'roleReply', 'vibe', 'tease', 'intent', 'chemistry', 'invite', 'boundary', 'close'],
  ],
  morboso: [
    ['open', 'vibe', 'intent', 'rolePing', 'roleReply', 'chemistry', 'tease', 'invite', 'boundary', 'close'],
    ['open', 'intent', 'vibe', 'rolePing', 'roleReply', 'tease', 'chemistry', 'invite', 'boundary', 'close'],
  ],
  curioso: [
    ['curiousPing', 'guide', 'open', 'rolePing', 'roleReply', 'safety', 'intent', 'invite', 'boundary', 'close'],
    ['curiousPing', 'open', 'guide', 'rolePing', 'roleReply', 'safety', 'chemistry', 'invite', 'boundary', 'close'],
  ],
};

const TEXT_BANK = {
  open: [
    'wena cabros, quien anda conectado a esta hora',
    'buenas, entre recien y esta movida la sala',
    'hola gente, dia largo y con ganas de conversar',
    'holaa, alguno despierto por {zone}',
    'que onda, pase a mirar si salia buena conversa',
    'wena, quien mas anda en modo after pega',
    'buenas noches, recien me desocupe y cai aca',
    'aca reportandome, quien esta con energia todavia',
    'me meti de curioso, se ve buena la sala',
    'hola, ando por {zone} y con ganas de hablar un rato',
  ],
  checkin: [
    'aca tranqui, recien cerrando el dia y tomando algo',
    'yo ando piola, sali del gym y quede con energia',
    'todo bien por aca, estaba en casa y me meti',
    'yo igual conectado, andaba medio aburrido y cai aqui',
    'por este lado todo ok, con ganas de charla real',
    'aca firme, estaba viendo si habia gente de mi zona',
    'yo ando relajado, pero igual abierto a que salga algo',
    'por aqui piola, sin apuro y sin hacerse el dificil',
    'todo bien, vengo a conversar en serio no solo tirar lineas',
    'aca presente, dia pesado pero buena actitud',
  ],
  vibe: [
    'se nota buena onda hoy, me gusta ese ambiente',
    'ya, se puso interesante rapido esto',
    'igual hay harta energia, me tinca quedarme un rato',
    'anda liviana la conversa, justo lo que buscaba',
    'asi da gusto, directo pero respetuoso',
    'buena vibra en la sala, se agradece',
    'estan respondiendo con onda, no como chat muerto',
    'hoy la sala esta filete, hay tema y hay ritmo',
    'asi si po, da ganas de participar de verdad',
    'cuando hay energia real se nota al toque',
  ],
  rolePing: [
    'ustedes como andan de rol hoy, activo pasivo o vers',
    'quien esta en modo versatil por aca',
    'pregunta rapida, como se definen ustedes',
    'yo cacho que depende del dia, ustedes igual',
    'estamos mas en plan activo o de flow vers hoy',
    'se vale cambiar de mood, ustedes como estan',
    'como andan de rol, mas top mas bottom o mixto',
    'yo no me complico, pero me gusta saber con quien hablo',
    'rol de hoy cabros, para cachar afinidad',
    'me ubico mejor cuando dicen rol y que buscan',
  ],
  roleReply: [
    'yo ando mas {role} hoy, pero igual depende de la onda',
    'aca tirado para {role}, converso primero y despues veo',
    'normalmente {role}, si hay quimica fluye solo',
    'en mi caso mas {role}, sin prisa y sin drama',
    'yo me muevo en {role}, lo importante es la conexion',
    'hoy estoy mas {role}, pero abierto a conversar bien',
    'acostumbro ir por {role}, todo con buena comunicacion',
    'generalmente {role}, si hay match se nota altiro',
    'me describo como {role}, con buena energia',
    'voy mas por {role}, pero no me cierro',
  ],
  zonePing: [
    'quien mas cerca de {zone} ahora mismo',
    'hay gente de {zone} o alrededores',
    'yo estoy por {zone}, alguien por ese lado',
    'si sale algo, ideal que sea cerca de {zone}',
    'se mueve gente de {zone} en esta sala o no tanto',
    'hoy estoy por {zone}, por si alguien coincide',
  ],
  zoneReply: [
    'yo ando por {zone}, me queda comodo moverme',
    'aca {zone}, pero me adapto si hay onda',
    'desde {zone}, no tan lejos en verdad',
    'yo estoy en {zone}, hoy me puedo mover',
    'aca por {zone}, cerca del metro',
    'de {zone}, asi que todo relativamente cerca',
  ],
  intent: [
    'mi idea es charla con intencion, no solo llenar tiempo',
    'busco buena conversa y si hay onda pasamos a privado',
    'ando en plan adulto, sin vueltas pero con respeto',
    'quiero algo real, aunque sea corto pero bien',
    'si conectamos, yo feliz de seguir la conversa',
    'voy por quimica primero y despues vemos plan',
    'ando buscando algo rico pero con cabeza',
    'si se da feeling, avanzamos sin apurar',
    'prefiero intencion clara y cero cuento',
    'chat si, pero con chance real de concretar',
  ],
  tease: [
    'cuando hay quimica se nota altiro, no hay que forzar nada',
    'me gusta cuando responden con actitud y no en modo copia pega',
    'igual suma harto el humor, me baja la gente fria',
    'yo me prendo con buena energia y confianza',
    'si alguien tiene iniciativa, ya suma puntos',
    'sin apuro pero con intencion, ese es mi mood',
  ],
  chemistry: [
    'si se da la quimica, yo no tengo problema en avanzar',
    'cuando la conversa prende, el resto cae solo',
    'prefiero gente clara en lo que busca',
    'a mi me sirve que haya honestidad desde el inicio',
    'todo cambia cuando hay feeling real',
    'si la energia coincide, todo fluye mejor',
  ],
  curiousPing: [
    'primera vez metiendome a una sala asi, algun tip real',
    'soy medio nuevo en esto, como filtran gente confiable',
    'pregunta seria, como hacen match sin perder tiempo',
    'estoy aprendiendo, se agradece consejo sin juzgar',
    'vengo en plan curioso, que recomiendan para empezar',
    'primera noche por aqui, no quiero sonar perdido',
    'soy nuevo aca, como cachan cuando alguien va en serio',
    'reci en entrando, algun consejo para no perder tiempo',
    'es mi primera semana en chats asi, tiro la pregunta nomas',
    'vengo en buena, quiero entender como se mueven aqui',
  ],
  guide: [
    'tip corto: perfil claro, conversa corta y despues privado si hay onda',
    'lo mejor es hablar normal y cachar energia antes de cualquier plan',
    'yo reviso tono y coherencia, ahi se nota quien va en serio',
    'si alguien va apurado raro, mejor pasar',
    'con respeto y limites claros se pasa bien',
    'siempre mejor empezar de a poco y ver como responde',
  ],
  safety: [
    'clave: no compartir datos sensibles de una',
    'si quedas, mejor lugar publico primero y avisar a alguien',
    'si algo no te cuadra, cortas y listo',
    'confianza se construye, no se regala altiro',
    'perfil verificado y charla coherente, eso ayuda harto',
    'siempre con criterio, asi evitas malos ratos',
  ],
  invite: [
    'si quieren seguimos por privado y aterrizamos mejor',
    'si hay interesados, abrimos privado y vemos detalle',
    'podemos seguir esta conversa en privado sin problema',
    'si alguien coincide, pasemos a privado y ordenamos plan',
    'si les tinca, seguimos en privado para no spamear sala',
    'el que quiera seguir, me escribe por privado',
  ],
  boundary: [
    'eso si, cero presion y todo consensuado',
    'de mi lado todo con respeto y buena comunicacion',
    'si no hay onda, todo bien igual',
    'sin ghosteo raro, mejor hablar claro',
    'yo voy sin dramas, pero con limites claros',
    'todo bien si no coincide, la idea es buena onda',
  ],
  close: [
    'me quedo un rato mas, cualquier cosa me hablan',
    'ya cabros, buena charla, sigo atento por aca',
    'bacan la conversa, se sintio mas humana hoy',
    'asi da gusto, hablamos y vemos que sale',
    'dejo la puerta abierta, me escriben nomas',
    'listo, quedo por aqui conectado',
    'buena cabros, sigo leyendo por aca por si sale algo',
    'ya, me quedo en linea, cualquier cosa me tiran mensaje',
  ],
  extra: [
    'de fondo tengo musica y el chat apaña',
    'igual la sala esta mejor cuando todos aportan contexto',
    'a esta hora se pone mas sincera la gente',
    'hoy me tinca conversar sin filtro raro',
    'siempre es mejor decir de frente lo que buscas',
    'me cargan los monosilabos, prefiero charla real',
    'cuando responden con detalles, se arma mejor',
    'no todo es correr, igual una charla buena suma',
    'si hay coherencia, el privado sale solo',
    'aca en modo tranquilo pero atento',
  ],
};

const ROLE_LABELS = {
  activo: ['activo', 'top'],
  pasivo: ['pasivo', 'bottom'],
  versatil: ['vers', 'versatil'],
  curioso: ['curioso', 'en exploracion'],
};

const seeded = (a, b) => {
  const x = (a * 9301 + b * 49297 + 233280) % 233280;
  return x / 233280;
};

const pick = (arr, a, b) => arr[Math.floor(seeded(a, b) * arr.length)];

const normalize = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim();
const usedLines = new Set();

const roleForProfile = (profile, conversationId, lineIndex) => {
  const options = ROLE_LABELS[profile.role] || [profile.role || 'vers'];
  return pick(options, conversationId + profile.age, lineIndex + 23);
};

const renderTemplate = (template, vars) => {
  return template
    .replace(/\{zone\}/g, vars.zone)
    .replace(/\{role\}/g, vars.role)
    .replace(/\{target\}/g, vars.target);
};

const uniqueLine = (baseText) => {
  const normalized = normalize(baseText);
  if (!usedLines.has(normalized)) {
    usedLines.add(normalized);
    return baseText;
  }

  const fallback = `${baseText} igual`;
  usedLines.add(normalize(fallback));
  return fallback;
};

const getTagByConversationId = (conversationId) => {
  let cursor = 0;
  for (const item of TAG_DISTRIBUTION) {
    cursor += item.count;
    if (conversationId <= cursor) return item.tag;
  }
  return 'casual';
};

const getConversationCount = (conversationId) => {
  return 10 + (Math.floor(seeded(conversationId, 57) * 1000) % 7); // 10-16
};

const pickParticipants = (conversationId, tag) => {
  const count = 3 + (Math.floor(seeded(conversationId, 19) * 1000) % 3); // 3-5
  const start = Math.floor(seeded(conversationId, 29) * USERNAMES.length);
  const participants = [];

  if (tag === 'curioso') {
    const curiousProfiles = BOT_PROFILES.filter((profile) => profile.role === 'curioso');
    if (curiousProfiles.length > 0) {
      participants.push(curiousProfiles[Math.floor(seeded(conversationId, 111) * curiousProfiles.length)].username);
    }
  }

  for (let i = 0; i < USERNAMES.length && participants.length < count; i++) {
    const idx = (start + i * 2 + (conversationId % 7)) % USERNAMES.length;
    const username = USERNAMES[idx];
    if (!participants.includes(username)) {
      participants.push(username);
    }
  }

  return participants;
};

const getSpeaker = (participants, index) => {
  if (index === 0) return participants[0];
  return participants[index % participants.length];
};

const getTemplateKey = (tag, index, conversationId) => {
  const flows = TAG_FLOW_VARIANTS[tag] || TAG_FLOW_VARIANTS.casual;
  const flow = flows[Math.floor(seeded(conversationId, 222) * flows.length)];
  if (index < flow.length) return flow[index];
  return 'extra';
};

const buildLine = (tag, key, conversationId, lineIndex, speakerProfile, targetProfile) => {
  const templates = TEXT_BANK[key] || TEXT_BANK.extra;
  const template = pick(templates, conversationId * 13, lineIndex * 17 + speakerProfile.age);
  const zone = lineIndex % 2 === 0 ? speakerProfile.location : targetProfile.location;
  const role = roleForProfile(speakerProfile, conversationId, lineIndex);
  const target = targetProfile.username;
  const baseText = renderTemplate(template, { zone, role, target });
  return baseText;
};

const buildDelay = (conversationId, lineIndex) => {
  if (lineIndex === 0) return 0;
  return 3000 + (Math.floor(seeded(conversationId, 400 + lineIndex) * 100000) % 12001); // 3-15s
};

const buildConversation = (conversationId, tag) => {
  const participants = pickParticipants(conversationId, tag);
  const totalMessages = getConversationCount(conversationId);
  const messages = [];

  for (let i = 0; i < totalMessages; i++) {
    const speaker = getSpeaker(participants, i);
    const target = participants[(i + participants.length - 1) % participants.length];
    const speakerProfile = PROFILE_BY_USERNAME.get(speaker);
    const targetProfile = PROFILE_BY_USERNAME.get(target) || speakerProfile;
    const key = getTemplateKey(tag, i, conversationId);

    let line = buildLine(tag, key, conversationId, i, speakerProfile, targetProfile);
    line = uniqueLine(line);

    messages.push({
      from: speaker,
      text: line,
      delayMs: buildDelay(conversationId, i),
    });
  }

  return {
    id: conversationId,
    participants,
    messages,
    tags: [tag],
  };
};

const conversations = [];
for (let id = 1; id <= 100; id++) {
  const tag = getTagByConversationId(id);
  conversations.push(buildConversation(id, tag));
}

export const BOT_CONVERSATIONS = conversations;

export const getConversationsByTag = (tag) =>
  BOT_CONVERSATIONS.filter((conversation) => conversation.tags.includes(tag));

export const getRandomConversationByTag = (tag) => {
  const list = getConversationsByTag(tag);
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
};
