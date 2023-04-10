import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Dialog, Paper, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { RoutingStepDetails } from '@x-fuji/sdk';
import Image from 'next/image';

import {
  ActionType,
  recommendedLTV,
  remainingBorrowLimit,
} from '../../helpers/assets';
import { BasePosition } from '../../helpers/positions';
import { mapSteps } from '../../helpers/routing';
import { formatValue } from '../../helpers/values';
import { FetchStatus } from '../../store/borrow.store';
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

export function ConfirmTransactionModal({
  basePosition,
  transactionMeta,
  isEditing,
  actionType,
  open,
  onClose,
  action,
}: ConfirmTransactionModalProps) {
  const { palette } = useTheme();
  const { steps } = transactionMeta;
  const { editedPosition, position } = basePosition;

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

  const { start, end, collateralStep, borrowStep } = mapSteps(steps);
  const isCrossChain = start?.chainId !== end?.chainId;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiPaper-root': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
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
          {collateralStep && (
            <AssetBox
              type="collateral"
              isEditing={isEditing}
              actionType={actionType}
              step={collateralStep}
            />
          )}

          {borrowStep && (
            <AssetBox
              type="debt"
              isEditing={isEditing}
              actionType={actionType}
              step={borrowStep}
            />
          )}
        </Stack>

        {steps && steps.length > 0 && <RouteBox steps={steps} isCrossChain />}

        <InfoRow
          title="Estimated Cost"
          value={<Typography variant="small">{estCost}</Typography>}
        />

        <InfoRow
          title="Est.processing time"
          value={
            <Typography variant="small">{`~${
              transactionMeta.estimateTime / 60
            } minutes`}</Typography>
          }
        />

        {isCrossChain && (
          <InfoRow
            title="Est. slippage"
            value={
              <Typography variant="small">{`~${transactionMeta.estimateSlippage} %`}</Typography>
            }
          />
        )}

        <InfoRow
          title="Borrow Limit Left"
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
          title="LTV Ratio"
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
          title="Liquidation Price"
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
