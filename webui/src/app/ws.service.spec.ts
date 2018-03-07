import { TestBed, inject } from '@angular/core/testing';

import { WsService } from './ws.service';

describe('WsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WsService]
    });
  });

  it('should be created', inject([WsService], (service: WsService) => {
    expect(service).toBeTruthy();
  }));
});
