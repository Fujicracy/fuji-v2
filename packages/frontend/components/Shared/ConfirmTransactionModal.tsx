import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Card,
  Dialog,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { RoutingStep, RoutingStepDetails, Token } from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';
import Image from 'next/image';
import { ReactNode } from 'react';

import {
  ActionType,
  AssetChange,
  recommendedLTV,
  remainingBorrowLimit,
} from '../../helpers/assets';
import { chainName } from '../../helpers/chains';
import { BasePosition } from '../../helpers/positions';
import { camelize, formatValue, toNotSoFixed } from '../../helpers/values';
import { FetchStatus } from '../../store/borrow.store';
import { NetworkIcon } from './Icons';
import TokenIcon from './Icons/TokenIcon';
import WarningInfo from './WarningInfo';

type ConfirmTransactionModalProps = {
  collateral: AssetChange;
  debt: AssetChange;
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
  collateral,
  debt,
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        '-ms-overflow-style': 'none',
        'scrollbar-width': 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        '& .MuiDialog-paper': {
          maxWidth: '35rem',
          width: { xs: '80%', sm: '35rem' },
        },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: { xs: 'auto', sm: '35rem' },
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

        {collateral.input && collateral.input !== '0' ? (
          <AssetBox
            type="collateral"
            isEditing={isEditing}
            actionType={actionType}
            token={collateral.token}
            value={collateral.input}
          />
        ) : (
          <></>
        )}

        {debt.input && debt.input !== '0' ? (
          <AssetBox
            type="debt"
            isEditing={isEditing}
            actionType={actionType}
            token={debt.token}
            value={debt.input}
          />
        ) : (
          <></>
        )}

        {steps && steps.length > 0 && (
          <RouteBox
            steps={steps}
            isCrossChainTransaction={collateral.chainId !== debt.chainId}
          />
        )}

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

        {collateral.chainId !== debt.chainId && (
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

function AssetBox({
  type,
  token,
  value,
  isEditing,
  actionType,
}: {
  type: 'debt' | 'collateral';
  token: Token;
  value: string;
  isEditing: boolean;
  actionType: ActionType;
}) {
  const { palette } = useTheme();
  const labelMap =
    isEditing && actionType === ActionType.REMOVE
      ? { debt: 'Payback', collateral: 'Withdraw' }
      : { debt: 'Borrow', collateral: 'Deposit' };

  const label = labelMap[type];

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: palette.secondary.light,
        m: '0.5rem 0 1rem 0',
        width: '100%',
      }}
    >
      <Stack
        width="100%"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="small">{label}</Typography>

        <Stack flexDirection="row" alignItems="center" gap={0.75}>
          <TokenIcon token={token} height={16} width={16} />
          <Typography variant="small">
            {`${formatValue(value, {
              maximumFractionDigits: 3,
            })} ${token.symbol}`}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
}

function InfoRow({ title, value }: { title: string; value: ReactNode }) {
  const { palette } = useTheme();

  return (
    <Stack
      width="100%"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      mt="0.6rem"
      flexWrap="wrap"
    >
      <Typography
        sx={{
          ['@media screen and (max-width: 370px)']: {
            fontSize: '0.7rem',
          },
        }}
        color={palette.info.main}
        variant="small"
      >
        {title}
      </Typography>

      {value}
    </Stack>
  );
}

function RouteBox({
  steps,
  isCrossChainTransaction,
}: {
  steps: RoutingStepDetails[];
  isCrossChainTransaction: boolean;
}) {
  const { palette } = useTheme();

  const stepsToShow = steps.filter(
    (s) => s.step !== RoutingStep.START && s.step !== RoutingStep.END
  );

  function description(step: RoutingStepDetails) {
    if (step.lendingProvider) {
      const preposition = step.step === RoutingStep.DEPOSIT ? 'to' : 'from';
      return (
        <Typography
          align="center"
          variant="xsmall"
          fontSize="0.75rem"
          sx={{ display: 'flex', gap: '0.25rem' }}
        >
          {`${preposition} ${step.lendingProvider.name} on `}
          <NetworkIcon
            network={chainName(step.chainId)}
            height={14}
            width={14}
          />
        </Typography>
      );
    }
    if (step.step === RoutingStep.X_TRANSFER) {
      return (
        <Stack flexDirection="row" alignItems="center" gap="0.25rem">
          <Typography align="center" variant="xsmall" fontSize="0.75rem">
            from
          </Typography>
          <NetworkIcon
            network={chainName(step.token?.chainId)}
            height={14}
            width={14}
          />
          <Typography align="center" variant="xsmall" fontSize="0.75rem">
            to
          </Typography>
          <NetworkIcon
            network={chainName(step.chainId)}
            height={14}
            width={14}
          />
        </Stack>
      );
    }

    return <></>;
  }

  function textForStep({ step, amount, token }: RoutingStepDetails) {
    switch (step) {
      case RoutingStep.DEPOSIT:
      case RoutingStep.BORROW:
      case RoutingStep.PAYBACK:
      case RoutingStep.WITHDRAW:
        return camelize(
          `${step.toString()} ${toNotSoFixed(
            formatUnits(amount ?? 0, token?.decimals || 18)
          )} ${token?.symbol}`
        );
      case RoutingStep.X_TRANSFER:
        return camelize(
          `${step.toString()} ${toNotSoFixed(
            formatUnits(amount ?? 0, token?.decimals || 18)
          )} ${token?.symbol}`
        );
      default:
        return camelize(step);
    }
  }

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: palette.secondary.light,
        m: '1rem 0',
        width: '100%',
      }}
    >
      <Stack
        width="100%"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="small">Route</Typography>

        {isCrossChainTransaction && (
          <Typography variant="small">via Connext Network</Typography>
        )}
      </Stack>

      <Divider sx={{ m: '0.75rem 0', height: '1px', width: '100%' }} />

      <Stack
        width="100%"
        justifyContent="space-between"
        sx={{
          flex: 1,
          maxWidth: '30rem',
          flexWrap: 'wrap',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: { xs: 'center', sm: 'space-between' },
          gap: '0.5rem',
        }}
      >
        {stepsToShow.map((step, i) => (
          <>
            {i !== 0 && (
              <Box
                key={i}
                sx={{
                  ['@media screen and (max-width: 600px)']: {
                    transform: 'rotate(90deg)',
                  },
                }}
              >
                <Image
                  alt="Arrow icon"
                  src="/assets/images/shared/doubleArrow.svg"
                  height={10}
                  width={9}
                />
              </Box>
            )}
            <Stack
              key={step.step}
              direction="column"
              sx={{
                p: '0.375rem 0.45rem',
                backgroundColor: '#35353B',
                borderRadius: '6px',
                minWidth: '8rem',
                flex: 1,
                width: { xs: '100%', sm: 'unset' },
              }}
            >
              <Typography align="left" variant="xsmall">
                {textForStep(step)}
              </Typography>
              <Typography align="left" variant="xsmall" mt={0.5}>
                {description(step)}
              </Typography>
            </Stack>
          </>
        ))}
      </Stack>
    </Card>
  );
}

export default ConfirmTransactionModal;
