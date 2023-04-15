import * as Module from "module";

import { spy } from "chai";

const originalRequire = Module.prototype.require;
let count = 0;
Module.prototype.require = new Proxy(Module.prototype.require, {
  apply(target, thisArg, argArray) {
    if(argArray[0] === "date-fns"){
      return {
        format: spy(() => {
          count++;
          if(count === 1){
            throw new Error();
          }else{
            throw new Error("test");
          }
        }),
      };
    }
    return Reflect.apply(target, thisArg, argArray);
  },
});

import { pretty } from "../../src/transport/transform";

import { Readable } from "stream";

it("pretty split callback throws", () => {
  const result = pretty({ colorize: true, withLabel: true, debug: true, hidden: false });
  const stream = new Readable();
  stream.push("{ \"msg\": \"Test message\", \"time\": 1514074545477, \"level\": 40, \"label\": \"TestStream\" }");
  stream.push(null);
  stream.pipe(result).pipe(process.stdout);
});

it("pretty split callback throws 2", () => {
  const result = pretty({ colorize: true, withLabel: true, debug: true, hidden: false });
  const stream = new Readable();
  stream.push("{ \"msg\": \"Test message\", \"time\": 1514074545477, \"level\": 40, \"label\": \"TestStream\" }");
  stream.push(null);
  stream.pipe(result).pipe(process.stdout);
});

Module.prototype.require = originalRequire;
