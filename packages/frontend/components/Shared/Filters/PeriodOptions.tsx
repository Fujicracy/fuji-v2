import React, { useMemo, useState } from 'react';

import { TabOption } from '../../../constants';
import { Period } from '../../../helpers/charts';
import TabSwitch from '../TabSwitch';

const periodOptions: TabOption[] = [
  { label: '1D', value: Period.DAY },
  { label: '7D', value: Period.WEEK },
  { label: '30D', value: Period.MONTH },
  { label: '365D', value: Period.YEAR },
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
      options={options}
      selected={daysPeriod}
      onChange={onPeriodChange}
      width="13.6rem"
    />
  );
}

export default PeriodOptions;
