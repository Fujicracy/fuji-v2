export const rearrangeProvidersWithActiveInCenter = () => {
  console.log('rearrange');
};
//   array: LendingProviderDetails[]
// ): LendingProviderDetails[] {
//   const activeItem = array.find((item) => item.active);
//   if (!activeItem || array.length === 1) {
//     // No active item found, return the original array
//     return array;
//   }

//   const middleIndex = (array.length - 1) / 2;
//   const activeIndex = array.indexOf(activeItem);
//   array.splice(activeIndex, 1);

//   let leftArray: LendingProviderDetails[] = [];
//   let rightArray: LendingProviderDetails[] = [];

//   leftArray = array.slice(0, middleIndex);
//   rightArray = array.slice(middleIndex);

//   return [...leftArray, activeItem, ...rightArray];
// }
