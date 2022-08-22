#!/usr/bin/env bash

. ./script/bash/rinkeby/common.sh

deploy_contract XRouter --constructor-args $WETH $CONNEXT_HANDLER

ROUTER=$(cat ./deployments/rinkeby/XRouter)

cast_tx $ROUTER "setTestnetToken(address)" $TEST_TOKEN
