import React from "react"
import { Box, Chip, Stack } from "@mui/material"
// import { Box, Button, Chip, Fade, Menu, MenuItem, Stack } from "@mui/material"
// import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
// import CheckIcon from "@mui/icons-material/Check"
import { LendingProviderDetails } from "@x-fuji/sdk"

import { ProviderIcon } from "../../Shared/Icons"

type VaultsMenuProps = {
  // vault: BorrowingVault
  providers: LendingProviderDetails[]
}

// Commenting out most of this component and let it
// display only the rating and the providers of the activeVault.
// In the future, it should be turned again into a menu and made
// responsible to select vaults according their safety rating.

function VaultsMenu({ providers }: VaultsMenuProps) {
  // const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  // const open = (event: React.MouseEvent<HTMLButtonElement>) => {
  // setAnchorEl(event.currentTarget)
  // }
  // const select = (route: RouteMeta) => {
  // props.onSelection(route)
  // setAnchorEl(null)
  // }

  //const selectedRoute = props.routes.find(
  //(r) => r.address === props.vault.address.value
  //)
  //if (!selectedRoute) return <></>
  // if (props.routes.length < 2) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Chip variant="success" label="A+" />
      <Box display="flex" alignItems="center">
        {providers &&
          providers.map((p) => (
            <ProviderIcon
              key={p.name}
              providerName={p.name}
              height={16}
              width={16}
            />
          ))}
      </Box>
    </Stack>
  )
  // }

  // return (
  //   <>
  //     <Button
  //       id="button-vaults-menu"
  //       variant="secondary"
  //       onClick={open}
  //       style={{ position: "relative" }}
  //     >
  //       <Stack direction="row" alignItems="center" spacing={1}>
  //         <Chip
  //           variant="success"
  //           label="A+"
  //           sx={{ ".MuiChip-label": { textOverflow: "clip" } }}
  //         />
  //         <Box display="flex" alignItems="center">
  //           {providersForRoute(selectedRoute).map((p) => (
  //             <ProviderIcon
  //               key={p.name}
  //               providerName={p.name}
  //               height={16}
  //               width={16}
  //             />
  //           ))}
  //         </Box>
  //         <KeyboardArrowDownIcon width={16} height={16} />
  //       </Stack>
  //     </Button>
  //     <Menu
  //       id="vaults-menu"
  //       anchorEl={anchorEl}
  //       anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
  //       open={Boolean(anchorEl)}
  //       onClose={() => setAnchorEl(null)}
  //       MenuListProps={{ "aria-labelledby": "button-vaults-menu" }}
  //       TransitionComponent={Fade}
  //     >
  //       {props.routes.map((r: RouteMeta) => (
  //         <VaultMenuItem
  //           key={r.address}
  //           providers={providersForRoute(r)}
  //           selected={r.address === props.vault.address.value}
  //           route={r}
  //           onClick={() => select(r)}
  //         />
  //       ))}
  //     </Menu>
  //   </>
  // )
}

export default VaultsMenu

// type VaultMenuItemProps = {
//   route: RouteMeta
//   providers: LendingProviderDetails[]
//   selected: boolean
//   onClick: (route: RouteMeta) => void
// }
// const VaultMenuItem = ({
//   route,
//   providers,
//   selected,
//   onClick,
// }: VaultMenuItemProps) => {
//   return (
//     <MenuItem onClick={() => onClick(route)}>
//       <Stack direction="row" alignItems="center" spacing={1}>
//         <Chip variant="success" label="A+" />
//         <Box display="flex" alignItems="center">
//           {providers.map((p, i) => (
//             <Box
//               display="flex"
//               alignItems="center"
//               key={p.name}
//               sx={{ right: `${i * 4}px`, position: "relative" }}
//             >
//               <ProviderIcon
//                 key={p.name}
//                 providerName={p.name}
//                 height={16}
//                 width={16}
//               />
//             </Box>
//           ))}
//         </Box>
//         {selected && <CheckIcon />}
//       </Stack>
//     </MenuItem>
//   )
// }
