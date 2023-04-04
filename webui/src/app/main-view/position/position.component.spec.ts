import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PositionComponent } from './position.component';

describe('PositionComponent', () => {
  let component: PositionComponent;
  let fixture: ComponentFixture<PositionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PositionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
