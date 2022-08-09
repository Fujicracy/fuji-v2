#!/usr/bin/env bash

. ./script/bash/rinkeby/common.sh

GOERLI_VAULT=$(cat ./deployments/goerli/Vault)
RINKEBY_VAULT=$(cat ./deployments/rinkeby/Vault)

USER_ADDR=$(cast wallet address --private-key $PRIVATE_KEY | grep 'Address:' | awk '{print $NF}')
AMOUNT=$(cast --to-wei 10)
BORROW_AMOUNT=1000000000

ROUTER=$(cat ./deployments/rinkeby/XRouter)

# mint some WETH
#cast_tx $WETH "mint(address,uint256)" $USER_ADDR $AMOUNT

# approve router for weth
cast_tx $WETH "approve(address,uint256)" $ROUTER $AMOUNT

# call bridgeDepositAndBorrow
#cast_tx $ROUTER "bridgeDepositAndBorrow(uint256,address,address,uint256,uint256)" $GOERLI_DOMAIN $GOERLI_VAULT $WETH $AMOUNT $BORROW_AMOUNT

cast_tx $ROUTER "depositBorrowAndBridge(uint256,address,uint256,uint256)" $GOERLI_DOMAIN $RINKEBY_VAULT $AMOUNT $BORROW_AMOUNT

#cast_tx $ROUTER "bridgeDepositBorrowAndTransfer(uint256,uint256,address,address,uint256,uint256,address)" $GOERLI_DOMAIN $RINKEBY_DOMAIN $GOERLI_VAULT $WETH $AMOUNT $BORROW_AMOUNT $DEBT_ASSET
