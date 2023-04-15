import * as fs from "fs";

import { expect, spy } from "chai";

import { getConfigRoot } from "../src/configUtil";

let existsSyncCount = 0;
const originalExistsSync = fs.existsSync;
const originalReadFileSync = fs.readFileSync;
// @ts-expect-error
fs.existsSync = spy(() => {
  existsSyncCount++;
  return false;
});
// @ts-expect-error
fs.readFileSync = spy(() => "{\"language\": \"test\"}");

it("getConfigRoot not found config.json", () => {
  const config = getConfigRoot();
  expect(existsSyncCount).to.equal(1);
  expect(config.language).to.equal("test");
});

it("getConfigRoot with process.env mock", () => {
  process.env.NODE_ENV = "testmock";
  try{
    const config = getConfigRoot();
    expect(config.language).to.equal("test");
  } finally{
    process.env.NODE_ENV = "test";
  }
});

// @ts-expect-error
fs.existsSync = originalExistsSync;
// @ts-expect-error
fs.readFileSync = originalReadFileSync;
