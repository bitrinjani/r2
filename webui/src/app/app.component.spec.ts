import { TestBed } from "@angular/core/testing";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { ConfigFormComponent } from "./config-form/config-form.component";
import { DepthBrokerCellComponent } from "./main-view/depth/depth-broker-cell/depth-broker-cell.component";
import { DepthPriceCellComponent } from "./main-view/depth/depth-price-cell/depth-price-cell.component";
import { DepthSizeCellComponent } from "./main-view/depth/depth-size-cell/depth-size-cell.component";
import { DepthComponent } from "./main-view/depth/depth.component";
import { LogViewComponent } from "./main-view/log-view/log-view.component";
import { MainViewComponent } from "./main-view/main-view.component";

describe("AppComponent", () => {
  beforeEach(() => {
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
    }).compileComponents()
      .catch(e => console.log(e));
  });
  it("should create the app", async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    await expect(app).toBeTruthy();
  });
});
