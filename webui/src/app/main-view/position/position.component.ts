import { Component, OnInit, OnDestroy } from '@angular/core';
import { WsService } from '../../ws.service';
import * as _ from 'lodash';
import { BrokerPosition } from '../../types';
import { Subscription } from 'rxjs/Subscription';
import { splitSymbol } from '../../util';

@Component({
  selector: 'app-position',
  templateUrl: './position.component.html'
})
export class PositionComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  brokerPositions: BrokerPosition[] = [];
  baseCcy: string;
  quoteCcy: string;

  constructor(private readonly wsService: WsService) {}

  ngOnInit() {
    this.wsService.connect();
    this.subscription = this.wsService.position$.subscribe(x => {
      this.brokerPositions = _.values(x);
    });
    const configSubscription = this.wsService.config$.subscribe(config => {
      const { baseCcy, quoteCcy } = splitSymbol(config.symbol);
      this.baseCcy = baseCcy;
      this.quoteCcy = quoteCcy;
    });
    this.subscription.add(configSubscription);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
