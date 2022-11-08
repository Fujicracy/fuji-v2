#!/usr/bin/env bash

MUMBAI_DOMAIN=9991
OPT_GOERLI_DOMAIN=1735356532

MUMBAI_ROUTER=$(cat .local/mumbai/ConnextRouter.address)
OPT_GOERLI_ROUTER=$(cat .local/optimism-goerli/ConnextRouter.address)

echo "Calling setRouter(uint256,address) on Mumbai ..."
cast send $MUMBAI_ROUTER "setRouter(uint256,address)" $OPT_GOERLI_DOMAIN $OPT_GOERLI_ROUTER --rpc-url $RPC_MUMBAI --private-key $PRIVATE_KEY | grep 'transactionHash' | awk '{print $NF}'

echo "Calling setRouter(uint256,address) on Otimism Goerli ..."
cast send $OPT_GOERLI_ROUTER "setRouter(uint256,address)" $MUMBAI_DOMAIN $MUMBAI_ROUTER --rpc-url $RPC_OPTIMISM_GOERLI --private-key $PRIVATE_KEY | grep 'transactionHash' | awk '{print $NF}'
