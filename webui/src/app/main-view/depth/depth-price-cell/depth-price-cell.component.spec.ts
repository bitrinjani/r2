import type { ComponentFixture } from "@angular/core/testing";

import { TestBed } from "@angular/core/testing";

import { DepthPriceCellComponent } from "./depth-price-cell.component";

describe("DepthPriceCellComponent", () => {
  let component: DepthPriceCellComponent;
  let fixture: ComponentFixture<DepthPriceCellComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ DepthPriceCellComponent ],
    }).compileComponents()
      .catch(e => console.log(e));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepthPriceCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });
});
