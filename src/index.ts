import { exec } from "child_process";

import AppRoot from "./appRoot";
import container from "./container.config";

process.title = "r2app";
const app = new AppRoot(container);
// eslint-disable-next-line @typescript-eslint/no-floating-promises
app.start();

function exit(code: number = 0) {
  exec(`pkill ${process.title}`);
  process.exit(code);
}

process.on("SIGINT", async () => {
  console.log("SIGINT received. Stopping...");
  await app.stop();
  console.log("Stopped app.");
  exit();
});

process.on("unhandledRejection", async (reason, p) => {
  console.error(reason);
  await app.stop();
  console.log("Stopped app.");
  exit(1);
});
