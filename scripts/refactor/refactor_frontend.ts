import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs';

const project = new Project();
project.addSourceFilesAtPaths('src/**/*.tsx');
project.addSourceFilesAtPaths('src/**/*.ts');

const pagesToMove = [
  'Home.tsx',
  'HostDashboard.tsx',
  'PlayerScreen.tsx',
  'Overlay.tsx',
  'Profile.tsx',
  'CreateQuiz.tsx',
  'SubmitQuestion.tsx',
  'ReviewQuestions.tsx',
  'AuctionHouse.tsx',
  'Dashboard.tsx'
];

for (const page of pagesToMove) {
  const oldPath = 'src/components/' + page;
  const newPath = 'src/pages/' + page;
  
  if (fs.existsSync(oldPath)) {
    const sourceFile = project.getSourceFileOrThrow(oldPath);
    
    // Update imports inside the file
    const imports = sourceFile.getImportDeclarations();
    for (const imp of imports) {
      const moduleSpecifier = imp.getModuleSpecifierValue();
      
      if (moduleSpecifier.startsWith('./')) {
        imp.setModuleSpecifier(moduleSpecifier.replace('./', '../components/'));
      } else if (moduleSpecifier.startsWith('../')) {
        // Wait, if it imports from '../lib/db' and we move it to 'src/pages', it's still '../lib/db'
        // But if it imports from '../../lib/db', it would be wrong.
        // Let's just leave '../' alone because 'pages' is at the same depth as 'components'.
      }
    }
    
    // Move the file
    sourceFile.moveToDirectory('src/pages');
  }
}

// Update App.tsx imports
const appFile = project.getSourceFileOrThrow('src/App.tsx');
const appImports = appFile.getImportDeclarations();
for (const imp of appImports) {
  const moduleSpecifier = imp.getModuleSpecifierValue();
  for (const page of pagesToMove) {
    const pageName = page.replace('.tsx', '');
    if (moduleSpecifier === './components/' + pageName) {
      imp.setModuleSpecifier('./pages/' + pageName);
    }
  }
}

project.saveSync();
console.log('Frontend refactored successfully.');
