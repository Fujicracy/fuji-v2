import { Card, Divider, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { RoutingStep, RoutingStepDetails } from '@x-fuji/sdk';
import { BigNumber } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';

import { chainName } from '../../../helpers/chains';
import { toNotSoFixed } from '../../../helpers/values';
import { NetworkIcon, TokenIcon } from '../Icons';
import InfoTooltip from '../Tooltips/InfoTooltip';

function AssetBox({
  isEditing,
  step,
}: {
  isEditing: boolean;
  step: RoutingStepDetails;
}) {
  const { palette } = useTheme();
  const type = [RoutingStep.DEPOSIT, RoutingStep.WITHDRAW].includes(step.step)
    ? 'collateral'
    : 'debt';
  const isRemoveAction = [RoutingStep.WITHDRAW, RoutingStep.PAYBACK].includes(
    step.step
  );

  const descriptionMap =
    isEditing && isRemoveAction
      ? {
          debt: 'The network where the debt will be paid back',
          collateral: 'The network from where the collateral will be withdrawn',
        }
      : {
          debt: 'The network where the loan will be taken out',
          collateral: 'The network where the collateral will be deposited on',
        };

  const description = descriptionMap[type];

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: palette.secondary.light,
        m: '0.5rem 0',
        width: '100%',
      }}
    >
      <Stack
        width="100%"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography
          variant="small"
          sx={{ '&::first-letter': { textTransform: 'capitalize' } }}
        >
          {step.step}
        </Typography>

        <Stack flexDirection="row" alignItems="center" gap={0.75}>
          <TokenIcon token={step.token || ''} height={16} width={16} />
          <Typography variant="small">
            {`${toNotSoFixed(
              formatUnits(
                step.amount ?? BigNumber.from('0'),
                step.token?.decimals ?? 18
              )
            )} ${step.token?.symbol}`}
          </Typography>
        </Stack>
      </Stack>

      <Divider sx={{ m: '0.75rem 0', height: '1px', width: '100%' }} />

      <Stack
        width="100%"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Stack flexDirection="row" alignItems="center">
          <Typography variant="small">Network</Typography>

          {!isEditing && (
            <InfoTooltip
              title={
                'If you wish to open a position on a different chain, please select an alternative route.'
              }
              isDark
            />
          )}
        </Stack>

        <Stack flexDirection="row" alignItems="center" gap={0.75}>
          <NetworkIcon network={step.chainId} height={16} width={16} />
          <Typography variant="small">{chainName(step.chainId)}</Typography>
        </Stack>
      </Stack>

      <Typography
        textAlign="start"
        mt=".5rem"
        variant="xsmall"
        fontSize="0.75rem"
        lineHeight="1.2rem"
        color={palette.info.main}
        sx={{ width: '100%' }}
      >
        {description}
      </Typography>
    </Card>
  );
}

export default AssetBox;
