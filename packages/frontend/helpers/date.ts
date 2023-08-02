export function timeAgoFromNow(inputDate: Date): string {
  const currentDate = new Date();
  const timeDifference = currentDate.getTime() - inputDate.getTime();

  const minutes = 60 * 1000;
  const hours = 60 * minutes;
  const days = 24 * hours;
  const months = 30 * days;
  const years = 365 * days;

  if (timeDifference >= years) {
    const numUnits = Math.floor(timeDifference / years);
    return `${numUnits}y ago`;
  } else if (timeDifference >= months) {
    const numUnits = Math.floor(timeDifference / months);
    return `${numUnits}m ago`;
  } else if (timeDifference >= days) {
    const numUnits = Math.floor(timeDifference / days);
    return `${numUnits}d ago`;
  } else if (timeDifference >= hours) {
    const numUnits = Math.floor(timeDifference / hours);
    return `${numUnits}h ago`;
  } else if (timeDifference >= minutes) {
    const numUnits = Math.floor(timeDifference / minutes);
    return `${numUnits}m ago`;
  } else {
    return 'now';
  }
}
