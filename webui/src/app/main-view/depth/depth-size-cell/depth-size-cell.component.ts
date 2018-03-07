import { Component, OnInit, Input } from '@angular/core';
import * as _ from 'lodash';
import { DepthSizeCell } from '../../../types';

@Component({
  selector: 'app-depth-size-cell',
  templateUrl: './depth-size-cell.component.html'
})
export class DepthSizeCellComponent implements OnInit {
  tradable: boolean;
  @Input() sizeCells: DepthSizeCell[];
  @Input() isBest: boolean;
  @Input() side: string;
  sizeCellsWithContrast: { highPart: string; lowPart: string }[];

  constructor() {}

  ngOnInit() {
    this.sizeCellsWithContrast = this.sizeCells.map(sizeCell => {
      const sizeString = sizeCell.value.toLocaleString('ja-JP', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
      const lowPart = _.takeRightWhile(sizeString, c => c === '0').join('');
      const highPart = sizeString.slice(0, sizeString.length - lowPart.length);
      return { highPart, lowPart, tradable: sizeCell.tradable, size: sizeCell.value };
    });
  }

  getCssClass(s: DepthSizeCell) {
    return {
      best: this.isBest,
      untradable: !s.tradable
    };
  }

  plot(s) {
    const background = this.side === 'ask' ? '#405b44' : '#54404b';
    const direction = this.side === 'ask' ? 'rtl' : 'ltr';
    return {
      background,
      width: `${_.min([s.size * 50, 100])}%`,
      direction
    }
  }
}
