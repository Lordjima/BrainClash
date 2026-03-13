import { query } from './core';
import type { GlobalLeaderboardEntry } from '../../types';

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

export async function addBrainCoins(username: string, amount: number): Promise<boolean> {
  try {
    await query('UPDATE users SET brainCoins = brainCoins + ? WHERE username = ?', [amount, username]);
    return true;
  } catch (error) {
    console.error('Error adding brainCoins:', error);
    return false;
  }
}
