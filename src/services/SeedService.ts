import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Theme, ShopItem, Badge, Chest } from '../types';

export const SeedService = {
  async seedAll() {
    if (!db) return;
    
    await this.seedThemes();
    await this.seedSpells();
    await this.seedBadges();
    await this.seedChests();
    
    console.log('Seeding completed!');
  },

  async seedThemes() {
    const themes: Theme[] = [
      {
        id: 'gaming',
        name: 'Gaming & E-sport',
        questions: [
          { id: 'g1', text: 'Quel est le premier jeu à avoir introduit le "Rocket Jump" ?', options: ['Quake', 'Doom', 'Unreal Tournament', 'Halo'], correctOptionIndex: 0, timeLimit: 15 },
          { id: 'g2', text: 'Dans League of Legends, quel objet a été supprimé car trop puissant sur les mages ?', options: ['DFG (Bracelet de feu mortel)', 'Rabadon', 'Zhonya', 'Luden'], correctOptionIndex: 0, timeLimit: 15 },
          { id: 'g3', text: 'Qui est le créateur de Minecraft ?', options: ['Notch', 'Jeb', 'Dinnerbone', 'C418'], correctOptionIndex: 0, timeLimit: 15 }
        ]
      },
      {
        id: 'pop-culture',
        name: 'Pop Culture',
        questions: [
          { id: 'p1', text: 'Quel est le nom du dragon dans Le Hobbit ?', options: ['Smaug', 'Alduin', 'Paarthurnax', 'Viserion'], correctOptionIndex: 0, timeLimit: 15 },
          { id: 'p2', text: 'Dans One Piece, quel est le fruit du démon de Luffy ?', options: ['Gomu Gomu no Mi', 'Mera Mera no Mi', 'Hito Hito no Mi', 'Ope Ope no Mi'], correctOptionIndex: 0, timeLimit: 15 }
        ]
      }
    ];

    for (const theme of themes) {
      await setDoc(doc(db, 'themes', theme.id.toString()), theme);
    }
  },

  async seedSpells() {
    const spells: ShopItem[] = [
      {
        id: 'spell_flashbang',
        name: 'Flashbang',
        description: 'Éblouit un adversaire : son écran devient blanc pendant 5 secondes.',
        price: 150,
        icon: 'Zap',
        type: 'spell',
        power: 3
      },
      {
        id: 'spell_freeze',
        name: 'Gel Temporel',
        description: 'Bloque les réponses d\'un adversaire pendant 3 secondes.',
        price: 200,
        icon: 'Snowflake',
        type: 'spell',
        power: 4
      },
      {
        id: 'spell_shield',
        name: 'Bouclier de Mana',
        description: 'Protège contre le prochain sort lancé contre vous.',
        price: 100,
        icon: 'Shield',
        type: 'defense',
        power: 2
      },
      {
        id: 'spell_double',
        name: 'Double Dose',
        description: 'Double les points gagnés sur la prochaine question.',
        price: 300,
        icon: 'TrendingUp',
        type: 'bonus',
        power: 5
      },
      {
        id: 'spell_confuse',
        name: 'Confusion',
        description: 'Mélange l\'ordre des réponses pour un adversaire.',
        price: 180,
        icon: 'RotateCw',
        type: 'spell',
        power: 3
      }
    ];

    for (const spell of spells) {
      await setDoc(doc(db, 'shopItems', spell.id.toString()), spell);
    }
  },

  async seedBadges() {
    const badges: Badge[] = [
      { id: 'b_speed', name: 'Éclair', description: 'Répondre correctement en moins de 1 seconde.', icon: 'Zap', level: 1, rarity: 15 },
      { id: 'b_win', name: 'Champion', description: 'Gagner 10 quiz.', icon: 'Trophy', level: 2, rarity: 5 },
      { id: 'b_rich', name: 'Crésus', description: 'Posséder plus de 1000 Coins.', icon: 'Coins', level: 1, rarity: 10 }
    ];

    for (const badge of badges) {
      await setDoc(doc(db, 'badges', badge.id.toString()), badge);
    }
  },

  async seedChests() {
    const chests: Chest[] = [
      {
        id: 'chest_common',
        name: 'Coffre en Bois',
        description: 'Contient des sorts de base.',
        price: 50,
        icon: 'Package',
        possibleItems: ['spell_shield', 'spell_flashbang'],
        rarity: 'common'
      },
      {
        id: 'chest_epic',
        name: 'Coffre Mystique',
        description: 'Une chance d\'obtenir des sorts légendaires.',
        price: 250,
        icon: 'Sparkles',
        possibleItems: ['spell_freeze', 'spell_double', 'spell_confuse'],
        rarity: 'epic'
      }
    ];

    for (const chest of chests) {
      await setDoc(doc(db, 'chests', chest.id.toString()), chest);
    }
  }
};
