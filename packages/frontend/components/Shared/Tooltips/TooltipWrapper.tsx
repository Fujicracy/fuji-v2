import { Tooltip } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

type WithTooltipProps = {
  title: React.ReactElement | string;
  children: React.ReactElement;
  placement:
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'top-start'
    | 'top-end'
    | 'bottom-start'
    | 'bottom-end'
    | 'right-start'
    | 'right-end'
    | 'left-start'
    | 'left-end'
    | undefined;
  defaultOpen?: boolean;
};

function TooltipWrapper({
  title,
  children,
  placement,
  defaultOpen,
}: WithTooltipProps) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = () => {
    timerRef.current && clearTimeout(timerRef.current);
  };

  useEffect(() => {
    if (defaultOpen) {
      timerRef.current = setTimeout(() => {
        setOpen(false);
        clearHideTimer();
      }, 5000);
    }

    return () => {
      clearHideTimer();
    };
  }, [defaultOpen]);

  return (
    <div style={{ display: 'inline' }} onMouseOver={clearHideTimer}>
      <Tooltip
        title={title}
        placement={placement}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        arrow
        sx={{ display: { xs: 'inline', sm: 'none' } }}
      >
        <div>{children}</div>
      </Tooltip>
    </div>
  );
}

export default TooltipWrapper;
