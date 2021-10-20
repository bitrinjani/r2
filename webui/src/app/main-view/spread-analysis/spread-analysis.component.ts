import { Component, OnInit, OnDestroy } from '@angular/core';
import { WsService } from '../../ws.service';
import { SpreadAnalysisResult, LimitCheckResult, ConfigRoot } from '../../types';
import { Subscription } from 'rxjs/Subscription';
import { splitSymbol } from '../../util';

@Component({
  selector: 'app-spread-analysis',
  templateUrl: './spread-analysis.component.html'
})
export class SpreadAnalysisComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  limitCheckResult: LimitCheckResult;
  spread: SpreadAnalysisResult;
  baseCcy: string;
  quoteCcy: string;

  constructor(private readonly wsService: WsService) {}

  ngOnInit() {
    this.wsService.connect();
    this.subscription = this.wsService.spread$.subscribe(spread => {
      this.spread = spread;
    });
    const limitSubscription = this.wsService.limitCheck$.subscribe(limitCheckResult => {
      this.limitCheckResult = limitCheckResult;
    });
    const configSubscription = this.wsService.config$.subscribe(config => {
      const { baseCcy, quoteCcy } = splitSymbol(config.symbol);
      this.baseCcy = baseCcy;
      this.quoteCcy = quoteCcy;
    });
    this.subscription.add(limitSubscription);
    this.subscription.add(configSubscription);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
