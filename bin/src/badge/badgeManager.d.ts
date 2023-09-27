import { GenerateBadgeResponse } from "../grpc_web_services/lavanet/lava/pairing/badges_pb";
import { grpc } from "@improbable-eng/grpc-web";
export declare const TimoutFailureFetchingBadgeError: Error;
/**
 * Interface for managing Badges
 */
export interface BadgeOptions {
    badgeServerAddress: string;
    projectId: string;
    authentication?: string;
}
export declare class BadgeManager {
    private badgeServerAddress;
    private projectId;
    private authentication;
    private active;
    private transport;
    private badgeGeneratorClient?;
    constructor(options: BadgeOptions | undefined, transport?: grpc.TransportFactory);
    isActive(): boolean;
    fetchBadge(badgeUser: string, specId: string): Promise<GenerateBadgeResponse | Error>;
    getTransport(): grpc.TransportFactory;
    getTransportWrapped(): {
        transport: grpc.TransportFactory;
    };
    private timeoutPromise;
    private relayWithTimeout;
}
