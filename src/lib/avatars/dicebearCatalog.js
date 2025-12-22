import { createAvatar } from '@dicebear/core';
import {
  avataaars as styleAvataaars,
  bigSmile as styleBigSmile,
  adventurer as styleAdventurer,
  bottts as styleBottts,
  funEmoji as styleFunEmoji,
  lorelei as styleLorelei,
  micah as styleMicah,
  croodles as styleCroodles,
  personas as stylePersonas,
  thumbs as styleThumbs
} from '@dicebear/collection';

/**
 * Catálogo de avatares usando DiceBear
 * Genera 120 avatares únicos distribuidos en tiers
 */

// Estilos disponibles para usar
const AVATAR_STYLES = [
  { name: 'avataaars', style: styleAvataaars },
  { name: 'big-smile', style: styleBigSmile },
  { name: 'adventurer', style: styleAdventurer },
  { name: 'bottts', style: styleBottts },
  { name: 'fun-emoji', style: styleFunEmoji },
  { name: 'lorelei', style: styleLorelei },
  { name: 'micah', style: styleMicah },
  { name: 'croodles', style: styleCroodles },
  { name: 'personas', style: stylePersonas },
  { name: 'thumbs', style: styleThumbs },
];

// Nombres para los avatares
const AVATAR_NAMES = [
  // Gratis
  'Arcoíris 1', 'Arcoíris 2', 'Cool 1', 'Cool 2', 'Feliz 1', 'Feliz 2', 'Sonrisa 1', 'Sonrisa 2', 
  'Aventurero 1', 'Aventurero 2', 'Doodle 1', 'Doodle 2', 'Retro 1', 'Retro 2', 'Moderno 1', 
  'Moderno 2', 'Emoji 1', 'Emoji 2', 'Robot 1', 'Robot 2',
  // Verificado
  'Élite 1', 'Élite 2', 'Élite 3', 'Verificado 1', 'Verificado 2', 'Verificado 3', 'VIP 1', 'VIP 2',
  'Estrella 1', 'Estrella 2', 'Destacado 1', 'Destacado 2', 'Exclusivo 1', 'Exclusivo 2', 'Premium Light 1',
  'Premium Light 2', 'Dorado 1', 'Dorado 2', 'Plata 1', 'Plata 2', 'Oro 1', 'Oro 2', 'Diamante 1',
  'Diamante 2', 'Legendario 1', 'Legendario 2', 'Místico 1', 'Místico 2', 'Especial 1', 'Especial 2',
  // Premium
  'Rey 1', 'Rey 2', 'Reina 1', 'Reina 2', 'Emperador 1', 'Emperador 2', 'Dios 1', 'Dios 2',
  'Cosmos 1', 'Cosmos 2', 'Infinito 1', 'Infinito 2', 'Supremo 1', 'Supremo 2', 'Épico 1', 'Épico 2',
  'Único 1', 'Único 2', 'Divino 1', 'Divino 2', 'Celestial 1', 'Celestial 2', 'Transcendente 1',
  'Transcendente 2', 'Omega 1', 'Omega 2', 'Alpha 1', 'Alpha 2', 'Ultra 1', 'Ultra 2',
];

/**
 * Genera un avatar SVG usando DiceBear
 */
const generateAvatarSVG = (styleName, styleModule, seed) => {
  try {
    const avatar = createAvatar(styleModule, {
      seed: seed,
      size: 128,
      backgroundColor: ['b6e3f4', 'c0aede', 'ffd5dc', 'ffdfbf', 'd1d4f9'],
      radius: 50,
    });
    return avatar.toDataUri();
  } catch (error) {
    console.error(`Error generando avatar ${styleName} con seed ${seed}:`, error);
    // Fallback a avataaars
    const fallback = createAvatar(styleAvataaars, {
      seed: seed,
      size: 128,
      backgroundColor: 'b6e3f4',
    });
    return fallback.toDataUri();
  }
};

