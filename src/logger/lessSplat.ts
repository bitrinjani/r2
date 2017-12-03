import * as winston from 'winston';
import * as util from 'util';

const lessSplat = winston.format((info) => {
  if (info.splat) {
    info.message = util.format(info.message, ...info.splat);
    // prevent unnecesarry JSON output
    info.splat = undefined;
  }
  return info;
});

export default lessSplat;