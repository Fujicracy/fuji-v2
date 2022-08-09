#!/usr/bin/env bash

RPC_URL=$RPC_RINKEBY

RINKEBY_DOMAIN=1111
GOERLI_DOMAIN=3331

ASSET=0xd74047010D77c5901df5b0f9ca518aED56C85e8D
DEBT_ASSET=0xb18d016cDD2d9439A19f15633005A6b2cd6Aa774
ORACLE=0xD7E3AE6f48A1D442069b32a5Aa6e315B111B992C
WETH=0xd74047010D77c5901df5b0f9ca518aED56C85e8D
TEST_TOKEN=0x3FFc03F05D1869f493c7dbf913E636C6280e0ff9
CONNEXT_HANDLER=0x4cAA6358a3d9d1906B5DABDE60A626AAfD80186F

deploy_contract() {
  local ADDR=$(forge create $* --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --etherscan-api-key $ETHERSCAN_KEY --verify | grep 'Deployed to:' | awk '{print $NF}')

  echo "$1 deployed and address saved at './deployments/rinkeby/$1':"
  echo $ADDR
  echo $ADDR > ./deployments/rinkeby/$1
  echo "========="
}

cast_tx() {
  echo "Sending tx $2 ..."
  local HASH=$(cast send $* --rpc-url $RPC_URL --private-key $PRIVATE_KEY | grep '^transactionHash' | awk '{print $NF}')
  echo "Transaction hash:"
  echo $HASH
  echo "https://rinkeby.etherscan.io/tx/$HASH"
  echo "========="
}
