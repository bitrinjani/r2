import type { ComponentFixture } from "@angular/core/testing";

import { TestBed } from "@angular/core/testing";

import { PositionComponent } from "./position.component";

describe("PositionComponent", () => {
  let component: PositionComponent;
  let fixture: ComponentFixture<PositionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ PositionComponent ],
    }).compileComponents()
      .catch(e => console.log(e));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });
});
