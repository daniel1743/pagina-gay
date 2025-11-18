import { Users, Hash, Gamepad2, Heart, UserCheck, GitFork, UserMinus, Cake } from 'lucide-react';

export const roomsData = [
  {
    id: 'santiago',
    name: 'Santiago 🏙️',
    description: 'Gays de Santiago - Capital de Chile',
    icon: Users,
    color: 'cyan'
  },
  {
    id: 'valparaiso',
    name: 'Valparaíso 🌊',
    description: 'Gays de Valparaíso - Puerto y cerros',
    icon: Users,
    color: 'blue'
  },
  {
    id: 'conversas-libres',
    name: 'Conversas Libres',
    description: 'Chat general para todos los temas',
    icon: Hash,
    color: 'teal'
  },
  {
    id: 'amistad',
    name: 'Amistad',
    description: 'Conoce nuevos amigos LGBT+',
    icon: Heart,
    color: 'pink'
  },
  {
    id: 'osos',
    name: 'Osos',
    description: 'Espacio para la comunidad Bear',
    icon: UserCheck,
    color: 'amber'
  },
  {
    id: 'activos-buscando',
    name: 'Activos Buscando',
    description: 'Activos en búsqueda',
    icon: UserCheck,
    color: 'blue'
  },
  {
    id: 'pasivos-buscando',
    name: 'Pasivos Buscando',
    description: 'Pasivos en búsqueda',
    icon: UserCheck,
    color: 'purple'
  },
  {
    id: 'lesbianas',
    name: 'Lesbianas',
    description: 'Sala exclusiva para lesbianas',
    icon: GitFork,
    color: 'fuchsia'
  },
  {
    id: 'menos-30',
    name: 'Menos de 30',
    description: 'Para menores de 30 años',
    icon: UserMinus,
    color: 'green'
  },
  {
    id: 'mas-30',
    name: 'Más de 30',
    description: 'Para mayores de 30 años',
    icon: Users,
    color: 'teal'
  },
  {
    id: 'mas-40',
    name: 'Más de 40',
    description: 'Para mayores de 40 años',
    icon: Cake,
    color: 'orange'
  },
  {
    id: 'mas-50',
    name: 'Más de 50',
    description: 'Para mayores de 50 años',
    icon: Cake,
    color: 'red'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Gamers LGBT+ conectando',
    icon: Gamepad2,
    color: 'violet'
  },
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

