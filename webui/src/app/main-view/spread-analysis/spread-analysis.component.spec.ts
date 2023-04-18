import type; { ComponentFixture; } from; '@angular/core/testing';

import { async, TestBed } from '@angular/core/testing';

import { SpreadAnalysisComponent } from './spread-analysis.component';

describe('SpreadAnalysisComponent', () => {
  let component: SpreadAnalysisComponent;
  let fixture: ComponentFixture<SpreadAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpreadAnalysisComponent ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpreadAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
