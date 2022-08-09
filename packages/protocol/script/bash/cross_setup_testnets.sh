#!/usr/bin/env bash

RINKEBY_DOMAIN=1111
GOERLI_DOMAIN=3331

RINKEBY_ROUTER=$(cat ./deployments/rinkeby/XRouter)
GOERLI_ROUTER=$(cat ./deployments/goerli/XRouter)

echo "Calling setRouter(uint256,address) on Goerli ..."
cast send $GOERLI_ROUTER "setRouter(uint256,address)" $RINKEBY_DOMAIN $RINKEBY_ROUTER --rpc-url $RPC_GOERLI --private-key $PRIVATE_KEY | grep 'transactionHash' | awk '{print $NF}'

echo "Calling setRouter(uint256,address) on Rinkeby ..."
cast send $RINKEBY_ROUTER "setRouter(uint256,address)" $GOERLI_DOMAIN $GOERLI_ROUTER --rpc-url $RPC_RINKEBY --private-key $PRIVATE_KEY | grep 'transactionHash' | awk '{print $NF}'
