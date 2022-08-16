#!/usr/bin/env bash

. ./script/bash/goerli/common.sh

deploy_contract XRouter --constructor-args $WETH $CONNEXT_HANDLER

ROUTER=$(cat ./deployments/goerli/XRouter)

cast_tx $ROUTER "setTestnetToken(address)" $TEST_TOKEN
