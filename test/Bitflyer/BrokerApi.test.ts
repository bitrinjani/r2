// tslint:disable
import * as nock from 'nock';
import * as _ from 'lodash';
import BrokerApi from '../../src/Bitflyer/BrokerApi';
import nocksetup from './nocksetup';
import { options } from '@bitr/logger';
import { expect } from 'chai';
options.enabled = false;

nocksetup();

describe("BrokerApi", function(){
  this.afterAll(() => {
    nock.restore();
  });
  const target = new BrokerApi('key', 'secret');

  describe('BrokerApi', async () => {
    it('sendChildOrder', async () => {
      const req = {
        "product_code": "BTC_JPY",
        "child_order_type": "LIMIT",
        "side": "BUY",
        "price": 30000,
        "size": 0.1,
        "time_in_force": ""
      };
      const reply = await target.sendChildOrder(req);
      expect(reply.child_order_acceptance_id).to.equal('JRF20150707-050237-639234');
    })

    it('cancel', async () => {
      const req = {
        "product_code": "BTC_JPY",
        "child_order_acceptance_id": "JRF20150707-033333-099999"
      };
      const reply = await target.cancelChildOrder(req);
      expect(reply).to.equal({});
    })

    it('board', async () => {
      const reply = await target.getBoard();
      expect(reply.asks.length).to.equal(2);
      expect(reply.bids[1].price).to.equal(25570);
    });

    it('getchildorders', async () => {
      const acceptanceId = 'JRF20150707-084547-396699';
      const reply = await target.getChildOrders({child_order_acceptance_id: acceptanceId});
      expect(reply[0].child_order_acceptance_id).to.equal(acceptanceId);
    });

    it('getExecutions', async () => {
      const acceptanceId = 'JRF20150707-060559-396699';
      const reply = await target.getExecutions({child_order_acceptance_id: acceptanceId});
      expect(reply[0].child_order_acceptance_id).to.equal(acceptanceId);
      expect(reply[0].exec_date.getUTCFullYear()).to.equal(2015);
    })
  });
});
