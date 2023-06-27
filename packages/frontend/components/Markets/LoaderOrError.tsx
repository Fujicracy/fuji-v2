import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Skeleton, Tooltip } from '@mui/material';

import { MarketRowStatus } from '../../store/types/markets';

export const loaderOrError = (status: MarketRowStatus) =>
  status === MarketRowStatus.Loading ? (
    <Skeleton />
  ) : status === MarketRowStatus.Error ? (
    <Tooltip title="Error loading data" arrow>
      <ErrorOutlineIcon />
    </Tooltip>
  ) : (
    <></>
  );
