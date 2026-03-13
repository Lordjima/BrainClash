import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import dotenv from 'dotenv';
import type { GlobalLeaderboardEntry, SubmittedQuestion, Question, Theme } from '../types';

dotenv.config();

let mysqlPool: mysql.Pool | null = null;
let sqliteDb: Database | null = null;
let useMySQL = process.env.DB_HOST && process.env.DB_HOST !== '127.0.0.1' && process.env.DB_HOST !== 'localhost';

// Helper to translate MySQL queries to SQLite
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

      // Translate ON DUPLICATE KEY UPDATE for saveUserProfile
      if (translated.includes('ON DUPLICATE KEY UPDATE')) {
        translated = translated.replace(
          /ON DUPLICATE KEY UPDATE\s+avatar = VALUES\(avatar\), score = VALUES\(score\), games_played = VALUES\(games_played\),\s+coins = VALUES\(coins\), xp = VALUES\(xp\), level = VALUES\(level\)/,
          'ON CONFLICT(username) DO UPDATE SET avatar = excluded.avatar, score = excluded.score, games_played = excluded.games_played, coins = excluded.coins, xp = excluded.xp, level = excluded.level'
        );
        
        // For batchUpdateUserProfiles
        translated = translated.replace(
          /ON DUPLICATE KEY UPDATE\s+avatar = VALUES\(avatar\), score = score \+ VALUES\(score\), games_played = games_played \+ 1, coins = coins \+ VALUES\(coins\)/,
          'ON CONFLICT(username) DO UPDATE SET avatar = excluded.avatar, score = score + excluded.score, games_played = games_played + 1, coins = coins + excluded.coins'
        );
        
        // For awardBadgeXp
        translated = translated.replace(
          /ON DUPLICATE KEY UPDATE xp = xp \+ VALUES\(xp\)/,
          'ON CONFLICT(username, badge_id) DO UPDATE SET xp = xp + excluded.xp'
        );
      }

      // Translate UNIX_TIMESTAMP
      if (translated.includes('UNIX_TIMESTAMP')) {
        translated = translated.replace(/UNIX_TIMESTAMP\(([^)]+)\)/g, "strftime('%s', $1)");
      }

      // Translate NOW()
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

  // SQLite Fallback
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
    const result = await sqliteDb.run(translatedSql, params);
    return [] as any[]; // Return empty array for inserts/updates to match mysql signature expectation in most places
  }
}

