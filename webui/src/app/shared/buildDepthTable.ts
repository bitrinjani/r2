import { Quote, DepthLine, BrokerPosition, BrokerMap, ConfigRoot } from '../types';

import * as _ from 'lodash';

import { QuoteSide } from '../types';

class DepthTable {
  private readonly depthSize = 100;
  private bestTradableBid: Quote;
  private bestTradableAsk: Quote;

  constructor(
    private readonly quotes: Quote[],
    private readonly positionMap: BrokerMap<BrokerPosition>,
    private readonly config: ConfigRoot
  ) {}

  build(): DepthLine[] {
    const asks = this.quotes.filter(q => q.side === QuoteSide.Ask);
    const bids = this.quotes.filter(q => q.side === QuoteSide.Bid);
    this.bestTradableAsk = _(asks)
      .filter(q => this.isTradable(q))
      .minBy('price');
    this.bestTradableBid = _(bids)
      .filter(q => this.isTradable(q))
      .maxBy('price');
    const depthLines = _(this.quotes)
      .groupBy(q => q.price)
      .map((quotes: Quote[]) => _.reduce(quotes, this.depthReducer.bind(this), this.blankDepthLine()))
      .orderBy(['priceCell.value'], ['desc'])
      .value();
    const middlePart = _(depthLines)
      .filter(l => l.priceCell.value >= this.bestTradableAsk.price && l.priceCell.value <= this.bestTradableBid.price)
      .value();
    const whiskerSize = _.floor((this.depthSize - middlePart.length) / 2);
    const residual = (this.depthSize - middlePart.length) % 2;
    const upperPart = _(depthLines)
      .takeWhile(l => l.priceCell.value > this.bestTradableBid.price)
      .takeRight(whiskerSize)
      .value();
    const bottomPart = _(depthLines)
      .takeRightWhile(l => l.priceCell.value < this.bestTradableAsk.price)
      .take(whiskerSize + residual)
      .value();
    if (middlePart.length <= this.depthSize) {
      return _.concat(upperPart, middlePart, bottomPart);
    }
    return _.concat(
      _.take(middlePart, this.depthSize / 2),
      [this.blankDepthLine()],
      _.takeRight(middlePart, this.depthSize / 2)
    );
  }

  private isTradable(quote: Quote) {
    return this.allowedByPosition(quote) && this.largerThanMinSize(quote);
  }

  private largerThanMinSize(quote: Quote) {
    const maxTargetVolumePercent = _.defaultTo(this.config.maxTargetVolumePercent, 100);
    return quote.volume >= this.config.minSize * _.floor(100 / this.config.maxTargetVolumePercent);
  }

  private allowedByPosition(quote: Quote) {
    const position = this.positionMap[quote.broker];
    return quote.side === QuoteSide.Ask ? position.longAllowed : position.shortAllowed;
  }

  private depthReducer(depthLine: DepthLine, q: Quote): DepthLine {
    depthLine.priceCell.value = q.price;
    const tradable = this.isTradable(q);
    if (q.side === QuoteSide.Ask) {
      depthLine.askBrokerCells.push({ value: q.broker, tradable });
      depthLine.askSizeCells.push({ value: q.volume, tradable });
      depthLine.isBestAsk = depthLine.isBestAsk || q === this.bestTradableAsk;
      depthLine.priceCell.askTradable = depthLine.priceCell.askTradable || tradable;
    } else {
      depthLine.bidBrokerCells.push({ value: q.broker, tradable });
      depthLine.bidSizeCells.push({ value: q.volume, tradable });
      depthLine.isBestBid = depthLine.isBestBid || q === this.bestTradableBid;
      depthLine.priceCell.bidTradable = depthLine.priceCell.bidTradable || tradable;
    }
    return depthLine;
  }

  private blankDepthLine(): DepthLine {
    return {
      askBrokerCells: [],
      askSizeCells: [],
      priceCell: { value: NaN, askTradable: false, bidTradable: false },
      bidSizeCells: [],
      bidBrokerCells: [],
      isBestAsk: false,
      isBestBid: false,
    };
  }
}

export function buildDepthTable(quotes: Quote[], positionMap: BrokerMap<BrokerPosition>, config: ConfigRoot) {
  return new DepthTable(quotes, positionMap, config).build();
}
