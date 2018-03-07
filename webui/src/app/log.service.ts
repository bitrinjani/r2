import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { catchError, map, tap, filter, share } from 'rxjs/operators';
import { Quote, WsMessage, BrokerMap, BrokerPosition, SpreadAnalysisResult, LogRecord } from './types';
import * as ReconnectingWebSocket from 'reconnecting-websocket';

@Injectable()
export class LogService {
  private readonly host = window.location.hostname;
  private readonly url = `ws://${this.host}:8721`; 
  private connected = false;
  log$: Observable<LogRecord>;
  socket: Subject<MessageEvent>;

  connect() {
    if (this.connected) {
      return;
    }
    const ws = new ReconnectingWebSocket(this.url);
    const observable = Observable.create((obs: Observer<MessageEvent>) => {
      ws.onmessage = obs.next.bind(obs);
      return ws.close.bind(ws);
    });
    const observer = {
      next: (data: Object) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        }
      }
    };
    this.socket = Subject.create(observer, observable);
    const sharedObservable = this.socket.pipe(share());
    this.log$ = this.mapMessage<LogRecord>(sharedObservable, 'log');
    this.connected = true;
  }

  private mapMessage<T>(sharedObservable: Observable<MessageEvent>, type: string) {
    return sharedObservable.pipe(
      map(x => JSON.parse(x.data) as WsMessage<string>),
      filter(x => x.type === type),
      map(x => JSON.parse(x.body))
    );
  }
}
