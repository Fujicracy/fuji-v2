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
          Our risk framework considers various factors including liquidity,
          audits, and the team profile of each protocol.{' '}
          <Link
            href="https://docs.fujidao.org/"
            target="_blank"
            rel="noreferrer"
          >
            <u> Learn more</u>
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
