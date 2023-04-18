import type { Execution } from "../src/types";

import { expect } from "chai";

import { createOrder } from "./helper";
import { toExecution } from "../src/util";

describe("Order", () => {
  it("averageFilledPrice", () => {
    const target = createOrder("Bitflyer", "Buy", 0.01, 1000, "Cash", "Limit", 1);
    const ex1 = toExecution(target);
    ex1.price = 1100;
    ex1.size = 0.004;
    const ex2 = toExecution(target);
    ex2.price = 1200;
    ex2.size = 0.006;
    target.executions.push(ex1 as Execution);
    target.executions.push(ex2 as Execution);
    expect(target.averageFilledPrice).to.equal(1160);
  });
});
