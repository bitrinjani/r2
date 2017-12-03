import LoggerFactory, { Logger } from './LoggerFactory';

const factory = new LoggerFactory();

export function getLogger(name: string): Logger {
  return factory.create(name);
}
