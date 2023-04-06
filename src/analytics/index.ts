import AnalyticsService from './AnalyticsService';
import { getLogger } from '@bitr/logger';

const log = getLogger('analytics');
let analyticsService: AnalyticsService;

async function main() {
  try {
    analyticsService = new AnalyticsService();
    await analyticsService.start();
  } catch (ex) {
    log.error(`Analytics Service failed. ${ex.message}`);
    log.debug(ex.stack);
    analyticsService.stop().catch(log.error.bind(log));
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
