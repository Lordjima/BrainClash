import { ShopItem, Badge, Chest } from '../types';

export const INITIAL_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'shield_1',
    name: 'Bouclier de Bronze',
    description: 'Protège contre une attaque mineure.',
    price: 150,
    icon: 'Shield',
    type: 'defense',
    power: 1
  },
  {
    id: 'shield_2',
    name: 'Bouclier d\'Argent',
    description: 'Une protection solide pour les duels.',
    price: 450,
    icon: 'ShieldCheck',
    type: 'defense',
    power: 3
  },
  {
    id: 'shield_3',
    name: 'Égide d\'Or',
    description: 'La protection ultime des champions.',
    price: 1200,
    icon: 'ShieldAlert',
    type: 'defense',
    power: 5
  },
  {
    id: 'sword_1',
    name: 'Dague de Fer',
    description: 'Une petite attaque rapide.',
    price: 200,
    icon: 'Sword',
    type: 'attack',
    power: 1
  },
  {
    id: 'sword_2',
    name: 'Lame de Duel',
    description: 'Parfait pour trancher les scores.',
    price: 600,
    icon: 'Swords',
    type: 'attack',
    power: 3
  },
  {
    id: 'sword_3',
    name: 'Excalibur',
    description: 'La légende entre vos mains.',
    price: 2500,
    icon: 'Zap',
    type: 'attack',
    power: 5
  },
  {
    id: 'potion_1',
    name: 'Potion de Rapidité',
    description: 'Réduit le temps de réflexion de 2s.',
    price: 300,
    icon: 'Zap',
    type: 'bonus',
    power: 2
  },
  {
    id: 'potion_2',
    name: 'Élixir de Savoir',
    description: 'Double les points pour la prochaine question.',
    price: 800,
    icon: 'FlaskConical',
    type: 'bonus',
    power: 4
  },
  {
    id: 'spell_1',
    name: 'Gel Temporel',
    description: 'Gèle le temps pour tous les autres joueurs pendant 3s.',
    price: 1500,
    icon: 'Snowflake',
    type: 'spell',
    power: 4
  },
  {
    id: 'spell_2',
    name: 'Foudre Divine',
    description: 'Retire 500 points au premier du classement.',
    price: 3000,
    icon: 'CloudLightning',
    type: 'spell',
    power: 5
  }
];

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'newbie',
    name: 'Nouveau Venu',
    description: 'Bienvenue dans l\'arène !',
    icon: 'UserPlus',
    level: 1,
    rarity: 100
  },
  {
    id: 'winner_1',
    name: 'Premier Sang',
    description: 'Gagner sa première partie.',
    icon: 'Trophy',
    level: 5,
    rarity: 40
  },
  {
    id: 'streak_5',
    name: 'Série de 5',
    description: 'Répondre juste à 5 questions d\'affilée.',
    icon: 'Flame',
    level: 10,
    rarity: 25
  },
  {
    id: 'collector',
    name: 'Collectionneur',
    description: 'Posséder 10 objets différents.',
    icon: 'Package',
    level: 15,
    rarity: 10
  },
  {
    id: 'legend',
    name: 'Légende de l\'Arène',
    description: 'Atteindre le niveau 50.',
    icon: 'Crown',
    level: 50,
    rarity: 1
  }
];

export const INITIAL_CHESTS: Chest[] = [
  {
    id: 'chest_common',
    name: 'Coffre en Bois',
    description: 'Contient principalement des objets communs.',
    price: 500,
    icon: 'Package',
    possibleItems: ['shield_1', 'sword_1', 'potion_1'],
    rarity: 'common'
  },
  {
    id: 'chest_rare',
    name: 'Coffre Renforcé',
    description: 'Une chance d\'obtenir des objets rares.',
    price: 1500,
    icon: 'PackagePlus',
    possibleItems: ['shield_2', 'sword_2', 'potion_2', 'shield_1', 'sword_1'],
    rarity: 'rare'
  },
  {
    id: 'chest_epic',
    name: 'Coffre Mystique',
    description: 'Contient souvent des sorts puissants.',
    price: 5000,
    icon: 'Sparkles',
    possibleItems: ['spell_1', 'shield_3', 'sword_3', 'potion_2'],
    rarity: 'epic'
  },
  {
    id: 'chest_legendary',
    name: 'Coffre des Dieux',
    description: 'L\'élite de l\'équipement.',
    price: 15000,
    icon: 'Crown',
    possibleItems: ['spell_2', 'sword_3', 'shield_3', 'spell_1'],
    rarity: 'legendary'
  }
];
