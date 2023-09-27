import { PairingResponse } from "./state_query";
import { Relayer } from "../../relayer/relayer";
import { AccountData } from "@cosmjs/proto-signing";
import { BadgeManager } from "../../badge/badgeManager";
export declare class StateBadgeQuery {
    private pairing;
    private badgeManager;
    private chainIDs;
    private walletAddress;
    private relayer;
    private account;
    constructor(badgeManager: BadgeManager, walletAddress: string, account: AccountData, chainIDs: string[], relayer: Relayer);
    fetchPairing(): Promise<number>;
    init(): Promise<void>;
    getPairing(chainID: string): PairingResponse | undefined;
    private fetchNewBadge;
}
