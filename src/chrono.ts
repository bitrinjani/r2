import * as mkdirp from 'mkdirp';
import { ChronoDB } from '@bitr/chronodb';

const prodPath = `${process.cwd()}/datastore/main`;
let chronoDB: ChronoDB;

export function getChronoDB(path: string = prodPath): ChronoDB {
  if (chronoDB === undefined) {
    mkdirp.sync(path);
    chronoDB = new ChronoDB(path);
  }
  return chronoDB;
}

export async function closeChronoDB(): Promise<void> {
  if (chronoDB === undefined) {
    return;
  }
  await chronoDB.close();
}