import { MetaRoutingResult } from './MetaRoutingResult';
import { RouterActionParams } from './RouterActionParams';

export type PreviewResult = MetaRoutingResult & {
  actions: RouterActionParams[];
};
