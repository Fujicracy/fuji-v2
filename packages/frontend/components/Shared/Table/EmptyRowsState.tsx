import { Stack, TableCell, TableRow, Typography } from '@mui/material';

function EmptyRowsState({ withFilters }: { withFilters: boolean }) {
  const message = withFilters
    ? 'No results found'
    : 'No data available at the moment';

  return (
    <TableRow>
      <TableCell
        sx={{
          height: '10rem',
        }}
        colSpan={8}
      >
        <Stack
          data-cy="market-empty-state"
          alignItems="center"
          justifyContent="center"
          sx={{
            width: '100%',
          }}
        >
          <Typography variant="body" fontWeight={500}>
            No data
          </Typography>
          <Typography mt="0.25rem" variant="smallDark">
            {message}
          </Typography>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default EmptyRowsState;
