import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { VaultType } from '@x-fuji/sdk';
import Image from 'next/image';
import React from 'react';

import { ActionType, AssetType } from '../../helpers/assets';
import { PositionRow } from '../../helpers/positions';
import { useBorrow } from '../../store/borrow.store';
import { NetworkIcon, ProviderIcon } from '../Shared/Icons';
import CurrencyCard from '../Shared/Operation/FormAssetBox/CurrencyCard';
import WarningInfo from '../Shared/WarningInfo';
import InfoWithIcon from './InfoWithIcon';
import PositionHealth from './PositionHealth';

type MigrateFromProps = {
  onBack: () => void;
  onNext: () => void;
  position: PositionRow;
  isFormFormFilled: boolean;
};

function MigrateFrom({
  onBack,
  position,
  onNext,
  isFormFormFilled,
}: MigrateFromProps) {
  const { palette } = useTheme();
  const changeAssetCurrency = useBorrow((state) => state.changeAssetCurrency);
  const changeAssetValue = useBorrow((state) => state.changeAssetValue);

  const collateral = useBorrow((state) => state.collateral);
  const debt = useBorrow((state) => state.debt);
  const isExecuting = useBorrow((state) => state.isExecuting);
  const changeAssetChain = useBorrow((state) => state.changeAssetChain);

  return (
    <Stack direction="column" justifyContent="flex-start" textAlign="left">
      <Stack
        flexDirection="row"
        alignItems="center"
        onClick={onBack}
        sx={{
          cursor: 'pointer',
          mt: { xs: '0', sm: '-2.5rem' },
          mb: '1rem',
        }}
      >
        <Image
          src="/assets/images/shared/arrowBack.svg"
          height={14}
          width={16}
          alt="Arrow Back"
        />
        <Typography variant="small" ml="0.75rem" color={palette.info.main}>
          Back to select position
        </Typography>
      </Stack>
      <Card sx={{ maxWidth: '400px' }}>
        <CardContent sx={{ p: 3, width: '100%', mb: 3 }}>
          <Typography variant="small" fontWeight={500}>
            Migrate From
          </Typography>

          <Stack direction="row" justifyContent="space-between" gap={1} mt={1}>
            <InfoWithIcon
              icon={
                <ProviderIcon provider={'Compound V2'} width={18} height={18} />
              }
              text="Compound V2"
            />
            <InfoWithIcon
              icon={<NetworkIcon network={1} width={18} height={18} />}
              text="Ethereum"
            />
          </Stack>

          {[collateral, debt].map((assetChange, index) => {
            const collateralIndex = 0;
            const type =
              index === collateralIndex ? AssetType.Collateral : AssetType.Debt;
            const maxAmount =
              type === AssetType.Debt
                ? position?.debt?.amount
                : position?.collateral?.amount;
            const label =
              type === AssetType.Collateral ? 'Collateral' : 'Borrow';
            return (
              <>
                <Typography
                  variant="small"
                  sx={{ display: 'inline-block', mt: 2, mb: 1 }}
                >
                  {label} Asset
                </Typography>

                <CurrencyCard
                  type={type}
                  vaultType={VaultType.BORROW}
                  showMax={true}
                  maxAmount={Number(maxAmount) || 0}
                  isEditing={true}
                  assetChange={assetChange}
                  actionType={ActionType.REMOVE}
                  disabled={true}
                  isExecuting={isExecuting}
                  value={assetChange?.input}
                  isFocusedByDefault={index === 0}
                  onCurrencyChange={(currency, updateVault) => {
                    changeAssetCurrency(type, currency, updateVault);
                  }}
                  onInputChange={(value) => changeAssetValue(type, value)}
                />
              </>
            );
          })}

          <Box mt={3}>
            <WarningInfo
              withoutIcon
              text={
                'While migrating debt, the process involves repaying your debt on the source chain prior to taking on a new debt on the destination chain'
              }
            />
          </Box>

          <Box mt={2}>
            <PositionHealth value={20} maxLTV={80} recommendedLTV={75} />
          </Box>

          {!isFormFormFilled && (
            <Button
              fullWidth
              variant="gradient"
              size="medium"
              disabled={false}
              onClick={onNext}
              sx={{
                mt: 3,
              }}
            >
              Next
            </Button>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

export default MigrateFrom;
