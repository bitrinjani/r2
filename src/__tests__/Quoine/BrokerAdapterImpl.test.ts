// tslint:disable
import * as nock from 'nock';
import * as _ from 'lodash';
import Quoine from '../../Quoine/BrokerAdapterImpl';
import { OrderStatus, Broker, CashMarginType, OrderSide, OrderType } from '../../type';
import nocksetup from './nocksetup';
import Order from '../../Order';

nocksetup();

const config = {
  brokers: [
    { broker: Broker.Quoine, key: 'key', secret: 'secret', cashMarginType: CashMarginType.NetOut }
  ]
};

describe('Quoine BrokerAdapter', () => {
  test('send leverage buy limit', async () => {
    const target = new Quoine.BrokerAdapterImpl({ config });
    const order = new Order(
      Broker.Quoine, 
      OrderSide.Buy, 
      0.01, 
      783000, 
      CashMarginType.NetOut, OrderType.Limit, 10);
    await target.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('118573146');
  });

  test('send wrong broker order', async () => {
    const target = new Quoine.BrokerAdapterImpl({ config });
    const order = { broker: Broker.Bitflyer };
    try { 
      await target.send(order);
    } catch(ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('fetchQuotes', async () => {
    const target = new Quoine.BrokerAdapterImpl({ config });
    const result = await target.fetchQuotes();
    expect(result.length).toBe(42);
    result.forEach(q => expect(q.broker).toBe(Broker.Quoine));
  });

  test('getBtcPosition Margin', async () => {
    const target = new Quoine.BrokerAdapterImpl({ config });
    const result = await target.getBtcPosition();
    expect(result).toBe(0.12);    
  });
});