import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";
import { env } from "./env";
import { logger } from "./logger";
import type {
  GlobalLeaderboardEntry,
  Question,
  SubmittedQuestion,
  Theme
} from "../types";

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) {
    return pool;
  }

  pool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    waitForConnections: true,
    connectionLimit: env.db.connectionLimit,
    queueLimit: 0
  });

  return pool;
}

export async function testDBConnection(): Promise<void> {
  const db = getPool();
  const connection = await db.getConnection();
  try {
    await connection.ping();
    logger.info("MySQL connection OK");
  } finally {
    connection.release();
  }
}

export async function initDB(): Promise<void> {
  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      username VARCHAR(120) PRIMARY KEY,
      avatar TEXT NULL,
      score INT NOT NULL DEFAULT 0,
      games_played INT NOT NULL DEFAULT 0,
      date BIGINT NOT NULL,
      coins INT NOT NULL DEFAULT 0,
      is_sub BOOLEAN NOT NULL DEFAULT FALSE,
      badges JSON NOT NULL,
      inventory JSON NOT NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS submitted_questions (
      id VARCHAR(64) PRIMARY KEY,
      text TEXT NOT NULL,
      options JSON NOT NULL,
      correct_option_index INT NOT NULL,
      author VARCHAR(255) NOT NULL,
      theme VARCHAR(255) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending'
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS themes (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(120) NOT NULL UNIQUE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id VARCHAR(64) PRIMARY KEY,
      theme_id VARCHAR(64) NOT NULL,
      text TEXT NOT NULL,
      options JSON NOT NULL,
      correct_option_index INT NOT NULL,
      time_limit INT NOT NULL DEFAULT 20,
      CONSTRAINT fk_questions_theme
        FOREIGN KEY (theme_id) REFERENCES themes(id)
        ON DELETE CASCADE
    )
  `);

  logger.info("Database initialized");
}

type LeaderboardRow = RowDataPacket & {
  username: string;
  avatar: string | null;
  score: number;
  games_played: number;
  date: number;
  coins: number;
  is_sub: number | boolean;
  badges: string;
  inventory: string;
};

export async function getLeaderboard(): Promise<GlobalLeaderboardEntry[]> {
  const db = getPool();

  const [rows] = await db.query<LeaderboardRow[]>(
    `
      SELECT username, avatar, score, games_played, date, coins, is_sub, badges, inventory
      FROM leaderboard
      ORDER BY score DESC, date ASC
      LIMIT 100
    `
  );

  return rows.map((row) => ({
    username: row.username,
    avatar: row.avatar ?? undefined,
    score: row.score,
    games_played: row.games_played,
    date: row.date,
    coins: row.coins,
    is_sub: Boolean(row.is_sub),
    badges: safeJsonParse<string[]>(row.badges, []),
    inventory: safeJsonParse<string[]>(row.inventory, [])
  }));
}

type SubmittedQuestionRow = RowDataPacket & {
  id: string;
  text: string;
  options: string;
  correct_option_index: number;
  author: string;
  theme: string;
  status: "pending" | "approved" | "rejected";
};

export async function getPendingQuestions(): Promise<SubmittedQuestion[]> {
  const db = getPool();

  const [rows] = await db.query<SubmittedQuestionRow[]>(
    `
      SELECT id, text, options, correct_option_index, author, theme, status
      FROM submitted_questions
      WHERE status = 'pending'
      ORDER BY id DESC
    `
  );

  return rows.map((row) => ({
    id: row.id,
    text: row.text,
    options: safeJsonParse<string[]>(row.options, []),
    correctOptionIndex: row.correct_option_index,
    author: row.author,
    theme: row.theme,
    status: row.status
  }));
}

export async function addSubmittedQuestion(input: SubmittedQuestion): Promise<void> {
  const db = getPool();

  await db.query(
    `
      INSERT INTO submitted_questions
      (id, text, options, correct_option_index, author, theme, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.id,
      input.text,
      JSON.stringify(input.options),
      input.correctOptionIndex,
      input.author,
      input.theme,
      input.status
    ]
  );
}

export async function updateSubmittedQuestionStatus(
  id: string,
  status: "pending" | "approved" | "rejected"
): Promise<void> {
  const db = getPool();

  await db.query(
    `
      UPDATE submitted_questions
      SET status = ?
      WHERE id = ?
    `,
    [status, id]
  );
}

type ThemeRow = RowDataPacket & {
  theme_id: string;
  theme_name: string;
  question_id: string | null;
  question_text: string | null;
  question_options: string | null;
  correct_option_index: number | null;
  time_limit: number | null;
};

