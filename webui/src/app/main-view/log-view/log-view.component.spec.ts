import type { ComponentFixture } from "@angular/core/testing";

import { TestBed } from "@angular/core/testing";

import { LogViewComponent } from "./log-view.component";
import { LogService } from "../../log.service";

const logServiceStub = {
  connect: [],
};

describe("LogViewComponent", () => {
  let component: LogViewComponent;
  let fixture: ComponentFixture<LogViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ LogViewComponent ],
      providers: [ { provide: LogService, useValue: logServiceStub }],
    }).compileComponents()
      .catch(e => console.log(e));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });
});
