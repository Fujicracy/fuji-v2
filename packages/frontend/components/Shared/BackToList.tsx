import { Stack, Typography, useTheme } from '@mui/material';
import { VaultType } from '@x-fuji/sdk';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { PATH } from '../../constants';

type BackToListProps = {
  type: VaultType;
  isEditing?: boolean;
};

function BackToList({ type, isEditing }: BackToListProps) {
  const { palette } = useTheme();
  const router = useRouter();

  const handleClick = () => {
    if (type === VaultType.BORROW) {
      router.push(PATH.MY_POSITIONS);
    } else {
      router.push({
        pathname: isEditing ? PATH.MY_POSITIONS : PATH.MARKETS,
        query: { tab: 'lend' },
      });
    }
  };

  const title =
    type === VaultType.BORROW
      ? 'View all active positions'
      : `Back to All Lending ${isEditing ? 'Positions' : 'Vaults'}`;

  return (
    <Stack
      flexDirection="row"
      alignItems="center"
      onClick={handleClick}
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
        {title}
      </Typography>
    </Stack>
  );
}

export default BackToList;
