import { getDb, initDB, useMySQL } from '../src/lib/db';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';

const categories = [
  { id: 'culture-generale', name: 'Culture Générale' },
  { id: 'jeux-video', name: 'Jeux Vidéo' },
  { id: 'science-nature', name: 'Science & Nature' },
  { id: 'cinema-series', name: 'Cinéma & Séries' },
  { id: 'histoire', name: 'Histoire' },
  { id: 'manga-anime', name: 'Manga & Anime' },
  { id: 'sport', name: 'Sport' },
] as const;

const badges = [
  { id: 'first_game', name: 'Premier Pas', description: 'A joué sa première partie', icon: '🎮' },
  { id: 'veteran', name: 'Vétéran', description: 'A joué 10 parties', icon: '🎖️' },
  { id: 'expert', name: 'Expert', description: 'A joué 50 parties', icon: '🎓' },
  { id: 'champion', name: 'Champion', description: "A fini premier d'une partie", icon: '🏆' },
  { id: 'cresus', name: 'Crésus', description: 'A accumulé 1000 pièces', icon: '💰' },
  { id: 'contributeur', name: 'Contributeur', description: 'A proposé une question approuvée', icon: '✍️' },
] as const;

const shopItems = [
  { id: 'bouclier-bois', name: 'Bouclier en Bois', description: 'Protège contre une attaque mineure', price: 50, icon: '🛡️', type: 'defense' },
  { id: 'bouclier-fer', name: 'Bouclier en Fer', description: 'Protège contre une attaque moyenne', price: 150, icon: '🛡️', type: 'defense' },
  { id: 'potion-soin', name: 'Potion de Soin', description: 'Restaure 25 HP', price: 30, icon: '🧪', type: 'bonus' },
  { id: 'grande-potion', name: 'Grande Potion', description: 'Restaure 50 HP', price: 70, icon: '🧪', type: 'bonus' },
  { id: 'petite-bombe', name: 'Petite Bombe', description: 'Inflige 10 dégâts à un adversaire', price: 100, icon: '💣', type: 'attack' },
  { id: 'glace', name: 'Glace', description: 'Gèle un adversaire pendant 5 secondes', price: 200, icon: '❄️', type: 'attack' },
] as const;

const questions = [
  {
    category_id: 'culture-generale',
    text: 'Quel est le plus grand océan du monde ?',
    options: ['Océan Atlantique', 'Océan Indien', 'Océan Pacifique', 'Océan Arctique'],
    correctOptionIndex: 2,
  },
  {
    category_id: 'culture-generale',
    text: 'Qui a peint la Joconde ?',
    options: ['Vincent van Gogh', 'Pablo Picasso', 'Léonard de Vinci', 'Claude Monet'],
    correctOptionIndex: 2,
  },
  {
    category_id: 'jeux-video',
    text: 'Quel est le nom du protagoniste dans The Legend of Zelda ?',
    options: ['Zelda', 'Link', 'Ganon', 'Sheik'],
    correctOptionIndex: 1,
  },
  {
    category_id: 'jeux-video',
    text: 'Quel studio a développé le jeu The Witcher 3 ?',
    options: ['Ubisoft', 'Bethesda', 'CD Projekt Red', 'Rockstar Games'],
    correctOptionIndex: 2,
  },
  {
    category_id: 'science-nature',
    text: 'Quelle est la planète la plus proche du Soleil ?',
    options: ['Vénus', 'Mars', 'Mercure', 'Jupiter'],
    correctOptionIndex: 2,
  },
  {
    category_id: 'cinema-series',
    text: 'Qui a réalisé le film Inception ?',
    options: ['Steven Spielberg', 'Christopher Nolan', 'Quentin Tarantino', 'Martin Scorsese'],
    correctOptionIndex: 1,
  },
  {
    category_id: 'manga-anime',
    text: 'Dans Naruto, quel est le nom du démon renard à neuf queues ?',
    options: ['Shukaku', 'Matatabi', 'Kurama', 'Gyuki'],
    correctOptionIndex: 2,
  },
  {
    category_id: 'sport',
    text: "Combien de joueurs y a-t-il dans une équipe de football sur le terrain ?",
    options: ['9', '10', '11', '12'],
    correctOptionIndex: 2,
  },
] as const;

async function dropTables(db: mysql.Pool | Database.Database) {
  const tablesToDrop = [
    'auction_items',
    'submit_questions',
    'user_badges',
    'questions',
    'shop_items',
    'badges',
    'categories',
    'users',
  ];

  if (useMySQL) {
    await (db as mysql.Pool).query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of tablesToDrop) {
      await (db as mysql.Pool).query(`DROP TABLE IF EXISTS ${table}`);
    }
    await (db as mysql.Pool).query('SET FOREIGN_KEY_CHECKS = 1');
    return;
  }

  const sqlite = db as Database.Database;
  sqlite.exec('PRAGMA foreign_keys = OFF;');
  for (const table of tablesToDrop) {
    sqlite.prepare(`DROP TABLE IF EXISTS ${table}`).run();
  }
  sqlite.exec('PRAGMA foreign_keys = ON;');
}

