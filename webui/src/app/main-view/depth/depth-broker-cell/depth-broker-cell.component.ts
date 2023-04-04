import { Component, OnInit, Input } from '@angular/core';
import { DepthBrokerCell } from '../../../types';

@Component({
  selector: 'app-depth-broker-cell',
  templateUrl: './depth-broker-cell.component.html'
})
export class DepthBrokerCellComponent implements OnInit {
  @Input() brokerCells: DepthBrokerCell[];
  @Input() isBest: boolean;

  ngOnInit() {}

  getCssClass(b: DepthBrokerCell) {
    return {
      best: this.isBest,
      untradable: !b.tradable
    }
  }
}
