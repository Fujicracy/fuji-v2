import { Typography } from '@mui/material';

import { Balance } from '../../../../helpers/balances';

type BalanceItemProps = {
  balance: Balance;
};

function BalanceItem({ balance }: BalanceItemProps) {
  return <Typography>{balance.currency.symbol}</Typography>;
}

export default BalanceItem;
