import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from ".//app-routing.module";
import { AppComponent } from "./app.component";
import { ConfigFormComponent } from "./config-form/config-form.component";
import { DepthService } from "./depth.service";
import { LogService } from "./log.service";
import { ActivePairComponent } from "./main-view/active-pair/active-pair.component";
import { DepthBrokerCellComponent } from "./main-view/depth/depth-broker-cell/depth-broker-cell.component";
import { DepthPriceCellComponent } from "./main-view/depth/depth-price-cell/depth-price-cell.component";
import { DepthSizeCellComponent } from "./main-view/depth/depth-size-cell/depth-size-cell.component";
import { DepthComponent } from "./main-view/depth/depth.component";
import { LogViewComponent } from "./main-view/log-view/log-view.component";
import { MainViewComponent } from "./main-view/main-view.component";
import { PositionComponent } from "./main-view/position/position.component";
import { SpreadAnalysisComponent } from "./main-view/spread-analysis/spread-analysis.component";
import { LoadingComponent } from "./shared/loading/loading.component";
import { WsService } from "./ws.service";

@NgModule({
  declarations: [
    AppComponent,
    DepthComponent,
    DepthBrokerCellComponent,
    DepthSizeCellComponent,
    DepthPriceCellComponent,
    LogViewComponent,
    MainViewComponent,
    ConfigFormComponent,
    PositionComponent,
    SpreadAnalysisComponent,
    ActivePairComponent,
    LoadingComponent,
  ],
  imports: [BrowserModule, HttpClientModule, AppRoutingModule, FormsModule],
  providers: [WsService, LogService, DepthService],
  bootstrap: [AppComponent],
})
export class AppModule {}
