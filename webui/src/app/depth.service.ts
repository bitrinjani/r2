import { Injectable } from '@angular/core';
import { WsService } from './ws.service';
import { withLatestFrom, map } from 'rxjs/operators';
import { buildDepthTable } from './shared/buildDepthTable';
import { Observable } from 'rxjs/Observable';
import { DepthLine } from './types';

@Injectable()
export class DepthService {
  depth$: Observable<DepthLine[]>;

  constructor(private readonly wsService: WsService) {
    wsService.connect();
    this.depth$ = wsService.quote$.pipe(
      withLatestFrom(this.wsService.position$, this.wsService.config$),
      map(([quotes, position, config]) => buildDepthTable(quotes, position, config))
    );
  }
}
