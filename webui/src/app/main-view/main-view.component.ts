import { Component, OnInit, OnDestroy } from '@angular/core';
import { WsService } from '../ws.service';
import { filter, map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { splitSymbol } from '../util';

@Component({
  selector: 'app-main-view',
  templateUrl: './main-view.component.html'
})
export class MainViewComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  private errorCacheTime = 8000;
  errorMessage: string;
  logAutoScroll: boolean = true;
  baseCcy: string;
  quoteCcy: string;

  constructor(private readonly wsService: WsService) {}

  ngOnInit() {
    this.wsService.connect();
    let timer;
    this.subscription = this.wsService.error$.pipe(filter(x => x.code !== undefined), map(x => x.code)).subscribe(x => {
      this.errorMessage = `WebSocket connection failed. Error: ${x}`;
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        this.errorMessage = '';
        timer = undefined;
      }, this.errorCacheTime);
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
