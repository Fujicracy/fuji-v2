import { Card, Chip, Grid, Typography, useTheme } from '@mui/material';
import { Stack } from '@mui/system';
import React from 'react';

import { belowPriceColor } from '../../../../helpers/positions';

export type SummaryCardItemInfo = {
  title: string;
  amount: string;
  footer: string;
  data?: { amount: number; recommended: number };
  extra?: string | number;
};

type SummaryCardItemProps = {
  info: SummaryCardItemInfo;
  isMobile: boolean;
};

function SummaryCardItem({ info, isMobile }: SummaryCardItemProps) {
  const { palette } = useTheme();
  const { title, amount, footer, data, extra } = info;

  if (isMobile) {
    const shouldHaveParenthesis = title !== 'Current Price';
    let content: JSX.Element | string = `${amount} ${
      shouldHaveParenthesis ? '(' : ''
    }${footer}${shouldHaveParenthesis ? ')' : ''}`;

    if (footer.includes('below current price')) {
      const coloredFooter = (
        <span
          style={{
            color: palette.info.dark,
            marginLeft: '5px',
          }}
        >
          (
          <span
            style={{
              color: data?.amount
                ? belowPriceColor(data.amount, palette, data.recommended)
                : palette.info.dark,
            }}
          >
            {' '}
            {footer.split('below current price')[0]}{' '}
          </span>
          {footer.split('%')[1]})
        </span>
      );

      content = (
        <span>
          {amount}
          {coloredFooter}
        </span>
      );
    }

    return (
      <Grid item sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="smallDark">{title}</Typography>
        <Typography variant="small" sx={{ textAlign: 'right' }}>
          {content}
        </Typography>
      </Grid>
    );
  }
  return (
    <Grid item xs={6}>
      <Card variant="position">
        <Typography variant="smallDark">{title}</Typography>
        <Stack
          direction="row"
          alignItems="right"
          justifyContent="start"
          sx={{ textAlign: 'left' }}
        >
          <Typography
            variant="regularH4"
            mb="0.5rem"
            data-cy="borrow-summary-amount"
          >
            {amount}
          </Typography>
          {extra && (
            <Chip
              sx={{ marginLeft: '0.5rem' }}
              label={`${extra} after`}
              variant={'currency'}
            />
          )}
        </Stack>
        {footer && data && footer.includes('below current price') ? (
          <Typography
            variant="smallDark"
            mb="1rem"
            sx={{
              color: data.amount
                ? belowPriceColor(data.amount, palette, data.recommended)
                : palette.info.dark,
            }}
          >
            {footer.split('below current price')[0]}
            <Typography variant="smallDark" mb="1rem">
              {footer.split('%')[1]}
            </Typography>
          </Typography>
        ) : (
          <Typography variant="smallDark" mb="1rem">
            {footer}
          </Typography>
        )}
      </Card>
    </Grid>
  );
}

export default SummaryCardItem;
