import { TestBed, inject } from '@angular/core/testing';

import { DepthService } from './depth.service';

describe('DepthService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DepthService]
    });
  });

  it('should be created', inject([DepthService], (service: DepthService) => {
    expect(service).toBeTruthy();
  }));
});
