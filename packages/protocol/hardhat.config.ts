import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy-ethers";
import "hardhat-abi-exporter";
import "hardhat-preprocessor";
import "hardhat-deploy";
import * as fs from "fs";

/** 
 * Tasks
*/
import "./hardhat-tasks/generate";

/** 
 * Configuration
*/
const config: HardhatUserConfig = {
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
    sources: "./src",
    cache: "./cache_hardhat",
  },
  abiExporter: {
    path: './abis',
    runOnCompile: false,
    clear: true,
    spacing: 2,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.15",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      }
    ],
  },
  namedAccounts: {
    deployer: { default: 0 },
    alice: { default: 1 },
    bob: { default: 2 },
    rando: { default: 3 },
  },
};

function getRemappings() {
  return fs
  .readFileSync("remappings_hardhat.txt", "utf8")
  .split("\n")
    .filter(Boolean) // remove empty lines
    .map((line: string) => line.trim().split("="));
}

export default config;

