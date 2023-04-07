import { SpreadStat } from './types';
import { ChronoDB, TimeSeries } from './chrono';
import { eRound } from './util';
import { EOL } from 'os';

export const getSpreadStatTimeSeries = (chronoDB: ChronoDB): TimeSeries<SpreadStat> =>
  chronoDB.getTimeSeries<SpreadStat>('SpreadStat');

export const spreadStatCsvHeader = [
  'timestamp',
  '[best] ask broker',
  '[best] ask price',
  '[best] ask volume',
  '[best] bid broker',
  '[best] bid price',
  '[best] bid volume',
  '[best] spread',
  '[best] available volume',
  '[best] target volume',
  '[best] target profit',
  '[best] target profit percent',
  '[worst] ask broker',
  '[worst] ask price',
  '[worst] ask volume',
  '[worst] bid broker',
  '[worst] bid price',
  '[worst] bid volume',
  '[worst] spread',
  '[worst] available volume',
  '[worst] target volume',
  '[worst] target profit',
  '[worst] target profit percent'
].join(', ') + EOL;

export function spreadStatToCsv(spreadStat: SpreadStat): string {
  return [
    new Date(spreadStat.timestamp).toLocaleString(),
    spreadStat.bestCase.ask.broker,
    spreadStat.bestCase.ask.price,
    eRound(spreadStat.bestCase.ask.volume),
    spreadStat.bestCase.bid.broker,
    spreadStat.bestCase.bid.price,
    eRound(spreadStat.bestCase.bid.volume),
    -spreadStat.bestCase.invertedSpread,
    spreadStat.bestCase.availableVolume,
    spreadStat.bestCase.targetVolume,
    spreadStat.bestCase.targetProfit,
    spreadStat.bestCase.profitPercentAgainstNotional,
    spreadStat.worstCase.ask.broker,
    spreadStat.worstCase.ask.price,
    eRound(spreadStat.worstCase.ask.volume),
    spreadStat.worstCase.bid.broker,
    spreadStat.worstCase.bid.price,
    eRound(spreadStat.worstCase.bid.volume),
    -spreadStat.worstCase.invertedSpread,
    spreadStat.worstCase.availableVolume,
    spreadStat.worstCase.targetVolume,
    spreadStat.worstCase.targetProfit,
    spreadStat.worstCase.profitPercentAgainstNotional,
  ].join(', ') + EOL;
}
