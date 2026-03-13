import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFileAtPath('src/lib/db.ts');
const sourceFile = project.getSourceFileOrThrow('src/lib/db.ts');

const initDBFunc = sourceFile.getFunction('initDB');
if (initDBFunc) {
  initDBFunc.setBodyText(`
  try {
    console.log(\`🚀 Initialisation de la base de données MySQL...\`);
    const db = await getDb();
    
    // Check connection
    await db.getConnection();

    const pool = db;
    
    // 1. users
    await pool.query(\`
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    \`);

    // 2. categories
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
      )
    \`);

    // 3. questions
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        text TEXT NOT NULL,
        options JSON NOT NULL,
        correctOptionIndex INT NOT NULL,
        timeLimit INT NOT NULL DEFAULT 15,
        is_custom BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    \`);

    // 4. submit_questions
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS submit_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
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
    \`);

    // 5. valid_questions
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS valid_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
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
    \`);

    // 6. badges
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS badges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(255)
      )
    \`);

    // user_badges (junction)
    await pool.query(\`
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
    \`);

    // 7. quiz
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS quiz (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INT NOT NULL,
        timeLimit INT NOT NULL DEFAULT 15,
        created_by VARCHAR(191),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(username) ON DELETE SET NULL
      )
    \`);

    // 8. shop_items
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS shop_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price INT NOT NULL,
        currency ENUM('coins', 'brainCoins') DEFAULT 'coins',
        icon VARCHAR(255),
        type ENUM('attack', 'defense', 'bonus', 'cosmetic') NOT NULL
      )
    \`);

    // 9. inventory_items
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(191) NOT NULL,
        item_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE
      )
    \`);

    // 10. auction_items
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS auction_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller VARCHAR(191) NOT NULL,
        item_id INT NOT NULL,
        price INT NOT NULL,
        currency ENUM('coins', 'brainCoins') DEFAULT 'coins',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller) REFERENCES users(username) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE
      )
    \`);

    // Migrations for existing tables (if needed)
    const [userColumns] = await pool.query('SHOW COLUMNS FROM users');
    const userColNames = (userColumns as any[]).map(c => c.Field);
    
    // Migrate inventory JSON to inventory_items if inventory column exists
    if (userColNames.includes('inventory')) {
      console.log('Migrating inventory JSON to inventory_items table...');
      const [users] = await pool.query('SELECT username, inventory FROM users WHERE inventory IS NOT NULL');
      for (const user of (users as any[])) {
        try {
          const inv = typeof user.inventory === 'string' ? JSON.parse(user.inventory) : user.inventory;
          if (Array.isArray(inv)) {
            for (const itemId of inv) {
              // Assuming itemId is string or number, but shop_items.id is INT.
              // We might need to handle string IDs if they were used before.
              // For now, insert if it's a valid number.
              const parsedId = parseInt(itemId);
              if (!isNaN(parsedId)) {
                await pool.query('INSERT INTO inventory_items (username, item_id, quantity) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE quantity = quantity + 1', [user.username, parsedId]);
              }
            }
          }
        } catch (e) {
          console.error('Failed to migrate inventory for user', user.username);
        }
      }
      // Drop the old inventory column
      await pool.query('ALTER TABLE users DROP COLUMN inventory');
    }

    await seedData();

    console.log(\`✅ Base de données MySQL initialisée avec succès\`);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de la base de données:", error);
  }
  `);
}

sourceFile.saveSync();
console.log('Updated initDB schema.');
