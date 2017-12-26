import { injectable, inject } from 'inversify';
import symbols from './symbols';
import { LimitCheckerFactory, ConfigStore, PositionService, SpreadAnalysisResult, LimitChecker } from './types';
import LimitCheckerImpl from './LimitCheckerImpl';

@injectable()
export default class LimitCheckerFactoryImpl implements LimitCheckerFactory {
  constructor(
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    @inject(symbols.PositionService) private readonly positionService: PositionService
  ) { } 

  create(spreadAnalysisResult: SpreadAnalysisResult, exitFlag: boolean): LimitChecker {
    return new LimitCheckerImpl(this.configStore, this.positionService, spreadAnalysisResult, exitFlag);
  }
} /* istanbul ignore next */