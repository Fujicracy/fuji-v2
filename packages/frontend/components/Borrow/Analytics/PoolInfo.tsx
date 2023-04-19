import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Divider,
  Grid,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { ReactNode } from 'react';

function PoolInfo() {
  const { palette, breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  function PoolInfoDivider() {
    return isMobile ? <></> : <Divider sx={{ mt: 2, mb: 2 }} />;
  }

  function InfoRow({
    label,
    value,
  }: {
    label: string;
    value: number | string;
  }) {
    return (
      <Grid container justifyContent="space-between">
        <Typography variant="smallDark">{label}</Typography>

        <Typography variant="small">{value}</Typography>
      </Grid>
    );
  }

  return (
    <>
      <Typography variant="body2">Pool Info</Typography>

      <br />

      <PoolInfoContainer isMobile={isMobile}>
        <InfoRow label="Total Borrowers" value={'4,024'} />

        <PoolInfoDivider />

        <Grid container justifyContent="space-between">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="smallDark">Last Harvest</Typography>
            <Tooltip arrow title="test">
              <InfoOutlinedIcon
                sx={{
                  ml: '0.4rem',
                  fontSize: '0.875rem',
                  color: palette.info.dark,
                  display: { xs: 'none', sm: 'inline' },
                }}
              />
            </Tooltip>
          </div>
          <Typography variant="small">30 minutes ago</Typography>
        </Grid>

        <PoolInfoDivider />

        <InfoRow label="Maximum LTV" value={'80%'} />

        <PoolInfoDivider />

        <InfoRow label="LTV Liquidation Threshold" value={'82.5%'} />

        <PoolInfoDivider />

        <InfoRow label="Liquidation Penalty" value={'10%'} />
      </PoolInfoContainer>
    </>
  );
}

export default PoolInfo;

type DetailContainerProps = {
  children: ReactNode;
  isMobile: boolean;
};

function PoolInfoContainer({ children, isMobile }: DetailContainerProps) {
  return isMobile ? (
    <Grid container direction="column" rowSpacing="0.75rem">
      {children}
    </Grid>
  ) : (
    <>{children} </>
  );
}
