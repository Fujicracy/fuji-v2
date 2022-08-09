#!/usr/bin/env bash

. ./script/bash/goerli/common.sh

deploy_contract XRouter --constructor-args $WETH $CONNEXT_HANDLER

ROUTER=$(cat ./deployments/goerli/XRouter)

VAULT=$(cat ./deployments/goerli/BorrowingVault)

cast_tx $ROUTER "setTestnetToken(address)" $TEST_TOKEN

cast_tx $ROUTER "registerVault(address)" $VAULT
