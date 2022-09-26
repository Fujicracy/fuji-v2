import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy-ethers";
import "hardhat-abi-exporter";
import "hardhat-preprocessor";
import {DeployFunction} from 'hardhat-deploy/types';
import * as fs from "fs";

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

};

function getRemappings() {
  return fs
  .readFileSync("remappings_hardhat.txt", "utf8")
  .split("\n")
    .filter(Boolean) // remove empty lines
    .map((line: string) => line.trim().split("="));
}

export default config;

