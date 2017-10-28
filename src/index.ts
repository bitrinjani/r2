import AppRoot from './AppRoot';
import { exec } from 'child_process';

process.title = 'r2app';
const app = new AppRoot();
app.start();

function exit() {  
  exec(`pkill ${process.title}`);
}

process.on('SIGINT', () => {
  console.log('SIGINT received. Stopping...');
  app.stop();
  exit();
});

process.on('unhandledRejection', (reason, p) => {
  console.error(reason);
  app.stop();
  exit();
});