import { initDB, getDb, useMySQL } from '../src/lib/db';
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2/promise';

const categories = [
  { name: 'Culture Générale' },
  { name: 'Jeux Vidéo' },
  { name: 'Science & Nature' },
  { name: 'Cinéma & Séries' },
  { name: 'Histoire' },
  { name: 'Manga & Anime' },
  { name: 'Sport' }
];

const badges = [
  { name: 'Premier Pas', description: 'A joué sa première partie', icon: '🎮' },
  { name: 'Vétéran', description: 'A joué 10 parties', icon: '🎖️' },
  { name: 'Expert', description: 'A joué 50 parties', icon: '🎓' },
  { name: 'Champion', description: 'A fini premier d\'une partie', icon: '🏆' },
  { name: 'Crésus', description: 'A accumulé 1000 pièces', icon: '💰' },
  { name: 'Contributeur', description: 'A proposé une question approuvée', icon: '✍️' }
];

const shopItems = [
  { name: 'Bouclier en Bois', description: 'Protège contre une attaque mineure', price: 50, icon: '🛡️', type: 'defense' },
  { name: 'Bouclier en Fer', description: 'Protège contre une attaque moyenne', price: 150, icon: '🛡️', type: 'defense' },
  { name: 'Potion de Soin', description: 'Restaure 25 HP', price: 30, icon: '🧪', type: 'bonus' },
  { name: 'Grande Potion', description: 'Restaure 50 HP', price: 70, icon: '🧪', type: 'bonus' },
  { name: 'Petite Bombe', description: 'Inflige 10 dégâts à un adversaire', price: 100, icon: '💣', type: 'attack' },
  { name: 'Glace', description: 'Gèle un adversaire pendant 5 secondes', price: 200, icon: '❄️', type: 'attack' }
];

const questions = [
  {
    category_id: 1,
    text: 'Quel est le plus grand océan du monde ?',
    options: ['Océan Atlantique', 'Océan Indien', 'Océan Pacifique', 'Océan Arctique'],
    correctOptionIndex: 2
  },
  {
    category_id: 1,
    text: 'Qui a peint la Joconde ?',
    options: ['Vincent van Gogh', 'Pablo Picasso', 'Léonard de Vinci', 'Claude Monet'],
    correctOptionIndex: 2
  },
  {
    category_id: 2,
    text: 'Quel est le nom du protagoniste dans The Legend of Zelda ?',
    options: ['Zelda', 'Link', 'Ganon', 'Sheik'],
    correctOptionIndex: 1
  },
  {
    category_id: 2,
    text: 'Quel studio a développé le jeu The Witcher 3 ?',
    options: ['Ubisoft', 'Bethesda', 'CD Projekt Red', 'Rockstar Games'],
    correctOptionIndex: 2
  },
  {
    category_id: 3,
    text: 'Quelle est la planète la plus proche du Soleil ?',
    options: ['Vénus', 'Mars', 'Mercure', 'Jupiter'],
    correctOptionIndex: 2
  },
  {
    category_id: 4,
    text: 'Qui a réalisé le film Inception ?',
    options: ['Steven Spielberg', 'Christopher Nolan', 'Quentin Tarantino', 'Martin Scorsese'],
    correctOptionIndex: 1
  },
  {
    category_id: 6,
    text: 'Dans Naruto, quel est le nom du démon renard à neuf queues ?',
    options: ['Shukaku', 'Matatabi', 'Kurama', 'Gyuki'],
    correctOptionIndex: 2
  },
  {
    category_id: 7,
    text: 'Combien de joueurs y a-t-il dans une équipe de football sur le terrain ?',
    options: ['9', '10', '11', '12'],
    correctOptionIndex: 2
  }
];

