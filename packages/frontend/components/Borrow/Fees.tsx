import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {
  Card,
  CircularProgress,
  Collapse,
  Stack,
  Typography,
} from '@mui/material';
import { ReactNode, useState } from 'react';

import { toNotSoFixed } from '../../helpers/values';
import { useBorrow } from '../../store/borrow.store';

function Fees() {
  const transactionMeta = useBorrow((state) => state.transactionMeta);
  const collateral = useBorrow((state) => state.collateral);
  const debt = useBorrow((state) => state.debt);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const show = showTransactionDetails && transactionMeta.status === 'ready';

  const crossChainTx = collateral.chainId !== debt.chainId;

  const handleClick = () => {
    if (transactionMeta.status === 'ready') {
      setShowTransactionDetails(!showTransactionDetails);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{ cursor: 'pointer', border: 'none' }}
      onClick={handleClick}
    >
      <Stack direction="row" justifyContent="space-between" width="100%">
        <Typography variant="small" display="block">
          Estimated Cost
        </Typography>
        {transactionMeta.status === 'ready' && (
          <Stack direction="row" alignItems="center" maxHeight="22px">
            <Typography variant="small">
              {`~$${transactionMeta.bridgeFees[0].toFixed(2)} + gas`}
            </Typography>
            {show ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </Stack>
        )}
        {transactionMeta.status === 'fetching' && (
          <Stack direction="row" alignItems="center" maxHeight="22px">
            <CircularProgress size="0.875rem" />
          </Stack>
        )}
        {(transactionMeta.status === 'error' ||
          transactionMeta.status === 'initial') && (
          <Typography variant="small" display="block">
            n/a
          </Typography>
        )}
      </Stack>

      <Collapse in={show} sx={{ width: '100%' }}>
        {crossChainTx && (
          <Fee
            label="Bridge fee"
            value={`~$${toNotSoFixed(transactionMeta.bridgeFees[0])}`}
          />
        )}
        <Fee
          label="Est. processing time"
          value={`~${transactionMeta.estimateTime / 60} minutes`}
        />
        {crossChainTx && (
          <Fee
            label="Est. slippage"
            value={`~${transactionMeta.estimateSlippage} %`}
          />
        )}
      </Collapse>
    </Card>
  );
}

export default Fees;

type FeeProps = {
  label: string;
  value: string | ReactNode;
};

const Fee = ({ label, value }: FeeProps) => (
  <Stack direction="row" justifyContent="space-between" width="92%" mt="1rem">
    <Typography variant="small">{label}</Typography>
    <Typography variant="small">{value}</Typography>
  </Stack>
);