/**
 * Genera el catálogo completo de avatares
 * @param {number} totalCount - Número total de avatares (default: 120)
 * @returns {Array} Array de objetos avatar con metadata
 */
export const generateAvatarCatalog = (totalCount = 120) => {
  const catalog = [];
  
  // Distribución: Free=30, Verified=40, Premium=50 (total 120)
  const FREE_COUNT = 30;
  const VERIFIED_COUNT = 40;
  const PREMIUM_COUNT = 50;

  let nameIndex = 0;
  let styleIndex = 0;

  // FREE avatares (0-29)
  for (let i = 0; i < FREE_COUNT; i++) {
    const seed = `free-avatar-${String(i + 1).padStart(3, '0')}`;
    const styleData = AVATAR_STYLES[styleIndex % AVATAR_STYLES.length];
    const svg = generateAvatarSVG(styleData.name, styleData.style, seed);
    
    catalog.push({
      id: `avatar-${String(i + 1).padStart(3, '0')}`,
      seed: seed,
      style: styleData.name,
      name: AVATAR_NAMES[nameIndex] || `Avatar ${i + 1}`,
      tierRequired: 'free',
      levelRequired: null,
      svg: svg,
    });
    
    styleIndex++;
    nameIndex++;
  }

  // VERIFIED avatares (30-69)
  for (let i = FREE_COUNT; i < FREE_COUNT + VERIFIED_COUNT; i++) {
    const seed = `verified-avatar-${String(i + 1).padStart(3, '0')}`;
    const styleData = AVATAR_STYLES[styleIndex % AVATAR_STYLES.length];
    const svg = generateAvatarSVG(styleData.name, styleData.style, seed);
    
    catalog.push({
      id: `avatar-${String(i + 1).padStart(3, '0')}`,
      seed: seed,
      style: styleData.name,
      name: AVATAR_NAMES[nameIndex] || `Avatar ${i + 1}`,
      tierRequired: 'verified',
      levelRequired: null,
      svg: svg,
    });
    
    styleIndex++;
    nameIndex++;
  }

  // PREMIUM avatares (70-119)
  for (let i = FREE_COUNT + VERIFIED_COUNT; i < totalCount; i++) {
    const seed = `premium-avatar-${String(i + 1).padStart(3, '0')}`;
    const styleData = AVATAR_STYLES[styleIndex % AVATAR_STYLES.length];
    const svg = generateAvatarSVG(styleData.name, styleData.style, seed);
    
    catalog.push({
      id: `avatar-${String(i + 1).padStart(3, '0')}`,
      seed: seed,
      style: styleData.name,
      name: AVATAR_NAMES[nameIndex] || `Avatar ${i + 1}`,
      tierRequired: 'premium',
      levelRequired: null,
      svg: svg,
    });
    
    styleIndex++;
    nameIndex++;
  }

  return catalog;
};

// ✅ Catálogo pre-generado (memoizado para rendimiento)
export const DEFAULT_CATALOG = generateAvatarCatalog(120);

/**
 * Obtiene avatares filtrados por tier
 */
export const getAvatarsByTier = (tier) => {
  return DEFAULT_CATALOG.filter(avatar => avatar.tierRequired === tier);
};

/**
 * Verifica si un usuario puede usar un avatar basado en su tier
 */
export const canUserUseAvatar = (avatar, userTier, userLevel = 0) => {
  if (!avatar) return false;
  
  // Admin puede usar todos
  // (se valida en el componente)
  
  const tierHierarchy = { free: 0, verified: 1, premium: 2 };
  const userTierLevel = tierHierarchy[userTier] || 0;
  const avatarTierLevel = tierHierarchy[avatar.tierRequired] || 0;
  
  // Usuario puede usar si su tier es igual o mayor
  if (userTierLevel >= avatarTierLevel) {
    // Si tiene levelRequired, verificar nivel
    if (avatar.levelRequired && userLevel < avatar.levelRequired) {
      return false;
    }
    return true;
  }
  
  return false;
};

