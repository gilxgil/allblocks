import { ReportedProvider } from "../grpc_web_services/lavanet/lava/pairing/relay_pb";
export declare class ReportedProviders {
    private addedToPurgeAndReport;
    reset(): void;
    GetReportedProviders(): Array<ReportedProvider>;
    isReported(address: string): boolean;
    reportedProvider(address: string, errors: number, disconnections: number): void;
}
