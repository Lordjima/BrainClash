import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import type { GlobalLeaderboardEntry, Question, SubmittedQuestion, Theme } from '../types';

dotenv.config();

let mysqlPool: mysql.Pool | null = null;
let sqliteDb: Database.Database | null = null;

export let useMySQL = process.env.USE_MYSQL === 'true' && !!process.env.DB_HOST;

const SQLITE_FILE = process.env.SQLITE_FILE || './database.sqlite';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'general';
}

function parseInventory(raw: unknown): (string | number)[] {
  if (!raw) return [];

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (parsed && typeof parsed === 'object') {
      const inventory: (string | number)[] = [];
      for (const [key, value] of Object.entries(parsed)) {
        const count = Number(value) || 0;
        for (let i = 0; i < count; i += 1) {
          inventory.push(key);
        }
      }
      return inventory;
    }
  } catch {
    return [];
  }

  return [];
}

function parseOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw !== 'string') return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toThemeId(theme: string | number): string {
  return typeof theme === 'number' ? String(theme) : slugify(String(theme));
}

function mapProfileRow(row: any): GlobalLeaderboardEntry {
  return {
    username: row.username,
    avatar: row.avatar || undefined,
    score: Number(row.score || 0),
    games_played: Number(row.games_played || 0),
    date: Number(row.date || Date.now()),
    coins: Number(row.coins || 0),
    brainCoins: Number(row.brainCoins || 0),
    is_sub: Boolean(row.is_sub),
    badges: row.badges ? String(row.badges).split(',').filter(Boolean) : [],
    inventory: parseInventory(row.inventory),
    level: Number(row.level || 1),
    xp: Number(row.xp || 0),
  };
}

export async function getDb() {
  if (useMySQL) {
    if (!mysqlPool) {
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'brainclash',
        waitForConnections: true,
        connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
        queueLimit: 0,
        connectTimeout: 5000,
        charset: 'utf8mb4',
      });
    }
    return mysqlPool;
  }

  if (!sqliteDb) {
    sqliteDb = new Database(SQLITE_FILE);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');
    sqliteDb.pragma('synchronous = NORMAL');
    sqliteDb.pragma('busy_timeout = 5000');
  }

  return sqliteDb;
}

async function ensureUserExists(username: string, avatar?: string | null): Promise<void> {
  const db = await getDb();

  if (useMySQL) {
    await (db as mysql.Pool).query(
      `INSERT INTO users (username, avatar, inventory)
       VALUES (?, ?, '[]')
       ON DUPLICATE KEY UPDATE avatar = COALESCE(VALUES(avatar), avatar)`,
      [username, avatar || null],
    );
    return;
  }

  (db as Database.Database)
    .prepare(
      `INSERT INTO users (username, avatar, inventory)
       VALUES (?, ?, '[]')
       ON CONFLICT(username) DO UPDATE SET avatar = COALESCE(excluded.avatar, users.avatar)`,
    )
    .run(username, avatar || null);
}

