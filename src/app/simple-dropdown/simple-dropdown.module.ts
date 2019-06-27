import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SimpleDropdownComponent } from './simple-dropdown.component';

@NgModule({
  imports: [CommonModule],
  declarations: [SimpleDropdownComponent],
  exports: [SimpleDropdownComponent]
})
export class SimpleDropdownModule {}

export { SimpleDropdownComponent };
