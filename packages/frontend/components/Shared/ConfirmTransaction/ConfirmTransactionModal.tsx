import { Box, Button, Dialog, Paper, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import React, { useMemo } from 'react';

import {
  ActionType,
  FetchStatus,
  ltvMeta,
  recommendedLTV,
  remainingBorrowLimit,
} from '../../../helpers/assets';
import { PositionData } from '../../../helpers/positions';
import { isCrossChainTransaction } from '../../../helpers/routes';
import {
  stringifiedBridgeFeeSum,
  TransactionMeta,
} from '../../../helpers/transactions';
import { formatValue } from '../../../helpers/values';
import { useAuth } from '../../../store/auth.store';
import { BorrowingPosition } from '../../../store/models/Position';
import ModalHeader from '../ModalHeader';
import WarningInfo from '../WarningInfo';
import InfoRow from './InfoRow';
import RouteBox from './RouteBox';

type ConfirmTransactionModalProps = {
  positionData: PositionData | undefined;
  transactionMeta: TransactionMeta;
  open: boolean;
  actionType: ActionType;
  onClose: () => void;
  action: () => void;
};

export function ConfirmTransactionModal({
  positionData,
  transactionMeta,
  open,
  onClose,
  action,
}: ConfirmTransactionModalProps) {
  const { palette } = useTheme();
  const { steps } = transactionMeta;

  const slippage = useAuth((state) => state.slippage);
  // TODO: casting to BorrowingPosition just for it to compile, we need to separate things accordingly
  const position = positionData
    ? (positionData.position as BorrowingPosition)
    : undefined;
  const editedPosition = positionData
    ? (positionData.editedPosition as BorrowingPosition)
    : undefined;
  const dynamicLtvMeta = ltvMeta(positionData);

  const estCost =
    transactionMeta.status === FetchStatus.Ready && transactionMeta.bridgeFees
      ? `~$${stringifiedBridgeFeeSum(transactionMeta.bridgeFees)} + gas`
      : 'n/a';

  const positionBorrowLimit = position
    ? remainingBorrowLimit(position.collateral, position.debt, position.ltvMax)
    : undefined;

  const editedBorrowLimit =
    position &&
    editedPosition &&
    remainingBorrowLimit(
      editedPosition.collateral,
      editedPosition.debt,
      position.ltvMax
    );

  const getLtv = (value: number): string => {
    return value <= 100 && value >= 0 ? `${value.toFixed(0)}%` : 'n/a';
  };

  const isCrossChain = isCrossChainTransaction(steps);
  const isEstimatedSlippageBiggerThanSelected = useMemo(
    () =>
      transactionMeta.estimateSlippage &&
      transactionMeta.estimateSlippage > slippage / 100,
    [transactionMeta.estimateSlippage, slippage]
  );

  if (!position || !dynamicLtvMeta) {
    return <></>; // TODO: borrow-refactor
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiPaper-root': {
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '& .MuiDialog-paper': {
          maxWidth: '40rem',
          width: { xs: '80%', sm: '32rem' },
        },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: { xs: 'auto', sm: '32rem' },
          p: { xs: '1rem', sm: '1.5rem' },
          textAlign: 'center',
        }}
      >
        <ModalHeader title="Confirm Transaction" onClose={() => onClose()} />

        {steps && steps.length > 0 && (
          <RouteBox steps={steps} isCrossChain={isCrossChain} />
        )}

        <InfoRow
          title="Est. cost"
          value={<Typography variant="small">{estCost}</Typography>}
        />

        <InfoRow
          title="Est. processing time"
          value={
            <Typography variant="small">{`~${
              transactionMeta.estimateTime / 60
            } minutes`}</Typography>
          }
        />

        {isCrossChain && (
          <InfoRow
            title="Slippage"
            value={
              <Typography variant="small">{`Est. ${
                transactionMeta.estimateSlippage
              }% (max. ${slippage / 100}%)`}</Typography>
            }
          />
        )}

        <InfoRow
          title="Borrow limit left"
          value={
            <Stack flexDirection="row" alignItems="center">
              <Typography variant="small">
                {formatValue(positionBorrowLimit, {
                  style: 'currency',
                })}
              </Typography>
              {editedPosition && (
                <>
                  <Image
                    src="/assets/images/shared/arrowRight.svg"
                    alt="Arrow Right"
                    width={14}
                    height={10}
                    style={{ marginLeft: '0.25rem' }}
                  />
                  <Typography ml={0.5} variant="small">
                    {formatValue(editedBorrowLimit, { style: 'currency' })}
                  </Typography>
                </>
              )}
            </Stack>
          }
        />

        <InfoRow
          title="Loan-to-value ratio"
          value={
            <Stack flexDirection="row" alignItems="center">
              <Typography
                color={
                  !position.ltv
                    ? ''
                    : position.ltv > position.ltvMax
                    ? palette.error.main
                    : position.ltv > recommendedLTV(position.ltvMax)
                    ? palette.warning.main
                    : palette.success.main
                }
                variant="small"
              >
                {getLtv(position.ltv)}
              </Typography>
              {editedPosition && (
                <>
                  <Image
                    src="/assets/images/shared/arrowRight.svg"
                    alt="Arrow Right"
                    width={14}
                    height={10}
                    style={{ marginLeft: '0.25rem' }}
                  />
                  <Typography
                    ml={0.5}
                    color={
                      !editedPosition.ltv
                        ? ''
                        : editedPosition.ltv / 100 > editedPosition.ltvMax
                        ? palette.error.main
                        : editedPosition.ltv >
                          recommendedLTV(editedPosition.ltvMax * 100)
                        ? palette.warning.main
                        : palette.success.main
                    }
                    variant="small"
                  >{`${getLtv(editedPosition.ltv)}`}</Typography>
                </>
              )}
            </Stack>
          }
        />

        <InfoRow
          title="Liquidation price"
          value={
            <Stack flexDirection="row" alignItems="center">
              <Typography variant="small">
                {formatValue(position.liquidationPrice, {
                  style: 'currency',
                })}
              </Typography>
              {editedPosition && (
                <>
                  <Image
                    src="/assets/images/shared/arrowRight.svg"
                    alt="Arrow Right"
                    width={14}
                    height={10}
                    style={{ marginLeft: '0.25rem' }}
                  />
                  <Typography ml={0.5} variant="small">
                    {formatValue(editedPosition?.liquidationPrice, {
                      style: 'currency',
                    })}
                  </Typography>
                </>
              )}
            </Stack>
          }
        />

        {/*I did this (check) just to exclude weird error we got before*/}
        {dynamicLtvMeta.ltv !== undefined &&
        dynamicLtvMeta.ltvMax !== undefined &&
        dynamicLtvMeta.ltv >= dynamicLtvMeta.ltvMax - 5 ? (
          <Box mt="1rem">
            <WarningInfo text="Warning: Your Loan-to-Value ratio is very close to the maximum allowed. Your position risks being liquidated if the price of the collateral changes." />
          </Box>
        ) : null}

        {isCrossChain && isEstimatedSlippageBiggerThanSelected ? (
          <Box mt="1rem">
            <WarningInfo
              text={
                <>
                  Expected slippage for this transaction might be higher than
                  your slippage tolerance. This may lead to a longer waiting
                  time for your transaction to be executed on the destination
                  chain. Please, consider increasing your slippage tolerance
                  from the{' '}
                  <Image
                    src={'/assets/images/shared/settings.svg'}
                    alt="Settings Image"
                    width={14}
                    height={14}
                    style={{ transform: 'translateY(20%)', margin: '0 0.1rem' }}
                  />{' '}
                  {'"Settings" menu.'}
                </>
              }
            />
          </Box>
        ) : null}

        <Button
          variant="gradient"
          size="medium"
          fullWidth
          onClick={action}
          data-cy="new-borrow-redirect"
          sx={{
            mt: '1.5rem',
          }}
        >
          Confirm
        </Button>
      </Paper>
    </Dialog>
  );
}

export default ConfirmTransactionModal;
