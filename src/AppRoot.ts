import { getLogger } from './logger';
import intl from './intl';
import 'reflect-metadata';
import container from './container';
import symbols from './symbols';
import { Arbitrager } from './type';
import { Container } from 'inversify';

export default class AppRoot {
  private log = getLogger('AppRoot');
  private arbitrager: Arbitrager;

  constructor(private readonly ioc: Container = container) { }

  async start(): Promise<void> {
    try {
      this.log.info(intl.t('StartingTheService'));
      this.arbitrager = this.ioc.get<Arbitrager>(symbols.Arbitrager);
      await this.arbitrager.start();
      this.log.info(intl.t('SuccessfullyStartedTheService'));
    } catch (ex) {
      this.log.error(ex.message);
      this.log.debug(ex.stack);
    }
  }
  
  async stop(): Promise<void> {
    try {
      this.log.info(intl.t('StoppingTheService'));
      if (this.arbitrager) {
        await this.arbitrager.stop();
      }
      this.log.info(intl.t('SuccessfullyStoppedTheService'));
    } catch (ex) {
      this.log.error(ex.message);
      this.log.debug(ex.stack);
    } 
  }
}