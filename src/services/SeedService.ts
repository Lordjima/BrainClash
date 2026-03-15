import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Theme, CatalogItem, CatalogBadge, CatalogChest, Question } from '../types';

export const SeedService = {
  async seedAll() {
    if (!db) return;
    
    try {
      await this.seedThemes();
      await this.seedItems();
      await this.seedBadges();
      await this.seedChests();
      console.log('Seeding completed!');
    } catch (err) {
      console.error('Seeding failed:', err);
      throw err;
    }
  },

  async seedThemes() {
    const themes: Theme[] = [
      { id: 'gaming', name: 'Gaming & E-sport', questionCount: 2 },
      { id: 'pop-culture', name: 'Pop Culture', questionCount: 1 },
      { id: 'disney', name: 'Disney', questionCount: 0 }
    ];

    for (const theme of themes) {
      await setDoc(doc(db, 'themes', theme.id), theme);
    }

    // Seed some questions
    const questions: (Question & { id: string })[] = [
      { id: 'g1', index: 0, questionId: 'g1', text: 'Quel est le premier jeu à avoir introduit le "Rocket Jump" ?', options: ['Quake', 'Doom', 'Unreal Tournament', 'Halo'], correctOptionIndex: 0, timeLimit: 15, theme: 'gaming' },
      { id: 'g2', index: 0, questionId: 'g2', text: 'Dans League of Legends, quel objet a été supprimé car trop puissant sur les mages ?', options: ['DFG (Bracelet de feu mortel)', 'Rabadon', 'Zhonya', 'Luden'], correctOptionIndex: 0, timeLimit: 15, theme: 'gaming' },
      { id: 'p1', index: 0, questionId: 'p1', text: 'Quel est le nom du dragon dans Le Hobbit ?', options: ['Smaug', 'Alduin', 'Paarthurnax', 'Viserion'], correctOptionIndex: 0, timeLimit: 15, theme: 'pop-culture' }
    ];

    for (const q of questions) {
      await setDoc(doc(db, 'questionBank', q.id), q);
    }
  },

  async seedItems() {
    const now = Date.now();
    const items: CatalogItem[] = [
      {
        id: 'spell_flashbang',
        name: 'Flashbang',
        description: 'Éblouit un adversaire : son écran devient blanc pendant 5 secondes.',
        price: 150,
        currency: 'coins',
        icon: 'Zap',
        type: 'spell',
        power: 3,
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'spell_freeze',
        name: 'Gel Temporel',
        description: 'Bloque les réponses d\'un adversaire pendant 3 secondes.',
        price: 200,
        currency: 'coins',
        icon: 'Snowflake',
        type: 'spell',
        power: 4,
        chestOnly: true,
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'spell_shield',
        name: 'Bouclier de Mana',
        description: 'Protège contre le prochain sort lancé contre vous.',
        price: 100,
        currency: 'coins',
        icon: 'Shield',
        type: 'defense',
        power: 2,
        active: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const item of items) {
      await setDoc(doc(db, 'catalogItems', item.id), item);
    }
  },

  async seedBadges() {
    const badges: CatalogBadge[] = [
      { id: 'b_speed', name: 'Éclair', description: 'Répondre correctement en moins de 1 seconde.', icon: 'Zap' },
      { id: 'b_win', name: 'Champion', description: 'Gagner 10 quiz.', icon: 'Trophy' }
    ];

    for (const badge of badges) {
      await setDoc(doc(db, 'catalogBadges', badge.id), badge);
    }
  },

  async seedChests() {
    const chests: CatalogChest[] = [
      {
        id: 'chest_common',
        name: 'Coffre en Bois',
        description: 'Contient des sorts de base.',
        price: 50,
        currency: 'coins',
        icon: 'Package',
        possibleItems: ['spell_shield', 'spell_flashbang'],
        rarity: 'common',
        active: true
      }
    ];

    for (const chest of chests) {
      await setDoc(doc(db, 'catalogChests', chest.id), chest);
    }
  }
};
