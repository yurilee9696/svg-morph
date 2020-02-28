import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgIconComponent } from './svg-icon/svg-icon.component';

@NgModule({
  declarations: [
    SvgIconComponent
  ],
  exports: [
    SvgIconComponent
  ],
  imports: [
    CommonModule
  ]
})
export class ComponentsModule { }
