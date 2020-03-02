import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgIconComponent } from './svg-icon/svg-icon.component';
import { IcMorphComponent } from './ic-morph/ic-morph.component';

@NgModule({
  declarations: [
    SvgIconComponent,
    IcMorphComponent,
  ],
  exports: [
    SvgIconComponent,
    IcMorphComponent,
  ],
  imports: [
    CommonModule
  ]
})
export class ComponentsModule { }
