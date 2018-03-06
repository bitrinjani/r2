import { Component, OnInit, OnDestroy } from '@angular/core';
import { WsService } from '../../ws.service';
import * as _ from 'lodash';
import { BrokerPosition } from '../../types';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-position',
  templateUrl: './position.component.html'
})
export class PositionComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  brokerPositions: BrokerPosition[] = [];

  constructor(private readonly wsService: WsService) {}

  ngOnInit() {
    this.wsService.connect();
    this.subscription = this.wsService.position$.subscribe(x => {
      this.brokerPositions = _.values(x);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
