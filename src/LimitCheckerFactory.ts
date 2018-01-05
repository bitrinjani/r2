import { injectable, inject } from 'inversify';
import symbols from './symbols';
import { ConfigStore, SpreadAnalysisResult, LimitChecker } from './types';
import PositionService from './PositionService';
import MainLimitChecker from './MainLimitChecker';

@injectable()
export default class LimitCheckerFactory { 
  constructor(
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    private readonly positionService: PositionService
  ) {}

  create(spreadAnalysisResult: SpreadAnalysisResult, closableOrdersKey: string): LimitChecker {
    return new MainLimitChecker(this.configStore, this.positionService, spreadAnalysisResult, closableOrdersKey);
  }
} /* istanbul ignore next */
