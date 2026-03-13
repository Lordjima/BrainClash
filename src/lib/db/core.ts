import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { getThemesWithQuestions, addTheme, addQuestion } from './questions';

dotenv.config();

let mysqlPool: mysql.Pool | null = null;

export async function query(sql: string, params: any[] = []): Promise<any[]> {
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

export async function initDB() {
  try {
    console.log(`🚀 Initialisation de la base de données (MySQL)...`);
    
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
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        text TEXT NOT NULL,
        options JSON NOT NULL,
        correctOptionIndex INT NOT NULL,
        timeLimit INT NOT NULL DEFAULT 15,
        is_custom BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS submit_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
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
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS valid_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
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
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS badges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(255)
      )
    `);

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
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INT NOT NULL,
        timeLimit INT NOT NULL DEFAULT 15,
        created_by VARCHAR(191),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(username) ON DELETE SET NULL
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS shop_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price INT NOT NULL,
        currency ENUM('coins', 'brainCoins') DEFAULT 'coins',
        icon VARCHAR(255),
        type ENUM('attack', 'defense', 'bonus', 'cosmetic') NOT NULL
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(191) NOT NULL,
        item_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS auction_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller VARCHAR(191) NOT NULL,
        item_id INT NOT NULL,
        price INT NOT NULL,
        currency ENUM('coins', 'brainCoins') DEFAULT 'coins',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller) REFERENCES users(username) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE
      )
    `);

    await seedData();

    console.log(`✅ Base de données initialisée avec succès`);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de la base de données:", error);
    throw error; // Re-throw to ensure the app fails if MySQL fails
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
    throw error;
  }
}