export async function initDB() {
  try {
    console.log(`🚀 Initialisation de la base de données (${useMySQL ? 'MySQL' : 'SQLite'})...`);
    
    // 1. users
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

    // 2. categories
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE
      )
    `.replace('INTEGER PRIMARY KEY AUTOINCREMENT', useMySQL ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'));

    // 3. questions
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

    // 4. submit_questions
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

    // 5. valid_questions
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

    // 6. badges
    await query(`
      CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(255)
      )
    `.replace('INTEGER PRIMARY KEY AUTOINCREMENT', useMySQL ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'));

    // user_badges (junction)
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

    // 7. quiz
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

    // 8. shop_items
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

    // 9. inventory_items
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

    // 10. auction_items
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
    // Seed Badges
    const badges = [
      { id: 'first_game', name: 'Première Partie', description: 'A joué sa première partie', icon: 'Award' },
      { id: 'veteran', name: 'Vétéran', description: 'A joué 10 parties', icon: 'Shield' },
      { id: 'expert', name: 'Expert', description: 'A joué 50 parties', icon: 'Zap' },
      { id: 'champion', name: 'Champion', description: 'A gagné une partie', icon: 'Star' }
    ];

    for (const badge of badges) {
      await query('INSERT IGNORE INTO badges (name, description, icon) VALUES (?, ?, ?)', [badge.name, badge.description, badge.icon]);
    }

    // Seed Shop Items
    const shopItems = [
      { id: 'fumigene', name: 'Fumigène', description: 'Floute l\'écran des adversaires pendant 5s', price: 50, icon: 'EyeOff', type: 'attack' },
      { id: 'seisme', name: 'Séisme', description: 'Fait trembler l\'écran des adversaires', price: 75, icon: 'Zap', type: 'attack' },
      { id: 'inversion', name: 'Inversion', description: 'Met l\'écran des adversaires à l\'envers', price: 100, icon: 'RefreshCcw', type: 'attack' },
      { id: 'bouclier', name: 'Bouclier', description: 'Protège contre la prochaine attaque', price: 50, icon: 'Shield', type: 'defense' }
    ];

    for (const item of shopItems) {
      await query('INSERT IGNORE INTO shop_items (name, description, price, icon, type) VALUES (?, ?, ?, ?, ?)', [item.name, item.description, item.price, item.icon, item.type]);
    }

    // Seed some default categories and questions if empty
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

export async function getShopItems(): Promise<any[]> {
  try {
    return await query('SELECT * FROM shop_items');
  } catch (error) {
    console.error('Error fetching shop items:', error);
    return [];
  }
}

export async function getThemesWithQuestions(): Promise<Record<string, Theme>> {
  try {
    const categories = await query('SELECT * FROM categories');
    const questions = await query('SELECT * FROM questions');
    
    const themes: Record<string, Theme> = {};
    
    for (const cat of categories) {
      themes[cat.name] = {
        id: cat.id,
        name: cat.name,
        questions: questions
          .filter((q: any) => q.category_id === cat.id)
          .map((q: any) => ({
            id: q.id,
            text: q.text,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
            correctOptionIndex: q.correctOptionIndex,
            timeLimit: q.timeLimit
          }))
      };
    }
    
    return themes;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {};
  }
}

export async function addTheme(name: string): Promise<number | null> {
  try {
    await query('INSERT INTO categories (name) VALUES (?)', [name]);
    const rows = await query(useMySQL ? 'SELECT LAST_INSERT_ID() as id' : 'SELECT last_insert_rowid() as id');
    return rows[0].id;
  } catch (error) {
    console.error('Error adding theme:', error);
    return null;
  }
}

export async function addQuestion(q: Question, categoryId: string | number, isCustom: boolean = true) {
  try {
    await query(
      'INSERT INTO questions (category_id, text, options, correctOptionIndex, timeLimit, is_custom) VALUES (?, ?, ?, ?, ?, ?)',
      [categoryId, q.text, JSON.stringify(q.options), q.correctOptionIndex, q.timeLimit, isCustom ? 1 : 0]
    );
  } catch (error) {
    console.error('Error adding question:', error);
  }
}

export async function getLeaderboard(): Promise<GlobalLeaderboardEntry[]> {
  try {
    const rows = await query(`
        SELECT u.username, u.avatar, u.score, u.games_played, UNIX_TIMESTAMP(u.last_played) * 1000 as date, 
        u.coins, u.brainCoins, u.level, u.xp, u.is_sub,
        GROUP_CONCAT(DISTINCT ub.badge_id) as badges,
        GROUP_CONCAT(DISTINCT ii.item_id) as inventory
        FROM users u
        LEFT JOIN user_badges ub ON u.username = ub.username
        LEFT JOIN inventory_items ii ON u.username = ii.username
        GROUP BY u.username
        ORDER BY u.score DESC LIMIT 50
      `);
    return rows.map((row: any) => {
      return {
        ...row,
        is_sub: !!row.is_sub,
        badges: row.badges ? row.badges.split(',') : [],
        inventory: row.inventory ? row.inventory.split(',').map(Number) : []
      };
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

export async function getUserProfile(username: string): Promise<GlobalLeaderboardEntry | null> {
  try {
    const rows = await query(`
        SELECT u.username, u.avatar, u.score, u.games_played, UNIX_TIMESTAMP(u.last_played) * 1000 as date, 
        u.coins, u.brainCoins, u.level, u.xp, u.is_sub,
        GROUP_CONCAT(DISTINCT ub.badge_id) as badges,
        GROUP_CONCAT(DISTINCT ii.item_id) as inventory
        FROM users u
        LEFT JOIN user_badges ub ON u.username = ub.username
        LEFT JOIN inventory_items ii ON u.username = ii.username
        WHERE u.username = ?
        GROUP BY u.username
      `, [username]);
    if (rows.length > 0) {
      const row = rows[0];
      return {
        ...row,
        is_sub: !!row.is_sub,
        badges: row.badges ? row.badges.split(',') : [],
        inventory: row.inventory ? row.inventory.split(',').map(Number) : []
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function saveUserProfile(profile: GlobalLeaderboardEntry) {
  try {
    await query(`
      INSERT INTO users (username, avatar, score, games_played, coins, xp, level) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      avatar = VALUES(avatar), score = VALUES(score), games_played = VALUES(games_played),
      coins = VALUES(coins), xp = VALUES(xp), level = VALUES(level)
    `, [profile.username, profile.avatar || '', profile.score, profile.games_played, profile.coins, profile.xp, profile.level]);

    // Save inventory items
    if (profile.inventory && profile.inventory.length > 0) {
      await query('DELETE FROM inventory_items WHERE username = ?', [profile.username]);
      for (const itemId of profile.inventory) {
        await query('INSERT INTO inventory_items (username, item_id, quantity) VALUES (?, ?, 1)', [profile.username, itemId]);
      }
    }
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
}

export async function batchUpdateUserProfiles(updates: { username: string, avatar: string | undefined, score: number, coinsEarned: number, newBadges: (string | number)[] }[]) {
  for (const update of updates) {
    try {
      await query(`
        INSERT INTO users (username, avatar, score, games_played, coins) 
        VALUES (?, ?, ?, 1, ?)
        ON DUPLICATE KEY UPDATE 
        avatar = VALUES(avatar), score = score + VALUES(score), games_played = games_played + 1, coins = coins + VALUES(coins)
      `, [update.username, update.avatar || '', update.score, update.coinsEarned]);

      for (const badgeId of update.newBadges) {
        await query('INSERT IGNORE INTO user_badges (username, badge_id) VALUES (?, ?)', [update.username, badgeId]);
      }
    } catch (error) {
      console.error('Error updating profile for', update.username, error);
    }
  }
}

export async function buyItem(username: string, itemId: string | number, cost: number): Promise<boolean> {
  try {
    const profile = await getUserProfile(username);
    if (!profile) return false;

    const items = await query('SELECT * FROM shop_items WHERE id = ?', [itemId]);
    const item = items[0];
    if (!item) return false;

    if (profile.coins < cost) return false;

    await query('UPDATE users SET coins = coins - ? WHERE username = ?', [cost, username]);
    await query('INSERT INTO inventory_items (username, item_id, quantity) VALUES (?, ?, 1)', [username, itemId]);

    return true;
  } catch (error) {
    console.error('Error buying item:', error);
    return false;
  }
}

export async function useItem(username: string, itemId: string | number): Promise<boolean> {
  try {
    const profile = await getUserProfile(username);
    if (!profile) return false;

    const invRows = await query('SELECT id FROM inventory_items WHERE username = ? AND item_id = ? LIMIT 1', [username, itemId]);
    if (invRows.length === 0) return false;

    const invId = invRows[0].id;
    await query('DELETE FROM inventory_items WHERE id = ?', [invId]);

    return true;
  } catch (error) {
    console.error('Error using item:', error);
    return false;
  }
}

export async function toggleSubStatus(username: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(username);
    if (!profile) return false;
    
    const newStatus = profile.is_sub ? 0 : 1;
    await query('UPDATE users SET is_sub = ? WHERE username = ?', [newStatus, username]);
    return true;
  } catch (error) {
    console.error('Error toggling sub status:', error);
    return false;
  }
}

export async function getPendingQuestions(): Promise<SubmittedQuestion[]> {
  try {
    const rows = await query(`
      SELECT sq.*, c.name as theme 
      FROM submit_questions sq
      JOIN categories c ON sq.category_id = c.id
      WHERE sq.status = 'pending'
    `);
    return rows.map((row: any) => ({
      ...row,
      options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options
    }));
  } catch (error) {
    console.error('Error fetching pending questions:', error);
    return [];
  }
}

export async function addSubmittedQuestion(q: SubmittedQuestion) {
  try {
    const cats = await query('SELECT id FROM categories WHERE name = ?', [q.theme]);
    let catId = cats.length > 0 ? cats[0].id : null;
    if (!catId) {
      catId = await addTheme(q.theme);
    }
    await query(
      'INSERT INTO submit_questions (category_id, text, options, correctOptionIndex, author) VALUES (?, ?, ?, ?, ?)',
      [catId, q.text, JSON.stringify(q.options), q.correctOptionIndex, q.author]
    );
  } catch (error) {
    console.error('Error submitting question:', error);
  }
}

export async function updateSubmittedQuestionStatus(id: string | number, status: 'approved' | 'rejected') {
  try {
    await query('UPDATE submit_questions SET status = ? WHERE id = ?', [status, id]);
    
    if (status === 'approved') {
      const rows = await query('SELECT * FROM submit_questions WHERE id = ?', [id]);
      if (rows.length > 0) {
        const q = rows[0];
        await query(
          'INSERT INTO valid_questions (original_submit_id, category_id, text, options, correctOptionIndex, author) VALUES (?, ?, ?, ?, ?, ?)',
          [q.id, q.category_id, q.text, q.options, q.correctOptionIndex, q.author]
        );
        await query(
          'INSERT INTO questions (category_id, text, options, correctOptionIndex, is_custom) VALUES (?, ?, ?, ?, 1)',
          [q.category_id, q.text, q.options, q.correctOptionIndex]
        );
      }
    }
  } catch (error) {
    console.error('Error updating question status:', error);
  }
}

export async function getAllBadges() {
  try {
    return await query('SELECT * FROM badges');
  } catch (error) {
    console.error('Error fetching all badges:', error);
    return [];
  }
}

export async function getAuctionItems(): Promise<any[]> {
  try {
    return await query(`
      SELECT a.*, s.name, s.description, s.icon, s.type 
      FROM auction_items a
      JOIN shop_items s ON a.item_id = s.id
      ORDER BY a.created_at DESC
    `);
  } catch (error) {
    console.error('Error fetching auction items:', error);
    return [];
  }
}

export async function awardBadgeXp(username: string, badgeId: string | number, xp: number) {
  try {
    await query(
      'INSERT INTO user_badges (username, badge_id, xp) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE xp = xp + VALUES(xp)',
      [username, badgeId, xp]
    );
    
    const rows = await query('SELECT xp, level FROM user_badges WHERE username = ? AND badge_id = ?', [username, badgeId]);
    if (rows.length > 0) {
      const currentXp = rows[0].xp;
      const currentLevel = rows[0].level;
      const xpNeeded = currentLevel * 100;
      
      if (currentXp >= xpNeeded) {
        await query('UPDATE user_badges SET level = level + 1, xp = xp - ? WHERE username = ? AND badge_id = ?', [xpNeeded, username, badgeId]);
      }
    }
  } catch (error) {
    console.error('Error awarding badge XP:', error);
  }
}

export async function updateUserProfile(username: string, updates: Partial<any>) {
  try {
    const setClauses: string[] = [];
    const values: any[] = [];
    
    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
    
    if (setClauses.length === 0) return;
    
    values.push(username);
    await query(`UPDATE users SET ${setClauses.join(', ')} WHERE username = ?`, values);
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
}

export async function openLootBox(username: string, boxType: 'standard' | 'premium'): Promise<{ success: boolean, item?: any, message?: string }> {
  try {
    const profile = await getUserProfile(username);
    if (!profile) return { success: false, message: 'User not found' };

    const cost = boxType === 'standard' ? 50 : 100;
    const currency = boxType === 'standard' ? 'coins' : 'brainCoins';

    if (profile[currency] < cost) {
      return { success: false, message: 'Fonds insuffisants' };
    }

    const shopItems = await getShopItems();
    if (shopItems.length === 0) return { success: false, message: 'Boutique vide' };

    const randomItem = shopItems[Math.floor(Math.random() * shopItems.length)];

    await query(`UPDATE users SET ${currency} = ${currency} - ? WHERE username = ?`, [cost, username]);
    await query('INSERT INTO inventory_items (username, item_id, quantity) VALUES (?, ?, 1)', [username, randomItem.id]);

    return { success: true, item: randomItem };
  } catch (error) {
    console.error('Error opening loot box:', error);
    return { success: false, message: 'Erreur serveur' };
  }
}

export async function listItemForAuction(username: string, itemId: string | number, price: number, currency: 'coins' | 'brainCoins'): Promise<boolean> {
  try {
    const invRows = await query('SELECT id FROM inventory_items WHERE username = ? AND item_id = ? LIMIT 1', [username, itemId]);
    if (invRows.length === 0) return false;

    const invId = invRows[0].id;
    await query('DELETE FROM inventory_items WHERE id = ?', [invId]);
    await query('INSERT INTO auction_items (seller, item_id, price, currency, created_at) VALUES (?, ?, ?, ?, NOW())', [username, itemId, price, currency]);

    return true;
  } catch (error) {
    console.error('Error listing item for auction:', error);
    return false;
  }
}

export async function buyAuctionItem(buyerUsername: string, auctionId: string | number): Promise<{ success: boolean, message: string }> {
  try {
    const profile = await getUserProfile(buyerUsername);
    if (!profile) return { success: false, message: 'User not found' };

    const auctionRows = await query('SELECT * FROM auction_items WHERE id = ?', [auctionId]);
    const auction = auctionRows[0];
    if (!auction) return { success: false, message: 'Auction not found' };

    if (profile[auction.currency] < auction.price) {
      return { success: false, message: `Not enough ${auction.currency}` };
    }

    await query(`UPDATE users SET ${auction.currency} = ${auction.currency} - ? WHERE username = ?`, [auction.price, buyerUsername]);
    await query(`UPDATE users SET ${auction.currency} = ${auction.currency} + ? WHERE username = ?`, [auction.price, auction.seller]);
    await query('INSERT INTO inventory_items (username, item_id, quantity) VALUES (?, ?, 1)', [buyerUsername, auction.item_id]);
    await query('DELETE FROM auction_items WHERE id = ?', [auctionId]);

    return { success: true, message: 'Item purchased successfully' };
  } catch (error) {
    console.error('Error buying auction item:', error);
    return { success: false, message: 'Internal server error' };
  }
}

export async function addBrainCoins(username: string, amount: number): Promise<boolean> {
  try {
    await query('UPDATE users SET brainCoins = brainCoins + ? WHERE username = ?', [amount, username]);
    return true;
  } catch (error) {
    console.error('Error adding brainCoins:', error);
    return false;
  }
}
