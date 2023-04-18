import { OnInit } from '@angular/core';

import { Component, Input } from '@angular/core';

import { DepthPriceCell } from '../../../types';

@Component({
  selector: 'app-depth-price-cell',
  templateUrl: './depth-price-cell.component.html',
})
export class DepthPriceCellComponent implements OnInit {
  tradable: boolean;
  @Input() priceCell: DepthPriceCell;
  @Input() isBest: boolean;
  formattedPrice: string;

  constructor() {}

  ngOnInit() {
    if (Number.isNaN(this.priceCell.value)) {
      this.formattedPrice = '⋮';
      this.tradable = true;
    } else {
      this.formattedPrice = this.priceCell.value.toLocaleString();
      this.tradable = this.priceCell.askTradable || this.priceCell.bidTradable;
    }
  }

  getCssClass() {
    return {
      best: this.isBest,
      untradable: !this.tradable,
    };
  }
}
