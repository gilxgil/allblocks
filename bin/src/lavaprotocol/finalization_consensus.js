"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalizationConsensus = exports.GetLatestFinalizedBlock = void 0;
const conflict_data_pb_1 = require("../grpc_web_services/lavanet/lava/conflict/conflict_data_pb");
const logger_1 = require("../logger/logger");
function GetLatestFinalizedBlock(latestBlock, blockDistanceForFinalizedData) {
    return latestBlock - blockDistanceForFinalizedData;
}
exports.GetLatestFinalizedBlock = GetLatestFinalizedBlock;
class FinalizationConsensus {
    constructor() {
        this.currentProviderHashesConsensus = [];
        this.prevEpochProviderHashesConsensus = [];
        this.currentEpoch = 0;
        this.latestBlock = 0;
    }
    newProviderHashesConsensus(blockDistanceForFinalizedData, providerAcc, latestBlock, finalizedBlocks, reply, req) {
        const newProviderDataContainer = {
            latestFinalizedBlock: GetLatestFinalizedBlock(latestBlock, blockDistanceForFinalizedData),
            latestBlockTime: performance.now(),
            finalizedBlockHashes: finalizedBlocks,
            sigBlocks: reply.getSigBlocks(),
            sessionId: req.getSessionId(),
            relayNum: req.getRelayNum(),
            blockHeight: req.getEpoch(),
            latestBlock: latestBlock,
        };
        const providerDataContiners = new Map([
            [providerAcc, newProviderDataContainer],
        ]);
        return {
            finalizedBlocksHashes: finalizedBlocks,
            agreeingProviders: providerDataContiners,
        };
    }
    insertProviderToConsensus(blockDistanceForFinalizedData, consensus, finalizedBlocks, latestBlock, reply, req, providerAcc) {
        const newProviderDataContainer = {
            latestFinalizedBlock: GetLatestFinalizedBlock(latestBlock, blockDistanceForFinalizedData),
            latestBlockTime: performance.now(),
            finalizedBlockHashes: finalizedBlocks,
            sigBlocks: reply.getSigBlocks(),
            sessionId: req.getSessionId(),
            relayNum: req.getRelayNum(),
            blockHeight: req.getEpoch(),
            latestBlock: latestBlock,
        };
        consensus.agreeingProviders.set(providerAcc, newProviderDataContainer);
        for (const [blockNum, blockHash] of finalizedBlocks.entries()) {
            consensus.finalizedBlocksHashes.set(blockNum, blockHash);
        }
    }
    updateFinalizedHashes(blockDistanceForFinalizedData, providerAddress, finalizedBlocks, req, reply) {
        const latestBlock = reply.getLatestBlock();
        let finalizationConflict;
        if (this.currentProviderHashesConsensus.length == 0 &&
            this.prevEpochProviderHashesConsensus.length == 0) {
            const newHashConsensus = this.newProviderHashesConsensus(blockDistanceForFinalizedData, providerAddress, latestBlock, finalizedBlocks, reply, req);
            this.currentProviderHashesConsensus.push(newHashConsensus);
        }
        else {
            let inserted = false;
            for (const consensus of this.currentProviderHashesConsensus) {
                const err = this.discrepancyChecker(finalizedBlocks, consensus);
                if (err) {
                    finalizationConflict = new conflict_data_pb_1.FinalizationConflict();
                    finalizationConflict.setRelayreply0(reply);
                    continue;
                }
                if (!inserted) {
                    this.insertProviderToConsensus(blockDistanceForFinalizedData, consensus, finalizedBlocks, latestBlock, reply, req, providerAddress);
                    inserted = true;
                }
            }
            if (!inserted) {
                const newHashConsensus = this.newProviderHashesConsensus(blockDistanceForFinalizedData, providerAddress, latestBlock, finalizedBlocks, reply, req);
                this.currentProviderHashesConsensus.push(newHashConsensus);
            }
            if (finalizationConflict) {
                logger_1.Logger.info("Simulation: Conflict found in discrepancyChecker");
                return finalizationConflict;
            }
            for (const idx in this.prevEpochProviderHashesConsensus) {
                const err = this.discrepancyChecker(finalizedBlocks, this.prevEpochProviderHashesConsensus[idx]);
                if (err) {
                    finalizationConflict = new conflict_data_pb_1.FinalizationConflict();
                    finalizationConflict.setRelayreply0(reply);
                    logger_1.Logger.info("Simulation: prev epoch Conflict found in discrepancyChecker", "Consensus idx", idx, "provider", providerAddress);
                    return finalizationConflict;
                }
            }
        }
        return undefined;
    }
    discrepancyChecker(finalizedBlocksA, consensus) {
        let toIterate = new Map();
        let otherBlocks = new Map();
        if (finalizedBlocksA.size < consensus.finalizedBlocksHashes.size) {
            toIterate = finalizedBlocksA;
            otherBlocks = consensus.finalizedBlocksHashes;
        }
        else {
            toIterate = consensus.finalizedBlocksHashes;
            otherBlocks = finalizedBlocksA;
        }
        for (const [blockNum, blockHash] of toIterate.entries()) {
            const otherHash = otherBlocks.get(blockNum);
            if (otherHash) {
                if (blockHash != otherHash) {
                    return logger_1.Logger.fatal("Simulation: reliability discrepancy, different hashes detected for block");
                }
            }
        }
        return undefined;
    }
    newEpoch(epoch) {
        if (this.currentEpoch < epoch) {
            // means it's time to refresh the epoch
            this.prevEpochProviderHashesConsensus =
                this.currentProviderHashesConsensus;
            this.currentProviderHashesConsensus = [];
            this.currentEpoch = epoch;
        }
    }
    getLatestBlock() {
        return this.latestBlock;
    }
    getExpectedBlockHeight(chainParser) {
        const chainBlockStats = chainParser.chainBlockStats();
        let highestBlockNumber = 0;
        const findAndUpdateHighestBlockNumber = (listProviderHashesConsensus) => {
            for (const providerHashesConsensus of listProviderHashesConsensus) {
                for (const [, providerDataContainer,] of providerHashesConsensus.agreeingProviders) {
                    if (highestBlockNumber < providerDataContainer.latestFinalizedBlock) {
                        highestBlockNumber = providerDataContainer.latestFinalizedBlock;
                    }
                }
            }
        };
        findAndUpdateHighestBlockNumber(this.prevEpochProviderHashesConsensus);
        findAndUpdateHighestBlockNumber(this.currentProviderHashesConsensus);
        const now = performance.now();
        const calcExpectedBlocks = function (mapExpectedBlockHeights, listProviderHashesConsensus) {
            for (const providerHashesConsensus of listProviderHashesConsensus) {
                for (const [providerAddress, providerDataContiner,] of providerHashesConsensus.agreeingProviders) {
                    const interpolation = interpolateBlocks(now, providerDataContiner.latestBlockTime, chainBlockStats.averageBlockTime);
                    let expected = providerDataContiner.latestFinalizedBlock + interpolation;
                    if (expected > highestBlockNumber) {
                        expected = highestBlockNumber;
                    }
                    mapExpectedBlockHeights.set(providerAddress, expected);
                }
            }
        };
        const mapExpectedBlockHeights = new Map();
        calcExpectedBlocks(mapExpectedBlockHeights, this.prevEpochProviderHashesConsensus);
        calcExpectedBlocks(mapExpectedBlockHeights, this.currentProviderHashesConsensus);
        const median = function (dataMap) {
            const data = [];
            for (const latestBlock of dataMap.values()) {
                data.push(latestBlock);
            }
            data.sort((a, b) => a - b);
            let medianResult = 0;
            if (data.length == 0) {
                return 0;
            }
            else if (data.length % 2 == 0) {
                medianResult =
                    (data[data.length / 2 - 1] + data[data.length / 2]) / 2.0;
            }
            else {
                medianResult = data[data.length / 2];
            }
            return medianResult;
        };
        const medianOfExpectedBlocks = median(mapExpectedBlockHeights);
        const providersMedianOfLatestBlock = medianOfExpectedBlocks + chainBlockStats.blockDistanceForFinalizedData;
        if (medianOfExpectedBlocks > 0 &&
            providersMedianOfLatestBlock > this.latestBlock) {
            if (providersMedianOfLatestBlock > this.latestBlock + 1000 &&
                this.latestBlock > 0) {
                logger_1.Logger.error("uncontinous jump in finalization data, latestBlock", this.latestBlock, "providersMedianOfLatestBlock", providersMedianOfLatestBlock);
            }
            this.latestBlock = providersMedianOfLatestBlock;
        }
        return {
            expectedBlockHeight: providersMedianOfLatestBlock -
                chainBlockStats.allowedBlockLagForQosSync,
            numOfProviders: mapExpectedBlockHeights.size,
        };
    }
}
exports.FinalizationConsensus = FinalizationConsensus;
function interpolateBlocks(timeNow, latestBlockTime, averageBlockTime) {
    if (timeNow < latestBlockTime) {
        return 0;
    }
    return Math.floor((timeNow - latestBlockTime) / averageBlockTime);
}
