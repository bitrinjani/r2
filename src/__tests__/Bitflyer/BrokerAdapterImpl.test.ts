// tslint:disable
import * as nock from 'nock';
import * as _ from 'lodash';
import Bitflyer from '../../Bitflyer/BrokerAdapterImpl';
import { OrderStatus, Broker, CashMarginType, OrderSide, OrderType } from '../../type';
import nocksetup from './nocksetup';
import Order from '../../Order';

nocksetup();
afterAll(() => {
  nock.restore();
});

const config = {
  brokers: [
    { broker: Broker.Bitflyer, key: '', secret: '', cashMarginType: CashMarginType.Cash }
  ]
};

describe('Coincheck BrokerAdapter', () => {

  test('getBtcPosition', async () => {
    const target = new Bitflyer.BrokerAdapterImpl({ config });
    const result = await target.getBtcPosition();
    expect(result).toBe(0.01084272);
  });

  test('fetchQuotes', async () => {
    const target = new Bitflyer.BrokerAdapterImpl({ config });
    const result = await target.fetchQuotes();
    expect(result.length).toBe(4);
    result.forEach(q => expect(q.broker).toBe(Broker.Bitflyer));
  });

  test('send wrong broker order', async () => {
    const target = new Bitflyer.BrokerAdapterImpl({ config });
    const order = { broker: Broker.Coincheck };
    try { 
      await target.send(order);
    } catch(ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('cancel', async () => {
    const target = new Bitflyer.BrokerAdapterImpl({ config });
    const order = { symbol: 'BTCJPY', brokerOrderId: 'JRF20150707-033333-099999' };
    await target.cancel(order);
    expect(order.status).toBe(OrderStatus.Canceled);
  });

  test('send buy limit', async () => {
    const target = new Bitflyer.BrokerAdapterImpl({ config });
    const order = new Order(
      Broker.Bitflyer, 
      OrderSide.Buy, 
      0.1, 
      30000, 
      CashMarginType.Cash, OrderType.Limit, undefined);
    await target.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('JRF20150707-050237-639234');
  });
});