export async function getThemesWithQuestions(): Promise<Record<string, Theme>> {
  const db = getPool();

  const [rows] = await db.query<ThemeRow[]>(
    `
      SELECT
        t.id AS theme_id,
        t.name AS theme_name,
        q.id AS question_id,
        q.text AS question_text,
        q.options AS question_options,
        q.correct_option_index,
        q.time_limit
      FROM themes t
      LEFT JOIN questions q ON q.theme_id = t.id
      ORDER BY t.name ASC
    `
  );

  const result: Record<string, Theme> = {};

  for (const row of rows) {
    if (!result[row.theme_id]) {
      result[row.theme_id] = {
        id: row.theme_id,
        name: row.theme_name,
        questions: []
      };
    }

    if (row.question_id && row.question_text && row.question_options) {
      const question: Question = {
        id: row.question_id,
        text: row.question_text,
        options: safeJsonParse<string[]>(row.question_options, []),
        correctOptionIndex: row.correct_option_index ?? 0,
        timeLimit: row.time_limit ?? 20
      };

      result[row.theme_id].questions.push(question);
    }
  }

  return result;
}

export async function addTheme(id: string, name: string): Promise<void> {
  const db = getPool();

  await db.query(
    `
      INSERT INTO themes (id, name)
      VALUES (?, ?)
    `,
    [id, name]
  );
}

export async function addQuestion(themeId: string, question: Question): Promise<void> {
  const db = getPool();

  await db.query(
    `
      INSERT INTO questions
      (id, theme_id, text, options, correct_option_index, time_limit)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      question.id,
      themeId,
      question.text,
      JSON.stringify(question.options),
      question.correctOptionIndex,
      question.timeLimit
    ]
  );
}

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

type UserProfileRow = RowDataPacket & {
  username: string;
  avatar: string | null;
  score: number;
  games_played: number;
  date: number;
  coins: number;
  is_sub: number | boolean;
  badges: string;
  inventory: string;
};

export async function getUserProfile(username: string): Promise<GlobalLeaderboardEntry | null> {
  const db = getPool();

  const [rows] = await db.query<UserProfileRow[]>(
    `
      SELECT username, avatar, score, games_played, date, coins, is_sub, badges, inventory
      FROM leaderboard
      WHERE username = ?
      LIMIT 1
    `,
    [username]
  );

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  return {
    username: row.username,
    avatar: row.avatar ?? undefined,
    score: row.score,
    games_played: row.games_played,
    date: row.date,
    coins: row.coins,
    is_sub: Boolean(row.is_sub),
    badges: safeJsonParse<string[]>(row.badges, []),
    inventory: safeJsonParse<string[]>(row.inventory, [])
  };
}

export async function updateUserProfile(profile: GlobalLeaderboardEntry): Promise<void> {
  const db = getPool();

  await db.query(
    `
      INSERT INTO leaderboard
      (username, avatar, score, games_played, date, coins, is_sub, badges, inventory)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        avatar = VALUES(avatar),
        score = VALUES(score),
        games_played = VALUES(games_played),
        date = VALUES(date),
        coins = VALUES(coins),
        is_sub = VALUES(is_sub),
        badges = VALUES(badges),
        inventory = VALUES(inventory)
    `,
    [
      profile.username,
      profile.avatar ?? null,
      profile.score,
      profile.games_played,
      profile.date,
      profile.coins,
      profile.is_sub,
      JSON.stringify(profile.badges ?? []),
      JSON.stringify(profile.inventory ?? [])
    ]
  );
}

export async function buyItem(username: string, itemId: string, price: number): Promise<boolean> {
  const profile = await getUserProfile(username);
  if (!profile) return false;
  if (profile.coins < price) return false;

  profile.coins -= price;
  profile.inventory = [...(profile.inventory ?? []), itemId];
  await updateUserProfile(profile);

  return true;
}

export async function useItem(username: string, itemId: string): Promise<boolean> {
  const profile = await getUserProfile(username);
  if (!profile) return false;

  const index = (profile.inventory ?? []).indexOf(itemId);
  if (index === -1) return false;

  profile.inventory.splice(index, 1);
  await updateUserProfile(profile);

  return true;
}

export async function toggleSubStatus(username: string): Promise<boolean> {
  const profile = await getUserProfile(username);
  if (!profile) return false;

  profile.is_sub = !profile.is_sub;
  await updateUserProfile(profile);

  return profile.is_sub;
}

export async function batchUpdateUserProfiles(profiles: GlobalLeaderboardEntry[]): Promise<void> {
  for (const profile of profiles) {
    await updateUserProfile(profile);
  }
}