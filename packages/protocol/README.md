## Factors in contracts
A factor through these contracts refer to a fixed-digit decimal number. Specifically, a decimal number scaled by 1e18. These numbers should be treated as real numbers scaled down by 1e18. For example, the number 50% would be represented as 5*1e17.

## Testing smart contract functions

1. Set up an `.env` file in `root\packages\protocol` with the required environment variables. Refer to `./sample.env`.