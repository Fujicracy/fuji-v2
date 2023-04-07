import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Card, Divider, Stack, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Token } from '@x-fuji/sdk';

import { ActionType } from '../../../helpers/assets';
import { chainName } from '../../../helpers/chains';
import { formatValue } from '../../../helpers/values';
import { NetworkIcon, TokenIcon } from '../Icons';

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

  const descriptionMap =
    isEditing && actionType === ActionType.REMOVE
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
        order:
          isEditing && actionType === ActionType.REMOVE && type === 'debt'
            ? 1
            : 2,
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
            <Tooltip
              title="If you wish to open a position on a different chain, please select an alternative route."
              placement="top"
            >
              <InfoOutlinedIcon
                sx={{
                  ml: '0.313rem',
                  fontSize: '0.875rem',
                  display: { xs: 'none', sm: 'inline' },
                  color: '#919191',
                  cursor: 'pointer',
                }}
              />
            </Tooltip>
          )}
        </Stack>

        <Stack flexDirection="row" alignItems="center" gap={0.75}>
          <NetworkIcon network={token.chainId} height={16} width={16} />
          <Typography variant="small">{chainName(token.chainId)}</Typography>
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