async function seed() {
  try {
    const db = await getDb();

    console.log('Suppression des anciennes tables pour la restructuration...');
    await dropTables(db as mysql.Pool | Database.Database);

    console.log('Initialisation de la base de données avec le nouveau schéma...');
    await initDB();

    console.log('Insertion des catégories...');
    for (const cat of categories) {
      if (useMySQL) {
        await (db as mysql.Pool).query(
          'INSERT INTO categories (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
          [cat.id, cat.name],
        );
      } else {
        (db as Database.Database)
          .prepare('INSERT INTO categories (id, name) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name')
          .run(cat.id, cat.name);
      }
    }

    console.log('Insertion des badges...');
    for (const badge of badges) {
      if (useMySQL) {
        await (db as mysql.Pool).query(
          'INSERT INTO badges (id, name, description, icon) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), icon = VALUES(icon)',
          [badge.id, badge.name, badge.description, badge.icon],
        );
      } else {
        (db as Database.Database)
          .prepare('INSERT INTO badges (id, name, description, icon) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, icon = excluded.icon')
          .run(badge.id, badge.name, badge.description, badge.icon);
      }
    }

    console.log('Insertion des objets de la boutique...');
    for (const item of shopItems) {
      if (useMySQL) {
        await (db as mysql.Pool).query(
          'INSERT INTO shop_items (id, name, description, price, icon, type) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), price = VALUES(price), icon = VALUES(icon), type = VALUES(type)',
          [item.id, item.name, item.description, item.price, item.icon, item.type],
        );
      } else {
        (db as Database.Database)
          .prepare('INSERT INTO shop_items (id, name, description, price, icon, type) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, price = excluded.price, icon = excluded.icon, type = excluded.type')
          .run(item.id, item.name, item.description, item.price, item.icon, item.type);
      }
    }

    console.log('Insertion des questions...');
    for (const q of questions) {
      if (useMySQL) {
        await (db as mysql.Pool).query(
          'INSERT INTO questions (category_id, text, options, correctOptionIndex, timeLimit, is_custom) VALUES (?, ?, ?, ?, ?, ?)',
          [q.category_id, q.text, JSON.stringify(q.options), q.correctOptionIndex, 15, false],
        );
      } else {
        (db as Database.Database)
          .prepare('INSERT INTO questions (category_id, text, options, correctOptionIndex, timeLimit, is_custom) VALUES (?, ?, ?, ?, ?, ?)')
          .run(q.category_id, q.text, JSON.stringify(q.options), q.correctOptionIndex, 15, 0);
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
      inventory: JSON.stringify(['bouclier-bois', 'bouclier-fer', 'potion-soin', 'potion-soin', 'grande-potion', 'petite-bombe', 'glace']),
    };

    if (useMySQL) {
      await (db as mysql.Pool).query(
        'INSERT INTO users (username, avatar, score, games_played, coins, brainCoins, level, xp, hp, maxHp, is_sub, inventory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE avatar = VALUES(avatar), score = VALUES(score), games_played = VALUES(games_played), coins = VALUES(coins), brainCoins = VALUES(brainCoins), level = VALUES(level), xp = VALUES(xp), hp = VALUES(hp), maxHp = VALUES(maxHp), is_sub = VALUES(is_sub), inventory = VALUES(inventory)',
        [testUser.username, testUser.avatar, testUser.score, testUser.games_played, testUser.coins, testUser.brainCoins, testUser.level, testUser.xp, testUser.hp, testUser.maxHp, testUser.is_sub, testUser.inventory],
      );
    } else {
      (db as Database.Database)
        .prepare('INSERT INTO users (username, avatar, score, games_played, coins, brainCoins, level, xp, hp, maxHp, is_sub, inventory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(username) DO UPDATE SET avatar = excluded.avatar, score = excluded.score, games_played = excluded.games_played, coins = excluded.coins, brainCoins = excluded.brainCoins, level = excluded.level, xp = excluded.xp, hp = excluded.hp, maxHp = excluded.maxHp, is_sub = excluded.is_sub, inventory = excluded.inventory')
        .run(testUser.username, testUser.avatar, testUser.score, testUser.games_played, testUser.coins, testUser.brainCoins, testUser.level, testUser.xp, testUser.hp, testUser.maxHp, testUser.is_sub ? 1 : 0, testUser.inventory);
    }

    console.log('Base de données initialisée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données:", error);
    process.exit(1);
  }
}

seed();
