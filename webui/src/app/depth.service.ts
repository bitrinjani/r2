import { DepthLine } from './types';
import { Observable } from 'rxjs/Observable';

import { Injectable } from '@angular/core';
import { withLatestFrom, map } from 'rxjs/operators';

import { buildDepthTable } from './shared/buildDepthTable';
import { WsService } from './ws.service';

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
