import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import type { GlobalLeaderboardEntry, SubmittedQuestion, Question, Theme } from '../types';

dotenv.config();

let mysqlPool: mysql.Pool | null = null;
let sqliteDb: any = null;

export let useMySQL = process.env.USE_MYSQL === 'true' && !!process.env.DB_HOST;

export async function getDb() {
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
    return mysqlPool;
  } else {
    if (!sqliteDb) {
      sqliteDb = new Database('./database.sqlite');
      // Enable WAL mode for better performance
      sqliteDb.pragma('journal_mode = WAL');
    }
    return sqliteDb;
  }
}

export async function initDB() {
  try {
    console.log(`🚀 Initialisation de la base de données ${useMySQL ? 'MySQL' : 'SQLite'}...`);
    let db;
    try {
      db = await getDb();
      if (useMySQL) {
        const pool = db as mysql.Pool;
        // Check connection
        await pool.getConnection();
      }
    } catch (connErr) {
      console.error("❌ Connexion base impossible :", (connErr as Error).message);
      throw connErr;
    }

    if (useMySQL) {
      const pool = db as mysql.Pool;
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          username VARCHAR(191) PRIMARY KEY,
          avatar VARCHAR(255),
          score INT NOT NULL DEFAULT 0,
          games_played INT NOT NULL DEFAULT 0,
          last_played DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          coins INT NOT NULL DEFAULT 0,
          brainCoins INT NOT NULL DEFAULT 0,
          level INT NOT NULL DEFAULT 1,
          xp INT NOT NULL DEFAULT 0,
          hp INT NOT NULL DEFAULT 100,
          maxHp INT NOT NULL DEFAULT 100,
          is_sub BOOLEAN DEFAULT FALSE,
          inventory JSON
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS questions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          category_id VARCHAR(100) NOT NULL,
          text TEXT NOT NULL,
          options JSON NOT NULL,
          correctOptionIndex INT NOT NULL,
          timeLimit INT NOT NULL DEFAULT 15,
          is_custom BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS badges (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          icon VARCHAR(255)
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_badges (
          username VARCHAR(191),
          badge_id VARCHAR(100),
          level INT NOT NULL DEFAULT 1,
          xp INT NOT NULL DEFAULT 0,
          earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (username, badge_id),
          FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
          FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS submit_questions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          category_id VARCHAR(100) NOT NULL,
          text TEXT NOT NULL,
          options JSON NOT NULL,
          correctOptionIndex INT NOT NULL,
          author VARCHAR(191) NOT NULL,
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS shop_items (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          price INT NOT NULL,
          icon VARCHAR(255),
          type ENUM('attack', 'defense', 'bonus') NOT NULL
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS auction_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          seller VARCHAR(191) NOT NULL,
          item_id VARCHAR(100) NOT NULL,
          price INT NOT NULL,
          currency ENUM('coins', 'brainCoins') DEFAULT 'coins',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (seller) REFERENCES users(username) ON DELETE CASCADE,
          FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE
        )
      `);

      // Migrations for existing tables
      const [userColumns] = await pool.query('SHOW COLUMNS FROM users');
      const userColNames = (userColumns as any[]).map(c => c.Field);
      
      if (!userColNames.includes('brainCoins')) {
        await pool.query('ALTER TABLE users ADD COLUMN brainCoins INT NOT NULL DEFAULT 0 AFTER coins');
      }
      if (!userColNames.includes('level')) {
        await pool.query('ALTER TABLE users ADD COLUMN level INT NOT NULL DEFAULT 1 AFTER brainCoins');
      }
      if (!userColNames.includes('xp')) {
        await pool.query('ALTER TABLE users ADD COLUMN xp INT NOT NULL DEFAULT 0 AFTER level');
      }
      if (!userColNames.includes('hp')) {
        await pool.query('ALTER TABLE users ADD COLUMN hp INT NOT NULL DEFAULT 100 AFTER xp');
      }
      if (!userColNames.includes('maxHp')) {
        await pool.query('ALTER TABLE users ADD COLUMN maxHp INT NOT NULL DEFAULT 100 AFTER hp');
      }

      const [badgeColumns] = await pool.query('SHOW COLUMNS FROM user_badges');
      const badgeColNames = (badgeColumns as any[]).map(c => c.Field);
      if (!badgeColNames.includes('xp')) {
        await pool.query('ALTER TABLE user_badges ADD COLUMN xp INT NOT NULL DEFAULT 0 AFTER level');
      }
    } else {
      const dbSqlite = db as any;
      
      // SQLite is local, but we can still check if it's writable
      try {
        dbSqlite.exec("SELECT 1");
      } catch (connErr) {
        console.error("❌ CRITICAL: Impossible d'accéder à la base de données SQLite.");
        throw connErr;
      }

      dbSqlite.exec(`
        CREATE TABLE IF NOT EXISTS users (
          username TEXT PRIMARY KEY,
          avatar TEXT,
          score INTEGER NOT NULL DEFAULT 0,
          games_played INTEGER NOT NULL DEFAULT 0,
          last_played DATETIME DEFAULT CURRENT_TIMESTAMP,
          coins INTEGER NOT NULL DEFAULT 0,
          brainCoins INTEGER NOT NULL DEFAULT 0,
          level INTEGER NOT NULL DEFAULT 1,
          xp INTEGER NOT NULL DEFAULT 0,
          hp INTEGER NOT NULL DEFAULT 100,
          maxHp INTEGER NOT NULL DEFAULT 100,
          is_sub BOOLEAN DEFAULT FALSE,
          inventory TEXT
        );

        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id TEXT NOT NULL,
          text TEXT NOT NULL,
          options TEXT NOT NULL,
          correctOptionIndex INTEGER NOT NULL,
          timeLimit INTEGER NOT NULL DEFAULT 15,
          is_custom BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS badges (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          icon TEXT
        );

        CREATE TABLE IF NOT EXISTS user_badges (
          username TEXT,
          badge_id TEXT,
          level INTEGER NOT NULL DEFAULT 1,
          xp INTEGER NOT NULL DEFAULT 0,
          earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (username, badge_id),
          FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
          FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS submit_questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id TEXT NOT NULL,
          text TEXT NOT NULL,
          options TEXT NOT NULL,
          correctOptionIndex INTEGER NOT NULL,
          author TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS shop_items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          price INTEGER NOT NULL,
          icon TEXT,
          type TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS custom_questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          question_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS auction_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          seller TEXT NOT NULL,
          item_id TEXT NOT NULL,
          price INTEGER NOT NULL,
          currency TEXT DEFAULT 'coins',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (seller) REFERENCES users(username) ON DELETE CASCADE,
          FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE
        );
      `);

      // Migrations for SQLite
      const userTableInfo = dbSqlite.prepare("PRAGMA table_info(users)").all();
      const userColNames = userTableInfo.map((c: any) => c.name);
      
      if (!userColNames.includes('brainCoins')) {
        dbSqlite.prepare('ALTER TABLE users ADD COLUMN brainCoins INTEGER NOT NULL DEFAULT 0').run();
      }
      if (!userColNames.includes('level')) {
        dbSqlite.prepare('ALTER TABLE users ADD COLUMN level INTEGER NOT NULL DEFAULT 1').run();
      }
      if (!userColNames.includes('xp')) {
        dbSqlite.prepare('ALTER TABLE users ADD COLUMN xp INTEGER NOT NULL DEFAULT 0').run();
      }
      if (!userColNames.includes('hp')) {
        dbSqlite.prepare('ALTER TABLE users ADD COLUMN hp INTEGER NOT NULL DEFAULT 100').run();
      }
      if (!userColNames.includes('maxHp')) {
        dbSqlite.prepare('ALTER TABLE users ADD COLUMN maxHp INTEGER NOT NULL DEFAULT 100').run();
      }

      const badgeTableInfo = dbSqlite.prepare("PRAGMA table_info(user_badges)").all();
      const badgeColNames = badgeTableInfo.map((c: any) => c.name);
      if (!badgeColNames.includes('xp')) {
        dbSqlite.prepare('ALTER TABLE user_badges ADD COLUMN xp INTEGER NOT NULL DEFAULT 0').run();
      }
    }
    
    await seedData();

    console.log(`✅ Base de données ${useMySQL ? 'MySQL' : 'SQLite'} initialisée avec succès`);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de la base de données:", error);
  }
}

async function seedData() {
  try {
    const db = await getDb();

    const badges = [
      { id: 'first-game', name: 'Première Partie', description: 'A joué sa première partie', icon: 'Award' },
      { id: 'veteran', name: 'Vétéran', description: 'A joué 10 parties', icon: 'Shield' },
      { id: 'expert', name: 'Expert', description: 'A joué 50 parties', icon: 'Zap' },
      { id: 'champion', name: 'Champion', description: 'A gagné une partie', icon: 'Star' }
    ];

    const shopItems = [
      { id: 'fumigene', name: 'Fumigène', description: 'Floute l'écran des adversaires pendant 5s', price: 50, icon: 'EyeOff', type: 'attack' },
      { id: 'seisme', name: 'Séisme', description: 'Fait trembler l'écran des adversaires', price: 75, icon: 'Zap', type: 'attack' },
      { id: 'inversion', name: 'Inversion', description: 'Met l'écran des adversaires à l'envers', price: 100, icon: 'RefreshCcw', type: 'attack' },
      { id: 'bouclier', name: 'Bouclier', description: 'Protège contre la prochaine attaque', price: 50, icon: 'Shield', type: 'defense' }
    ];

    if (useMySQL) {
      await (db as mysql.Pool).query('INSERT IGNORE INTO categories (id, name) VALUES (?, ?)', ['culture-generale', 'Culture Générale']);
    } else {
      (db as any).prepare('INSERT OR IGNORE INTO categories (id, name) VALUES (?, ?)').run('culture-generale', 'Culture Générale');
    }

    for (const badge of badges) {
      if (useMySQL) {
        await (db as mysql.Pool).query('INSERT IGNORE INTO badges (id, name, description, icon) VALUES (?, ?, ?, ?)', [badge.id, badge.name, badge.description, badge.icon]);
      } else {
        (db as any).prepare('INSERT OR IGNORE INTO badges (id, name, description, icon) VALUES (?, ?, ?, ?)').run(badge.id, badge.name, badge.description, badge.icon);
      }
    }

    for (const item of shopItems) {
      if (useMySQL) {
        await (db as mysql.Pool).query('INSERT IGNORE INTO shop_items (id, name, description, price, icon, type) VALUES (?, ?, ?, ?, ?, ?)', [item.id, item.name, item.description, item.price, item.icon, item.type]);
      } else {
        (db as any).prepare('INSERT OR IGNORE INTO shop_items (id, name, description, price, icon, type) VALUES (?, ?, ?, ?, ?, ?)').run(item.id, item.name, item.description, item.price, item.icon, item.type);
      }
    }

    const themes = await getThemesWithQuestions();
    if (!themes['culture-generale']?.questions?.length) {
      await addQuestion({
        id: 'q1',
        text: 'Quelle est la capitale de la France ?',
        options: ['Londres', 'Paris', 'Berlin', 'Madrid'],
        correctOptionIndex: 1,
        timeLimit: 15
      }, 'culture-generale', false);
    }
  } catch (err) {
    console.error('Error seeding data:', err);
  }
}

export async function getShopItems(): Promise<any[]> {
  try {
    const db = await getDb();
    if (useMySQL) {
      const [rows] = await (db as mysql.Pool).query('SELECT * FROM shop_items');
      return rows as any[];
    } else {
      return (db as any).prepare('SELECT * FROM shop_items').all();
    }
  } catch (error) {
    console.error('Error fetching shop items:', error);
    return [];
  }
}

export async function getThemesWithQuestions(): Promise<Record<string, Theme>> {
  try {
    const db = await getDb();
    let categories: any[], questions: any[];
    
    if (useMySQL) {
      const [tRows] = await (db as mysql.Pool).query('SELECT * FROM categories');
      const [qRows] = await (db as mysql.Pool).query('SELECT * FROM questions');
      categories = tRows as any[];
      questions = qRows as any[];
    } else {
      categories = (db as any).prepare('SELECT * FROM categories').all();
      questions = (db as any).prepare('SELECT * FROM questions').all();
    }

    const result: Record<string, Theme> = {};
    for (const t of categories) {
      result[t.id] = { id: t.id, name: t.name, questions: [] };
    }
    for (const q of questions) {
      if (result[q.category_id]) {
        result[q.category_id].questions.push({
          id: q.id,
          text: q.text,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
          correctOptionIndex: q.correctOptionIndex,
          timeLimit: q.timeLimit
        });
      }
    }
    return result;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {};
  }
}

export async function addTheme(name: string): Promise<string | null> {
  try {
    const db = await getDb();
    const slug = name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (useMySQL) {
      await (db as mysql.Pool).query('INSERT IGNORE INTO categories (id, name) VALUES (?, ?)', [slug, name]);
    } else {
      (db as any).prepare('INSERT OR IGNORE INTO categories (id, name) VALUES (?, ?)').run(slug, name);
    }

    return slug;
  } catch (error) {
    console.error('Error adding category:', error);
    return null;
  }
}


export async function addQuestion(q: Question, categoryId: string | number, isCustom: boolean = true) {
  try {
    const db = await getDb();
    if (useMySQL) {
      await (db as mysql.Pool).query(
        'INSERT INTO questions (category_id, text, options, correctOptionIndex, timeLimit, is_custom) VALUES (?, ?, ?, ?, ?, ?)',
        [categoryId, q.text, JSON.stringify(q.options), q.correctOptionIndex, q.timeLimit || 15, isCustom]
      );
    } else {
      (db as any).prepare(
        'INSERT INTO questions (category_id, text, options, correctOptionIndex, timeLimit, is_custom) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(categoryId, q.text, JSON.stringify(q.options), q.correctOptionIndex, q.timeLimit || 15, isCustom ? 1 : 0);
    }
  } catch (error) {
    console.error('Error adding question:', error);
  }
}

export async function getLeaderboard(): Promise<GlobalLeaderboardEntry[]> {
  try {
    const db = await getDb();
    let rows: any[];
    if (useMySQL) {
      const [qRows] = await (db as mysql.Pool).query(`
        SELECT u.username, u.avatar, u.score, u.games_played, UNIX_TIMESTAMP(u.last_played) * 1000 as date, 
        u.coins, u.brainCoins, u.level, u.xp, u.is_sub, u.inventory,
        GROUP_CONCAT(ub.badge_id) as badges
        FROM users u
        LEFT JOIN user_badges ub ON u.username = ub.username
        GROUP BY u.username
        ORDER BY u.score DESC LIMIT 50
      `);
      rows = qRows as any[];
    } else {
      rows = (db as any).prepare(`
        SELECT u.username, u.avatar, u.score, u.games_played, strftime('%s', u.last_played) * 1000 as date, 
        u.coins, u.brainCoins, u.level, u.xp, u.is_sub, u.inventory,
        GROUP_CONCAT(ub.badge_id) as badges
        FROM users u
        LEFT JOIN user_badges ub ON u.username = ub.username
        GROUP BY u.username
        ORDER BY u.score DESC LIMIT 50
      `).all();
    }
    return rows.map(row => {
      let parsedInventory: (string | number)[] = [];
      try {
        const inv = typeof row.inventory === 'string' ? JSON.parse(row.inventory) : (row.inventory || []);
        if (Array.isArray(inv)) {
          parsedInventory = inv;
        } else if (typeof inv === 'object' && inv !== null) {
          for (const [key, val] of Object.entries(inv)) {
            for (let i = 0; i < (val as number); i++) {
              parsedInventory.push(key);
            }
          }
        }
      } catch (e) {
        parsedInventory = [];
      }

      return {
        ...row,
        is_sub: !!row.is_sub,
        badges: row.badges ? row.badges.split(',') : [],
        inventory: parsedInventory
      };
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

export async function getUserProfile(username: string): Promise<GlobalLeaderboardEntry | null> {
  try {
    const db = await getDb();
    let rows: any[];
    if (useMySQL) {
      const [qRows] = await (db as mysql.Pool).query(`
        SELECT u.username, u.avatar, u.score, u.games_played, UNIX_TIMESTAMP(u.last_played) * 1000 as date, 
        u.coins, u.brainCoins, u.level, u.xp, u.is_sub, u.inventory,
        GROUP_CONCAT(ub.badge_id) as badges
        FROM users u
        LEFT JOIN user_badges ub ON u.username = ub.username
        WHERE u.username = ?
        GROUP BY u.username
      `, [username]);
      rows = qRows as any[];
    } else {
      rows = (db as any).prepare(`
        SELECT u.username, u.avatar, u.score, u.games_played, strftime('%s', u.last_played) * 1000 as date, 
        u.coins, u.brainCoins, u.level, u.xp, u.is_sub, u.inventory,
        GROUP_CONCAT(ub.badge_id) as badges
        FROM users u
        LEFT JOIN user_badges ub ON u.username = ub.username
        WHERE u.username = ?
        GROUP BY u.username
      `).all(username);
    }
    if (rows.length > 0) {
      const row = rows[0];
      let parsedInventory: (string | number)[] = [];
      try {
        const inv = typeof row.inventory === 'string' ? JSON.parse(row.inventory) : (row.inventory || []);
        if (Array.isArray(inv)) {
          parsedInventory = inv;
        } else if (typeof inv === 'object' && inv !== null) {
          for (const [key, val] of Object.entries(inv)) {
            for (let i = 0; i < (val as number); i++) {
              parsedInventory.push(key);
            }
          }
        }
      } catch (e) {
        parsedInventory = [];
      }

      return {
        ...row,
        is_sub: !!row.is_sub,
        badges: row.badges ? row.badges.split(',') : [],
        inventory: parsedInventory
      };
    }
    
    // Return a default profile for new users instead of null
    return {
      username,
      avatar: undefined,
      score: 0,
      games_played: 0,
      date: Date.now(),
      coins: 0,
      brainCoins: 0,
      level: 1,
      xp: 0,
      is_sub: false,
      inventory: [],
      badges: []
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function batchUpdateUserProfiles(updates: { username: string, avatar: string | undefined, score: number, coinsEarned: number, newBadges: (string | number)[] }[]) {
  if (updates.length === 0) return;
  
  try {
    const db = await getDb();
    if (useMySQL) {
      const pool = db as mysql.Pool;
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      try {
        for (const update of updates) {
          // Calculate XP: 10 XP per point
          const xpGained = update.score * 10;
          
          await connection.query(`
            INSERT INTO users (username, avatar, score, games_played, coins, xp, level, inventory) 
            VALUES (?, ?, ?, 1, ?, ?, 1, '[]') 
            ON DUPLICATE KEY UPDATE 
              avatar = VALUES(avatar),
              score = GREATEST(score, VALUES(score)),
              games_played = games_played + 1,
              coins = coins + VALUES(coins),
              xp = xp + VALUES(xp),
              level = FLOOR((xp + VALUES(xp)) / 1000) + 1
          `, [update.username, update.avatar, update.score, update.coinsEarned, xpGained]);
          
          for (const badgeId of update.newBadges) {
            await connection.query('INSERT IGNORE INTO user_badges (username, badge_id) VALUES (?, ?)', [update.username, badgeId]);
          }
        }
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } else {
      const dbSqlite = db as any;
      const transaction = dbSqlite.transaction((updates: any[]) => {
        for (const update of updates) {
          const xpGained = update.score * 10;
          dbSqlite.prepare(`
            INSERT INTO users (username, avatar, score, games_played, coins, xp, level, inventory) 
            VALUES (?, ?, ?, 1, ?, ?, 1, '[]') 
            ON CONFLICT(username) DO UPDATE SET 
              avatar = excluded.avatar,
              score = MAX(score, excluded.score),
              games_played = games_played + 1,
              coins = coins + excluded.coins,
              xp = xp + excluded.xp,
              level = (xp + excluded.xp) / 1000 + 1
          `).run(update.username, update.avatar, update.score, update.coinsEarned, xpGained);
          
          for (const badgeId of update.newBadges) {
            dbSqlite.prepare('INSERT OR IGNORE INTO user_badges (username, badge_id) VALUES (?, ?)').run(update.username, badgeId);
          }
        }
      });
      transaction(updates);
    }
  } catch (error) {
    console.error('Error batch updating user profiles:', error);
  }
}

export async function buyItem(username: string, itemId: string | number, cost: number): Promise<boolean> {
  try {
    const db = await getDb();
    const profile = await getUserProfile(username);
    if (!profile || profile.coins < cost) return false;

    const newInventory = [...profile.inventory, itemId];
    if (useMySQL) {
      await (db as mysql.Pool).query('UPDATE users SET coins = coins - ?, inventory = ? WHERE username = ?', [cost, JSON.stringify(newInventory), username]);
    } else {
      (db as any).prepare('UPDATE users SET coins = coins - ?, inventory = ? WHERE username = ?').run(cost, JSON.stringify(newInventory), username);
    }
    return true;
  } catch (error) {
    console.error('Error buying item:', error);
    return false;
  }
}

export async function useItem(username: string, itemId: string | number): Promise<boolean> {
  try {
    const db = await getDb();
    const profile = await getUserProfile(username);
    if (!profile) return false;

    const itemIndex = profile.inventory.indexOf(itemId);
    if (itemIndex === -1) return false;

    const newInventory = [...profile.inventory];
    newInventory.splice(itemIndex, 1);

    if (useMySQL) {
      await (db as mysql.Pool).query('UPDATE users SET inventory = ? WHERE username = ?', [JSON.stringify(newInventory), username]);
    } else {
      (db as any).prepare('UPDATE users SET inventory = ? WHERE username = ?').run(JSON.stringify(newInventory), username);
    }
    return true;
  } catch (error) {
    console.error('Error using item:', error);
    return false;
  }
}

export async function toggleSubStatus(username: string): Promise<boolean> {
  try {
    const db = await getDb();
    const profile = await getUserProfile(username);
    if (!profile) return false;
    const newStatus = !profile.is_sub;
    if (useMySQL) {
      await (db as mysql.Pool).query('UPDATE users SET is_sub = ? WHERE username = ?', [newStatus, username]);
    } else {
      (db as any).prepare('UPDATE users SET is_sub = ? WHERE username = ?').run(newStatus ? 1 : 0, username);
    }
    return newStatus;
  } catch (error) {
    console.error('Error toggling sub status:', error);
    return false;
  }
}

export async function getPendingQuestions(): Promise<SubmittedQuestion[]> {
  try {
    const db = await getDb();
    let rows: any[];
    if (useMySQL) {
      const [qRows] = await (db as mysql.Pool).query("SELECT * FROM submit_questions WHERE status = 'pending' ORDER BY created_at DESC");
      rows = qRows as any[];
    } else {
      rows = (db as any).prepare("SELECT * FROM submit_questions WHERE status = 'pending' ORDER BY created_at DESC").all();
    }
    return rows.map(row => ({
      ...row,
      theme: row.category_id, // Map category_id to theme for compatibility
      options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options
    }));
  } catch (error) {
    console.error('Error fetching pending questions:', error);
    return [];
  }
}

export async function addSubmittedQuestion(q: SubmittedQuestion) {
  try {
    const db = await getDb();
    if (useMySQL) {
      await (db as mysql.Pool).query(`
        INSERT INTO submit_questions (category_id, text, options, correctOptionIndex, author, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [q.theme, q.text, JSON.stringify(q.options), q.correctOptionIndex, q.author, q.status]);
    } else {
      (db as any).prepare(`
        INSERT INTO submit_questions (category_id, text, options, correctOptionIndex, author, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(q.theme, q.text, JSON.stringify(q.options), q.correctOptionIndex, q.author, q.status);
    }
  } catch (error) {
    console.error('Error adding submitted question:', error);
  }
}

export async function updateSubmittedQuestionStatus(id: string | number, status: 'approved' | 'rejected') {
  try {
    const db = await getDb();
    if (useMySQL) {
      await (db as mysql.Pool).query('UPDATE submit_questions SET status = ? WHERE id = ?', [status, id]);
    } else {
      (db as any).prepare('UPDATE submit_questions SET status = ? WHERE id = ?').run(status, id);
    }
  } catch (error) {
    console.error('Error updating question status:', error);
  }
}

export async function getAllBadges() {
  try {
    const db = await getDb();
    let badges: any[];
    let totalUsers: number;

    if (useMySQL) {
      const [bRows] = await (db as mysql.Pool).query('SELECT * FROM badges');
      const [uRows] = await (db as mysql.Pool).query('SELECT COUNT(*) as count FROM users');
      badges = bRows as any[];
      totalUsers = (uRows as any)[0].count || 1;

      for (const badge of badges) {
        const [countRows] = await (db as mysql.Pool).query('SELECT COUNT(*) as count FROM user_badges WHERE badge_id = ?', [badge.id]);
        const earnedCount = (countRows as any)[0].count || 0;
        badge.rarity = Math.round((earnedCount / totalUsers) * 100);
      }
    } else {
      badges = (db as any).prepare('SELECT * FROM badges').all();
      totalUsers = (db as any).prepare('SELECT COUNT(*) as count FROM users').get().count || 1;

      for (const badge of badges) {
        const earnedCount = (db as any).prepare('SELECT COUNT(*) as count FROM user_badges WHERE badge_id = ?').get(badge.id).count || 0;
        badge.rarity = Math.round((earnedCount / totalUsers) * 100);
      }
    }
    return badges;
  } catch (error) {
    console.error('Error fetching all badges:', error);
    return [];
  }
}

export async function getAuctionItems(): Promise<any[]> {
  try {
    const db = await getDb();
    if (useMySQL) {
      const [rows] = await (db as mysql.Pool).query('SELECT * FROM auction_items ORDER BY created_at DESC');
      return rows as any[];
    } else {
      return (db as any).prepare('SELECT * FROM auction_items ORDER BY created_at DESC').all();
    }
  } catch (error) {
    console.error('Error fetching auction items:', error);
    return [];
  }
}

export async function awardBadgeXp(username: string, badgeId: string | number, xp: number) {
  try {
    const db = await getDb();
    if (useMySQL) {
      // Check if user has badge
      const [rows] = await (db as mysql.Pool).query('SELECT * FROM user_badges WHERE username = ? AND badge_id = ?', [username, badgeId]);
      if ((rows as any[]).length > 0) {
        const current = (rows as any[])[0];
        const newXp = (current.xp || 0) + xp;
        const newLevel = Math.floor(newXp / 100) + 1;
        await (db as mysql.Pool).query('UPDATE user_badges SET xp = ?, level = ? WHERE username = ? AND badge_id = ?', [newXp, newLevel, username, badgeId]);
      } else {
        await (db as mysql.Pool).query('INSERT INTO user_badges (username, badge_id, level, xp) VALUES (?, ?, ?, ?)', [username, badgeId, 1, xp]);
      }
    } else {
      const row = (db as any).prepare('SELECT * FROM user_badges WHERE username = ? AND badge_id = ?').get(username, badgeId);
      if (row) {
        const newXp = (row.xp || 0) + xp;
        const newLevel = Math.floor(newXp / 100) + 1;
        (db as any).prepare('UPDATE user_badges SET xp = ?, level = ? WHERE username = ? AND badge_id = ?').run(newXp, newLevel, username, badgeId);
      } else {
        (db as any).prepare('INSERT INTO user_badges (username, badge_id, level, xp) VALUES (?, ?, ?, ?)').run(username, badgeId, 1, xp);
      }
    }
  } catch (error) {
    console.error('Error awarding badge XP:', error);
  }
}

export async function updateUserProfile(username: string, updates: Partial<any>) {
  try {
    const db = await getDb();
    const keys = Object.keys(updates);
    if (keys.length === 0) return;

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);

    if (useMySQL) {
      await (db as mysql.Pool).query(`UPDATE users SET ${setClause} WHERE username = ?`, [...values, username]);
    } else {
      (db as any).prepare(`UPDATE users SET ${setClause} WHERE username = ?`).run(...values, username);
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
}

export async function openLootBox(username: string, boxType: 'standard' | 'premium'): Promise<{ success: boolean, item?: any, message?: string }> {
  try {
    const db = await getDb();
    const profile = await getUserProfile(username);
    if (!profile) return { success: false, message: 'Profil introuvable' };

    const cost = boxType === 'standard' ? 500 : 5; // 500 Coins or 5 BrainCoins
    const currency = boxType === 'standard' ? 'coins' : 'brainCoins';

    if (profile[currency] < cost) {
      return { success: false, message: 'Fonds insuffisants' };
    }

    // Define loot table
    const shopItems = await getShopItems();
    if (shopItems.length === 0) return { success: false, message: 'Boutique vide' };

    // Randomly pick an item
    const randomItem = shopItems[Math.floor(Math.random() * shopItems.length)];
    const newInventory = [...profile.inventory, randomItem.id];

    if (useMySQL) {
      await (db as mysql.Pool).query(`UPDATE users SET ${currency} = ${currency} - ?, inventory = ? WHERE username = ?`, [cost, JSON.stringify(newInventory), username]);
    } else {
      (db as any).prepare(`UPDATE users SET ${currency} = ${currency} - ?, inventory = ? WHERE username = ?`).run(cost, JSON.stringify(newInventory), username);
    }

    return { success: true, item: randomItem };
  } catch (error) {
    console.error('Error opening loot box:', error);
    return { success: false, message: 'Erreur serveur' };
  }
}

export async function listItemForAuction(username: string, itemId: string | number, price: number, currency: 'coins' | 'brainCoins'): Promise<boolean> {
  try {
    const db = await getDb();
    const profile = await getUserProfile(username);
    if (!profile) return false;

    const itemIndex = profile.inventory.indexOf(itemId);
    if (itemIndex === -1) return false;

    // Remove from inventory
    const newInventory = [...profile.inventory];
    newInventory.splice(itemIndex, 1);

    const auctionId = Math.random().toString(36).substring(2, 9);

    if (useMySQL) {
      await (db as mysql.Pool).query('UPDATE users SET inventory = ? WHERE username = ?', [JSON.stringify(newInventory), username]);
      await (db as mysql.Pool).query('INSERT INTO auction_items (seller, item_id, price, currency, created_at) VALUES (?, ?, ?, ?, NOW())', [username, itemId, price, currency]);
    } else {
      (db as any).prepare('UPDATE users SET inventory = ? WHERE username = ?').run(JSON.stringify(newInventory), username);
      (db as any).prepare('INSERT INTO auction_items (seller, item_id, price, currency, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)').run(username, itemId, price, currency);
    }

    return true;
  } catch (error) {
    console.error('Error listing item for auction:', error);
    return false;
  }
}

export async function addBrainCoins(username: string, amount: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (useMySQL) {
      await (db as mysql.Pool).query('UPDATE users SET brainCoins = brainCoins + ? WHERE username = ?', [amount, username]);
    } else {
      (db as any).prepare('UPDATE users SET brainCoins = brainCoins + ? WHERE username = ?').run(amount, username);
    }
    return true;
  } catch (error) {
    console.error('Error adding brain coins:', error);
    return false;
  }
}
