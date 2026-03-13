import mysql from 'mysql2/promise';
import { getDb, initDB, useMySQL } from '../src/lib/db';

const categories = [
  { id: 'culture-generale', name: 'Culture Générale' },
  { id: 'jeux-video', name: 'Jeux Vidéo' },
  { id: 'science-nature', name: 'Science & Nature' },
  { id: 'cinema-series', name: 'Cinéma & Séries' },
  { id: 'histoire', name: 'Histoire' },
  { id: 'manga-anime', name: 'Manga & Anime' },
  { id: 'sport', name: 'Sport' },
];

const badges = [
  { id: 'first-game', name: 'Premier Pas', description: 'A joué sa première partie', icon: 'Award' },
  { id: 'veteran', name: 'Vétéran', description: 'A joué 10 parties', icon: 'Shield' },
  { id: 'expert', name: 'Expert', description: 'A joué 50 parties', icon: 'Zap' },
  { id: 'champion', name: 'Champion', description: 'A fini premier d'une partie', icon: 'Star' },
  { id: 'wealthy', name: 'Crésus', description: 'A accumulé 1000 pièces', icon: 'Coins' },
  { id: 'contributor', name: 'Contributeur', description: 'A proposé une question approuvée', icon: 'PenTool' },
];

const shopItems = [
  { id: 'bouclier-bois', name: 'Bouclier en Bois', description: 'Protège contre une attaque mineure', price: 50, icon: 'Shield', type: 'defense' },
  { id: 'bouclier-fer', name: 'Bouclier en Fer', description: 'Protège contre une attaque moyenne', price: 150, icon: 'Shield', type: 'defense' },
  { id: 'potion-soin', name: 'Potion de Soin', description: 'Restaure 25 HP', price: 30, icon: 'Heart', type: 'bonus' },
  { id: 'grande-potion', name: 'Grande Potion', description: 'Restaure 50 HP', price: 70, icon: 'Heart', type: 'bonus' },
  { id: 'petite-bombe', name: 'Petite Bombe', description: 'Inflige 10 dégâts à un adversaire', price: 100, icon: 'Bomb', type: 'attack' },
  { id: 'glace', name: 'Glace', description: 'Gèle un adversaire pendant 5 secondes', price: 200, icon: 'Snowflake', type: 'attack' },
];

const questions = [
  { category_id: 'culture-generale', text: 'Quel est le plus grand océan du monde ?', options: ['Océan Atlantique', 'Océan Indien', 'Océan Pacifique', 'Océan Arctique'], correctOptionIndex: 2 },
  { category_id: 'culture-generale', text: 'Qui a peint la Joconde ?', options: ['Vincent van Gogh', 'Pablo Picasso', 'Léonard de Vinci', 'Claude Monet'], correctOptionIndex: 2 },
  { category_id: 'jeux-video', text: 'Quel est le nom du protagoniste dans The Legend of Zelda ?', options: ['Zelda', 'Link', 'Ganon', 'Sheik'], correctOptionIndex: 1 },
  { category_id: 'jeux-video', text: 'Quel studio a développé le jeu The Witcher 3 ?', options: ['Ubisoft', 'Bethesda', 'CD Projekt Red', 'Rockstar Games'], correctOptionIndex: 2 },
  { category_id: 'science-nature', text: 'Quelle est la planète la plus proche du Soleil ?', options: ['Vénus', 'Mars', 'Mercure', 'Jupiter'], correctOptionIndex: 2 },
  { category_id: 'cinema-series', text: 'Qui a réalisé le film Inception ?', options: ['Steven Spielberg', 'Christopher Nolan', 'Quentin Tarantino', 'Martin Scorsese'], correctOptionIndex: 1 },
  { category_id: 'manga-anime', text: 'Dans Naruto, quel est le nom du démon renard à neuf queues ?', options: ['Shukaku', 'Matatabi', 'Kurama', 'Gyuki'], correctOptionIndex: 2 },
  { category_id: 'sport', text: 'Combien de joueurs y a-t-il dans une équipe de football sur le terrain ?', options: ['9', '10', '11', '12'], correctOptionIndex: 2 },
];

async function dropTables(db: unknown) {
  const tables = ['custom_questions', 'submit_questions', 'questions', 'user_badges', 'auction_items', 'shop_items', 'badges', 'categories', 'users'];
  if (useMySQL) {
    const pool = db as mysql.Pool;
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of tables) await pool.query(`DROP TABLE IF EXISTS ${table}`);
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  } else {
    for (const table of tables) (db as any).prepare(`DROP TABLE IF EXISTS ${table}`).run();
  }
}

