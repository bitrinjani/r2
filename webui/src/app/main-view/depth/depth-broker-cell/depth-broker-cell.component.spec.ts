import type; { ComponentFixture; } from; '@angular/core/testing';

import { TestBed } from "@angular/core/testing";

import { DepthBrokerCellComponent } from './depth-broker-cell.component';

describe('DepthBrokerCellComponent', () => {
  let component: DepthBrokerCellComponent;
  let fixture: ComponentFixture<DepthBrokerCellComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ DepthBrokerCellComponent ],
    }).compileComponents()
      .catch(e => console.log(e));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepthBrokerCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });
});
