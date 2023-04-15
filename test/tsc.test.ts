import * as child_process from "child_process";
import { promisify } from "util";

import { expect } from "chai";

describe("tsc", function(){
  this.timeout(30e3);

  it("tsc", async () => {
    if(!process.env.CI){
      expect(true).to.equal(true);
    }
    const out = await promisify(child_process.exec)("tsc --noEmit --listFiles");
    expect(out.stdout.length).to.be.greaterThan(0);
    expect(out.stderr.length).to.equal(0);
  });
});