async function seed() {
  try {
    const db = await getDb();
    console.log('Suppression des anciennes tables...');
    await dropTables(db);

    console.log('Initialisation de la base de données...');
    await initDB();
    const seededDb = await getDb();

    console.log('Insertion des catégories...');
    for (const category of categories) {
      if (useMySQL) {
        await (seededDb as mysql.Pool).query('INSERT INTO categories (id, name) VALUES (?, ?)', [category.id, category.name]);
      } else {
        (seededDb as any).prepare('INSERT INTO categories (id, name) VALUES (?, ?)').run(category.id, category.name);
      }
    }

    console.log('Insertion des badges...');
    for (const badge of badges) {
      if (useMySQL) {
        await (seededDb as mysql.Pool).query('INSERT INTO badges (id, name, description, icon) VALUES (?, ?, ?, ?)', [badge.id, badge.name, badge.description, badge.icon]);
      } else {
        (seededDb as any).prepare('INSERT INTO badges (id, name, description, icon) VALUES (?, ?, ?, ?)').run(badge.id, badge.name, badge.description, badge.icon);
      }
    }

    console.log('Insertion des objets de la boutique...');
    for (const item of shopItems) {
      if (useMySQL) {
        await (seededDb as mysql.Pool).query('INSERT INTO shop_items (id, name, description, price, icon, type) VALUES (?, ?, ?, ?, ?, ?)', [item.id, item.name, item.description, item.price, item.icon, item.type]);
      } else {
        (seededDb as any).prepare('INSERT INTO shop_items (id, name, description, price, icon, type) VALUES (?, ?, ?, ?, ?, ?)').run(item.id, item.name, item.description, item.price, item.icon, item.type);
      }
    }

    console.log('Insertion des questions...');
    for (const question of questions) {
      if (useMySQL) {
        await (seededDb as mysql.Pool).query('INSERT INTO questions (category_id, text, options, correctOptionIndex, timeLimit, is_custom) VALUES (?, ?, ?, ?, ?, ?)', [question.category_id, question.text, JSON.stringify(question.options), question.correctOptionIndex, 15, false]);
      } else {
        (seededDb as any).prepare('INSERT INTO questions (category_id, text, options, correctOptionIndex, timeLimit, is_custom) VALUES (?, ?, ?, ?, ?, ?)').run(question.category_id, question.text, JSON.stringify(question.options), question.correctOptionIndex, 15, 0);
      }
    }

    console.log('Création du compte de test...');
    const inventory = JSON.stringify(['bouclier-bois', 'bouclier-bois', 'potion-soin', 'petite-bombe']);
    if (useMySQL) {
      await (seededDb as mysql.Pool).query('INSERT INTO users (username, avatar, score, games_played, coins, brainCoins, level, xp, hp, maxHp, is_sub, inventory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ['JimaG4ming', 'https://api.dicebear.com/7.x/avataaars/svg?seed=JimaG4ming', 1500, 10, 5000, 1000, 5, 2500, 100, 100, true, inventory]);
      await (seededDb as mysql.Pool).query('INSERT INTO user_badges (username, badge_id, level, xp) VALUES (?, ?, ?, ?), (?, ?, ?, ?)', ['JimaG4ming', 'first-game', 1, 20, 'JimaG4ming', 'champion', 1, 50]);
    } else {
      (seededDb as any).prepare('INSERT INTO users (username, avatar, score, games_played, coins, brainCoins, level, xp, hp, maxHp, is_sub, inventory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run('JimaG4ming', 'https://api.dicebear.com/7.x/avataaars/svg?seed=JimaG4ming', 1500, 10, 5000, 1000, 5, 2500, 100, 100, 1, inventory);
      (seededDb as any).prepare('INSERT INTO user_badges (username, badge_id, level, xp) VALUES (?, ?, ?, ?), (?, ?, ?, ?)').run('JimaG4ming', 'first-game', 1, 20, 'JimaG4ming', 'champion', 1, 50);
    }

    console.log('Base de données initialisée avec succès.');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l'initialisation de la base de données:', error);
    process.exit(1);
  }
}

seed();
