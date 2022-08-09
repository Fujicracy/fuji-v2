#!/usr/bin/env bash

. ./script/bash/goerli/common.sh

AAVE_V3=$(cat ./deployments/goerli/AaveV3Goerli)

deploy_contract BorrowingVault --constructor-args $ASSET $DEBT_ASSET $ORACLE 0

VAULT=$(cat ./deployments/goerli/BorrowingVault)

cast_tx $VAULT "setActiveProvider(address)" $AAVE_V3
