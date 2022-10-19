import '@nomicfoundation/hardhat-toolbox';
import '@tenderly/hardhat-tenderly';
import 'hardhat-abi-exporter';
import 'hardhat-preprocessor';
import 'hardhat-deploy';

import * as fs from 'fs';
import { HardhatUserConfig } from 'hardhat/config';

const deployerPath = './deployer.json';

/**
 * Tasks
 */
import { mnemonic } from './hardhat-tasks/getWallet';

/**
 * Configuration
 */
const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.15',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    localhost: {
      live: false,
      saveDeployments: true,
      deploy: [`deploy/networks/${getTestDeployNetwork()}`],
    },
    hardhat: {
      live: false,
      saveDeployments: true,
      deploy: [`deploy/networks/${getTestDeployNetwork()}`],
    },
    mainnet: {
      live: true,
      saveDeployments: true,
      deploy: ['deploy/networks/mainnet'],
      url: `${process.env.RPC_MAINNET}`,
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : { mnemonic: mnemonic(deployerPath) },
    },
    goerli: {
      live: true,
      saveDeployments: true,
      deploy: ['deploy/networks/goerli'],
      url: `${process.env.RPC_GOERLI}`,
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : { mnemonic: mnemonic(deployerPath) },
    },
  },
  etherscan: {
    apiKey: {
      goerli: process.env.ETHERSCAN_KEY ?? '',
    },
  },
  preprocess: {
    eachLine: () => ({
      transform: (line: string) => {
        getRemappings().forEach(([find, replace]) => {
          if (line.match(find)) {
            line = line.replace(find, replace);
          }
        });
        return line;
      },
    }),
  },
  paths: {
    sources: './src',
    cache: './cache_hardhat',
  },
  abiExporter: {
    path: './abis',
    runOnCompile: false,
    clear: true,
    spacing: 2,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    alice: { default: 1 },
    bob: { default: 2 },
    rando: { default: 3 },
  },
  typechain: {
    dontOverrideCompile: true,
  },
  tenderly: {
    project: process.env.TENDERLY_PROJECT || '',
    username: process.env.TENDERLY_USERNAME || '',
  }
};

function getTestDeployNetwork() {
  if (!process.env.TEST_DEPLOY_NETWORK) {
    throw 'Set TEST_DEPLOY_NETWORK in .env';
  } else {
    return process.env.TEST_DEPLOY_NETWORK;
  }
}

function getRemappings() {
  return fs
    .readFileSync('remappings_hardhat.txt', 'utf8')
    .split('\n')
    .filter(Boolean) // remove empty lines
    .map((line: string) => line.trim().split('='));
}

export default config;
