import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import dotenv from 'dotenv';
import { getThemesWithQuestions, addTheme, addQuestion } from './questions';

dotenv.config();

let mysqlPool: mysql.Pool | null = null;
let sqliteDb: Database | null = null;
let useMySQL = process.env.DB_HOST && process.env.DB_HOST !== '127.0.0.1' && process.env.DB_HOST !== 'localhost';

function translateSql(sql: string): string {
  if (useMySQL) return sql;
  
  let translated = sql
    .replace(/AUTO_INCREMENT/g, 'AUTOINCREMENT')
    .replace(/ JSON/g, ' TEXT')
    .replace(/ ENUM\([^)]+\)/g, ' TEXT')
    .replace(/ DATETIME/g, ' TEXT')
    .replace(/ BOOLEAN/g, ' INTEGER')
    .replace(/ ON UPDATE CURRENT_TIMESTAMP/g, '')
    .replace(/INSERT IGNORE/g, 'INSERT OR IGNORE');

  if (translated.includes('ON DUPLICATE KEY UPDATE')) {
    translated = translated.replace(
      /ON DUPLICATE KEY UPDATE\s+avatar = VALUES\(avatar\), score = VALUES\(score\), games_played = VALUES\(games_played\),\s+coins = VALUES\(coins\), xp = VALUES\(xp\), level = VALUES\(level\)/,
      'ON CONFLICT(username) DO UPDATE SET avatar = excluded.avatar, score = excluded.score, games_played = excluded.games_played, coins = excluded.coins, xp = excluded.xp, level = excluded.level'
    );
    
    translated = translated.replace(
      /ON DUPLICATE KEY UPDATE\s+avatar = VALUES\(avatar\), score = score \+ VALUES\(score\), games_played = games_played \+ 1, coins = coins \+ VALUES\(coins\)/,
      'ON CONFLICT(username) DO UPDATE SET avatar = excluded.avatar, score = score + excluded.score, games_played = games_played + 1, coins = coins + excluded.coins'
    );
    
    translated = translated.replace(
      /ON DUPLICATE KEY UPDATE xp = xp \+ VALUES\(xp\)/,
      'ON CONFLICT(username, badge_id) DO UPDATE SET xp = xp + excluded.xp'
    );
  }

  if (translated.includes('UNIX_TIMESTAMP')) {
    translated = translated.replace(/UNIX_TIMESTAMP\(([^)]+)\)/g, "strftime('%s', $1)");
  }

  if (translated.includes('NOW()')) {
    translated = translated.replace(/NOW\(\)/g, "CURRENT_TIMESTAMP");
  }

  return translated;
}

export async function query(sql: string, params: any[] = []): Promise<any[]> {
  try {
    if (useMySQL) {
      if (!mysqlPool) {
        mysqlPool = mysql.createPool({
          host: process.env.DB_HOST || '127.0.0.1',
          port: parseInt(process.env.DB_PORT || '3306'),
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'brainclash',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          connectTimeout: 5000
        });
      }
      const [rows] = await mysqlPool.query(sql, params);
      return rows as any[];
    }
  } catch (e: any) {
    console.warn("MySQL connection failed, falling back to SQLite:", e.message);
    useMySQL = false;
  }

  if (!sqliteDb) {
    sqliteDb = await open({
      filename: 'database.sqlite',
      driver: sqlite3.Database
    });
  }

  const translatedSql = translateSql(sql);
  
  if (translatedSql.trim().toUpperCase().startsWith('SELECT') || translatedSql.trim().toUpperCase().startsWith('PRAGMA')) {
    return await sqliteDb.all(translatedSql, params);
  } else {
    await sqliteDb.run(translatedSql, params);
    return [] as any[];
  }
}

