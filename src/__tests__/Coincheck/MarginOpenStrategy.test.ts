import { CashMarginType, OrderSide, OrderType, OrderStatus } from '../../types';
import MarginOpenStrategy from '../../Coincheck/MarginOpenStrategy';
import nocksetup from './nocksetup';
import BrokerApi from '../../Coincheck/BrokerApi';
import * as nock from 'nock';
import { options } from '@bitr/logger';
import { createOrder } from '../helper';
import { expect } from 'chai';
options.enabled = false;

nocksetup();

describe('MarginOpenStrategy', function(){
  it('send leverage buy limit', async () => {
    const strategy = new MarginOpenStrategy(new BrokerApi('', ''));
    const order = createOrder(
      'Coincheck',
      OrderSide.Buy,
      0.005,
      300000,
      CashMarginType.MarginOpen, OrderType.Limit, undefined as any);
    await strategy.send(order);
    expect(order.status).to.equal(OrderStatus.New);
    expect(order.brokerOrderId).to.equal('340622252');
  });

  it('send fails - not MarginOpen order', async () => {
    const strategy = new MarginOpenStrategy(new BrokerApi('', ''));
    const order = createOrder(
      'Coincheck',
      OrderSide.Buy,
      0.005,
      300000,
      CashMarginType.Cash, OrderType.Limit, undefined as any);
    try {
      await strategy.send(order);
    } catch (ex) {
      return;
    }
    expect(false).to.equal(true);
  });

  it('send fails', async () => {
    const strategy = new MarginOpenStrategy(new BrokerApi('', ''));
    const order = createOrder(
      'Coincheck',
      OrderSide.Buy,
      0.005,
      300000,
      CashMarginType.MarginOpen, OrderType.Limit, undefined as any);
    try {
      await strategy.send(order);
    } catch (ex) {
      return;
    }
    expect(false).to.equal(true);
  });

  it('getBtcPosition Margin', async () => {
    const strategy = new MarginOpenStrategy(new BrokerApi('', ''));
    const result = await strategy.getBtcPosition();
    expect(result).to.equal(-0.14007);
  });

  it('open buy limit', () => {
    const strategy = new MarginOpenStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.MarginOpen,
      side: OrderSide.Buy,
      type: OrderType.Limit
    };
    const target = strategy["getBrokerOrderType"](order as any);
    expect(target).to.equal('leverage_buy');
  });

  it('open sell limit', () => {
    const strategy = new MarginOpenStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.MarginOpen,
      side: OrderSide.Sell,
      type: OrderType.Limit
    };
    const target = strategy["getBrokerOrderType"](order as any);
    expect(target).to.equal('leverage_sell');
  });

  it('open invalid side limit', () => {
    const strategy = new MarginOpenStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.MarginOpen,
      side: 'Invalid',
      type: OrderType.Limit
    };
    expect(() => strategy["getBrokerOrderType"](order as any)).to.throw();
  });

  this.afterAll(() => {
    nock.restore();
  });
});
