import { Box, Stack, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Chain } from '@x-fuji/sdk';
import Image from 'next/image';
import React, { ReactNode, useMemo } from 'react';

import { chains } from '../../helpers/chains';
import TooltipWrapper from '../Shared/Tooltips/TooltipWrapper';

export type MarketFilters = {
  searchQuery: string;
  chains: string[];
};

function MarketFiltersHeader({
  filters,
  setFilters,
}: {
  filters: MarketFilters;
  setFilters: (filters: MarketFilters) => void;
}) {
  const { palette } = useTheme();

  const handleSearchChange = (event: React.FocusEvent<HTMLInputElement>) => {
    const enteredValue = event?.target?.value.trim();

    setFilters({ ...filters, searchQuery: enteredValue });
  };

  const handleChainChange = (chainName: string) => {
    if (!chainName) {
      if (filters.chains.length === chains.length) {
        return;
      }

      setFilters({ ...filters, chains: chains.map((c) => c.name) });
      return;
    }

    if (filters.chains.length === chains.length) {
      setFilters({ ...filters, chains: [chainName] });
      return;
    }

    if (filters.chains.includes(chainName)) {
      setFilters({
        ...filters,
        chains: filters.chains.filter((c) => c !== chainName),
      });
      return;
    }
    setFilters({ ...filters, chains: [...filters.chains, chainName] });
  };

  const ChainButton = ({
    children,
    chainName,
    isSelected,
  }: {
    children: React.ReactNode;
    chainName: string;
    isSelected: boolean;
  }) => {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          backgroundColor: palette.secondary.contrastText,
          borderRadius: '0.5rem',
          width: '2.75rem',
          height: '2.75rem',
          cursor: 'pointer',
          border: `1px solid ${
            isSelected ? palette.text.primary : 'transparent'
          }`,
        }}
        onClick={() => handleChainChange(chainName)}
      >
        {children}
      </Stack>
    );
  };

  const images = useMemo(() => {
    const result: { [key: string]: ReactNode } = {};
    chains.forEach((chain) => {
      result[chain.name] = (
        <Image
          src={`/assets/images/protocol-icons/networks/${chain.name}.svg`}
          height={18}
          width={18}
          objectFit="cover"
          alt={chain.name}
        />
      );
    });

    return result;
  }, []);

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Box
        sx={{
          position: 'relative',
        }}
      >
        <TextField
          label="Filter by token, protocol"
          type="text"
          variant="outlined"
          sx={{
            minWidth: '17.5rem',
            width: '17.5rem',
            '& .MuiInputBase-input': {
              p: '0.6rem 1rem 0.6rem 2.5rem',
              fontSize: '0.875rem',
              lineHeight: '1.5rem',
            },
            '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
              transform: 'translate(37px, 7px) scale(1)',
              fontSize: '0.875rem',
              lineHeight: '1.5rem',
              color: palette.info.dark,
            },
            '& .MuiFormLabel-root.Mui-focused': {
              color: `${palette.text.primary}`,
            },
            '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: '1px !important',
              borderColor: `${palette.text.primary} !important`,
            },
          }}
          onChange={handleSearchChange}
          value={filters.searchQuery}
        />
        <Image
          src="/assets/images/shared/search.svg"
          alt="search icon"
          width={16}
          height={16}
          style={{
            position: 'absolute',
            left: '0.8rem',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />
      </Box>
      <Stack
        direction="row"
        gap="0.5rem"
        alignItems="center"
        flexWrap="wrap"
        mt="0.75rem"
      >
        <Typography variant="smallDark" color={palette.info.main} mr="0.75rem">
          Filter Chains:
        </Typography>
        <ChainButton
          chainName={''}
          isSelected={filters.chains.length === chains.length}
        >
          <Typography variant="small">All</Typography>
        </ChainButton>
        {chains.map((chain: Chain) => (
          <TooltipWrapper
            title={chain.name}
            placement="top"
            key={chain.chainId}
          >
            <ChainButton
              chainName={chain.name}
              isSelected={
                filters.chains.includes(chain.name) &&
                filters.chains.length !== chains.length
              }
            >
              {images[chain.name]}
            </ChainButton>
          </TooltipWrapper>
        ))}
      </Stack>
    </Stack>
  );
}

export default MarketFiltersHeader;
