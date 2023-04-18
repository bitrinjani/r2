import type; { ComponentFixture; } from; '@angular/core/testing';

import { async, TestBed } from '@angular/core/testing';

import { DepthPriceCellComponent } from './depth-price-cell.component';

describe('DepthPriceCellComponent', () => {
  let component: DepthPriceCellComponent;
  let fixture: ComponentFixture<DepthPriceCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DepthPriceCellComponent ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DepthPriceCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
