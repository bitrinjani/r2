import { getActivePairStore } from "../src/ActivePairLevelStore";
import { getChronoDB } from "../src/chrono";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const store = getActivePairStore(getChronoDB());
  console.log("Removing active pair cache...");
  await store.delAll();
  console.log("Done");
})();
