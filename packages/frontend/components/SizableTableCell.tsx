import { TableCell, TableCellProps } from "@mui/material"

// Hack bc it's difficult to size a tablecell,
// to avoid repeating sx=minwidth, maxwidth
type SizableTableCellProps = TableCellProps & {
  width?: string
}
export const SizableTableCell = (props: SizableTableCellProps) => {
  const { width, children } = props
  if (props.sx) console.debug(props.sx)
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
