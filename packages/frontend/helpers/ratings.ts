export const ratingToNote = (rating: number): string => {
  if (rating >= 95) return 'A+';
  else if (rating >= 85) return 'A-';
  else if (rating >= 75) return 'B+';
  else if (rating >= 65) return 'B-';
  else if (rating >= 55) return 'C+';
  else if (rating >= 45) return 'C-';
  return 'D';
};
