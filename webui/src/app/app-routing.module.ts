import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MainViewComponent } from './main-view/main-view.component';
import { ConfigFormComponent } from './config-form/config-form.component';

const routes: Routes = [
  { path: '', redirectTo: '/main-view', pathMatch: 'full' },
  { path: 'main-view', component: MainViewComponent },
  { path: 'config-form', component: ConfigFormComponent }
];

@NgModule({
  imports: [CommonModule, RouterModule.forRoot(routes)],
  declarations: [],
  exports: [RouterModule]
})
export class AppRoutingModule {}
