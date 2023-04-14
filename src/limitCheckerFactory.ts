import type { SpreadAnalysisResult, LimitChecker, OrderPair } from "./types";

import { injectable, inject } from "inversify";

import MainLimitChecker from "./mainLimitChecker";
import PositionService from "./positionService";
import symbols from "./symbols";
import { ConfigStore } from "./types";

@injectable()
export default class LimitCheckerFactory {
  constructor(
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    private readonly positionService: PositionService
  ) {}

  create(spreadAnalysisResult: SpreadAnalysisResult, orderPair?: OrderPair): LimitChecker {
    return new MainLimitChecker(
      this.configStore,
      this.positionService,
      spreadAnalysisResult,
      orderPair
    );
  }
} /* istanbul ignore next */
