# CrossFuji
Cross-chain Lending Aggregator

## Quickstart

1. Clone repository with the following command:

`git clone --recurse-submodules https://github.com/Fujicracy/x-fuji`  

**Note:** The 'protocol' workspace in this monorepo uses [Git Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules).

2. Install **Foundry**

You can find the instructions [here](https://book.getfoundry.sh/getting-started/installation).

## Code style

- Solidity

We are using Foundry built-in formatter ([more details here](https://book.getfoundry.sh/reference/config?highlight=format#formatter)). We have configured [husky](https://typicode.github.io/husky/#/) so that it runs before every commit.

- Commit messages

We want to establish rules over how our git commit messages can be formatted. This leads to more readable messages that are easy to follow when looking through the project history. Check conventions [here](https://www.conventionalcommits.org/en/v1.0.0/#summary). In general the pattern mostly looks like this:

```
type(scope?): subject  #scope is optional; multiple scopes are supported (current delimiter options: "/", "\" and ",")
```
