import AppRoot from './AppRoot';

const app = new AppRoot();
app.start();

process.on('SIGINT', () => {
  app.stop();
});

process.on('unhandledRejection', (reason, p) => {
  console.error(reason);
  app.stop();
});