import { AutotaskEvent } from 'defender-autotask-utils';
import { Sdk } from '@x-fuji/sdk';

export async function handler(event: AutotaskEvent) {
  const sdk = new Sdk({ infuraId: '9696141dd20c48039f66168e505bc3c7', alchemy: {} });
  console.log(sdk);
  console.log(`Hello world from serverless`);
  console.log(JSON.stringify(event));
  return `Hello world from serverless`;
};
