import { AutotaskEvent } from "defender-autotask-utils";
import { bumpTransferOn, ChainId } from "../bumpTransferOn";

export async function handler(event: AutotaskEvent) {
  //console.log(JSON.stringify(event));

  return await bumpTransferOn(ChainId.GNOSIS, event);
}
