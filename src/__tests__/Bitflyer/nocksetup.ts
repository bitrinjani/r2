// tslint:disable
import * as nock from 'nock';

function nocksetup() {
  const api = nock('https://api.bitflyer.jp');
  api.get('/v1/me/getbalance').reply(200, [{ "currency_code": "JPY", "amount": 100, "available": 100 }, { "currency_code": "BTC", "amount": 0.01084272, "available": 0.01084272 }, { "currency_code": "BCH", "amount": 0.00047989, "available": 0.00047989 }, { "currency_code": "ETH", "amount": 0, "available": 0 }, { "currency_code": "ETC", "amount": 0, "available": 0 }, { "currency_code": "LTC", "amount": 0, "available": 0 }, { "currency_code": "MONA", "amount": 0, "available": 0 }]);
  api.post('/v1/me/sendchildorder', {
    "product_code": "BTC_JPY",
    "child_order_type": "LIMIT",
    "side": "BUY",
    "price": 30000,
    "size": 0.1,
    "time_in_force": ""
  }).reply(200, {
    "child_order_acceptance_id": "JRF20150707-050237-639234"
  });
  api.post('/v1/me/cancelchildorder', {
    "product_code": "BTC_JPY",
    "child_order_acceptance_id": "JRF20150707-033333-099999"
  }).reply(200);
  api.get('/v1/me/getchildorders?child_order_acceptance_id=JRF20150707-084547-396699').reply(200, [
    {
      "id": 138397,
      "child_order_id": "JOR20150707-084549-022519",
      "product_code": "BTC_JPY",
      "side": "SELL",
      "child_order_type": "LIMIT",
      "price": 30000,
      "average_price": 0,
      "size": 0.1,
      "child_order_state": "CANCELED",
      "expire_date": "2015-07-14T07:25:47",
      "child_order_date": "2015-07-07T08:45:47",
      "child_order_acceptance_id": "JRF20150707-084547-396699",
      "outstanding_size": 0,
      "cancel_size": 0.1,
      "executed_size": 0,
      "total_commission": 0
    }
  ]);
  api.get('/v1/board').reply(200, {
    "mid_price": 33320,
    "bids": [
      {
        "price": 30000,
        "size": 0.1
      },
      {
        "price": 25570,
        "size": 3
      }
    ],
    "asks": [
      {
        "price": 36640,
        "size": 5
      },
      {
        "price": 36700,
        "size": 1.2
      }
    ]
  });
  api.get('/v1/me/getexecutions?child_order_acceptance_id=JRF20150707-060559-396699').reply(200, [
    {
      "id": 37233,
      "child_order_id": "JOR20150707-060559-021935",
      "side": "BUY",
      "price": 33470,
      "size": 0.01,
      "commission": 0,
      "exec_date": "2015-07-07T09:57:40.397",
      "child_order_acceptance_id": "JRF20150707-060559-396699"
    },
    {
      "id": 37232,
      "child_order_id": "JOR20150707-060426-021925",
      "side": "BUY",
      "price": 33470,
      "size": 0.01,
      "commission": 0,
      "exec_date": "2015-07-07T09:57:40.397",
      "child_order_acceptance_id": "JRF20150707-060559-396699"
    }
  ]);
}

export default nocksetup;