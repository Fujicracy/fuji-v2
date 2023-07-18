import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {
  alpha,
  Card,
  CircularProgress,
  Collapse,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { ReactNode, useState } from 'react';

import { FetchStatus } from '../../../helpers/assets';
import { stringifiedBridgeFeeSum } from '../../../helpers/transactions';
import { useBorrow } from '../../../store/borrow.store';

function ErrorComponent() {
  return (
    <Tooltip title="Error loading data" arrow>
      <ErrorOutlineIcon />
    </Tooltip>
  );
}

function Fees() {
  const transactionMeta = useBorrow((state) => state.transactionMeta);
  const collateral = useBorrow((state) => state.collateral);
  const debt = useBorrow((state) => state.debt);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const show =
    showTransactionDetails && transactionMeta.status === FetchStatus.Ready;

  const crossChainTx = debt && collateral.chainId !== debt.chainId;

  const handleClick = () => {
    if (transactionMeta.status === FetchStatus.Ready) {
      setShowTransactionDetails(!showTransactionDetails);
    }
  };

  const bridgeTooltip = () => {
    if (
      !transactionMeta.bridgeFees ||
      transactionMeta.bridgeFees.length === 0 ||
      transactionMeta.bridgeFees[0].amount === 0
    )
      return undefined;
    let outputString = '';
    for (const fee of transactionMeta.bridgeFees) {
      const amount =
        fee.amount < 0.000001 ? '< 0.000001' : fee.amount.toString();
      outputString += `${amount} ${fee.token.symbol}\n`;
    }
    return outputString;
  };

  return (
    <Card
      data-cy="fees-container"
      variant="outlined"
      sx={{ cursor: 'pointer', border: 'none' }}
      onClick={handleClick}
    >
      <Stack direction="row" justifyContent="space-between" width="100%">
        <Typography variant="small" display="block">
          Estimated Cost
        </Typography>
        {transactionMeta.status === FetchStatus.Ready && (
          <Stack direction="row" alignItems="center" maxHeight="22px">
            <Typography variant="small">
              {`~$${stringifiedBridgeFeeSum(transactionMeta.bridgeFees)} + gas`}
            </Typography>
            {show ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </Stack>
        )}
        {transactionMeta.status === FetchStatus.Loading && (
          <Stack direction="row" alignItems="center" maxHeight="22px">
            <CircularProgress size="0.875rem" />
          </Stack>
        )}
        {(transactionMeta.status === FetchStatus.Error ||
          transactionMeta.status === FetchStatus.Initial) && (
          <Typography variant="small" display="block">
            n/a
          </Typography>
        )}
      </Stack>

      <Collapse in={show} sx={{ width: '100%' }}>
        {crossChainTx && (
          <Fee
            label="Bridge Fee"
            value={`~$${stringifiedBridgeFeeSum(transactionMeta.bridgeFees)}`}
            tooltip={bridgeTooltip()}
            error={
              !transactionMeta.bridgeFees ||
              transactionMeta.bridgeFees?.every((fee) => fee.amount === 0)
            }
          />
        )}
        {crossChainTx && (
          <Fee label="Relayer Fee" value={'Sponsored by Fuji'} sponsored />
        )}
        <Fee
          label="Est. processing time"
          value={`~${transactionMeta.estimateTime / 60} minutes`}
        />
        {crossChainTx && (
          <Fee
            label="Est. slippage"
            value={`~${transactionMeta.estimateSlippage} %`}
            error={!transactionMeta.estimateSlippage}
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
  sponsored?: boolean;
  tooltip?: string;
  error?: boolean;
};

const Fee = ({ label, value, sponsored, tooltip, error }: FeeProps) => {
  const { palette } = useTheme();
  const valueComponent = error ? (
    <ErrorComponent />
  ) : sponsored ? (
    <Stack
      direction="row"
      alignItems="center"
      gap="0.25rem"
      sx={{
        backgroundColor: alpha(palette.success.main, 0.2),
        p: '0.2rem 0.5rem',
        borderRadius: '100px',
      }}
    >
      <Typography
        variant="xsmall"
        color={palette.success.main}
        fontWeight={500}
      >
        {value}
      </Typography>
    </Stack>
  ) : (
    <Typography variant="small">{value}</Typography>
  );

  return (
    <Stack
      data-cy="fee-item"
      direction="row"
      justifyContent="space-between"
      width="92%"
      mt="1rem"
    >
      <Typography variant="small">{label}</Typography>
      {tooltip ? (
        <Tooltip title={tooltip} placement="top">
          {valueComponent}
        </Tooltip>
      ) : (
        valueComponent
      )}
    </Stack>
  );
};

Fee.defaultProps = {
  sponsored: false,
};
