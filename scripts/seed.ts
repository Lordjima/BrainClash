import { initDB, getDb, useMySQL } from '../src/lib/db';
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2/promise';

const categories = [
  { id: 'general', name: 'Culture Générale' },
  { id: 'gaming', name: 'Jeux Vidéo' },
  { id: 'science', name: 'Science & Nature' },
  { id: 'cinema', name: 'Cinéma & Séries' },
  { id: 'histoire', name: 'Histoire' }
];

const badges = [
  { id: 'first_game', name: 'Premier Pas', description: 'A joué sa première partie', icon: '🎮' },
  { id: 'veteran', name: 'Vétéran', description: 'A joué 10 parties', icon: '🎖️' },
  { id: 'expert', name: 'Expert', description: 'A joué 50 parties', icon: '🎓' },
  { id: 'champion', name: 'Champion', description: 'A fini premier d\'une partie', icon: '🏆' },
  { id: 'rich', name: 'Crésus', description: 'A accumulé 1000 pièces', icon: '💰' },
  { id: 'contributor', name: 'Contributeur', description: 'A proposé une question approuvée', icon: '✍️' }
];

const questions = [
  {
    category_id: 'general',
    text: 'Quel est le plus grand océan du monde ?',
    options: ['Océan Atlantique', 'Océan Indien', 'Océan Pacifique', 'Océan Arctique'],
    correctOptionIndex: 2
  },
  {
    category_id: 'general',
    text: 'Qui a peint la Joconde ?',
    options: ['Vincent van Gogh', 'Pablo Picasso', 'Léonard de Vinci', 'Claude Monet'],
    correctOptionIndex: 2
  },
  {
    category_id: 'gaming',
    text: 'Quel est le nom du protagoniste dans The Legend of Zelda ?',
    options: ['Zelda', 'Link', 'Ganon', 'Sheik'],
    correctOptionIndex: 1
  },
  {
    category_id: 'gaming',
    text: 'Quel studio a développé le jeu The Witcher 3 ?',
    options: ['Ubisoft', 'Bethesda', 'CD Projekt Red', 'Rockstar Games'],
    correctOptionIndex: 2
  },
  {
    category_id: 'science',
    text: 'Quelle est la planète la plus proche du Soleil ?',
    options: ['Vénus', 'Mars', 'Mercure', 'Jupiter'],
    correctOptionIndex: 2
  },
  {
    category_id: 'cinema',
    text: 'Qui a réalisé le film Inception ?',
    options: ['Steven Spielberg', 'Christopher Nolan', 'Quentin Tarantino', 'Martin Scorsese'],
    correctOptionIndex: 1
  }
];

async function seed() {
  try {
    const db = await getDb();
    console.log('Suppression des anciennes tables pour la restructuration...');
    const tablesToDrop = ['custom_questions', 'submit_questions', 'questions', 'user_badges', 'badges', 'categories', 'users', 'themes'];
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
        await (db as mysql.Pool).query('INSERT IGNORE INTO categories (id, name) VALUES (?, ?)', [cat.id, cat.name]);
      } else {
        (db as any).prepare('INSERT OR IGNORE INTO categories (id, name) VALUES (?, ?)').run(cat.id, cat.name);
      }
    }

    console.log('Insertion des badges...');
    for (const badge of badges) {
      if (useMySQL) {
        await (db as mysql.Pool).query('INSERT IGNORE INTO badges (id, name, description, icon) VALUES (?, ?, ?, ?)', [badge.id, badge.name, badge.description, badge.icon]);
      } else {
        (db as any).prepare('INSERT OR IGNORE INTO badges (id, name, description, icon) VALUES (?, ?, ?, ?)').run(badge.id, badge.name, badge.description, badge.icon);
      }
    }
    
    console.log('Insertion des questions...');
    for (const q of questions) {
      const id = uuidv4();
      if (useMySQL) {
        await (db as mysql.Pool).query(
          'INSERT INTO questions (id, category_id, text, options, correctOptionIndex, timeLimit, is_custom) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, q.category_id, q.text, JSON.stringify(q.options), q.correctOptionIndex, 15, false]
        );
      } else {
        (db as any).prepare(
          'INSERT INTO questions (id, category_id, text, options, correctOptionIndex, timeLimit, is_custom) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(id, q.category_id, q.text, JSON.stringify(q.options), q.correctOptionIndex, 15, 0);
      }
    }
    
    console.log('Base de données initialisée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    process.exit(1);
  }
}

seed();
