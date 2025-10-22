/**
 * SISTEMA DE AVATARES PREMIUM DESBLOQUEABLES
 * 25 avatares únicos que se desbloquean compartiendo
 * Usa DiceBear API con estilos premium
 */

export const PREMIUM_AVATARS = [
  // TIER 1: Desbloqueables con 1 compartido (avatares 1-5)
  {
    id: 'premium_1',
    name: 'Aventurero',
    tier: 1,
    sharesRequired: 1,
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4&hair=short01&hairColor=0e0e0e',
    description: 'Avatar aventurero exclusivo'
  },
  {
    id: 'premium_2',
    name: 'Pixel Art Retro',
    tier: 1,
    sharesRequired: 1,
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Fluffy&backgroundColor=ffdfbf',
    description: 'Estilo pixel art retro'
  },
  {
    id: 'premium_3',
    name: 'Bottts Futurista',
    tier: 1,
    sharesRequired: 1,
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Lucky&backgroundColor=d1d4f9',
    description: 'Robot futurista único'
  },
  {
    id: 'premium_4',
    name: 'Lorelei Místico',
    tier: 1,
    sharesRequired: 1,
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Rainbow&backgroundColor=ffd5dc',
    description: 'Avatar místico y colorido'
  },
  {
    id: 'premium_5',
    name: 'Notionistas Pro',
    tier: 1,
    sharesRequired: 1,
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Pride&backgroundColor=c0aede',
    description: 'Estilo profesional Notion'
  },

  // TIER 2: Desbloqueables con 2 compartidos (avatares 6-10)
  {
    id: 'premium_6',
    name: 'Mini Avatar Cute',
    tier: 2,
    sharesRequired: 2,
    url: 'https://api.dicebear.com/7.x/miniavs/svg?seed=Sunshine&backgroundColor=ffdfbf',
    description: 'Mini avatar super cute'
  },
  {
    id: 'premium_7',
    name: 'Personas Clásico',
    tier: 2,
    sharesRequired: 2,
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=Storm&backgroundColor=b6e3f4',
    description: 'Avatar clásico elegante'
  },
  {
    id: 'premium_8',
    name: 'Shapes Abstracto',
    tier: 2,
    sharesRequired: 2,
    url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Cosmic&backgroundColor=d1d4f9',
    description: 'Formas abstractas únicas'
  },
  {
    id: 'premium_9',
    name: 'Identicon Geométrico',
    tier: 2,
    sharesRequired: 2,
    url: 'https://api.dicebear.com/7.x/identicon/svg?seed=Matrix&backgroundColor=c0aede',
    description: 'Patrón geométrico'
  },
  {
    id: 'premium_10',
    name: 'Rings Brillante',
    tier: 2,
    sharesRequired: 2,
    url: 'https://api.dicebear.com/7.x/rings/svg?seed=Diamond&backgroundColor=ffd5dc',
    description: 'Anillos brillantes'
  },

  // TIER 3: Desbloqueables con 3 compartidos (avatares 11-15)
  {
    id: 'premium_11',
    name: 'Big Ears Divertido',
    tier: 3,
    sharesRequired: 3,
    url: 'https://api.dicebear.com/7.x/big-ears/svg?seed=Jolly&backgroundColor=ffdfbf',
    description: 'Orejas grandes divertidas'
  },
  {
    id: 'premium_12',
    name: 'Big Smile Feliz',
    tier: 3,
    sharesRequired: 3,
    url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Happy&backgroundColor=b6e3f4',
    description: 'Gran sonrisa radiante'
  },
  {
    id: 'premium_13',
    name: 'Thumbs Positivo',
    tier: 3,
    sharesRequired: 3,
    url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Victor&backgroundColor=d1d4f9',
    description: 'Pulgar arriba único'
  },
  {
    id: 'premium_14',
    name: 'Fun Emoji Expresivo',
    tier: 3,
    sharesRequired: 3,
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Sparkle&backgroundColor=ffd5dc',
    description: 'Emoji súper expresivo'
  },
  {
    id: 'premium_15',
    name: 'Micah Premium',
    tier: 3,
    sharesRequired: 3,
    url: 'https://api.dicebear.com/7.x/micah/svg?seed=Elite&backgroundColor=c0aede',
    description: 'Avatar premium Micah'
  },

  // TIER 4: Desbloqueables con 4 compartidos (avatares 16-20)
  {
    id: 'premium_16',
    name: 'Adventurer Heroico',
    tier: 4,
    sharesRequired: 4,
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Hero&backgroundColor=ffdfbf&hair=long01',
    description: 'Aventurero heroico'
  },
  {
    id: 'premium_17',
    name: 'Bottts Neo',
    tier: 4,
    sharesRequired: 4,
    url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Neo&backgroundColor=b6e3f4',
    description: 'Robot neutral futurista'
  },
  {
    id: 'premium_18',
    name: 'Lorelei Encantado',
    tier: 4,
    sharesRequired: 4,
    url: 'https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=Enchanted&backgroundColor=d1d4f9',
    description: 'Avatar encantado neutral'
  },
  {
    id: 'premium_19',
    name: 'Notionists VIP',
    tier: 4,
    sharesRequired: 4,
    url: 'https://api.dicebear.com/7.x/notionists-neutral/svg?seed=VIP&backgroundColor=ffd5dc',
    description: 'VIP Notionists neutral'
  },
  {
    id: 'premium_20',
    name: 'Personas Elite',
    tier: 4,
    sharesRequired: 4,
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=Elite&backgroundColor=c0aede',
    description: 'Elite personas neutral'
  },

  // TIER 5: Desbloqueables con 5 compartidos (avatares 21-25) - LOS MÁS EXCLUSIVOS
  {
    id: 'premium_21',
    name: 'Pixel Gold',
    tier: 5,
    sharesRequired: 5,
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=GoldenKing&backgroundColor=ffd700',
    description: 'Pixel dorado exclusivo'
  },
  {
    id: 'premium_22',
    name: 'Adventurer Legendario',
    tier: 5,
    sharesRequired: 5,
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Legend&backgroundColor=ff6b9d&hair=long13&hairColor=ff69b4',
    description: 'Aventurero legendario'
  },
  {
    id: 'premium_23',
    name: 'Bottts Omega',
    tier: 5,
    sharesRequired: 5,
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=OmegaBot&backgroundColor=9333ea',
    description: 'Robot Omega supremo'
  },
  {
    id: 'premium_24',
    name: 'Cosmic Master',
    tier: 5,
    sharesRequired: 5,
    url: 'https://api.dicebear.com/7.x/shapes/svg?seed=CosmicMaster&backgroundColor=0ea5e9',
    description: 'Maestro cósmico'
  },
  {
    id: 'premium_25',
    name: 'Rainbow Supreme',
    tier: 5,
    sharesRequired: 5,
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=RainbowSupreme&backgroundColor=gradient',
    description: 'Avatar supremo arcoíris'
  }
];

/**
 * Obtiene avatares por tier
 */
export const getAvatarsByTier = (tier) => {
  return PREMIUM_AVATARS.filter(avatar => avatar.tier === tier);
};

/**
 * Obtiene avatar por ID
 */
export const getAvatarById = (id) => {
  return PREMIUM_AVATARS.find(avatar => avatar.id === id);
};

/**
 * Verifica si un avatar está desbloqueado
 */
export const isAvatarUnlocked = (avatarId, userShares) => {
  const avatar = getAvatarById(avatarId);
  if (!avatar) return false;
  return userShares >= avatar.sharesRequired;
};

/**
 * Obtiene avatares desbloqueados para un usuario
 */
export const getUnlockedAvatars = (userShares) => {
  return PREMIUM_AVATARS.filter(avatar => avatar.sharesRequired <= userShares);
};

/**
 * Obtiene el siguiente avatar a desbloquear
 */
export const getNextAvatarToUnlock = (userShares) => {
  const locked = PREMIUM_AVATARS.filter(avatar => avatar.sharesRequired > userShares);
  return locked.sort((a, b) => a.sharesRequired - b.sharesRequired)[0] || null;
};
