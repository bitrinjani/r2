import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { catchError, map, tap, filter, share } from 'rxjs/operators';
import {
  Quote,
  WsMessage,
  BrokerMap,
  BrokerPosition,
  SpreadAnalysisResult,
  OrderPair,
  ConfigRoot,
  PairWithSummary,
  LimitCheckResult
} from './types';
import * as ReconnectingWebSocket from 'reconnecting-websocket';

@Injectable()
export class WsService {
  private readonly host = window.location.hostname;
  private readonly url = `ws://${this.host}:${window.location.port}`;
  private connected = false;
  error$: Observable<{ code: string }>;
  config$: Observable<ConfigRoot>;
  activePair$: Observable<PairWithSummary[]>;
  log$: Observable<string>;
  limitCheck$: Observable<LimitCheckResult>;
  spread$: Observable<SpreadAnalysisResult>;
  position$: Observable<BrokerMap<BrokerPosition>>;
  quote$: Observable<Quote[]>;
  socket: Subject<MessageEvent>;

  connect() {
    if (this.connected) {
      return;
    }
    const ws = new ReconnectingWebSocket(this.url);
    const observable = Observable.create((obs: Observer<MessageEvent>) => {
      ws.onmessage = obs.next.bind(obs);
      ws.onerror = e => {
        obs.next.bind(obs)({ data: JSON.stringify({ type: 'error', body: e }) });
      };
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
    this.quote$ = this.mapMessage<Quote[]>(sharedObservable, 'quoteUpdated');
    this.position$ = this.mapMessage<BrokerMap<BrokerPosition>>(sharedObservable, 'positionUpdated');
    this.spread$ = this.mapMessage<SpreadAnalysisResult>(sharedObservable, 'spreadAnalysisDone');
    this.limitCheck$ = this.mapMessage<LimitCheckResult>(sharedObservable, 'limitCheckDone');
    this.log$ = this.mapMessage<string>(sharedObservable, 'log');
    this.activePair$ = this.mapMessage<PairWithSummary[]>(sharedObservable, 'activePairRefresh');
    this.config$ = this.mapMessage<ConfigRoot>(sharedObservable, 'configUpdated');
    this.error$ = this.mapMessage<{ code: string }>(sharedObservable, 'error');
    this.connected = true;
  }

  private mapMessage<T>(sharedObservable: Observable<MessageEvent>, type: string) {
    return sharedObservable.pipe(
      map(x => JSON.parse(x.data) as WsMessage<T>),
      filter(x => x.type === type),
      map(x => x.body)
    );
  }
}
