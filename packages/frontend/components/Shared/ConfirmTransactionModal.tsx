import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Dialog, Paper, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { RoutingStep, RoutingStepDetails } from '@x-fuji/sdk';
import Image from 'next/image';
import React, { useMemo } from 'react';

import {
  ActionType,
  recommendedLTV,
  remainingBorrowLimit,
} from '../../helpers/assets';
import { BasePosition } from '../../helpers/positions';
import { isCrossChainTransaction } from '../../helpers/routing';
import { formatValue } from '../../helpers/values';
import { FetchStatus, useBorrow } from '../../store/borrow.store';
import AssetBox from './ConfirmationTransaction/AssetBox';
import InfoRow from './ConfirmationTransaction/InfoRow';
import RouteBox from './ConfirmationTransaction/RouteBox';
import WarningInfo from './WarningInfo';

type ConfirmTransactionModalProps = {
  basePosition: BasePosition;
  transactionMeta: {
    status: FetchStatus;
    gasFees: number;
    bridgeFee: number;
    estimateTime: number;
    estimateSlippage: number;
    steps: RoutingStepDetails[];
  };
  open: boolean;
  isEditing: boolean;
  actionType: ActionType;
  onClose: () => void;
  action: () => void;
};

const routingSteps = [
  RoutingStep.DEPOSIT,
  RoutingStep.WITHDRAW,
  RoutingStep.BORROW,
  RoutingStep.PAYBACK,
];

export function ConfirmTransactionModal({
  basePosition,
  transactionMeta,
  isEditing,
  open,
  onClose,
  action,
}: ConfirmTransactionModalProps) {
  const { palette } = useTheme();
  const { steps } = transactionMeta;
  const { editedPosition, position } = basePosition;
  const slippage = useBorrow((state) => state.slippage);

  const dynamicLtvMeta = {
    ltv: editedPosition ? editedPosition.ltv : position.ltv,
    ltvMax: position.ltvMax,
    ltvThreshold: editedPosition
      ? editedPosition.ltvThreshold
      : position.ltvThreshold,
  };

  const estCost =
    transactionMeta.status === 'ready'
      ? `~$${transactionMeta.bridgeFee.toFixed(2)} + gas`
      : 'n/a';

  const positionBorrowLimit = remainingBorrowLimit(
    position.collateral,
    position.debt,
    position.ltvMax
  );

  const editedBorrowLimit =
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
    () => transactionMeta.estimateSlippage > slippage / 100,
    [transactionMeta.estimateSlippage, slippage]
  );

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
          width: { xs: '80%', sm: '40rem' },
        },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: { xs: 'auto', sm: '40rem' },
          p: { xs: '1rem', sm: '1.5rem' },
          textAlign: 'center',
        }}
      >
        <CloseIcon
          sx={{
            cursor: 'pointer',
            position: 'absolute',
            right: '3%',
          }}
          onClick={onClose}
        />
        <Typography mb="1rem" variant="h5" color={palette.text.primary}>
          Confirm Transaction
        </Typography>

        <Stack>
          {steps
            .filter((step) => routingSteps.includes(step.step))
            .map((step) => (
              <AssetBox key={step.step} isEditing={isEditing} step={step} />
            ))}
        </Stack>

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
              <Typography variant="small">{`Est. ~${transactionMeta.estimateSlippage}% (max ${slippage}%)`}</Typography>
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

        {dynamicLtvMeta.ltv >= dynamicLtvMeta.ltvMax - 5 && (
          <Box mt="1rem">
            <WarningInfo text="Warning: Your Loan-to-Value ratio is very close to the maximum allowed. Your position risks being liquidated if the price of the collateral changes." />
          </Box>
        )}

        {isCrossChain && isEstimatedSlippageBiggerThanSelected && (
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
        )}

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
