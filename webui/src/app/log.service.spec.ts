import { TestBed, inject } from "@angular/core/testing";

import { LogService } from "./log.service";

describe("LogService", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LogService],
    });
  });

  it("should be created", inject([LogService], async (service: LogService) => {
    await expect(service).toBeTruthy();
  }));
});
