import { Socket } from 'zeromq';

// patch for @types/zeromq
export interface ZmqSocket extends Socket {
  removeAllListeners: any;
  once: any;
}
