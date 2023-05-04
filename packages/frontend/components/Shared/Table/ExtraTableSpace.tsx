import { Box, TableCell, TableRow } from '@mui/material';

function ExtraTableSpace({
  itemLength,
  max,
  colSpan,
}: {
  itemLength: number;
  max: number;
  colSpan: number;
}) {
  if (itemLength >= max) return null;

  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center">
        <Box sx={{ height: `${(max - itemLength) * 4.3}rem` }} />
      </TableCell>
    </TableRow>
  );
}

export default ExtraTableSpace;
