import { TestBed, async } from "@angular/core/testing";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { ConfigFormComponent } from "./config-form/config-form.component";
import { DepthComponent } from "./depth/depth.component";
import { DepthBrokerCellComponent } from "./depth-broker-cell/depth-broker-cell.component";
import { DepthPriceCellComponent } from "./depth-price-cell/depth-price-cell.component";
import { DepthSizeCellComponent } from "./depth-size-cell/depth-size-cell.component";
import { LogViewComponent } from "./log-view/log-view.component";
import { MainViewComponent } from "./main-view/main-view.component";
describe("AppComponent", () => {
  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        DepthComponent,
        DepthBrokerCellComponent,
        DepthSizeCellComponent,
        DepthPriceCellComponent,
        LogViewComponent,
        MainViewComponent,
        ConfigFormComponent,
      ], imports: [AppRoutingModule],
    }).compileComponents();
  }));
  it("should create the app", async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
