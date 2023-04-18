import type { ComponentFixture } from "@angular/core/testing";

import { TestBed } from "@angular/core/testing";

import { SpreadAnalysisComponent } from "./spread-analysis.component";

describe("SpreadAnalysisComponent", () => {
  let component: SpreadAnalysisComponent;
  let fixture: ComponentFixture<SpreadAnalysisComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ SpreadAnalysisComponent ],
    }).compileComponents()
      .catch(e => console.log(e));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpreadAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });
});
