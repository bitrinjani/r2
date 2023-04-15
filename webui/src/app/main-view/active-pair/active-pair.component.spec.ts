import type { ComponentFixture } from "@angular/core/testing";

import { async, TestBed } from "@angular/core/testing";

import { ActivePairComponent } from "./active-pair.component";

describe("ActivePairComponent", () => {
  let component: ActivePairComponent;
  let fixture: ComponentFixture<ActivePairComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActivePairComponent ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivePairComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
