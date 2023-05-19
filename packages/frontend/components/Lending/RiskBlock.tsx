import { Card, Chip, Divider, Link, Stack, Typography } from '@mui/material';
import React from 'react';

import { ratingToNote } from '../../helpers/ratings';
import { useBorrow } from '../../store/borrow.store';

function RiskBlock() {
  const vault = useBorrow((state) => state.activeVault);

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: '1.5rem',
        m: '1.5rem 0',
      }}
    >
      <Typography variant="body2">Risk</Typography>

      <Divider sx={{ m: '1rem 0 1.5rem 0', width: '100%' }} />

      <Stack direction="row" alignItems="center" justifyContent="center">
        <Typography variant="body2">Safety Scoring</Typography>
        <Chip
          variant={
            Number(vault?.safetyRating?.toString()) > 75 ? 'success' : 'warning'
          }
          label={ratingToNote(Number(vault?.safetyRating?.toString()))}
          sx={{ ml: '0.5rem', '& .MuiChip-label': { p: '0.25rem 0.5rem' } }}
        />
      </Stack>

      <Typography variant="body">
        Our risk framework considers various factors including liquidity,
        audits, and the team profile of each protocol
      </Typography>
      <Link
        href={'test'}
        target="_blank"
        rel="noreferrer"
        sx={{ mt: '0.5rem', textDecoration: 'underline' }}
      >
        Read more
      </Link>

      <Typography variant="body2" mt="2rem" mb="0.5rem">
        Vault Smart Contract
      </Typography>

      <Typography variant="body">
        The Fuji Lending Vault smart contracts have been audited by XXXX and
        XXXX. Despite that, users are advised to only risk funds they can afford
        to lose.
      </Typography>
      <Link
        href={'test'}
        target="_blank"
        rel="noreferrer"
        sx={{ mt: '0.5rem', textDecoration: 'underline' }}
      >
        Read more
      </Link>
    </Card>
  );
}

export default RiskBlock;
