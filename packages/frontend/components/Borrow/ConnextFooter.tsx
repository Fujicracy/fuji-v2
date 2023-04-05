import { Grid, Link, Typography } from '@mui/material';
import Image from 'next/image';

function ConnextFooter() {
  return (
    <Link href="https://www.connext.network/" target="_blank" rel="noreferrer">
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        mt="2rem"
        mb="2rem"
      >
        <Typography variant="small">Powered by</Typography>
        <Image
          src="/assets/images/logo/connext-title.svg"
          height={16}
          width={95}
          alt="Connext logo"
        />
      </Grid>
    </Link>
  );
}

export default ConnextFooter;
