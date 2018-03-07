import { Component, OnInit, ViewChild, ElementRef, OnDestroy, Input } from '@angular/core';
import * as _ from 'lodash';
import { WsService } from '../../ws.service';
import { LogService } from '../../log.service';
import { LogRecord } from '../../types/index';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-log-view',
  templateUrl: './log-view.component.html'
})
export class LogViewComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  @ViewChild('logContent') private logContent: ElementRef;
  @Input() autoScroll: boolean = true;
  private readonly maxLogSize = 150;
  logs: LogRecord[] = [];

  constructor(private readonly logService: LogService) {}

  ngOnInit() {
    this.logService.connect();
    this.subscription = this.logService.log$.subscribe(log => {
      this.append(log);
      if (this.autoScroll) {
        setTimeout(() => this.scrollToBottom(), 0);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getLevelClass(log: LogRecord) {
    return {
      info: log.level === 'INFO',
      warn: log.level === 'WARN',
      error: log.level === 'ERROR'
    };
  }

  private append(log: LogRecord) {
    if (this.logs.length >= this.maxLogSize) {
      this.logs.shift();
    }
    this.logs.push(log);
  }

  private scrollToBottom(): void {
    this.logContent.nativeElement.scrollTop = this.logContent.nativeElement.scrollHeight;
  }
}
