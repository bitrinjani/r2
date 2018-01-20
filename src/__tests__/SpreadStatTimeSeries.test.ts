import { getSpreadStatTimeSeries } from '../SpreadStatTimeSeries';

describe('SpreadStatTimeSeries', () => {
  test('get', () => {
    const dbMock = { getTimeSeries: jest.fn() };
    getSpreadStatTimeSeries(dbMock);
    expect(dbMock.getTimeSeries.mock.calls.length).toBe(1);
  });
});