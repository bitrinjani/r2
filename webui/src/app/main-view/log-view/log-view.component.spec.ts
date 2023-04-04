import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LogViewComponent } from './log-view.component';
import { LogService } from '../log.service';

const logServiceStub = {
  connect: []
}

describe('LogViewComponent', () => {
  let component: LogViewComponent;
  let fixture: ComponentFixture<LogViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LogViewComponent ],
      providers: [ {provide: LogService, useValue: logServiceStub}]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
