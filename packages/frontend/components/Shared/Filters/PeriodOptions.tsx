import React, { useMemo, useState } from 'react';

import TabSwitch from '../TabSwitch';

type PeriodOption = {
  label: string;
  value: number;
};

const periodOptions: PeriodOption[] = [
  { label: '1D', value: 1 },
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '365D', value: 365 },
];

export function PeriodOptions({
  onChange,
  isDayExcluded = false,
}: {
  onChange: (value: number) => void;
  isDayExcluded?: boolean;
}) {
  const options = useMemo(() => {
    return isDayExcluded ? periodOptions.slice(1) : periodOptions;
  }, [isDayExcluded]);
  const [daysPeriod, setDaysPeriod] = useState<number>(options[0].value);

  const onPeriodChange = (value: number) => {
    setDaysPeriod(value);
    onChange(value);
  };

  return (
    <TabSwitch
      actions={options}
      selected={daysPeriod}
      onChange={onPeriodChange}
      width="13.6rem"
    />
  );
}

export default PeriodOptions;
