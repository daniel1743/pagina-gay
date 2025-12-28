/**
 * SISTEMA DE TEMAS POR PERSONALIDAD
 * Asegura que cada IA hable de temas específicos y únicos
 * Evita spam, repetición y patrones genéricos
 */

export const getPersonalityTopics = (username) => {
  const topicMap = {
    Mateo: {
      main: "fitness",
      topics: ["gym", "entreno", "pesas", "rutina", "prote", "gains", "comida", "restaurantes", "reggaeton", "carrete"],
      forbidden: ["risa", "risas", "jsjs", "jaj", "ajaja", "momento absurdo", "la vida es", "filosofía", "meme del"]
    },
    Nico: {
      main: "series/citas",
      topics: ["series", "streaming", "estreno", "capítulo", "citas", "plan nocturno", "bar", "evento"],
      forbidden: ["risa", "risas", "jsjs", "jaj", "ajaja", "momento absurdo", "meme del"]
    },
    Simon: {
      main: "gaming",
      topics: ["gaming", "videojuegos", "ranked", "mmr", "esports", "stream", "gg", "clutch"],
      forbidden: ["risa", "risas", "jsjs", "jaj", "ajaja", "momento absurdo", "meme del"]
    },
    Rafa: {
      main: "viajes/comida",
      topics: ["viaje", "destino", "hotel", "ruta", "comida", "restaurante", "café", "bar"],
      forbidden: ["risa", "risas", "jsjs", "jaj", "ajaja", "momento absurdo", "meme del"]
    },
    Vale: {
      main: "tendencias",
      topics: ["tendencia", "redes", "viral", "debate", "lgbt", "cultura", "cita", "look"],
      forbidden: ["risa", "risas", "jsjs", "jaj", "ajaja", "momento absurdo", "meme del"]
    },
    Luka: {
      main: "anime/geek",
      topics: ["anime", "manga", "waifu", "husbando", "streaming", "cultura digital", "cosplay"],
      forbidden: ["risa", "risas", "jsjs", "jaj", "ajaja", "momento absurdo", "meme del"]
    },
    Alan: {
      main: "vino/viajes",
      topics: ["vino", "viaje", "gastronomía", "libro", "podcast", "restaurante", "cultura"],
      forbidden: ["meme", "jsjs", "ajaja", "momento absurdo", "temas juveniles"]
    },
    Julian: {
      main: "cultura/arte",
      topics: ["arte", "expo", "cine", "cultura", "museo", "libro", "serie", "festival"],
      forbidden: ["risa", "risas", "jsjs", "jaj", "ajaja", "momento absurdo", "meme del"]
    },
    Ivan: {
      main: "deportes",
      topics: ["fútbol", "básquet", "partido", "entreno", "carrera", "outdoor", "evento deportivo"],
      forbidden: ["broma", "risas", "jsjs", "ajaja", "momento absurdo"]
    },
    Dante: {
      main: "cine",
      topics: ["cine", "película", "director", "escena", "actor", "thriller", "drama"],
      forbidden: ["risa", "risas", "jsjs", "jaj", "ajaja", "momento absurdo", "meme del"]
    },
    Bruno: {
      main: "nightlife",
      topics: ["bar", "antro", "fiesta", "after", "cocktail", "baile", "evento"],
      forbidden: ["risa", "risas", "jsjs", "jaj", "ajaja", "momento absurdo", "meme del"]
    },
    Emilio: {
      main: "música",
      topics: ["música", "playlist", "concierto", "artista", "streaming", "club", "vibes"],
      forbidden: ["risa", "risas", "jsjs", "jaj", "ajaja", "momento absurdo", "meme del"]
    },
    Tomas: {
      main: "tech/negocios",
      topics: ["ia", "startup", "producto", "negocio", "tendencia", "análisis", "estrategia"],
      forbidden: ["risa", "risas", "jsjs", "ajaja", "momento absurdo", "superficial", "meme del"]
    },
    Sebas: {
      main: "internet",
      topics: ["internet", "viral", "meme", "trend", "tiktok", "twitter", "streamer"],
      forbidden: ["risas forzadas", "momento absurdo", "plantilla", "meme del"]
    },
    Milo: {
      main: "planes",
      topics: ["plan", "panorama", "evento", "cita", "cine", "bar", "terraza"],
      forbidden: ["risa", "risas", "jsjs", "jaj", "ajaja", "momento absurdo", "meme del"]
    }
  };

  return topicMap[username] || { main: "varios", topics: [], forbidden: [] };
};

const normalize = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * ✅ Validación fuerte:
 * - Prohíbe temas spam
 * - Obliga a tocar al menos 1 topic keyword
 * - Evita estructuras plantilla
 */
export const validateMessageForPersonality = (message, personality) => {
  const topicData = getPersonalityTopics(personality.username);
  const text = normalize(message);

  // 1) forbid
  for (const f of topicData.forbidden) {
    if (text.includes(normalize(f))) {
      return { valid: false, reason: `FORBIDDEN:${f}` };
    }
  }

  // 2) anti-plantilla (lo de la screenshot)
  const templateStarts = [
    "wn y cuando",
    "wn, y cuando",
    "wn y al final",
    "wn, y al final",
    "wn, es que"
  ];
  if (templateStarts.some(p => text.startsWith(p))) {
    return { valid: false, reason: "TEMPLATE_START" };
  }

  // 3) require topic hit (si no es mensaje ultra corto)
  if (text.length >= 25 && topicData.topics.length > 0) {
    const hit = topicData.topics.some(t => text.includes(normalize(t)));
    if (!hit) return { valid: false, reason: `NO_TOPIC_HIT:${topicData.main}` };
  }

  // 4) anti-emoji spam
  const emojiCount = (message.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu) || []).length;
  if (emojiCount > 2) return { valid: false, reason: "EMOJI_SPAM" };

  return { valid: true };
};
