import { LendingProviderWithFinancials } from '@x-fuji/sdk';

type ProviderWithStatus = LendingProviderWithFinancials & { active?: boolean };

export const rearrangeProvidersWithActiveInCenter = (
  array: LendingProviderWithFinancials[]
): ProviderWithStatus[] => {
  const result = array.slice().map((e, i) => ({ ...e, active: i === 0 }));
  const activeItem = result.find((item) => item.active);
  if (!activeItem || result.length <= 1) {
    // No active item found, return the original array
    return result;
  }

  const middleIndex = (result.length - 1) / 2;
  const activeIndex = result.indexOf(activeItem);
  result.splice(activeIndex, 1);

  let leftArray: LendingProviderWithFinancials[];
  let rightArray: LendingProviderWithFinancials[];

  leftArray = result.slice(0, middleIndex);
  rightArray = result.slice(middleIndex);

  return [...leftArray, activeItem, ...rightArray];
};
