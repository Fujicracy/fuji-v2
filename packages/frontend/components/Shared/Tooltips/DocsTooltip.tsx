import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Link, Tooltip, useTheme } from '@mui/material';
import React from 'react';

type DocsTooltipProps = {
  fontSize: string;
};

function DocsTooltip({ fontSize }: DocsTooltipProps) {
  const { palette } = useTheme();

  return (
    <Tooltip
      arrow
      title={
        <span>
          We take into account variables such as liquidity, audits and team
          behind each protocol, you can read more on our risk framework{' '}
          <Link
            href="https://docs.fujidao.org/"
            target="_blank"
            rel="noreferrer"
          >
            <u> here</u>
          </Link>
        </span>
      }
      placement="top"
    >
      <InfoOutlinedIcon sx={{ fontSize, color: palette.info.main }} />
    </Tooltip>
  );
}

export default DocsTooltip;

DocsTooltip.defaultProps = {
  fontSize: '1rem',
};
