import { expect, spy } from "chai";

import * as config from "../src/config";

// @ts-ignore 2540
config.getConfigRoot = spy(() => {
  throw new Error();
});

describe("intl", () =>{
  it("intl catch", () => {
    expect(() => require("../i18n")).not.to.throw();
  });
});
