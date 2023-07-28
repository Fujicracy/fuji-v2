import { Typography } from '@mui/material';

import { Balance } from '../../../../helpers/balances';
import { CurrencyWithNetworkIcon } from '../../../Shared/Icons';

type BalanceItemProps = {
  balance: Balance;
};

function BalanceItem({ balance }: BalanceItemProps) {
  return (
    <>
      <CurrencyWithNetworkIcon
        currency={balance.currency}
        network={balance.currency.chainId}
        innerTop="1.1rem"
      />
      <Typography>{balance.currency.symbol}</Typography>
      <Typography>{balance.currency.name}</Typography>
      <Typography>{balance.amount}</Typography>
      <Typography>
        {balance.amountUsd ? `${balance.amountUsd}` : '-'}
      </Typography>
    </>
  );
}

export default BalanceItem;
