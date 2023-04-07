import { CashMarginType, OrderSide, OrderType, Broker, OrderStatus } from '../../types';
import CashStrategy from '../../Coincheck/CashStrategy';
import BrokerApi from '../../Coincheck/BrokerApi';
import nocksetup from './nocksetup';
import * as nock from 'nock';
import { options } from '@bitr/logger';
import { createOrder } from '../helper';
import { expect } from 'chai';
options.enabled = false;

nocksetup();

describe('CashStrategy', function(){
  it('send buy limit', async () => {
    const strategy = new CashStrategy(new BrokerApi('', ''));
    const order = createOrder(
      'Coincheck',
      OrderSide.Buy,
      0.005,
      300000,
      CashMarginType.Cash, OrderType.Limit, undefined as any);
    await strategy.send(order);
    expect(order.status).to.equal(OrderStatus.New);
    expect(order.brokerOrderId).to.equal('12345');
  });

  it('send fails - not Cash order', async () => {
    const strategy = new CashStrategy(new BrokerApi('', ''));
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

  it('getBtcPosition', async () => {
    const strategy = new CashStrategy(new BrokerApi('', ''));
    const result = await strategy.getBtcPosition();
    expect(result).to.equal(0.123);
  });

  it('cash market buy', () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Buy,
      type: OrderType.Market
    };
    const target = strategy["getBrokerOrderType"](order as any);
    expect(target).to.equal('market_buy');
  });

  it('cash limit buy', () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Buy,
      type: OrderType.Limit
    };
    const target = strategy["getBrokerOrderType"](order as any);
    expect(target).to.equal('buy');
  });

  it('cash invalid buy', () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Buy,
      type: OrderType.StopLimit
    };
    expect(() => strategy["getBrokerOrderType"](order as any)).to.throw();
  });

  it('cash sell market', () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Sell,
      type: OrderType.Market
    };
    const target = strategy["getBrokerOrderType"](order as any);
    expect(target).to.equal('market_sell');
  });

  it('cash sell limit', () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Sell,
      type: OrderType.Limit
    };
    const target = strategy["getBrokerOrderType"](order as any);
    expect(target).to.equal('sell');
  });

  it('cash sell invalid', () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Sell,
      type: OrderType.Stop
    };
    expect(() => strategy["getBrokerOrderType"](order as any)).to.throw();
  });

  it('cash invalid side', () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: 'Invalid',
      type: OrderType.Stop
    };
    expect(() => strategy["getBrokerOrderType"](order as any)).to.throw();
  });

  this.afterAll(() => {
    nock.restore();
  });
});
