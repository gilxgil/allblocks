import { AccountData } from "@cosmjs/proto-signing";
export declare class LavaWallet {
    private wallet;
    private privKey;
    constructor(privKey: string);
    init(): Promise<void>;
    getConsumerAccount(): Promise<AccountData>;
    printAccount(AccountData: AccountData): void;
}
export declare function createWallet(privKey: string): Promise<LavaWallet>;
interface WalletCreationResult {
    wallet: LavaWallet;
    privKey: string;
    seedPhrase: string;
}
declare type MnemonicLength = 24 | 12 | 15 | 18 | 21 | undefined;
export declare function createDynamicWallet(mnemonicLength?: MnemonicLength): Promise<WalletCreationResult>;
export {};