async function seed() {
  try {
    const db = await getDb();
    console.log('Suppression des anciennes tables pour la restructuration...');
    const tablesToDrop = ['custom_questions', 'submit_questions', 'questions', 'user_badges', 'badges', 'categories', 'users', 'themes', 'shop_items', 'auction_items'];
    for (const table of tablesToDrop) {
      try {
        if (useMySQL) {
          await (db as mysql.Pool).query(`DROP TABLE IF EXISTS ${table}`);
        } else {
          (db as any).prepare(`DROP TABLE IF EXISTS ${table}`).run();
        }
      } catch (e) {
        console.warn(`Could not drop table ${table}:`, e);
      }
    }

    console.log('Initialisation de la base de données avec le nouveau schéma...');
    await initDB();

    console.log('Insertion des catégories...');
    for (const cat of categories) {
      if (useMySQL) {
        await (db as mysql.Pool).query('INSERT IGNORE INTO categories (name) VALUES (?)', [cat.name]);
      } else {
        (db as any).prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(cat.name);
      }
    }

    console.log('Insertion des badges...');
    for (const badge of badges) {
      if (useMySQL) {
        await (db as mysql.Pool).query('INSERT IGNORE INTO badges (name, description, icon) VALUES (?, ?, ?)', [badge.name, badge.description, badge.icon]);
      } else {
        (db as any).prepare('INSERT OR IGNORE INTO badges (name, description, icon) VALUES (?, ?, ?)').run(badge.name, badge.description, badge.icon);
      }
    }
    
    console.log('Insertion des objets de la boutique...');
    for (const item of shopItems) {
      if (useMySQL) {
        await (db as mysql.Pool).query('INSERT IGNORE INTO shop_items (name, description, price, icon, type) VALUES (?, ?, ?, ?, ?)', [item.name, item.description, item.price, item.icon, item.type]);
      } else {
        (db as any).prepare('INSERT OR IGNORE INTO shop_items (name, description, price, icon, type) VALUES (?, ?, ?, ?, ?)').run(item.name, item.description, item.price, item.icon, item.type);
      }
    }
    
    console.log('Insertion des questions...');
    for (const q of questions) {
      if (useMySQL) {
        await (db as mysql.Pool).query(
          'INSERT INTO questions (category_id, text, options, correctOptionIndex, timeLimit, is_custom) VALUES (?, ?, ?, ?, ?, ?)',
          [q.category_id, q.text, JSON.stringify(q.options), q.correctOptionIndex, 15, false]
        );
      } else {
        (db as any).prepare(
          'INSERT INTO questions (category_id, text, options, correctOptionIndex, timeLimit, is_custom) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(q.category_id, q.text, JSON.stringify(q.options), q.correctOptionIndex, 15, 0);
      }
    }
    
    console.log('Création du compte de test JimaG4ming avec des crédits...');
    const testUser = {
      username: 'JimaG4ming',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JimaG4ming',
      score: 1500,
      games_played: 10,
      coins: 5000,
      brainCoins: 1000,
      level: 5,
      xp: 2500,
      hp: 100,
      maxHp: 100,
      is_sub: true,
      inventory: JSON.stringify([1, 1, 3, 3, 3, 3, 3])
    };
    
    if (useMySQL) {
      await (db as mysql.Pool).query(
        'INSERT IGNORE INTO users (username, avatar, score, games_played, coins, brainCoins, level, xp, hp, maxHp, is_sub, inventory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [testUser.username, testUser.avatar, testUser.score, testUser.games_played, testUser.coins, testUser.brainCoins, testUser.level, testUser.xp, testUser.hp, testUser.maxHp, testUser.is_sub, testUser.inventory]
      );
    } else {
      (db as any).prepare(
        'INSERT OR IGNORE INTO users (username, avatar, score, games_played, coins, brainCoins, level, xp, hp, maxHp, is_sub, inventory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(testUser.username, testUser.avatar, testUser.score, testUser.games_played, testUser.coins, testUser.brainCoins, testUser.level, testUser.xp, testUser.hp, testUser.maxHp, testUser.is_sub ? 1 : 0, testUser.inventory);
    }

    console.log('Base de données initialisée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    process.exit(1);
  }
}

seed();
