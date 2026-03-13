import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import type { GlobalLeaderboardEntry, SubmittedQuestion, Question, Theme } from '../types.ts';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        username VARCHAR(255) PRIMARY KEY,
        avatar VARCHAR(255),
        score INT NOT NULL DEFAULT 0,
        games_played INT NOT NULL DEFAULT 0,
        last_played DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        coins INT NOT NULL DEFAULT 0,
        is_sub BOOLEAN DEFAULT FALSE,
        badges JSON,
        inventory JSON
      )
    `);

    // Safely add columns if table already exists
    const cols = [
      'coins INT NOT NULL DEFAULT 0',
      'is_sub BOOLEAN DEFAULT FALSE',
      'badges JSON',
      'inventory JSON'
    ];
    for (const col of cols) {
      try {
        await pool.query(`ALTER TABLE leaderboard ADD COLUMN ${col}`);
      } catch (e) {
        // Ignore errors if columns already exist
      }
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS submitted_questions (
        id VARCHAR(255) PRIMARY KEY,
        theme VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        options JSON NOT NULL,
        correctOptionIndex INT NOT NULL,
        author VARCHAR(255) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS themes (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(255) PRIMARY KEY,
        theme_id VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        options JSON NOT NULL,
        correctOptionIndex INT NOT NULL,
        timeLimit INT NOT NULL DEFAULT 15,
        is_custom BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Base de données MySQL initialisée avec succès');
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de la base de données:", error);
  }
}

export async function getThemesWithQuestions(): Promise<Record<string, Theme>> {
  try {
    const [themes]: any = await pool.query('SELECT * FROM themes');
    const [questions]: any = await pool.query('SELECT * FROM questions');

    const result: Record<string, Theme> = {};
    for (const t of themes) {
      result[t.id] = { id: t.id, name: t.name, questions: [] };
    }
    for (const q of questions) {
      if (result[q.theme_id]) {
        result[q.theme_id].questions.push({
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
    console.error('Error fetching themes:', error);
    return {};
  }
}

export async function addTheme(id: string, name: string) {
  try {
    await pool.query('INSERT IGNORE INTO themes (id, name) VALUES (?, ?)', [id, name]);
  } catch (error) {
    console.error('Error adding theme:', error);
  }
}

export async function addQuestion(q: Question, themeId: string, isCustom: boolean = true) {
  try {
    await pool.query(
      'INSERT INTO questions (id, theme_id, text, options, correctOptionIndex, timeLimit, is_custom) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [q.id, themeId, q.text, JSON.stringify(q.options), q.correctOptionIndex, q.timeLimit || 15, isCustom]
    );
  } catch (error) {
    console.error('Error adding question:', error);
  }
}

export async function getLeaderboard(): Promise<GlobalLeaderboardEntry[]> {
  try {
    const [rows] = await pool.query('SELECT username, avatar, score, games_played, UNIX_TIMESTAMP(last_played) * 1000 as date, coins, is_sub, badges, inventory FROM leaderboard ORDER BY score DESC LIMIT 50');
    return (rows as any[]).map(row => ({
      ...row,
      is_sub: !!row.is_sub,
      badges: typeof row.badges === 'string' ? JSON.parse(row.badges) : (row.badges || []),
      inventory: typeof row.inventory === 'string' ? JSON.parse(row.inventory) : (row.inventory || [])
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

export async function getUserProfile(username: string): Promise<GlobalLeaderboardEntry | null> {
  try {
    const [rows]: any = await pool.query('SELECT username, avatar, score, games_played, UNIX_TIMESTAMP(last_played) * 1000 as date, coins, is_sub, badges, inventory FROM leaderboard WHERE username = ?', [username]);
    if (rows.length > 0) {
      const row = rows[0];
      return {
        ...row,
        is_sub: !!row.is_sub,
        badges: typeof row.badges === 'string' ? JSON.parse(row.badges) : (row.badges || []),
        inventory: typeof row.inventory === 'string' ? JSON.parse(row.inventory) : (row.inventory || [])
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateUserProfile(username: string, avatar: string | undefined, score: number, coinsEarned: number, newBadges: string[]) {
  try {
    const profile = await getUserProfile(username);
    const currentBadges = profile?.badges || [];
    const mergedBadges = Array.from(new Set([...currentBadges, ...newBadges]));

    await pool.query(`
      INSERT INTO leaderboard (username, avatar, score, games_played, coins, badges, inventory) 
      VALUES (?, ?, ?, 1, ?, ?, '[]') 
      ON DUPLICATE KEY UPDATE 
        avatar = VALUES(avatar),
        score = GREATEST(score, VALUES(score)),
        games_played = games_played + 1,
        coins = coins + VALUES(coins),
        badges = VALUES(badges)
    `, [username, avatar, score, coinsEarned, JSON.stringify(mergedBadges)]);
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
}

export async function buyItem(username: string, itemId: string, cost: number): Promise<boolean> {
  try {
    const profile = await getUserProfile(username);
    if (!profile || profile.coins < cost) return false;

    const newInventory = [...profile.inventory, itemId];
    await pool.query('UPDATE leaderboard SET coins = coins - ?, inventory = ? WHERE username = ?', [cost, JSON.stringify(newInventory), username]);
    return true;
  } catch (error) {
    console.error('Error buying item:', error);
    return false;
  }
}

export async function useItem(username: string, itemId: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(username);
    if (!profile) return false;

    const itemIndex = profile.inventory.indexOf(itemId);
    if (itemIndex === -1) return false;

    const newInventory = [...profile.inventory];
    newInventory.splice(itemIndex, 1);

    await pool.query('UPDATE leaderboard SET inventory = ? WHERE username = ?', [JSON.stringify(newInventory), username]);
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
    const newStatus = !profile.is_sub;
    await pool.query('UPDATE leaderboard SET is_sub = ? WHERE username = ?', [newStatus, username]);
    return newStatus;
  } catch (error) {
    console.error('Error toggling sub status:', error);
    return false;
  }
}

export async function updateLeaderboard(players: any[]) {
  // Deprecated: use updateUserProfile instead
}

export async function getPendingQuestions(): Promise<SubmittedQuestion[]> {
  try {
    const [rows] = await pool.query('SELECT * FROM submitted_questions WHERE status = "pending" ORDER BY created_at DESC');
    return (rows as any[]).map(row => ({
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
    await pool.query(`
      INSERT INTO submitted_questions (id, theme, text, options, correctOptionIndex, author, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [q.id, q.theme, q.text, JSON.stringify(q.options), q.correctOptionIndex, q.author, q.status]);
  } catch (error) {
    console.error('Error adding submitted question:', error);
  }
}

export async function updateSubmittedQuestionStatus(id: string, status: 'approved' | 'rejected') {
  try {
    await pool.query('UPDATE submitted_questions SET status = ? WHERE id = ?', [status, id]);
  } catch (error) {
    console.error('Error updating question status:', error);
  }
}
