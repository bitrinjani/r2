import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ConfigFormComponent } from './config-form/config-form.component';
import { MainViewComponent } from './main-view/main-view.component';
import { LogViewComponent } from './log-view/log-view.component';
import { DepthPriceCellComponent } from './depth-price-cell/depth-price-cell.component';
import { DepthSizeCellComponent } from './depth-size-cell/depth-size-cell.component';
import { DepthBrokerCellComponent } from './depth-broker-cell/depth-broker-cell.component';
import { DepthComponent } from './depth/depth.component';
describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        DepthComponent,
        DepthBrokerCellComponent,
        DepthSizeCellComponent,
        DepthPriceCellComponent,
        LogViewComponent,
        MainViewComponent,
        ConfigFormComponent
      ],  imports: [AppRoutingModule]
    }).compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
