import { Project } from 'ts-morph';
import fs from 'fs';

const project = new Project();
project.addSourceFilesAtPaths('src/pages/**/*.tsx');

for (const sourceFile of project.getSourceFiles()) {
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    
    // Fix paths that were adjusted for src/components/src/pages
    if (moduleSpecifier.startsWith('../../../')) {
      imp.setModuleSpecifier(moduleSpecifier.replace('../../../', '../'));
    } else if (moduleSpecifier.startsWith('../../')) {
      imp.setModuleSpecifier(moduleSpecifier.replace('../../', '../components/'));
    }
  }
}

project.saveSync();
console.log('Imports fixed in pages.');
