declare module "osc" {
    import { EventEmitter } from "events";

    export interface UDPPortOptions {
        localAddress: string;
        localPort: number;
        remoteAddress?: string;
        remotePort?: number;
        broadcast?: boolean;
        metadata?: boolean;
    }

    export interface PortOptions {
        [key: string]: any;
    }

    export class Port extends EventEmitter {
        options: any;
        constructor(options?: PortOptions);
        /**
         * Sends an OSC packet.
         */
        send(oscPacket: any, ...args: any[]): void;
        /**
         * Opens the port.
         */
        open(): void;
        /**
         * Optionally closes the port.
         */
        close?(): void;
        /**
         * Encodes an OSC packet.
         */
        encodeOSC(packet: any): any;
        /**
         * Decodes OSC data.
         */
        decodeOSC(data: any, packetInfo: any): void;
    }

    export class UDPPort extends Port {
        constructor(options: UDPPortOptions);
        close(): void;
    }

    export class SLIPPort extends Port {
        constructor(options?: any);
        close(): void;
        decodeSLIPData(data: any, packetInfo: any): void;
    }

    /**
     * Emits MQTT events for a given packet.
     */
    export function firePacketEvents(port: Port, packet: any, timeTag?: any, packetInfo?: any): void;
    export function fireBundleEvents(port: Port, bundle: any, timeTag?: any, packetInfo?: any): void;

    /**
     * Converts an encoded OSC packet to a native Buffer (or Uint8Array in the browser).
     */
    export function nativeBuffer(obj: any): any;
    /**
     * Reads an OSC packet from data.
     */
    export function readPacket(data: any, options?: any): any;
    /**
     * Writes an OSC packet.
     */
    export function writePacket(packet: any, options?: any): any;

    export class Relay extends EventEmitter {
        port1: Port;
        port2: Port;
        constructor(port1: Port, port2: Port, options?: any);
        open(): void;
        close(): void;
    }
}