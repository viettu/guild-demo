import { Component, Input } from '@angular/core';

export interface DropdownItem {
  label: string;
  value: any;
}

@Component({
  selector: 'simple-dropdown',
  templateUrl: './simple-dropdown.component.html',
  styleUrls: ['./simple-dropdown.component.less']
})
export class SimpleDropdownComponent {

  @Input() items: Array<DropdownItem>;

}
