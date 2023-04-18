import type; { ComponentFixture; } from; '@angular/core/testing';

import { async, TestBed } from '@angular/core/testing';

import { DepthSizeCellComponent } from './depth-size-cell.component';

describe('DepthSizeCellComponent', () => {
  let component: DepthSizeCellComponent;
  let fixture: ComponentFixture<DepthSizeCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DepthSizeCellComponent ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DepthSizeCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
