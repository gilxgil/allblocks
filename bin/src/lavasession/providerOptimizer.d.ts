import { ProviderOptimizer } from "./consumerTypes";
export declare class RandomProviderOptimizer implements ProviderOptimizer {
    chooseProvider(allAddresses: string[], ignoredProviders: string[], cu: number, requestedBlock: number, perturbationPercentage: number): string[];
    appendProbeRelayData(providerAddress: string, latency: number, success: boolean): void;
    appendRelayData(providerAddress: string, latency: number, isHangingApi: boolean, cu: number, syncBlock: number): void;
    appendRelayFailure(providerAddress: string): void;
    calculateProbabilityOfTimeout(availabilityScoreStore: ScoreStore): number;
    calculateProbabilityOfBlockError(requestedBlock: number, providerData: ProviderData): number;
    getExcellenceQoSReportForProvider(providerAddress: string): any;
}
interface ProviderData {
    availability: ScoreStore;
    latency: ScoreStore;
    sync: ScoreStore;
    syncBlock: number;
}
interface ScoreStore {
    num: number;
    denom: number;
    time: number;
}
export {};
