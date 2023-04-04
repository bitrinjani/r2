import { Component, OnInit, OnDestroy } from '@angular/core';
import { WsService } from '../ws.service';
import { Observable } from 'rxjs/Observable';
import { ConfigRoot } from '../types';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-config-form',
  templateUrl: './config-form.component.html'
})
export class ConfigFormComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  config: string;

  constructor(private readonly wsService: WsService) {}

  ngOnInit() {
    this.wsService.connect();
    this.subscription = this.wsService.config$.subscribe(config => {
      this.config = JSON.stringify(config, null, 2);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
