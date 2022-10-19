# Fuji v2
Cross-chain Lending Aggregator

- [Fuji v2](#fuji-v2)
  - [Quickstart](#quickstart)
  - [Code style](#code-style)

## Quickstart

1. Clone repository with the following command:

`git clone --recurse-submodules https://github.com/Fujicracy/x-fuji`  

**Note:** The 'protocol' workspace in this monorepo uses [Git Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules).

2. Install **Foundry**

You can find the instructions [here](https://book.getfoundry.sh/getting-started/installation).

## Code style

### Commit messages

We want to establish rules over how our git commit messages can be formatted. This leads to more readable messages that are easy to follow when looking through the project history. Check conventions [here](https://www.conventionalcommits.org/en/v1.0.0/#summary). In general the pattern mostly looks like this:

```
type(package): subject  #package should be one from "./packages/"
```

### Branch and PR naming

Branch titles have to follow a similar convention:
```
package/type/short-title  #package should be one from "./packages/"
```

A pull request title have to include no more than 3-4 words describing what it's about. PR titles start with upper-case.

### Protocol

We are using Foundry built-in formatter ([more details here](https://book.getfoundry.sh/reference/config?highlight=format#formatter)). We have configured [husky](https://typicode.github.io/husky/#/) so that it runs before every commit.

### Frontend

We use [eslint](https://eslint.org/) alongside with [prettier](https://prettier.io/) to format our code.

Every time you commit files, they are automatically formatted thanks to hysky (pre commit hooks), but you may want to enable it in your editor, this way every time you save it'll format it.

To do it in visual code:
1. Install ESlint extension
2. Install Prettier extension
3. Change default formatter and choose "prettier" as default
4. (optionnal) Enable "format on save"

If you use another editor feel free to add it in this doc.
