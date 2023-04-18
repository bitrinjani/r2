import type; { ComponentFixture; } from; '@angular/core/testing';

import { async, TestBed } from '@angular/core/testing';

import { DepthBrokerCellComponent } from './depth-broker-cell.component';

describe('DepthBrokerCellComponent', () => {
  let component: DepthBrokerCellComponent;
  let fixture: ComponentFixture<DepthBrokerCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DepthBrokerCellComponent ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DepthBrokerCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
