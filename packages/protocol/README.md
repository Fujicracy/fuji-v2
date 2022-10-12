## Factors in contracts
A factor through these contracts refer to a fixed-digit decimal number. Specifically, a decimal number scaled by 1e18. These numbers should be treated as real numbers scaled down by 1e18. For example, the number 50% would be represented as 5*1e17.

## Testing smart contract functions

1. Set up an `.env` file in `root\packages\protocol` with the required environment variables. Refer to `./sample.env`.

## Testing deployment of smart contracts

1. Ensure you have set `TEST_DEPLOY_NETWORK` in your .env file.  

2. Compile the contracts:
   >`forge build'  
  
3. Run a fork using the RPC of the same NETWORK as set in `TEST_DEPLOY_NETWORK`.  
    For example, if your `TEST_DEPLOY_NETWORK`=goerli, then create your fork with:  
    >`anvil --chain-id 420 --fork-url https://goerli.infura.io/v3/<YOUR_KEY>`  
  
4. Deploy the system with the following command:
   >`npx hardhat --network localhost deploy --no-compile`   
   NOTE: The configuration in `hardhatConfig.ts` uses the artifacts and bytecode created by the previously called `forge build` command.

5. A folder will be created under `deployments/localhost` with all the artifacts containing also the addresses. 