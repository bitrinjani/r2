import type { DepthLine } from "../../types";
import type { OnInit, OnDestroy } from "@angular/core";

import { Component, ElementRef, ViewChild, Input } from "@angular/core";


import "rxjs/add/observable/interval";
import { Observable } from "rxjs/Observable";

import type { Subscription } from "rxjs/Subscription";

import { combineLatest, withLatestFrom } from "rxjs/operators";

import { DepthService } from "../../depth.service";

@Component({
  selector: "app-depth",
  templateUrl: "./depth.component.html",
})
export class DepthComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  depthLines: DepthLine[] = [];
  @ViewChild("depthBody") private readonly depthBody: ElementRef;
  private scrolled = false;

  constructor(private readonly depthService: DepthService) {}

  ngOnInit() {
    this.subscription = this.depthService.depth$.subscribe(depthLines => {
      this.depthLines = depthLines;
      if(!this.scrolled){
        setTimeout(() => this.scrollToMiddle(), 0);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private scrollToMiddle(): void {
    this.depthBody.nativeElement.scrollTop
      = (this.depthBody.nativeElement.scrollHeight - this.depthBody.nativeElement.clientHeight) / 2;
    this.scrolled = true;
  }
}
