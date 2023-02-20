import { DetailsResult } from './DetailsResult';
import { RouterActionParams } from './RouterActionParams';

export type PreviewResult = DetailsResult & {
  actions: RouterActionParams[];
};
