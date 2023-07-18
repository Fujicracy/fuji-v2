import { AbstractVault } from '@x-fuji/sdk';

import { chainName } from '../../../helpers/chains';
import { RouteMeta } from '../../../helpers/routes';

type VaultWarningProps = {
  availableRoutes: RouteMeta[];
  vault?: AbstractVault;
};

function VaultWarning({ vault, availableRoutes }: VaultWarningProps) {
  return (
    <>
      {`Based on your selection, we\'ve noticed that you have an open ${
        vault?.collateral?.symbol
      } lending position on ${chainName(
        vault?.chainId
      )}. You may proceed to manage it. `}
      {availableRoutes.length > 1 &&
        "If you're trying to open a similar position on another chain, please select a different vault."}
    </>
  );
}

export default VaultWarning;
