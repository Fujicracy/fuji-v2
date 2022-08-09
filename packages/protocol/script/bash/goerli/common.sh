#!/usr/bin/env bash

RPC_URL=$RPC_GOERLI

RINKEBY_DOMAIN=1111
GOERLI_DOMAIN=3331

ASSET=0x2e3A2fb8473316A02b8A297B982498E661E1f6f5
DEBT_ASSET=0xA2025B15a1757311bfD68cb14eaeFCc237AF5b43
ORACLE=0xD7E3AE6f48A1D442069b32a5Aa6e315B111B992C
WETH=0x2e3A2fb8473316A02b8A297B982498E661E1f6f5
TEST_TOKEN=0x26FE8a8f86511d678d031a022E48FfF41c6a3e3b
CONNEXT_HANDLER=0x6c9a905Ab3f4495E2b47f5cA131ab71281E0546e

deploy_contract() {
  local ADDR=$(forge create $* --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --etherscan-api-key $ETHERSCAN_KEY --verify | grep 'Deployed to:' | awk '{print $NF}')

  echo "$1 deployed and address saved at './deployments/goerli/$1':"
  echo $ADDR
  echo $ADDR > ./deployments/goerli/$1
  echo "========="
}

cast_tx() {
  echo "Sending tx $2 ..."
  local HASH=$(cast send $* --rpc-url $RPC_URL --private-key $PRIVATE_KEY | grep '^transactionHash' | awk '{print $NF}')
  echo "Transaction hash:"
  echo $HASH
  echo "https://goerli.etherscan.io/tx/$HASH"
  echo "========="
}
