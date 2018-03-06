import { Component, OnInit, OnDestroy } from '@angular/core';
import { WsService } from '../../ws.service';
import { SpreadAnalysisResult, LimitCheckResult } from '../../types';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-spread-analysis',
  templateUrl: './spread-analysis.component.html'
})
export class SpreadAnalysisComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  limitCheckResult: LimitCheckResult;
  spread: SpreadAnalysisResult;

  constructor(private readonly wsService: WsService) {}

  ngOnInit() {
    this.wsService.connect();
    this.subscription = this.wsService.spread$.subscribe(spread => {
      this.spread = spread;
    });
    const limitSubscription = this.wsService.limitCheck$.subscribe(limitCheckResult => {
      this.limitCheckResult = limitCheckResult;
    });
    this.subscription.add(limitSubscription);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
