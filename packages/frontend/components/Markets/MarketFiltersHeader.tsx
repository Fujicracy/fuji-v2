import { Box, Stack, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import React, { ReactNode, useMemo, useState } from 'react';

import { TabOption } from '../../constants';
import { chains } from '../../helpers/chains';
import TabSwitch from '../Shared/TabSwitch/TabSwitch';
import { TooltipWrapper } from '../Shared/Tooltips';

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
  const [selectedChainIndexes, setSelectedChainIndexes] = useState([0]);

  const handleSearchChange = (event: React.FocusEvent<HTMLInputElement>) => {
    const enteredValue = event?.target?.value.trim();

    setFilters({ ...filters, searchQuery: enteredValue });
  };

  const handleChainChange = (index: number) => {
    const chainName = index > 0 ? chains[index - 1].name : '';
    if (index === 0) {
      setFilters({ ...filters, chains: chains.map((c) => c.name) });
      setSelectedChainIndexes([0]);
    } else if (filters.chains.length === chains.length) {
      setFilters({ ...filters, chains: [chainName] });
      setSelectedChainIndexes([index]);
    } else if (filters.chains.includes(chainName)) {
      const filtered = filters.chains.filter((c) => c !== chainName);
      const result = filtered.length > 0 ? filtered : chains.map((c) => c.name);
      setFilters({ ...filters, chains: result });
      const resultIndexes: number[] = [];
      chains.forEach((chain, i) => {
        filtered.includes(chain.name) && resultIndexes.push(i + 1);
      });
      setSelectedChainIndexes(resultIndexes);
    } else {
      setFilters({ ...filters, chains: [...filters.chains, chainName] });
      const resultIndexes: number[] = [];
      chains.forEach((chain, i) => {
        [...filters.chains, chainName].includes(chain.name) &&
          resultIndexes.push(i + 1);
      });
      setSelectedChainIndexes(
        resultIndexes.length === chains.length ? [0] : resultIndexes
      );
    }
  };

  const images = useMemo(() => {
    const result: { [key: string]: ReactNode } = {};
    chains.forEach((chain) => {
      result[chain.name] = (
        <TooltipWrapper title={chain.name} placement="top" key={chain.chainId}>
          <Image
            src={`/assets/images/protocol-icons/networks/${chain.name}.svg`}
            height={22}
            width={22}
            alt={chain.name}
            style={{ objectFit: 'cover', marginBottom: '-4px' }}
          />
        </TooltipWrapper>
      );
    });

    return result;
  }, []);

  const tabOptions = useMemo((): TabOption[] => {
    return [
      { value: 0, label: 'All' },
      ...chains.map((chain, i) => ({
        value: i + 1,
        label: images[chain.name],
      })),
    ];
  }, [images]);

  return (
    <Stack
      sx={{
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: { xs: 'start', md: 'end' },
        alignItems: { xs: 'start', md: 'center' },
      }}
    >
      <Stack direction="row" gap="0.5rem" alignItems="center">
        <TabSwitch
          options={tabOptions}
          selected={selectedChainIndexes}
          onChange={handleChainChange}
          size="large"
          width="100%"
          withBackground
        />
      </Stack>
      <Box
        sx={{
          position: 'relative',
          mt: { xs: '0.5rem', md: 0 },
          ml: { xs: 0, md: '1rem' },
          minWidth: { xs: '100%', md: '17.5rem' },
          width: { xs: '100%', md: '17.5rem' },
        }}
      >
        <TextField
          data-cy="market-search"
          label="Filter by token, protocol"
          type="text"
          variant="outlined"
          sx={{
            width: '100%',
            '& .MuiInputBase-input': {
              p: '0.75rem 1rem 0.75rem 2.5rem',
              fontSize: '0.875rem',
              lineHeight: '1.5rem',
            },
            '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
              transform: 'translate(37px, 10px) scale(1)',
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
    </Stack>
  );
}

export default MarketFiltersHeader;
