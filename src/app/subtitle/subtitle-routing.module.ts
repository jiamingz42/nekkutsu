import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SubtitlePage } from './subtitle.page';

const routes: Routes = [
  {
    path: '',
    component: SubtitlePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SubtitlePageRoutingModule {}