async function ensureThemeExists(themeId: string, themeName?: string): Promise<void> {
  const db = await getDb();
  const name = themeName?.trim() || themeId;

  if (useMySQL) {
    await (db as mysql.Pool).query(
      `INSERT INTO categories (id, name)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [themeId, name],
    );
    return;
  }

  (db as Database.Database)
    .prepare(
      `INSERT INTO categories (id, name)
       VALUES (?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name`,
    )
    .run(themeId, name);
}

export async function initDB() {
  try {
    console.log(`🚀 Initialisation de la base ${useMySQL ? 'MySQL' : 'SQLite'}...`);

    let db = await getDb();

    if (useMySQL) {
      try {
        const connection = await (db as mysql.Pool).getConnection();
        connection.release();
      } catch (error) {
        console.warn(`⚠️ MySQL indisponible, bascule SQLite: ${(error as Error).message}`);
        useMySQL = false;
        mysqlPool = null;
        db = await getDb();
      }
    }

    if (useMySQL) {
      const pool = db as mysql.Pool;

      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          username VARCHAR(191) PRIMARY KEY,
          avatar VARCHAR(512) NULL,
          score INT NOT NULL DEFAULT 0,
          games_played INT NOT NULL DEFAULT 0,
          last_played DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          coins INT NOT NULL DEFAULT 0,
          brainCoins INT NOT NULL DEFAULT 0,
          level INT NOT NULL DEFAULT 1,
          xp INT NOT NULL DEFAULT 0,
          hp INT NOT NULL DEFAULT 100,
          maxHp INT NOT NULL DEFAULT 100,
          is_sub TINYINT(1) NOT NULL DEFAULT 0,
          inventory JSON NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id VARCHAR(120) PRIMARY KEY,
          name VARCHAR(191) NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS questions (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          category_id VARCHAR(120) NOT NULL,
          text TEXT NOT NULL,
          options JSON NOT NULL,
          correctOptionIndex INT NOT NULL,
          timeLimit INT NOT NULL DEFAULT 15,
          is_custom TINYINT(1) NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_questions_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
          INDEX idx_questions_category (category_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS badges (
          id VARCHAR(120) PRIMARY KEY,
          name VARCHAR(191) NOT NULL,
          description TEXT NULL,
          icon VARCHAR(120) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_badges (
          username VARCHAR(191) NOT NULL,
          badge_id VARCHAR(120) NOT NULL,
          level INT NOT NULL DEFAULT 1,
          xp INT NOT NULL DEFAULT 0,
          earned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (username, badge_id),
          CONSTRAINT fk_user_badges_user FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
          CONSTRAINT fk_user_badges_badge FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
          INDEX idx_user_badges_badge (badge_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS submit_questions (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          theme_id VARCHAR(120) NOT NULL,
          text TEXT NOT NULL,
          options JSON NOT NULL,
          correctOptionIndex INT NOT NULL,
          author VARCHAR(191) NOT NULL,
          status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_submit_questions_status (status),
          INDEX idx_submit_questions_theme (theme_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS shop_items (
          id VARCHAR(120) PRIMARY KEY,
          name VARCHAR(191) NOT NULL,
          description TEXT NULL,
          price INT NOT NULL,
          icon VARCHAR(120) NULL,
          type ENUM('attack', 'defense', 'bonus') NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS auction_items (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          seller VARCHAR(191) NOT NULL,
          item_id VARCHAR(120) NOT NULL,
          price INT NOT NULL,
          currency ENUM('coins', 'brainCoins') NOT NULL DEFAULT 'coins',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_auction_items_user FOREIGN KEY (seller) REFERENCES users(username) ON DELETE CASCADE,
          CONSTRAINT fk_auction_items_item FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE,
          INDEX idx_auction_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } else {
      const sqlite = db as Database.Database;
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS users (
          username TEXT PRIMARY KEY,
          avatar TEXT,
          score INTEGER NOT NULL DEFAULT 0,
          games_played INTEGER NOT NULL DEFAULT 0,
          last_played TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          coins INTEGER NOT NULL DEFAULT 0,
          brainCoins INTEGER NOT NULL DEFAULT 0,
          level INTEGER NOT NULL DEFAULT 1,
          xp INTEGER NOT NULL DEFAULT 0,
          hp INTEGER NOT NULL DEFAULT 100,
          maxHp INTEGER NOT NULL DEFAULT 100,
          is_sub INTEGER NOT NULL DEFAULT 0,
          inventory TEXT
        );

        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id TEXT NOT NULL,
          text TEXT NOT NULL,
          options TEXT NOT NULL,
          correctOptionIndex INTEGER NOT NULL,
          timeLimit INTEGER NOT NULL DEFAULT 15,
          is_custom INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category_id);

        CREATE TABLE IF NOT EXISTS badges (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT
        );

        CREATE TABLE IF NOT EXISTS user_badges (
          username TEXT NOT NULL,
          badge_id TEXT NOT NULL,
          level INTEGER NOT NULL DEFAULT 1,
          xp INTEGER NOT NULL DEFAULT 0,
          earned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (username, badge_id),
          FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
          FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

        CREATE TABLE IF NOT EXISTS submit_questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          theme_id TEXT NOT NULL,
          text TEXT NOT NULL,
          options TEXT NOT NULL,
          correctOptionIndex INTEGER NOT NULL,
          author TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_submit_questions_status ON submit_questions(status);
        CREATE INDEX IF NOT EXISTS idx_submit_questions_theme ON submit_questions(theme_id);

        CREATE TABLE IF NOT EXISTS shop_items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          price INTEGER NOT NULL,
          icon TEXT,
          type TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS auction_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          seller TEXT NOT NULL,
          item_id TEXT NOT NULL,
          price INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'coins',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (seller) REFERENCES users(username) ON DELETE CASCADE,
          FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_auction_created_at ON auction_items(created_at);
      `);
    }

    await seedData();
    console.log(`✅ Base ${useMySQL ? 'MySQL' : 'SQLite'} prête`);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de la base:", error);
  }
}

