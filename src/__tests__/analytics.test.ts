import AnalyticsService from '../analytics/AnalyticsService';

describe('AnalyticsService', () => {
  test('instantiate', async () => {
    const as = new AnalyticsService();
    await as.stop();
  });
});
