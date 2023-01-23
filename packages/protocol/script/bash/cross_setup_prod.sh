#!/usr/bin/env bash

POLYGON_DOMAIN=1886350457
OPTIMISM_DOMAIN=1869640809

POLYGON_ROUTER=$(cat .local/polygon/ConnextRouter.address)
OPTIMISM_ROUTER=$(cat .local/optimism/ConnextRouter.address)

echo "Calling setRouter(uint256,address) on Polygon ..."
cast send $POLYGON_ROUTER "setRouter(uint256,address)" $OPTIMISM_DOMAIN $OPTIMISM_ROUTER --rpc-url $RPC_POLYGON --private-key $PRIVATE_KEY_DEPLOYER | grep 'transactionHash' | awk '{print $NF}'

echo "Calling setRouter(uint256,address) on Optimism ..."
cast send $OPTIMISM_ROUTER "setRouter(uint256,address)" $POLYGON_DOMAIN $POLYGON_ROUTER --rpc-url $RPC_OPTIMISM --private-key $PRIVATE_KEY_DEPLOYER | grep 'transactionHash' | awk '{print $NF}'
