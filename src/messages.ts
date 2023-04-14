import type { ConfigRoot, SpreadStat } from "./types";

import { ZmqResponder, ZmqRequester } from "./zmq";

export interface GenericRequest<T> {
  type: string;
  data?: T;
}

export interface GenericResponse<T> {
  success: boolean;
  reason?: string;
  data?: T;
}

export type ConfigRequest = GenericRequest<any>;
export type ConfigResponse = GenericResponse<ConfigRoot>;
export class ConfigRequester extends ZmqRequester<ConfigRequest, ConfigResponse> {}
export class ConfigResponder extends ZmqResponder<ConfigRequest, ConfigResponse> {}

export type SnapshotRequest = GenericRequest<never>;
export type SnapshotResponse = GenericResponse<SpreadStat[]>;
export class SnapshotRequester extends ZmqRequester<SnapshotRequest, SnapshotResponse> {}
export class SnapshotResponder extends ZmqResponder<SnapshotRequest, SnapshotResponse> {}
