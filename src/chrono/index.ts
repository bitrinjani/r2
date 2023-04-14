export * from "./ChronoDB";
export * from "./TimeSeries";
export * from "./types";

import mkdirp from "mkdirp";

import { ChronoDB } from "./ChronoDB";

const prodPath = `${process.cwd()}/datastore/main`;
let chronoDB: ChronoDB;

export function getChronoDB(path: string = prodPath): ChronoDB {
  if(chronoDB === undefined){
    mkdirp.sync(path);
    chronoDB = new ChronoDB(path);
  }
  return chronoDB;
}

export async function closeChronoDB(): Promise<void> {
  if(chronoDB === undefined){
    return;
  }
  await chronoDB.close();
}
