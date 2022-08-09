import { utils } from "ethers";

import { ConnextHandlerAbi, TokenRegistryAbi } from "./abi";
import { TokenRegistryInterface as TTokenRegistryInterface } from "./typechain-types/contracts/core/connext/helpers/TokenRegistry";
import { ConnextHandlerInterface as TConnextHandlerInterface } from "./typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol/ConnextHandler";

export const ConnextHandlerInterface = new utils.Interface(ConnextHandlerAbi) as TConnextHandlerInterface;
export const TokenRegistryInterface = new utils.Interface(TokenRegistryAbi) as TTokenRegistryInterface;
