/// <reference types="long" />
export declare function base64ToUint8Array(str: string): Uint8Array;
export declare function generateRPCData(method: string, params: Array<any>): string;
export declare function parseLong(long: Long): number;
export declare function debugPrint(debugMode: boolean, message?: any, ...optionalParams: any[]): void;
export declare function generateRandomInt(): number;
export declare function sleep(ms: number): Promise<void>;
export declare function median(values: number[]): number;
