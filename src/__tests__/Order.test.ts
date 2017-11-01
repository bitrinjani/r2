import Order from '../Order';
import { Broker, OrderSide, OrderType, CashMarginType } from '../type';
import Execution from '../Execution';

describe('Order', () => {
  test('averageFilledPrice', () => {
    const target = new Order(Broker.Bitflyer, OrderSide.Buy, 0.01, 1000, CashMarginType.Cash, OrderType.Limit, 1);
    const ex1 = new Execution(target);
    ex1.price = 1100;
    ex1.size = 0.004;
    const ex2 = new Execution(target);
    ex2.price = 1200;
    ex2.size = 0.006;
    target.executions.push(ex1);
    target.executions.push(ex2);
    expect(target.averageFilledPrice).toBeCloseTo(1160);
  });
});