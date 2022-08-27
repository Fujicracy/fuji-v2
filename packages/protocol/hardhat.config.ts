import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-preprocessor";
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
  solidity: {
    compilers: [
      {
        version: "0.8.15",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
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

