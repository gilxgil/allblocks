import { Grid, Text, Title } from "@tremor/react";
import { TabList, Tab, TabGroup, TabPanels, TabPanel } from "@tremor/react";
import { Chain } from "./chain";
import { LavaSDKOptions as LavaSDKOptionsLocal, SendRelayOptions, SendRestRelayOptions } from "../../bin/src/sdk/sdk";

interface ChainDesc {
  name: string;
  chainId: string;
  rpcInterface: string;
  blockTimeSeconds: number;
  testnet: string;
  relay: SendRelayOptions | SendRestRelayOptions;
  relayParse: string;
}

const evmRelay = {
  method: "eth_blockNumber",
  params: [],
  apiInterface: "jsonrpc",
};

const cosmosRelay = {
  connectionType: "GET",
  url: "/cosmos/base/tendermint/v1beta1/blocks/latest",
};

const aptosRelay = {
  connectionType: "GET",
  url: "/",
};

const starkRelay = {
  method: "starknet_blockNumber",
  params: [],
};

const solanaRelay = {
  method: "getBlockHeight",
  params: [],
};

const chains: Array<ChainDesc> = [
  {
    name: "Aptos",
    chainId: "APT1",
    rpcInterface: "rest",
    blockTimeSeconds: 1,
    testnet: "",
    relay: aptosRelay,
    relayParse: "aptosRelayParse",
  },
  {
    name: "Solana",
    chainId: "SOLANA",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 1,
    testnet: "",
    relay: solanaRelay,
    relayParse: "solanaRelayParse",
  },
  {
    name: "Solana",
    chainId: "SOLANAT",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 1,
    testnet: "Testnet",
    relay: solanaRelay,
    relayParse: "solanaRelayParse",
  },
  {
    name: "Cosmos Hub",
    chainId: "COS5",
    rpcInterface: "rest",
    blockTimeSeconds: 3,
    testnet: "",
    relay: cosmosRelay,
    relayParse: "cosmosRelayParse",
  },
  {
    name: "Cosmos Hub",
    chainId: "COS5T",
    rpcInterface: "rest",
    blockTimeSeconds: 3,
    testnet: "Testnet",
    relay: cosmosRelay,
    relayParse: "cosmosRelayParse",
  },
  {
    name: "Osmosis",
    chainId: "COS3",
    rpcInterface: "rest",
    blockTimeSeconds: 3,
    testnet: "",
    relay: cosmosRelay,
    relayParse: "cosmosRelayParse",
  },
  {
    name: "Osmosis",
    chainId: "COS4",
    rpcInterface: "rest",
    blockTimeSeconds: 3,
    testnet: "Testnet",
    relay: cosmosRelay,
    relayParse: "cosmosRelayParse",
  },
  {
    name: "Lava",
    chainId: "LAV1",
    rpcInterface: "rest",
    blockTimeSeconds: 30,
    testnet: "Testnet",
    relay: cosmosRelay,
    relayParse: "cosmosRelayParse",
  },
  {
    name: "Juno",
    chainId: "JUN1",
    rpcInterface: "rest",
    blockTimeSeconds: 3,
    testnet: "",
    relay: cosmosRelay,
    relayParse: "cosmosRelayParse",
  },
  {
    name: "Juno",
    chainId: "JUNT1",
    rpcInterface: "rest",
    blockTimeSeconds: 3,
    testnet: "Testnet",
    relay: cosmosRelay,
    relayParse: "cosmosRelayParse",
  },
  {
    name: "Ethereum",
    chainId: "ETH1",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 12,
    testnet: "",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Ethereum",
    chainId: "GTH1",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 12,
    testnet: "Goerli",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Fantom",
    chainId: "FTM250",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 3,
    testnet: "",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Celo",
    chainId: "CELO",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 5,
    testnet: "",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Celo",
    chainId: "ALFAJORES",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 5,
    testnet: "Alfajores",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Arbitrum",
    chainId: "ARBN",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 1,
    testnet: "",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Arb-Nova",
    chainId: "ARB1",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 1,
    testnet: "",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Polygon",
    chainId: "POLYGON1",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 3,
    testnet: "",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Polygon",
    chainId: "POLYGON1T",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 3,
    testnet: "Testnet",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Evmos",
    chainId: "EVMOS",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 3,
    testnet: "",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Evmos",
    chainId: "EVMOST",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 3,
    testnet: "Testnet",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Optimism",
    chainId: "OPTM",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 2,
    testnet: "",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Optimism",
    chainId: "OPTMT",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 2,
    testnet: "Testnet",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Avalanche",
    chainId: "AVAX",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 3,
    testnet: "",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Filecoin",
    chainId: "FVM",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 3,
    testnet: "",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Canto",
    chainId: "CANTO",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 3,
    testnet: "",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Base",
    chainId: "BASET",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 2,
    testnet: "Testnet",
    relay: evmRelay,
    relayParse: "evmRelayParse",
  },
  {
    name: "Starknet",
    chainId: "STRK",
    rpcInterface: "jsonrpc",
    blockTimeSeconds: 30,
    testnet: "",
    relay: starkRelay,
    relayParse: "starkRelayParse",
  },
];

const staging = "staging";
const testnet = "testnet";

const trkSz = 10;
const sdkStagingConfig: LavaSDKOptionsLocal = {
  badge: {
    badgeServerAddress: "https://badges.lava-cybertron.xyz",
    projectId: "79eef0054404d5bc750d6d56ef427c2b",
  },
  chainIds: "",
  // geolocation 1 for North america - geolocation 2 for Europe providers
  // default value is 1
  geolocation: "2",

  lavaChainId: "lava-staging-4",

};

const getConfig = (chain: ChainDesc, env: string) => {
  let config = sdkStagingConfig;

  let newConfig = structuredClone(config);
  newConfig.chainIds = chain.chainId;

  return newConfig;
};

export default function Home() {
  return (
    <main className="container mx-auto p-8 max-w-5xl">
      <Title>All blocks</Title>
      <Text>
        Show latest blocks from all chains, with latency and uptime info.
      </Text>
      <TabGroup>
        <TabList className="mt-8">
          <Tab>Staging</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Grid numItemsMd={3} className="mt-6 gap-6">
              {chains.map((chain) => (
                <Chain
                  key={chain.chainId}
                  name={chain.name}
                  testnet={chain.testnet}
                  relay={chain.relay}
                  relayParse={chain.relayParse}
                  trkSz={trkSz}
                  blockTimeSeconds={chain.blockTimeSeconds}
                  sdkConfig={getConfig(chain, staging)}
                  env={staging}
                />
              ))}
            </Grid>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </main>
  );
}
