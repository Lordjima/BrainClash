import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFileAtPath('src/lib/db.ts');
const sourceFile = project.getSourceFileOrThrow('src/lib/db.ts');

// Update openLootBox
const openLootBoxFunc = sourceFile.getFunction('openLootBox');
if (openLootBoxFunc) {
  openLootBoxFunc.setBodyText(`
  try {
    const db = await getDb();
    const profile = await getUserProfile(username);
    if (!profile) return { success: false, message: 'User not found' };

    const cost = boxType === 'standard' ? 50 : 100;
    const currency = boxType === 'standard' ? 'coins' : 'brainCoins';

    if (profile[currency] < cost) {
      return { success: false, message: 'Fonds insuffisants' };
    }

    // Define loot table
    const shopItems = await getShopItems();
    if (shopItems.length === 0) return { success: false, message: 'Boutique vide' };

    // Randomly pick an item
    const randomItem = shopItems[Math.floor(Math.random() * shopItems.length)];

    // Deduct cost
    await (db as mysql.Pool).query(\`UPDATE users SET \${currency} = \${currency} - ? WHERE username = ?\`, [cost, username]);

    // Add to inventory
    await (db as mysql.Pool).query('INSERT INTO inventory_items (username, item_id, quantity) VALUES (?, ?, 1)', [username, randomItem.id]);

    return { success: true, item: randomItem };
  } catch (error) {
    console.error('Error opening loot box:', error);
    return { success: false, message: 'Erreur serveur' };
  }
  `);
}

// Update listItemForAuction
const listItemForAuctionFunc = sourceFile.getFunction('listItemForAuction');
if (listItemForAuctionFunc) {
  listItemForAuctionFunc.setBodyText(`
  try {
    const db = await getDb();
    const profile = await getUserProfile(username);
    if (!profile) return false;

    // Check if user has the item
    const [invRows] = await (db as mysql.Pool).query('SELECT id FROM inventory_items WHERE username = ? AND item_id = ? LIMIT 1', [username, itemId]);
    if ((invRows as any[]).length === 0) {
      return false;
    }

    const invId = (invRows as any[])[0].id;

    // Remove from inventory
    await (db as mysql.Pool).query('DELETE FROM inventory_items WHERE id = ?', [invId]);

    // Add to auction
    await (db as mysql.Pool).query('INSERT INTO auction_items (seller, item_id, price, currency, created_at) VALUES (?, ?, ?, ?, NOW())', [username, itemId, price, currency]);

    return true;
  } catch (error) {
    console.error('Error listing item for auction:', error);
    return false;
  }
  `);
}

// Update buyAuctionItem
const buyAuctionItemFunc = sourceFile.getFunction('buyAuctionItem');
if (buyAuctionItemFunc) {
  buyAuctionItemFunc.setBodyText(`
  try {
    const db = await getDb();
    const profile = await getUserProfile(buyerUsername);
    if (!profile) return { success: false, message: 'User not found' };

    const [auctionRows] = await (db as mysql.Pool).query('SELECT * FROM auction_items WHERE id = ?', [auctionId]);
    const auction = (auctionRows as any[])[0];
    if (!auction) return { success: false, message: 'Auction not found' };

    if (profile[auction.currency] < auction.price) {
      return { success: false, message: \`Not enough \${auction.currency}\` };
    }

    // Deduct currency from buyer
    await (db as mysql.Pool).query(\`UPDATE users SET \${auction.currency} = \${auction.currency} - ? WHERE username = ?\`, [auction.price, buyerUsername]);

    // Add currency to seller
    await (db as mysql.Pool).query(\`UPDATE users SET \${auction.currency} = \${auction.currency} + ? WHERE username = ?\`, [auction.price, auction.seller]);

    // Add item to buyer's inventory
    await (db as mysql.Pool).query('INSERT INTO inventory_items (username, item_id, quantity) VALUES (?, ?, 1)', [buyerUsername, auction.item_id]);

    // Remove auction
    await (db as mysql.Pool).query('DELETE FROM auction_items WHERE id = ?', [auctionId]);

    return { success: true, message: 'Item purchased successfully' };
  } catch (error) {
    console.error('Error buying auction item:', error);
    return { success: false, message: 'Internal server error' };
  }
  `);
}

// Check saveUserProfile for 'inventory' in INSERT
const saveUserProfileFunc = sourceFile.getFunction('saveUserProfile');
if (saveUserProfileFunc) {
  let text = saveUserProfileFunc.getBodyText();
  if (text && text.includes('INSERT INTO users (username, avatar, score, games_played, coins, xp, level, inventory)')) {
    text = text.replace('INSERT INTO users (username, avatar, score, games_played, coins, xp, level, inventory)', 'INSERT INTO users (username, avatar, score, games_played, coins, xp, level)');
    saveUserProfileFunc.setBodyText(text);
  }
}

sourceFile.saveSync();
console.log('Updated remaining inventory references.');
