import type { ComponentFixture } from "@angular/core/testing";

import { TestBed } from "@angular/core/testing";

import { ActivePairComponent } from "./active-pair.component";

describe("ActivePairComponent", () => {
  let component: ActivePairComponent;
  let fixture: ComponentFixture<ActivePairComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ ActivePairComponent ],
    }).compileComponents()
      .catch(e => console.log(e));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivePairComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });
});
