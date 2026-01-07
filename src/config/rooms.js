import { Users, Hash, Gamepad2, Heart, UserCheck, GitFork, UserMinus, Cake } from 'lucide-react';

// ✅ CONSOLIDACIÓN DE SALAS 2025-12-16
// Estrategia: Concentrar usuarios en 4 salas principales para crear masa crítica
// Las demás salas se reactivarán cuando haya >200 usuarios diarios

export const roomsData = [
  // ⚠️ SALA GLOBAL ANTIGUA - COMENTADA (tenía spam masivo)
  // Se mantiene comentada como "general" para referencia histórica
  // {
  //   id: 'general',
  //   name: 'Chat General 🌍 (SPAM)',
  //   description: 'Sala antigua con spam - DESACTIVADA',
  //   icon: Hash,
  //   color: 'teal'
  // },

  // ⚠️ SALA GLOBAL - COMENTADA (reemplazada por Chat Principal)
  // {
  //   id: 'global',
  //   name: 'Chat Global 🌍',
  //   description: 'Sala principal - Todos los temas bienvenidos',
  //   icon: Hash,
  //   color: 'teal'
  // },

  // 🔥 SALA CHAT PRINCIPAL - Sala principal activa
  {
    id: 'principal',
    name: 'Chat Principal 🌍',
    description: 'Sala principal - Todos los temas bienvenidos',
    icon: Hash,
    color: 'teal'
  },

  // ⚠️ SALA DESACTIVADA - Tenía spam masivo, redirige a 'global'
  // {
  //   id: 'conversas-libres',
  //   name: 'Conversas Libres 💬',
  //   description: 'Chat general - Todos los temas bienvenidos',
  //   icon: Hash,
  //   color: 'teal'
  // },
  // 🎯 SALAS ESTRATÉGICAS - Nichos con alto engagement
  {
    id: 'mas-30',
    name: 'Más de 30 💪',
    description: 'Para mayores de 30 años',
    icon: Users,
    color: 'teal'
  },
  {
    id: 'santiago',
    name: 'Santiago 🏙️',
    description: 'Gays de Santiago - Capital de Chile',
    icon: Users,
    color: 'cyan'
  },
  {
    id: 'gaming',
    name: 'Gaming 🎮',
    description: 'Gamers LGBT+ conectando',
    icon: Gamepad2,
    color: 'violet'
  },

  // 🌍 SALAS POR PAÍS - Nuevas rutas internacionales
  {
    id: 'es-main',
    name: 'España 🇪🇸',
    description: 'Chat principal de España',
    icon: Hash,
    color: 'red'
  },
  {
    id: 'br-main',
    name: 'Brasil 🇧🇷',
    description: 'Chat principal do Brasil',
    icon: Hash,
    color: 'green'
  },
  {
    id: 'mx-main',
    name: 'México 🇲🇽',
    description: 'Chat principal de México',
    icon: Hash,
    color: 'green'
  },
  {
    id: 'ar-main',
    name: 'Argentina 🇦🇷',
    description: 'Chat principal de Argentina',
    icon: Hash,
    color: 'blue'
  },

  // 🆕 SALA SECUNDARIA - Chat secundario con conversación bidireccional
  {
    id: 'secundaria',
    name: 'Sala Secundaria 💬',
    description: 'Chat secundario - Conversación bidireccional',
    icon: Hash,
    color: 'purple',
    isSecondary: true // ✅ Flag para identificar que es sala secundaria
  },

  // 💤 SALAS DESACTIVADAS TEMPORALMENTE (Reactivar cuando haya más tráfico)
  // {
  //   id: 'valparaiso',
  //   name: 'Valparaíso 🌊',
  //   description: 'Gays de Valparaíso - Puerto y cerros',
  //   icon: Users,
  //   color: 'blue'
  // },
  // {
  //   id: 'amistad',
  //   name: 'Amistad',
  //   description: 'Conoce nuevos amigos LGBT+',
  //   icon: Heart,
  //   color: 'pink'
  // },
  // {
  //   id: 'osos',
  //   name: 'Osos',
  //   description: 'Espacio para la comunidad Bear',
  //   icon: UserCheck,
  //   color: 'amber'
  // },
  // {
  //   id: 'activos-buscando',
  //   name: 'Activos Buscando',
  //   description: 'Activos en búsqueda',
  //   icon: UserCheck,
  //   color: 'blue'
  // },
  // {
  //   id: 'pasivos-buscando',
  //   name: 'Pasivos Buscando',
  //   description: 'Pasivos en búsqueda',
  //   icon: UserCheck,
  //   color: 'purple'
  // },
  // {
  //   id: 'lesbianas',
  //   name: 'Lesbianas',
  //   description: 'Sala exclusiva para lesbianas',
  //   icon: GitFork,
  //   color: 'fuchsia'
  // },
  // {
  //   id: 'menos-30',
  //   name: 'Menos de 30',
  //   description: 'Para menores de 30 años',
  //   icon: UserMinus,
  //   color: 'green'
  // },
  // {
  //   id: 'mas-40',
  //   name: 'Más de 40',
  //   description: 'Para mayores de 40 años',
  //   icon: Cake,
  //   color: 'orange'
  // },
  // {
  //   id: 'mas-50',
  //   name: 'Más de 50',
  //   description: 'Para mayores de 50 años',
  //   icon: Cake,
  //   color: 'red'
  // },
];

export const colorClasses = {
  cyan: 'text-cyan-400',
  pink: 'text-pink-400',
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  fuchsia: 'text-fuchsia-400',
  green: 'text-green-400',
  teal: 'text-teal-400',
  orange: 'text-orange-400',
  red: 'text-red-400',
  violet: 'text-violet-400',
};

