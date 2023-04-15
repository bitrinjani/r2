import type { ComponentFixture } from "@angular/core/testing";

import { async, TestBed } from "@angular/core/testing";

import { DepthComponent } from "./depth.component";

describe("DepthComponent", () => {
  let component: DepthComponent;
  let fixture: ComponentFixture<DepthComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DepthComponent ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DepthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
