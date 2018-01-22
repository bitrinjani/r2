import { ConfigRoot, SpreadStat } from './types';
import { ZmqResponder, ZmqRequester } from '@bitr/zmq';

export interface GenericRequest<T> {
  type: string;
  data?: T;
}

export interface GenericResponse<T> {
  success: boolean;
  reason?: string;
  data?: T;
}

export interface ConfigRequest extends GenericRequest<any> {}
export interface ConfigResponse extends GenericResponse<ConfigRoot> {}
export class ConfigRequester extends ZmqRequester<ConfigRequest, ConfigResponse> {}
export class ConfigResponder extends ZmqResponder<ConfigRequest, ConfigResponse> {}

export interface SnapshotRequest extends GenericRequest<never> {}
export interface SnapshotResponse extends GenericResponse<SpreadStat[]> {}
export class SnapshotRequester extends ZmqRequester<SnapshotRequest, SnapshotResponse> {}
export class SnapshotResponder extends ZmqResponder<SnapshotRequest, SnapshotResponse> {}