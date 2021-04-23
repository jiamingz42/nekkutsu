import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SubtitlePageRoutingModule } from './subtitle-routing.module';

import { SubtitlePage } from './subtitle.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SubtitlePageRoutingModule
  ],
  declarations: [SubtitlePage]
})
export class SubtitlePageModule {}
