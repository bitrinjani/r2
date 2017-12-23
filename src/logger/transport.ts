import pretty from './pretty';
import * as fs from 'fs';

const infoFile = fs.createWriteStream('logs/info.log', { flags: 'a' });
const debugFile = fs.createWriteStream('logs/debug.log', { flags: 'a' });
process.stdin.pipe(pretty({ colorize: true, withLabel: false, debug: false })).pipe(process.stdout);
process.stdin.pipe(pretty({ colorize: false, withLabel: true, debug: false })).pipe(infoFile);
process.stdin.pipe(pretty({ colorize: false, withLabel: true, debug: true })).pipe(debugFile);
