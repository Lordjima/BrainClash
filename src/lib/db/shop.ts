import { query } from './core';
import { getUserProfile } from './users';

export async function getShopItems(): Promise<any[]> {
  try {
    return await query('SELECT * FROM shop_items');
  } catch (error) {
    console.error('Error fetching shop items:', error);
    return [];
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

export async function getAllBadges() {
  try {
    return await query('SELECT * FROM badges');
  } catch (error) {
    console.error('Error fetching all badges:', error);
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
