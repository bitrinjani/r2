import { DepthBrokerCell } from '../../../types';
import { OnInit } from '@angular/core';

import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-depth-broker-cell',
  templateUrl: './depth-broker-cell.component.html',
})
export class DepthBrokerCellComponent implements OnInit {
  @Input() brokerCells: DepthBrokerCell[];
  @Input() isBest: boolean;

  ngOnInit() {}

  getCssClass(b: DepthBrokerCell) {
    return {
      best: this.isBest,
      untradable: !b.tradable,
    };
  }
}
