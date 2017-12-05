import LoggerFactory, { Logger } from './LoggerFactory';
import * as _ from 'lodash';

const factory = new LoggerFactory();

export function getLogger(name: string): Logger {
  return factory.create(_.trimEnd(name, 'Impl'));
}
