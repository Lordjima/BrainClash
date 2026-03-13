import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFileAtPath('scripts/seed.ts');
const sourceFile = project.getSourceFileOrThrow('scripts/seed.ts');

let text = sourceFile.getFullText();
text = text.split("await (db as mysql.Pool).query(").join("await query(");

sourceFile.replaceWithText(text);
sourceFile.saveSync();
console.log('Fixed seed.ts');
