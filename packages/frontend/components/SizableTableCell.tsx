import { TableCell, TableCellProps } from "@mui/material"

// Hack bc it's difficult to size a tablecell,
// to avoid repeating sx=minwidth, maxwidth
// See https://github.com/mui/material-ui/issues/35536
type SizableTableCellProps = TableCellProps & {
  width?: string
}
export const SizableTableCell = (props: SizableTableCellProps) => {
  const { width, children } = props

  return (
    <TableCell
      {...props}
      sx={{
        ...props.sx,
        minWidth: `${width} !important`,
        maxWidth: `${width} !important`,
      }}
    >
      {children}
    </TableCell>
  )
}
