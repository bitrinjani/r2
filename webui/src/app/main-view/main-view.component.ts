import type { OnInit, OnDestroy } from "@angular/core";
import type { Subscription } from "rxjs/Subscription";

import { Component } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { filter, map } from "rxjs/operators";

import { WsService } from "../ws.service";

@Component({
  selector: "app-main-view",
  templateUrl: "./main-view.component.html",
})
export class MainViewComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  private readonly errorCacheTime = 8000;
  errorMessage: string;
  logAutoScroll = true;

  constructor(private readonly wsService: WsService) {}

  ngOnInit() {
    this.wsService.connect();
    let timer;
    this.subscription = this.wsService.error$.pipe(filter(x => x.code !== undefined), map(x => x.code)).subscribe(x => {
      this.errorMessage = `WebSocket connection failed. Error: ${x}`;
      if(timer){
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        this.errorMessage = "";
        timer = undefined;
      }, this.errorCacheTime);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
