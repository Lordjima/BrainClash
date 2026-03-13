import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFileAtPath('server/game.ts');
project.addSourceFileAtPath('server/socket.ts');

const gameFile = project.getSourceFileOrThrow('server/game.ts');
let gameText = gameFile.getFullText();
gameText = gameText.replace(/room\\.status = 'showing_answer';/g, "room.showAnswer = true;");
gameText = gameText.replace(/r\\.status = 'playing';/g, "r.status = 'active'; r.showAnswer = false;");
gameFile.replaceWithText(gameText);
gameFile.saveSync();

const socketFile = project.getSourceFileOrThrow('server/socket.ts');
let socketText = socketFile.getFullText();
socketText = socketText.replace(/status: 'waiting'/g, "status: 'lobby', showAnswer: false");
socketText = socketText.replace(/room\\.status !== 'waiting'/g, "room.status !== 'lobby'");
socketText = socketText.replace(/room\\.status = 'playing';/g, "room.status = 'active'; room.showAnswer = false;");
socketText = socketText.replace(/room\\.status !== 'playing'/g, "room.status !== 'active' || room.showAnswer");
socketText = socketText.replace(/room\\.status = 'showing_answer';/g, "room.showAnswer = true;");
socketText = socketText.replace(/r\\.status = 'playing';/g, "r.status = 'active'; r.showAnswer = false;");
socketText = socketText.replace(/room\\.status === 'showing_answer'/g, "room.showAnswer");
socketText = socketText.replace(/room\\.status === 'waiting'/g, "room.status === 'lobby'");

socketFile.replaceWithText(socketText);
socketFile.saveSync();

console.log('Fixed game.ts and socket.ts');
