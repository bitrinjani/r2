import { getLogger } from './logger';
import t from './intl';
import 'reflect-metadata';
import container from './container';
import symbols from './symbols';
import { Arbitrager, QuoteAggregator, PositionService } from './types';
import { Container } from 'inversify';

export default class AppRoot {
  private log = getLogger(this.constructor.name);
  private quoteAggregator: QuoteAggregator;
  private positionService: PositionService;
  private arbitrager: Arbitrager;

  constructor(private readonly ioc: Container = container) { }

  async start(): Promise<void> {
    try {
      this.log.info(t`StartingTheService`);
      this.quoteAggregator = this.ioc.get<QuoteAggregator>(symbols.QuoteAggregator);
      await this.quoteAggregator.start();
      this.positionService = this.ioc.get<PositionService>(symbols.PositionService);
      await this.positionService.start();
      this.arbitrager = this.ioc.get<Arbitrager>(symbols.Arbitrager);
      await this.arbitrager.start();
      this.log.info(t`SuccessfullyStartedTheService`);
    } catch (ex) {
      this.log.error(ex.message);
      this.log.debug(ex.stack);
    }
  }
  
  async stop(): Promise<void> {
    try {
      this.log.info(t`StoppingTheService`);
      if (this.arbitrager) {
        await this.arbitrager.stop();
      }
      if (this.positionService) {
        await this.positionService.stop();
      }
      if (this.quoteAggregator) {
        await this.quoteAggregator.stop();
      }
      this.log.info(t`SuccessfullyStoppedTheService`);
    } catch (ex) {
      this.log.error(ex.message);
      this.log.debug(ex.stack);
    } 
  }
}