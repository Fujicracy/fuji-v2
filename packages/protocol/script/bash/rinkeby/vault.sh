#!/usr/bin/env bash

. ./script/bash/rinkeby/common.sh

AAVE_V3=$(cat ./deployments/rinkeby/AaveV3Rinkeby)

deploy_contract BorrowingVault --constructor-args $ASSET $DEBT_ASSET $ORACLE 0

VAULT=$(cat ./deployments/rinkeby/BorrowingVault)

cast_tx $VAULT "setActiveProvider(address)" $AAVE_V3
