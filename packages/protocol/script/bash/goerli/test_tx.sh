#!/usr/bin/env bash

. ./script/bash/goerli/common.sh

RINKEBY_VAULT=$(cat ./deployments/rinkeby/Vault)

USER_ADDR=$(cast wallet address --private-key $PRIVATE_KEY | grep 'Address:' | awk '{print $NF}')
AMOUNT=$(cast --to-wei 10)
BORROW_AMOUNT=1000000000

ROUTER=$(cat ./deployments/goerli/XRouter)

# mint some WETH
cast_tx $WETH "mint(address,uint256)" $USER_ADDR $AMOUNT

# approve router for weth
cast_tx $WETH "approve(address,uint256)" $ROUTER $AMOUNT

# call bridgeDepositAndBorrow
cast_tx $ROUTER "bridgeDepositAndBorrow(uint256,address,address,uint256,uint256)" $RINKEBY_DOMAIN $RINKEBY_VAULT $WETH $AMOUNT $BORROW_AMOUNT
