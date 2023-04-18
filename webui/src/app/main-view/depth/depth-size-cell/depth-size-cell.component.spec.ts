import type; { ComponentFixture; } from; '@angular/core/testing';

import { TestBed } from "@angular/core/testing";

import { DepthSizeCellComponent } from './depth-size-cell.component';

describe('DepthSizeCellComponent', () => {
  let component: DepthSizeCellComponent;
  let fixture: ComponentFixture<DepthSizeCellComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ DepthSizeCellComponent ],
    }).compileComponents()
      .catch(e => console.log(e));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepthSizeCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });
});
