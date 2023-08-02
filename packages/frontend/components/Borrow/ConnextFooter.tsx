import { Grid, Link, Typography } from '@mui/material';
import Image from 'next/image';

const defaultMb = '2rem';
type ConnextFooterProps = { mb: string };

function ConnextFooter({ mb }: ConnextFooterProps) {
  return (
    <Link href="https://www.connext.network/" target="_blank" rel="noreferrer">
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        mt={defaultMb}
        mb={mb}
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

ConnextFooter.defaultProps = {
  mb: defaultMb,
};
