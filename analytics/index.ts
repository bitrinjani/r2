import { getLogger } from "@bitr/logger";

import AnalyticsService from "./AnalyticsService";

const log = getLogger("analytics");
let analyticsService: AnalyticsService;

async function main() {
  try{
    analyticsService = new AnalyticsService();
    await analyticsService.start();
  } catch(ex){
    log.error(`Analytics Service failed. ${ex.message}`);
    log.debug(ex.stack);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    analyticsService.stop();
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
