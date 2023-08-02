import { Stack, Typography } from '@mui/material';
import { LendingProviderWithFinancials, VaultType } from '@x-fuji/sdk';
import React, { useEffect, useState } from 'react';

import { DateFormat, formattedDate } from '../../../helpers/values';
import { ProviderIcon } from '../Icons';
import { TooltipWrapper } from '../Tooltips';

function ChartAPYHeader({
  activeProvider,
  type = VaultType.BORROW,
}: {
  activeProvider?: LendingProviderWithFinancials;
  type?: VaultType;
}) {
  const [currentApr, setCurrentApr] = useState<string | undefined>(undefined);

  useEffect(() => {
    const aprBase =
      type === VaultType.BORROW
        ? activeProvider?.borrowAprBase
        : activeProvider?.depositAprBase;
    const currentApr = aprBase?.toFixed(2);
    setCurrentApr(currentApr);
  }, [activeProvider, type]);

  return (
    <>
      {activeProvider && (
        <Stack flexDirection={'row'} gap={0.8} alignItems="center">
          <TooltipWrapper
            title={`${activeProvider?.name}'s current APY`}
            placement="top"
          >
            <Typography
              variant="body2"
              fontSize="1.125rem"
              fontWeight={700}
              lineHeight="1.8rem"
            >
              {`${currentApr}%`}
            </Typography>
          </TooltipWrapper>
          <ProviderIcon
            provider={activeProvider?.name || ''}
            height={24}
            width={24}
            sx={{ mt: '-3px' }}
          />
        </Stack>
      )}
      <Typography variant="smallDark" fontSize="0.875rem" lineHeight="1.4rem">
        {formattedDate(DateFormat.YEAR)}
      </Typography>
    </>
  );
}

export default ChartAPYHeader;
