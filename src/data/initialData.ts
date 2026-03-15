import { ShopItem, Badge, Chest } from '../types';

const now = Date.now();

export const INITIAL_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'bouclier',
    name: 'Bouclier de Force',
    description: 'Vous protège des attaques des autres joueurs pendant 15s.',
    price: 300,
    currency: 'coins',
    icon: 'Shield',
    type: 'defense',
    power: 1,
    active: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'fumigene',
    name: 'Fumigène Ninja',
    description: 'Brouille l\'écran de tous les autres joueurs pendant 10s.',
    price: 50,
    currency: 'brainCoins',
    icon: 'EyeOff',
    type: 'attack',
    power: 2,
    active: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'seisme',
    name: 'Séisme',
    description: 'Fait trembler l\'écran des adversaires pendant 8s.',
    price: 750,
    currency: 'coins',
    icon: 'Zap',
    type: 'attack',
    power: 3,
    active: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'inversion',
    name: 'Inversion Spatiale',
    description: 'Renverse l\'écran des autres joueurs pendant 10s.',
    price: 100,
    currency: 'brainCoins',
    icon: 'RefreshCcw',
    type: 'attack',
    power: 4,
    active: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'gel',
    name: 'Gel Temporel',
    description: 'Gèle les boutons de réponse des adversaires pendant 5s.',
    price: 1500,
    currency: 'coins',
    icon: 'Snowflake',
    type: 'attack',
    power: 5,
    chestOnly: true,
    active: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'flash',
    name: 'Flash Divin',
    description: 'Éblouissement total et instantané pour tous les adversaires (12s).',
    price: 250,
    currency: 'brainCoins',
    icon: 'Sun',
    type: 'attack',
    power: 5,
    isExclusive: true,
    chestOnly: true,
    active: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'super_bouclier',
    name: 'Égide de Diamant',
    description: 'Immunité totale pendant 30s et renvoie les malus.',
    price: 500,
    currency: 'brainCoins',
    icon: 'ShieldAlert',
    type: 'defense',
    power: 5,
    isExclusive: true,
    chestOnly: true,
    active: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'triple_points',
    name: 'Triple Score',
    description: 'Vos points sont triplés sur les 3 prochaines questions.',
    price: 150,
    currency: 'brainCoins',
    icon: 'TrendingUp',
    type: 'bonus',
    power: 4,
    active: true,
    createdAt: now,
    updatedAt: now
  }
];

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'newbie',
    name: 'Nouveau Venu',
    description: 'Bienvenue dans l\'arène !',
    icon: 'UserPlus',
    level: 1,
    rarity: 'common'
  },
  {
    id: 'winner_1',
    name: 'Premier Sang',
    description: 'Gagner sa première partie.',
    icon: 'Trophy',
    level: 5,
    rarity: 'rare'
  },
  {
    id: 'streak_5',
    name: 'Série de 5',
    description: 'Répondre juste à 5 questions d\'affilée.',
    icon: 'Flame',
    level: 10,
    rarity: 'rare'
  },
  {
    id: 'collector',
    name: 'Collectionneur',
    description: 'Posséder 10 objets différents.',
    icon: 'Package',
    level: 15,
    rarity: 'epic'
  },
  {
    id: 'legend',
    name: 'Légende de l\'Arène',
    description: 'Atteindre le niveau 50.',
    icon: 'Crown',
    level: 50,
    rarity: 'legendary'
  }
];

export const INITIAL_CHESTS: Chest[] = [
  {
    id: 'chest_common',
    name: 'Coffre en Bois',
    description: 'Contient principalement des objets communs.',
    price: 200,
    currency: 'coins',
    icon: 'Package',
    possibleItems: ['bouclier', 'fumigene', 'seisme'],
    rarity: 'common',
    active: true
  },
  {
    id: 'chest_rare',
    name: 'Coffre Renforcé',
    description: 'Une chance d\'obtenir des objets rares et le Gel Temporel.',
    price: 30,
    currency: 'brainCoins',
    icon: 'PackagePlus',
    possibleItems: ['seisme', 'inversion', 'bouclier', 'gel'],
    rarity: 'rare',
    active: true
  },
  {
    id: 'chest_epic',
    name: 'Coffre Mystique',
    description: 'Contient souvent des sorts puissants et exclusifs.',
    price: 2000,
    currency: 'coins',
    icon: 'Zap',
    possibleItems: ['gel', 'inversion', 'seisme', 'flash'],
    rarity: 'epic',
    active: true
  },
  {
    id: 'chest_legendary',
    name: 'Coffre des Dieux',
    description: 'L\'élite de l\'équipement. Seul moyen d\'avoir l\'Égide de Diamant.',
    price: 150,
    currency: 'brainCoins',
    icon: 'Crown',
    possibleItems: ['flash', 'super_bouclier', 'gel', 'inversion', 'triple_points'],
    rarity: 'legendary',
    active: true
  }
];
