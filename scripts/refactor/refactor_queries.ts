import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFileAtPath('src/lib/db.ts');
const sourceFile = project.getSourceFileOrThrow('src/lib/db.ts');

// Update getLeaderboard
const getLeaderboardFunc = sourceFile.getFunction('getLeaderboard');
if (getLeaderboardFunc) {
  getLeaderboardFunc.setBodyText(`
  try {
    const db = await getDb();
    let rows: any[];
    const [qRows] = await (db as mysql.Pool).query(\`
        SELECT u.username, u.avatar, u.score, u.games_played, UNIX_TIMESTAMP(u.last_played) * 1000 as date, 
        u.coins, u.brainCoins, u.level, u.xp, u.is_sub,
        GROUP_CONCAT(DISTINCT ub.badge_id) as badges,
        GROUP_CONCAT(DISTINCT ii.item_id) as inventory
        FROM users u
        LEFT JOIN user_badges ub ON u.username = ub.username
        LEFT JOIN inventory_items ii ON u.username = ii.username
        GROUP BY u.username
        ORDER BY u.score DESC LIMIT 50
      \`);
    rows = qRows as any[];
    return rows.map(row => {
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
  `);
}

// Update getUserProfile
const getUserProfileFunc = sourceFile.getFunction('getUserProfile');
if (getUserProfileFunc) {
  getUserProfileFunc.setBodyText(`
  try {
    const db = await getDb();
    let rows: any[];
    const [qRows] = await (db as mysql.Pool).query(\`
        SELECT u.username, u.avatar, u.score, u.games_played, UNIX_TIMESTAMP(u.last_played) * 1000 as date, 
        u.coins, u.brainCoins, u.level, u.xp, u.is_sub,
        GROUP_CONCAT(DISTINCT ub.badge_id) as badges,
        GROUP_CONCAT(DISTINCT ii.item_id) as inventory
        FROM users u
        LEFT JOIN user_badges ub ON u.username = ub.username
        LEFT JOIN inventory_items ii ON u.username = ii.username
        WHERE u.username = ?
        GROUP BY u.username
      \`, [username]);
    rows = qRows as any[];
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
  `);
}

// Update saveUserProfile
const saveUserProfileFunc = sourceFile.getFunction('saveUserProfile');
if (saveUserProfileFunc) {
  saveUserProfileFunc.setBodyText(`
  try {
    const db = await getDb();
    await (db as mysql.Pool).query(\`
      INSERT INTO users (username, avatar, score, games_played, coins, xp, level) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      avatar = VALUES(avatar), score = VALUES(score), games_played = VALUES(games_played),
      coins = VALUES(coins), xp = VALUES(xp), level = VALUES(level)
    \`, [profile.username, profile.avatar || '', profile.score, profile.games_played, profile.coins, profile.xp, profile.level]);

    // Save inventory items
    if (profile.inventory && profile.inventory.length > 0) {
      // Clear existing inventory
      await (db as mysql.Pool).query('DELETE FROM inventory_items WHERE username = ?', [profile.username]);
      // Insert new inventory
      for (const itemId of profile.inventory) {
        await (db as mysql.Pool).query('INSERT INTO inventory_items (username, item_id, quantity) VALUES (?, ?, 1)', [profile.username, itemId]);
      }
    }
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
  `);
}

// Update buyItem
const buyItemFunc = sourceFile.getFunction('buyItem');
if (buyItemFunc) {
  buyItemFunc.setBodyText(`
  try {
    const db = await getDb();
    const profile = await getUserProfile(username);
    if (!profile) return { success: false, message: 'User not found' };

    const [items] = await (db as mysql.Pool).query('SELECT * FROM shop_items WHERE id = ?', [itemId]);
    const item = (items as any[])[0];
    if (!item) return { success: false, message: 'Item not found' };

    const cost = item.price;
    if (profile.coins < cost) {
      return { success: false, message: 'Not enough coins' };
    }

    // Deduct coins
    await (db as mysql.Pool).query('UPDATE users SET coins = coins - ? WHERE username = ?', [cost, username]);
    
    // Add to inventory
    await (db as mysql.Pool).query('INSERT INTO inventory_items (username, item_id, quantity) VALUES (?, ?, 1)', [username, itemId]);

    return { success: true, message: 'Item purchased successfully' };
  } catch (error) {
    console.error('Error buying item:', error);
    return { success: false, message: 'Internal server error' };
  }
  `);
}

// Update useItem
const useItemFunc = sourceFile.getFunction('useItem');
if (useItemFunc) {
  useItemFunc.setBodyText(`
  try {
    const db = await getDb();
    const profile = await getUserProfile(username);
    if (!profile) return { success: false, message: 'User not found' };

    // Check if user has the item
    const [invRows] = await (db as mysql.Pool).query('SELECT id FROM inventory_items WHERE username = ? AND item_id = ? LIMIT 1', [username, itemId]);
    if ((invRows as any[]).length === 0) {
      return { success: false, message: 'Item not in inventory' };
    }

    const invId = (invRows as any[])[0].id;

    // Remove from inventory
    await (db as mysql.Pool).query('DELETE FROM inventory_items WHERE id = ?', [invId]);

    return { success: true, message: 'Item used successfully' };
  } catch (error) {
    console.error('Error using item:', error);
    return { success: false, message: 'Internal server error' };
  }
  `);
}

// Update openChest
const openChestFunc = sourceFile.getFunction('openChest');
if (openChestFunc) {
  openChestFunc.setBodyText(`
  try {
    const db = await getDb();
    const profile = await getUserProfile(username);
    if (!profile) return { success: false, message: 'User not found' };

    const cost = chestType === 'premium' ? 50 : 100;
    const currency = chestType === 'premium' ? 'brainCoins' : 'coins';

    if (profile[currency] < cost) {
      return { success: false, message: \`Not enough \${currency}\` };
    }

    // Deduct cost
    await (db as mysql.Pool).query(\`UPDATE users SET \${currency} = \${currency} - ? WHERE username = ?\`, [cost, username]);

    // Get random item
    const [items] = await (db as mysql.Pool).query('SELECT * FROM shop_items');
    const shopItems = items as any[];
    if (shopItems.length === 0) return { success: false, message: 'No items in shop' };

    const randomItem = shopItems[Math.floor(Math.random() * shopItems.length)];

    // Add to inventory
    await (db as mysql.Pool).query('INSERT INTO inventory_items (username, item_id, quantity) VALUES (?, ?, 1)', [username, randomItem.id]);

    return { success: true, item: randomItem };
  } catch (error) {
    console.error('Error opening chest:', error);
    return { success: false, message: 'Internal server error' };
  }
  `);
}

sourceFile.saveSync();
console.log('Updated db.ts queries.');
