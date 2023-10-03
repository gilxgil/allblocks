import { StateQuery } from "../stateQuery/state_query";
import { ConsumerSessionManager } from "../../lavasession/consumerSessionManager";
import { Config } from "../state_tracker";
export declare class PairingUpdater {
    private stateQuery;
    private consumerSessionManagerMap;
    private config;
    constructor(stateQuery: StateQuery, config: Config);
    registerPairing(consumerSessionManager: ConsumerSessionManager): Promise<void | Error>;
    update(): Promise<void>;
    private updateConsumerSessionManager;
    private filterPairingListByEndpoint;
}