export async function initDB() {
  try {
    console.log(`🚀 Initialisation de la base de données (${useMySQL ? 'MySQL' : 'SQLite'})...`);
    
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        username VARCHAR(191) PRIMARY KEY,
        avatar VARCHAR(255),
        score INT NOT NULL DEFAULT 0,
        games_played INT NOT NULL DEFAULT 0,
        last_played DATETIME DEFAULT CURRENT_TIMESTAMP,
        coins INT NOT NULL DEFAULT 0,
        brainCoins INT NOT NULL DEFAULT 0,
        level INT NOT NULL DEFAULT 1,
        xp INT NOT NULL DEFAULT 0,
        hp INT NOT NULL DEFAULT 100,
        maxHp INT NOT NULL DEFAULT 100,
        is_sub BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE
      )
    `.replace('INTEGER PRIMARY KEY AUTOINCREMENT', useMySQL ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'));

    await query(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INT NOT NULL,
        text TEXT NOT NULL,
        options JSON NOT NULL,
        correctOptionIndex INT NOT NULL,
        timeLimit INT NOT NULL DEFAULT 15,
        is_custom BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `.replace('INTEGER PRIMARY KEY AUTOINCREMENT', useMySQL ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'));

    await query(`
      CREATE TABLE IF NOT EXISTS submit_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INT NOT NULL,
        text TEXT NOT NULL,
        options JSON NOT NULL,
        correctOptionIndex INT NOT NULL,
        author VARCHAR(191) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (author) REFERENCES users(username) ON DELETE CASCADE
      )
    `.replace('INTEGER PRIMARY KEY AUTOINCREMENT', useMySQL ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'));

    await query(`
      CREATE TABLE IF NOT EXISTS valid_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_submit_id INT,
        category_id INT NOT NULL,
        text TEXT NOT NULL,
        options JSON NOT NULL,
        correctOptionIndex INT NOT NULL,
        author VARCHAR(191),
        approved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (author) REFERENCES users(username) ON DELETE SET NULL
      )
    `.replace('INTEGER PRIMARY KEY AUTOINCREMENT', useMySQL ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'));

    await query(`
      CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(255)
      )
    `.replace('INTEGER PRIMARY KEY AUTOINCREMENT', useMySQL ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'));

    await query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        username VARCHAR(191),
        badge_id INT,
        level INT NOT NULL DEFAULT 1,
        xp INT NOT NULL DEFAULT 0,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (username, badge_id),
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
        FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS quiz (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INT NOT NULL,
        timeLimit INT NOT NULL DEFAULT 15,
        created_by VARCHAR(191),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(username) ON DELETE SET NULL
      )
    `.replace('INTEGER PRIMARY KEY AUTOINCREMENT', useMySQL ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'));

    await query(`
      CREATE TABLE IF NOT EXISTS shop_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price INT NOT NULL,
        currency ENUM('coins', 'brainCoins') DEFAULT 'coins',
        icon VARCHAR(255),
        type ENUM('attack', 'defense', 'bonus', 'cosmetic') NOT NULL
      )
    `.replace('INTEGER PRIMARY KEY AUTOINCREMENT', useMySQL ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'));

    await query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(191) NOT NULL,
        item_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE
      )
    `.replace('INTEGER PRIMARY KEY AUTOINCREMENT', useMySQL ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'));

    await query(`
      CREATE TABLE IF NOT EXISTS auction_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller VARCHAR(191) NOT NULL,
        item_id INT NOT NULL,
        price INT NOT NULL,
        currency ENUM('coins', 'brainCoins') DEFAULT 'coins',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller) REFERENCES users(username) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE
      )
    `.replace('INTEGER PRIMARY KEY AUTOINCREMENT', useMySQL ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'));

    await seedData();

    console.log(`✅ Base de données initialisée avec succès`);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de la base de données:", error);
  }
}

async function seedData() {
  try {
    const badges = [
      { id: 'first_game', name: 'Première Partie', description: 'A joué sa première partie', icon: 'Award' },
      { id: 'veteran', name: 'Vétéran', description: 'A joué 10 parties', icon: 'Shield' },
      { id: 'expert', name: 'Expert', description: 'A joué 50 parties', icon: 'Zap' },
      { id: 'champion', name: 'Champion', description: 'A gagné une partie', icon: 'Star' }
    ];

    for (const badge of badges) {
      await query('INSERT IGNORE INTO badges (name, description, icon) VALUES (?, ?, ?)', [badge.name, badge.description, badge.icon]);
    }

    const shopItems = [
      { id: 'fumigene', name: 'Fumigène', description: 'Floute l\'écran des adversaires pendant 5s', price: 50, icon: 'EyeOff', type: 'attack' },
      { id: 'seisme', name: 'Séisme', description: 'Fait trembler l\'écran des adversaires', price: 75, icon: 'Zap', type: 'attack' },
      { id: 'inversion', name: 'Inversion', description: 'Met l\'écran des adversaires à l\'envers', price: 100, icon: 'RefreshCcw', type: 'attack' },
      { id: 'bouclier', name: 'Bouclier', description: 'Protège contre la prochaine attaque', price: 50, icon: 'Shield', type: 'defense' }
    ];

    for (const item of shopItems) {
      await query('INSERT IGNORE INTO shop_items (name, description, price, icon, type) VALUES (?, ?, ?, ?, ?)', [item.name, item.description, item.price, item.icon, item.type]);
    }

    const themes = await getThemesWithQuestions();
    if (Object.keys(themes).length === 0) {
      await addTheme('Culture Générale');
      await addQuestion({
        id: 'q1',
        text: 'Quelle est la capitale de la France ?',
        options: ['Londres', 'Berlin', 'Paris', 'Madrid'],
        correctOptionIndex: 2,
        timeLimit: 15
      }, 1, false);
      
      await addTheme('Science');
      await addQuestion({
        id: 'q2',
        text: 'Quel est le symbole chimique de l\'eau ?',
        options: ['CO2', 'H2O', 'O2', 'NaCl'],
        correctOptionIndex: 1,
        timeLimit: 15
      }, 2, false);
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}
