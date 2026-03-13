import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFileAtPath('src/lib/db.ts');
const sourceFile = project.getSourceFileOrThrow('src/lib/db.ts');

const translateSqlFunc = sourceFile.getFunction('translateSql');
if (translateSqlFunc) {
  translateSqlFunc.setBodyText(`
  if (useMySQL) return sql;
  
  let translated = sql
    .replace(/AUTO_INCREMENT/g, 'AUTOINCREMENT')
    .replace(/ JSON/g, ' TEXT')
    .replace(/ ENUM\\([^)]+\\)/g, ' TEXT')
    .replace(/ DATETIME/g, ' TEXT')
    .replace(/ BOOLEAN/g, ' INTEGER')
    .replace(/ ON UPDATE CURRENT_TIMESTAMP/g, '')
    .replace(/INSERT IGNORE/g, 'INSERT OR IGNORE');

  // Translate ON DUPLICATE KEY UPDATE for saveUserProfile
  if (translated.includes('ON DUPLICATE KEY UPDATE')) {
    translated = translated.replace(
      /ON DUPLICATE KEY UPDATE\\s+avatar = VALUES\\(avatar\\), score = VALUES\\(score\\), games_played = VALUES\\(games_played\\),\\s+coins = VALUES\\(coins\\), xp = VALUES\\(xp\\), level = VALUES\\(level\\)/,
      'ON CONFLICT(username) DO UPDATE SET avatar = excluded.avatar, score = excluded.score, games_played = excluded.games_played, coins = excluded.coins, xp = excluded.xp, level = excluded.level'
    );
    
    // For batchUpdateUserProfiles
    translated = translated.replace(
      /ON DUPLICATE KEY UPDATE\\s+avatar = VALUES\\(avatar\\), score = score \\+ VALUES\\(score\\), games_played = games_played \\+ 1, coins = coins \\+ VALUES\\(coins\\)/,
      'ON CONFLICT(username) DO UPDATE SET avatar = excluded.avatar, score = score + excluded.score, games_played = games_played + 1, coins = coins + excluded.coins'
    );
    
    // For awardBadgeXp
    translated = translated.replace(
      /ON DUPLICATE KEY UPDATE xp = xp \\+ VALUES\\(xp\\)/,
      'ON CONFLICT(username, badge_id) DO UPDATE SET xp = xp + excluded.xp'
    );
  }

  // Translate UNIX_TIMESTAMP
  if (translated.includes('UNIX_TIMESTAMP')) {
    translated = translated.replace(/UNIX_TIMESTAMP\\(([^)]+)\\)/g, "strftime('%s', $1)");
  }

  // Translate NOW()
  if (translated.includes('NOW()')) {
    translated = translated.replace(/NOW\\(\\)/g, "CURRENT_TIMESTAMP");
  }

  return translated;
  `);
}

sourceFile.saveSync();
console.log('Fixed translateSql');
