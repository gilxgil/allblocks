export declare class ProviderEpochTracker {
    private providersEpochs;
    private epoch;
    reset(): void;
    hasEpochDataForProviderAddress(providersPublicAddress: string): boolean;
    setEpoch(providersPublicAddress: string, epoch: number): void;
    getEpoch(): number;
    getProviderListSize(): number;
}
