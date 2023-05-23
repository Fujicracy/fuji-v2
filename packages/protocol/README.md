## Setup
1. Get required keys and set them as env variables
```
cp sample.env .env
source .env
```

2. Install Foundry
Find the instructions [here](https://book.getfoundry.sh/getting-started/installation).

3. Install npm packages
```
yarn
```

4. Compile contracts
```
yarn build
```

5. Test
```
yarn test
```

## Git Submodules used in Foundry

This package works with git submodules (due to Foundry)

From time to time you may require to refresh/update your submodudles.
Follow this steps:

1. Clean the `lib` folder where foundry keeps git submodules, from the project root directory:

```
sudo rm -r ~/packages/protocol/lib/*
```

2. Run the command to update the submodule files:

```
git submodules update --recursive
```

## Slither
Slither is a Solidity static analyzer. It helps identify potential security issues.

1. [How to install](https://github.com/crytic/slither#how-to-install)

2. Run from "packages/protocol"
```
slither .
```

3. Run and generate outputs in a file
```
slither . --json slither_output.json
```

## Factors in contracts
A factor through these contracts refer to a fixed-digit decimal number. Specifically, a decimal number scaled by 1e18. These numbers should be treated as real numbers scaled down by 1e18. For example, the number 50% would be represented as 5*1e17.

## Testing deployment of smart contracts

1. Ensure you have set `TEST_DEPLOY_NETWORK` in your .env file.  

2. Compile the contracts:
```
forge build
```
  
3. Run a fork using the RPC of the same NETWORK as set in `TEST_DEPLOY_NETWORK`. For example, if your `TEST_DEPLOY_NETWORK`=goerli, then create your fork with:  
```
anvil --chain-id 420 --fork-url https://goerli.infura.io/v3/<YOUR_KEY>
```

4. Deploy the system with the following command:
```
npx hardhat --network localhost deploy --no-compile
```
NOTE: The configuration in `hardhat.config.ts` uses the artifacts and bytecode created by the previously called `forge build` command.

5. A folder will be created under `deployments/localhost` with all the artifacts containing also the addresses. 

## Error message format
The contracts in Fuji version 2 shall use solidity `error messages` instead of `require` statements. This saves on contract bytecode. The format should be the following:

> `Contract__function_errorMessage();`

Capitalized contract + two underscores + camelcase function + underscore + camelcase error message.  

## General smart contract documentation guideline
Use the follow contract as a documentation guideline.

```js
// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

/**
 * @title DocumentationGuideline
 * 
 * @author Fujidao Labs
 * 
 * @notice Sample contract to illustrate the documentation style.
 * 
 * @dev All contracts and interfaces must have a documentation title block like this one.
 * The title tag must match the contract name.
 * The notice tag should explain the user what this contract does and are intended for 
 * the general public/user audience.
 * The dev tag should explain developer information details and are intended for 
 * developer audience.
 * There must be a line gap between tags.
 * Imports must be placed after the title block.
 * Interfaces for external protocols do not require further documentation aside
 * from this title block. Optionally add a link to the repository
 * of the external protocol in this block.
 * Use explicit pragma, and define license accordingly. 
 * Maintain documentation notes under the 100 character line.
 */

import { OtherContract } from "./<fake-path>/OtherContract.sol";
import { ArbitraryLibrary } from "./<fake-path>/ArbitraryLibrary.sol";

contract DocumentationGuideline {
    using ArbitraryLibrary for uint;

    /**
     * @dev This is an example struct. If needed, define the parameters
     * with simple inline comments. You must define the purpose of the struct in a dev tag.
     * Struct/Enum definitions are follow type extensions.
     */
    struct ExampleStruct {
        // This is the first property.
        uint one;
        // All inline comments must be there own line.
        uint two;
        // Inline comments first word must be capitalized and full stop. 
        string three;
    }

    /**
     * @dev Multiple line and/or tag comments should be described in a star block, such as this
     * one, decribing an event. Event definition is located after struct/enum definitions.
     * Event parameters must be described in tags.
     * Parameter description must not be capitalized and with no full stop ("." at the end).
     * 
     * @param caller of the function
     * @param name of who is saying "hello"
     */
    event SayHello(address caller, string name);

    /// @dev Inline single tag comments must use the triple slash format. Error definition follow events.
    error DocumentationGuideline__setNumber_zeroValue();

    uint256 public constant THIS_IS_A_CONSTANT;

    /// @dev The `number` in this contract is important. Public variable definition follow constants.
    uint256 public number;

    // Another example of a simple inline comment. Private variable definition follows public ones.
    uint256 internal _secretNumber;

    /**
     * @notice Initialize a new {DocumentationGuideline}.
     * Notice tag should describe briefly what the function does.
     * 
     * @param initialNumber to set when deploying this contract
     * 
     * @dev All contracts or interface objects must be wrapped in brackets. 
     * For example; the {OtherContract} contract.
     */
    constructor(uint initialNumber) {
        number = initialNumber
    }

    /**
     * @notice In public functions inform the user what this function do in
     * the notice tag. This must be the first tag.
     * 
     * @param name of who is saying "hello"
     * 
     * @dev Dev tags must follow the param tags in public or external
     * functions.
     */
    function justSayHello(string memory name) public {
        _justSayHello(name);
    }

    /**
     * @notice Set the `number` state.
     * 
     * @param newNumber to set
     * 
     * @dev Requirements:
     * - Must check `newNumber` is not zero.
     * 
     * Requirements must be defined in the dev tag. Function must ensure requirements 
     * are met. All statements must be listed and use "must". For example:
     *  - Must check this.
     *  - Must be > x or =< y.
     */
    function setNumber(uint newNumber) public {
        // Simple inline comments should be like this.
        if (newNumber == 0) {
            revert DocumentationGuideline__setNumber_zeroValue();
        }
        number = newNumber;
    }

    /**
     * @notice Increment `number` by `number_`.
     * 
     * @param number_ to increment
     * 
     * @dev To avoid variable collisions add "_" after variable name in local variables.
     * In public or external functions the dev tag follows the parameter definition.
     */
    function incrementBy(uint number_) public {
        // When referring to variables in documentation surround them with backlashes; as `number_`.
        number += number_;
    }


    /// @inheritdoc OtherContract
    function decreaseBy(uint number_) public {
        // Use the inheritdoc tag to import documentation from an imported file. 
        if(number_ > number) {
            revert DocumentationGuideline__decreaseBy_invalidInput();
        }
        number -= number_;
    }

    /*////////////////////////////////////
        Example of code block separator
    ////////////////////////////////////*/

    // In large contracts, as required, separate blocks of code logic with a visual as shown above.

    /**
     * @dev Internal and private functions must be described with the dev tag, and
     * this must be the first tag. Parameters of internal and private functions
     * must also be described.
     * 
     * @param name of who is saying "hello"
     */
    function _justSayHello(string memory name) internal {
        emit SayHello(msg.sender, name);
    }
}
```
