import { expect, spy } from 'chai';
import { getSpreadStatTimeSeries } from '../spreadStatTimeSeries';

describe('SpreadStatTimeSeries', () => {
  it('get', () => {
    let dbMockCount = 0;
    const dbMock = { getTimeSeries: spy(() => ++dbMockCount) };
    getSpreadStatTimeSeries(dbMock as any);
    expect(dbMockCount).to.equal(1);
  });
});