async function seedData() {
  try {
    const db = await getDb();

    const badges = [
      { id: 'first_game', name: 'Première Partie', description: 'A joué sa première partie', icon: 'Award' },
      { id: 'veteran', name: 'Vétéran', description: 'A joué 10 parties', icon: 'Shield' },
      { id: 'expert', name: 'Expert', description: 'A joué 50 parties', icon: 'Zap' },
      { id: 'champion', name: 'Champion', description: 'A gagné une partie', icon: 'Star' },
    ];

    for (const badge of badges) {
      if (useMySQL) {
        await (db as mysql.Pool).query(
          `INSERT INTO badges (id, name, description, icon)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), icon = VALUES(icon)`,
          [badge.id, badge.name, badge.description, badge.icon],
        );
      } else {
        (db as Database.Database)
          .prepare(
            `INSERT INTO badges (id, name, description, icon)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, icon = excluded.icon`,
          )
          .run(badge.id, badge.name, badge.description, badge.icon);
      }
    }

    const shopItems = [
      { id: 'fumigene', name: 'Fumigène', description: "Floute l'écran des adversaires pendant 5s", price: 50, icon: 'EyeOff', type: 'attack' },
      { id: 'seisme', name: 'Séisme', description: "Fait trembler l'écran des adversaires", price: 75, icon: 'Zap', type: 'attack' },
      { id: 'inversion', name: 'Inversion', description: "Met l'écran des adversaires à l'envers", price: 100, icon: 'RefreshCcw', type: 'attack' },
      { id: 'bouclier', name: 'Bouclier', description: 'Protège contre la prochaine attaque', price: 50, icon: 'Shield', type: 'defense' },
    ] as const;

    for (const item of shopItems) {
      if (useMySQL) {
        await (db as mysql.Pool).query(
          `INSERT INTO shop_items (id, name, description, price, icon, type)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), price = VALUES(price), icon = VALUES(icon), type = VALUES(type)`,
          [item.id, item.name, item.description, item.price, item.icon, item.type],
        );
      } else {
        (db as Database.Database)
          .prepare(
            `INSERT INTO shop_items (id, name, description, price, icon, type)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, price = excluded.price, icon = excluded.icon, type = excluded.type`,
          )
          .run(item.id, item.name, item.description, item.price, item.icon, item.type);
      }
    }

    await ensureThemeExists('general', 'Culture Générale');

    let questionCount = 0;
    if (useMySQL) {
      const [rows] = await (db as mysql.Pool).query('SELECT COUNT(*) AS count FROM questions WHERE category_id = ?', ['general']);
      questionCount = Number((rows as any[])[0]?.count || 0);
    } else {
      questionCount = Number((db as Database.Database).prepare('SELECT COUNT(*) AS count FROM questions WHERE category_id = ?').get('general')?.count || 0);
    }

    if (questionCount === 0) {
      await addQuestion(
        {
          id: 'seed-france-capital',
          text: 'Quelle est la capitale de la France ?',
          options: ['Londres', 'Paris', 'Berlin', 'Madrid'],
          correctOptionIndex: 1,
          timeLimit: 15,
        },
        'general',
        false,
      );
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

export async function getShopItems(): Promise<any[]> {
  try {
    const db = await getDb();
    if (useMySQL) {
      const [rows] = await (db as mysql.Pool).query('SELECT * FROM shop_items ORDER BY price ASC, name ASC');
      return rows as any[];
    }
    return (db as Database.Database).prepare('SELECT * FROM shop_items ORDER BY price ASC, name ASC').all();
  } catch (error) {
    console.error('Error fetching shop items:', error);
    return [];
  }
}

export async function getThemesWithQuestions(): Promise<Record<string, Theme>> {
  try {
    const db = await getDb();
    let categories: any[] = [];
    let questions: any[] = [];

    if (useMySQL) {
      const [themeRows] = await (db as mysql.Pool).query('SELECT * FROM categories ORDER BY name ASC');
      const [questionRows] = await (db as mysql.Pool).query('SELECT * FROM questions ORDER BY created_at ASC');
      categories = themeRows as any[];
      questions = questionRows as any[];
    } else {
      categories = (db as Database.Database).prepare('SELECT * FROM categories ORDER BY name ASC').all();
      questions = (db as Database.Database).prepare('SELECT * FROM questions ORDER BY created_at ASC').all();
    }

    const themes: Record<string, Theme> = {};
    for (const category of categories) {
      themes[category.id] = { id: category.id, name: category.name, questions: [] };
    }

    for (const question of questions) {
      const theme = themes[question.category_id];
      if (!theme) continue;
      theme.questions.push({
        id: question.id,
        text: question.text,
        options: parseOptions(question.options),
        correctOptionIndex: Number(question.correctOptionIndex),
        timeLimit: Number(question.timeLimit || 15),
      });
    }

    return themes;
  } catch (error) {
    console.error('Error fetching themes:', error);
    return {};
  }
}

export async function addTheme(idOrName: string, name?: string): Promise<string | null> {
  try {
    const themeId = name ? slugify(idOrName) : slugify(idOrName);
    const themeName = name || idOrName;
    await ensureThemeExists(themeId, themeName);
    return themeId;
  } catch (error) {
    console.error('Error adding theme:', error);
    return null;
  }
}

export async function addQuestion(q: Question, categoryId: string | number, isCustom = true) {
  try {
    const db = await getDb();
    const themeId = toThemeId(categoryId);
    await ensureThemeExists(themeId, themeId);

    if (useMySQL) {
      await (db as mysql.Pool).query(
        `INSERT INTO questions (category_id, text, options, correctOptionIndex, timeLimit, is_custom)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [themeId, q.text, JSON.stringify(q.options), q.correctOptionIndex, q.timeLimit || 15, isCustom ? 1 : 0],
      );
      return;
    }

    (db as Database.Database)
      .prepare(
        'INSERT INTO questions (category_id, text, options, correctOptionIndex, timeLimit, is_custom) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(themeId, q.text, JSON.stringify(q.options), q.correctOptionIndex, q.timeLimit || 15, isCustom ? 1 : 0);
  } catch (error) {
    console.error('Error adding question:', error);
  }
}

export async function getLeaderboard(): Promise<GlobalLeaderboardEntry[]> {
  try {
    const db = await getDb();
    let rows: any[] = [];

    if (useMySQL) {
      const [result] = await (db as mysql.Pool).query(`
        SELECT
          u.username,
          u.avatar,
          u.score,
          u.games_played,
          UNIX_TIMESTAMP(u.last_played) * 1000 AS date,
          u.coins,
          u.brainCoins,
          u.level,
          u.xp,
          u.is_sub,
          u.inventory,
          GROUP_CONCAT(ub.badge_id ORDER BY ub.badge_id SEPARATOR ',') AS badges
        FROM users u
        LEFT JOIN user_badges ub ON ub.username = u.username
        GROUP BY u.username
        ORDER BY u.score DESC, u.games_played DESC, u.username ASC
        LIMIT 50
      `);
      rows = result as any[];
    } else {
      rows = (db as Database.Database).prepare(`
        SELECT
          u.username,
          u.avatar,
          u.score,
          u.games_played,
          strftime('%s', u.last_played) * 1000 AS date,
          u.coins,
          u.brainCoins,
          u.level,
          u.xp,
          u.is_sub,
          u.inventory,
          GROUP_CONCAT(ub.badge_id, ',') AS badges
        FROM users u
        LEFT JOIN user_badges ub ON ub.username = u.username
        GROUP BY u.username
        ORDER BY u.score DESC, u.games_played DESC, u.username ASC
        LIMIT 50
      `).all();
    }

    return rows.map(mapProfileRow);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

export async function getUserProfile(username: string): Promise<GlobalLeaderboardEntry | null> {
  try {
    await ensureUserExists(username);
    const db = await getDb();
    let row: any;

    if (useMySQL) {
      const [rows] = await (db as mysql.Pool).query(`
        SELECT
          u.username,
          u.avatar,
          u.score,
          u.games_played,
          UNIX_TIMESTAMP(u.last_played) * 1000 AS date,
          u.coins,
          u.brainCoins,
          u.level,
          u.xp,
          u.is_sub,
          u.inventory,
          GROUP_CONCAT(ub.badge_id ORDER BY ub.badge_id SEPARATOR ',') AS badges
        FROM users u
        LEFT JOIN user_badges ub ON ub.username = u.username
        WHERE u.username = ?
        GROUP BY u.username
      `, [username]);
      row = (rows as any[])[0];
    } else {
      row = (db as Database.Database).prepare(`
        SELECT
          u.username,
          u.avatar,
          u.score,
          u.games_played,
          strftime('%s', u.last_played) * 1000 AS date,
          u.coins,
          u.brainCoins,
          u.level,
          u.xp,
          u.is_sub,
          u.inventory,
          GROUP_CONCAT(ub.badge_id, ',') AS badges
        FROM users u
        LEFT JOIN user_badges ub ON ub.username = u.username
        WHERE u.username = ?
        GROUP BY u.username
      `).get(username);
    }

    return row ? mapProfileRow(row) : null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function batchUpdateUserProfiles(
  updates: { username: string; avatar: string | undefined; score: number; coinsEarned: number; newBadges: (string | number)[] }[],
) {
  if (updates.length === 0) return;

  try {
    const db = await getDb();

    if (useMySQL) {
      const connection = await (db as mysql.Pool).getConnection();
      try {
        await connection.beginTransaction();

        for (const update of updates) {
          const xpGained = Math.max(0, update.score) * 10;
          await connection.query(
            `INSERT INTO users (username, avatar, score, games_played, last_played, coins, xp, level, inventory)
             VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, ?, ?, 1, '[]')
             ON DUPLICATE KEY UPDATE
               avatar = COALESCE(VALUES(avatar), avatar),
               score = GREATEST(score, VALUES(score)),
               games_played = games_played + 1,
               last_played = CURRENT_TIMESTAMP,
               coins = coins + VALUES(coins),
               xp = xp + VALUES(xp),
               level = FLOOR((xp + VALUES(xp)) / 1000) + 1`,
            [update.username, update.avatar || null, update.score, update.coinsEarned, xpGained],
          );

          for (const badgeId of update.newBadges) {
            await connection.query(
              `INSERT INTO user_badges (username, badge_id)
               VALUES (?, ?)
               ON DUPLICATE KEY UPDATE badge_id = badge_id`,
              [update.username, String(badgeId)],
            );
          }
        }

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      return;
    }

    const sqlite = db as Database.Database;
    const transaction = sqlite.transaction((payload) => {
      for (const update of payload) {
        const xpGained = Math.max(0, update.score) * 10;
        sqlite
          .prepare(`
            INSERT INTO users (username, avatar, score, games_played, last_played, coins, xp, level, inventory)
            VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, ?, ?, 1, '[]')
            ON CONFLICT(username) DO UPDATE SET
              avatar = COALESCE(excluded.avatar, users.avatar),
              score = MAX(users.score, excluded.score),
              games_played = users.games_played + 1,
              last_played = CURRENT_TIMESTAMP,
              coins = users.coins + excluded.coins,
              xp = users.xp + excluded.xp,
              level = CAST(((users.xp + excluded.xp) / 1000) AS INTEGER) + 1
          `)
          .run(update.username, update.avatar || null, update.score, update.coinsEarned, xpGained);

        for (const badgeId of update.newBadges) {
          sqlite
            .prepare(
              `INSERT INTO user_badges (username, badge_id)
               VALUES (?, ?)
               ON CONFLICT(username, badge_id) DO NOTHING`,
            )
            .run(update.username, String(badgeId));
        }
      }
    });

    transaction(updates);
  } catch (error) {
    console.error('Error batch updating user profiles:', error);
  }
}

export async function buyItem(username: string, itemId: string | number, cost: number): Promise<boolean> {
  try {
    const db = await getDb();
    const profile = await getUserProfile(username);
    if (!profile || profile.coins < cost) return false;

    const inventory = [...profile.inventory, itemId];

    if (useMySQL) {
      await (db as mysql.Pool).query('UPDATE users SET coins = coins - ?, inventory = ? WHERE username = ?', [cost, JSON.stringify(inventory), username]);
    } else {
      (db as Database.Database).prepare('UPDATE users SET coins = coins - ?, inventory = ? WHERE username = ?').run(cost, JSON.stringify(inventory), username);
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

    const inventory = [...profile.inventory];
    const index = inventory.findIndex((entry) => entry === itemId);
    if (index === -1) return false;

    inventory.splice(index, 1);

    if (useMySQL) {
      await (db as mysql.Pool).query('UPDATE users SET inventory = ? WHERE username = ?', [JSON.stringify(inventory), username]);
    } else {
      (db as Database.Database).prepare('UPDATE users SET inventory = ? WHERE username = ?').run(JSON.stringify(inventory), username);
    }

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

    const db = await getDb();
    const newStatus = !profile.is_sub;

    if (useMySQL) {
      await (db as mysql.Pool).query('UPDATE users SET is_sub = ? WHERE username = ?', [newStatus ? 1 : 0, username]);
    } else {
      (db as Database.Database).prepare('UPDATE users SET is_sub = ? WHERE username = ?').run(newStatus ? 1 : 0, username);
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
    let rows: any[] = [];

    if (useMySQL) {
      const [result] = await (db as mysql.Pool).query(
        `SELECT id, theme_id, text, options, correctOptionIndex, author, status
         FROM submit_questions
         WHERE status = 'pending'
         ORDER BY created_at DESC`,
      );
      rows = result as any[];
    } else {
      rows = (db as Database.Database)
        .prepare(
          `SELECT id, theme_id, text, options, correctOptionIndex, author, status
           FROM submit_questions
           WHERE status = 'pending'
           ORDER BY created_at DESC`,
        )
        .all();
    }

    return rows.map((row) => ({
      id: row.id,
      text: row.text,
      options: parseOptions(row.options),
      correctOptionIndex: Number(row.correctOptionIndex),
      author: row.author,
      theme: row.theme_id,
      status: row.status,
    }));
  } catch (error) {
    console.error('Error fetching pending questions:', error);
    return [];
  }
}

export async function addSubmittedQuestion(q: SubmittedQuestion) {
  try {
    const db = await getDb();
    const themeId = toThemeId(q.theme);

    if (useMySQL) {
      await (db as mysql.Pool).query(
        `INSERT INTO submit_questions (theme_id, text, options, correctOptionIndex, author, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [themeId, q.text, JSON.stringify(q.options), q.correctOptionIndex, q.author, q.status],
      );
      return;
    }

    (db as Database.Database)
      .prepare(
        'INSERT INTO submit_questions (theme_id, text, options, correctOptionIndex, author, status) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(themeId, q.text, JSON.stringify(q.options), q.correctOptionIndex, q.author, q.status);
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
      (db as Database.Database).prepare('UPDATE submit_questions SET status = ? WHERE id = ?').run(status, id);
    }
  } catch (error) {
    console.error('Error updating question status:', error);
  }
}

export async function getAllBadges() {
  try {
    const db = await getDb();
    let badges: any[] = [];
    let totalUsers = 1;

    if (useMySQL) {
      const [badgeRows] = await (db as mysql.Pool).query('SELECT * FROM badges ORDER BY name ASC');
      const [userRows] = await (db as mysql.Pool).query('SELECT COUNT(*) AS count FROM users');
      badges = badgeRows as any[];
      totalUsers = Number((userRows as any[])[0]?.count || 1);

      for (const badge of badges) {
        const [countRows] = await (db as mysql.Pool).query('SELECT COUNT(*) AS count FROM user_badges WHERE badge_id = ?', [badge.id]);
        badge.rarity = Math.round((Number((countRows as any[])[0]?.count || 0) / totalUsers) * 100);
      }
    } else {
      const sqlite = db as Database.Database;
      badges = sqlite.prepare('SELECT * FROM badges ORDER BY name ASC').all();
      totalUsers = Number(sqlite.prepare('SELECT COUNT(*) AS count FROM users').get()?.count || 1);

      for (const badge of badges) {
        badge.rarity = Math.round(
          (Number(sqlite.prepare('SELECT COUNT(*) AS count FROM user_badges WHERE badge_id = ?').get(badge.id)?.count || 0) / totalUsers) * 100,
        );
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
      const [rows] = await (db as mysql.Pool).query(`
        SELECT ai.id, ai.seller, ai.item_id AS itemId, ai.price, ai.currency, UNIX_TIMESTAMP(ai.created_at) * 1000 AS createdAt,
               si.name, si.description, si.icon, si.type
        FROM auction_items ai
        JOIN shop_items si ON si.id = ai.item_id
        ORDER BY ai.created_at DESC
      `);
      return rows as any[];
    }

    return (db as Database.Database)
      .prepare(`
        SELECT ai.id, ai.seller, ai.item_id AS itemId, ai.price, ai.currency, strftime('%s', ai.created_at) * 1000 AS createdAt,
               si.name, si.description, si.icon, si.type
        FROM auction_items ai
        JOIN shop_items si ON si.id = ai.item_id
        ORDER BY ai.created_at DESC
      `)
      .all();
  } catch (error) {
    console.error('Error fetching auction items:', error);
    return [];
  }
}

export async function awardBadgeXp(username: string, badgeId: string | number, xp: number) {
  try {
    const db = await getDb();
    const normalizedBadgeId = String(badgeId);

    if (useMySQL) {
      const [rows] = await (db as mysql.Pool).query('SELECT xp FROM user_badges WHERE username = ? AND badge_id = ?', [username, normalizedBadgeId]);
      const currentXp = Number((rows as any[])[0]?.xp || 0);
      const nextXp = currentXp + xp;
      const nextLevel = Math.floor(nextXp / 100) + 1;

      await (db as mysql.Pool).query(
        `INSERT INTO user_badges (username, badge_id, level, xp)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE xp = VALUES(xp), level = VALUES(level)`,
        [username, normalizedBadgeId, nextLevel, nextXp],
      );
      return;
    }

    const sqlite = db as Database.Database;
    const currentXp = Number(sqlite.prepare('SELECT xp FROM user_badges WHERE username = ? AND badge_id = ?').get(username, normalizedBadgeId)?.xp || 0);
    const nextXp = currentXp + xp;
    const nextLevel = Math.floor(nextXp / 100) + 1;

    sqlite
      .prepare(
        `INSERT INTO user_badges (username, badge_id, level, xp)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(username, badge_id) DO UPDATE SET xp = excluded.xp, level = excluded.level`,
      )
      .run(username, normalizedBadgeId, nextLevel, nextXp);
  } catch (error) {
    console.error('Error awarding badge XP:', error);
  }
}

export async function updateUserProfile(username: string, updates: Partial<any>) {
  try {
    const keys = Object.keys(updates).filter((key) => updates[key] !== undefined);
    if (keys.length === 0) return;

    const db = await getDb();
    const setClause = keys.map((key) => `${key} = ?`).join(', ');
    const values = keys.map((key) => updates[key]);

    if (useMySQL) {
      await (db as mysql.Pool).query(`UPDATE users SET ${setClause} WHERE username = ?`, [...values, username]);
    } else {
      (db as Database.Database).prepare(`UPDATE users SET ${setClause} WHERE username = ?`).run(...values, username);
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
}

export async function openLootBox(username: string, boxType: 'standard' | 'premium'): Promise<{ success: boolean; item?: any; message?: string }> {
  try {
    const profile = await getUserProfile(username);
    if (!profile) return { success: false, message: 'Profil introuvable' };

    const currency = boxType === 'standard' ? 'coins' : 'brainCoins';
    const cost = boxType === 'standard' ? 500 : 5;

    if ((profile as any)[currency] < cost) {
      return { success: false, message: 'Fonds insuffisants' };
    }

    const shopItems = await getShopItems();
    if (shopItems.length === 0) {
      return { success: false, message: 'Boutique vide' };
    }

    const reward = shopItems[Math.floor(Math.random() * shopItems.length)];
    const inventory = [...profile.inventory, reward.id];
    const db = await getDb();

    if (useMySQL) {
      await (db as mysql.Pool).query(
        `UPDATE users SET ${currency} = ${currency} - ?, inventory = ? WHERE username = ?`,
        [cost, JSON.stringify(inventory), username],
      );
    } else {
      (db as Database.Database)
        .prepare(`UPDATE users SET ${currency} = ${currency} - ?, inventory = ? WHERE username = ?`)
        .run(cost, JSON.stringify(inventory), username);
    }

    return { success: true, item: reward };
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

    const inventory = [...profile.inventory];
    const index = inventory.findIndex((entry) => entry === itemId);
    if (index === -1) return false;

    inventory.splice(index, 1);

    if (useMySQL) {
      const connection = await (db as mysql.Pool).getConnection();
      try {
        await connection.beginTransaction();
        await connection.query('UPDATE users SET inventory = ? WHERE username = ?', [JSON.stringify(inventory), username]);
        await connection.query('INSERT INTO auction_items (seller, item_id, price, currency) VALUES (?, ?, ?, ?)', [username, String(itemId), price, currency]);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      return true;
    }

    const sqlite = db as Database.Database;
    const transaction = sqlite.transaction(() => {
      sqlite.prepare('UPDATE users SET inventory = ? WHERE username = ?').run(JSON.stringify(inventory), username);
      sqlite.prepare('INSERT INTO auction_items (seller, item_id, price, currency) VALUES (?, ?, ?, ?)').run(username, String(itemId), price, currency);
    });
    transaction();
    return true;
  } catch (error) {
    console.error('Error listing item for auction:', error);
    return false;
  }
}

export async function addBrainCoins(username: string, amount: number): Promise<boolean> {
  try {
    await ensureUserExists(username);
    const db = await getDb();
    if (useMySQL) {
      await (db as mysql.Pool).query('UPDATE users SET brainCoins = brainCoins + ? WHERE username = ?', [amount, username]);
    } else {
      (db as Database.Database).prepare('UPDATE users SET brainCoins = brainCoins + ? WHERE username = ?').run(amount, username);
    }
    return true;
  } catch (error) {
    console.error('Error adding brain coins:', error);
    return false;
  }
}
