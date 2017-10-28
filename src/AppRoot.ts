import { getLogger } from './logger';
import intl from './intl';
import 'reflect-metadata';
import container from './container';
import symbols from './symbols';
import { Arbitrager } from './type';

export default class AppRoot {
  private log = getLogger('AppRoot');
  private arbitrager: Arbitrager;

  async start(): Promise<void> {
    try {
      this.log.info(intl.t('StartingTheService'));
      this.arbitrager = container.get<Arbitrager>(symbols.Arbitrager);
      await this.arbitrager.start();
      this.log.info(intl.t('SuccessfullyStartedTheService'));
    } catch (ex) {
      this.log.error(ex.message);
      this.log.debug(ex.stack);
    }
  }
  
  stop(): void {
    try {
      this.log.info(intl.t('StoppingTheService'));
      if (this.arbitrager) {
        this.arbitrager.stop();
      }
      this.log.info(intl.t('SuccessfullyStoppedTheService'));
    } catch (ex) {
      this.log.error(ex.message);
      this.log.debug(ex.stack);
    } 
  }
}