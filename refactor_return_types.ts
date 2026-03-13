import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFileAtPath('src/lib/db.ts');
const sourceFile = project.getSourceFileOrThrow('src/lib/db.ts');

const buyItemFunc = sourceFile.getFunction('buyItem');
if (buyItemFunc) {
  buyItemFunc.setBodyText(`
  try {
    const db = await getDb();
    const profile = await getUserProfile(username);
    if (!profile) return false;

    const [items] = await (db as mysql.Pool).query('SELECT * FROM shop_items WHERE id = ?', [itemId]);
    const item = (items as any[])[0];
    if (!item) return false;

    if (profile.coins < cost) {
      return false;
    }

    // Deduct coins
    await (db as mysql.Pool).query('UPDATE users SET coins = coins - ? WHERE username = ?', [cost, username]);
    
    // Add to inventory
    await (db as mysql.Pool).query('INSERT INTO inventory_items (username, item_id, quantity) VALUES (?, ?, 1)', [username, itemId]);

    return true;
  } catch (error) {
    console.error('Error buying item:', error);
    return false;
  }
  `);
}

const useItemFunc = sourceFile.getFunction('useItem');
if (useItemFunc) {
  useItemFunc.setBodyText(`
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

    return true;
  } catch (error) {
    console.error('Error using item:', error);
    return false;
  }
  `);
}

sourceFile.saveSync();
console.log('Fixed return types.');
