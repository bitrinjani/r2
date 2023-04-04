import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { DepthComponent } from './main-view/depth/depth.component';
import { DepthBrokerCellComponent } from './main-view/depth/depth-broker-cell/depth-broker-cell.component';
import { DepthSizeCellComponent } from './main-view/depth/depth-size-cell/depth-size-cell.component';
import { DepthPriceCellComponent } from './main-view/depth/depth-price-cell/depth-price-cell.component';
import { LogViewComponent } from './main-view/log-view/log-view.component';
import { WsService } from './ws.service';
import { AppRoutingModule } from './/app-routing.module';
import { MainViewComponent } from './main-view/main-view.component';
import { ConfigFormComponent } from './config-form/config-form.component';
import { PositionComponent } from './main-view/position/position.component';
import { SpreadAnalysisComponent } from './main-view/spread-analysis/spread-analysis.component';
import { ActivePairComponent } from './main-view/active-pair/active-pair.component';
import { LogService } from './log.service';
import { LoadingComponent } from './shared/loading/loading.component';
import { DepthService } from './depth.service';

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
    LoadingComponent
  ],
  imports: [BrowserModule, HttpClientModule, AppRoutingModule, FormsModule],
  providers: [WsService, LogService, DepthService],
  bootstrap: [AppComponent]
})
export class AppModule {}
