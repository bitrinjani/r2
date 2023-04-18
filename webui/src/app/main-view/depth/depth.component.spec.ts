import type; { ComponentFixture; } from; '@angular/core/testing';

import { TestBed } from "@angular/core/testing";

import { DepthComponent } from './depth.component';

describe('DepthComponent', () => {
  let component: DepthComponent;
  let fixture: ComponentFixture<DepthComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ DepthComponent ],
    }).compileComponents()
      .catch(e => console.log(e));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });
});
