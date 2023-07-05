import {
  Box,
  Button,
  Checkbox,
  Dialog,
  FormControlLabel,
  Link,
  Paper,
  Typography,
} from '@mui/material';
import { ConnectOptions } from '@web3-onboard/core';
import React, { ChangeEvent, useEffect, useState } from 'react';

import { acceptTermsOfUse, getOnboardStatus } from '../../../helpers/auth';
import { useAuth } from '../../../store/auth.store';
import ModalHeaderTitle from '../../Shared/ModalHeaderTitle';

type AgreementBox = { checked: boolean; text: string };

const agreements: AgreementBox[] = [
  {
    checked: false,
    text: 'I am a person of legal age and not in the Prohibited Person and/or Prohibited Establishment list nor acting on behalf such a Prohibited Person or Establishment.',
  },
  {
    checked: false,
    text: 'I understand borrowing money is not free. My collateral can be liquidated to cover my liabilities. I understand lending out money brings risk.',
  },
  {
    checked: false,
    text: 'I understand Fuji Finance is at an early stage of development and may come with additional risks. I have done my own research and I am aware of the risks involved.',
  },
];

export function DisclaimerModal() {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(true);
  const [hasPreviouslyAcceptedTerms, setHasPreviouslyAcceptedTerms] =
    useState<boolean>(true);
  const [agreementsBoxes, setAgreementsBoxes] =
    useState<AgreementBox[]>(agreements);

  const login = useAuth((state) => state.login);
  const isDisclaimerShown = useAuth((state) => state.isDisclaimerShown);

  useEffect(() => {
    const hasPreviouslyAcceptedTerms = getOnboardStatus().hasAcceptedTerms;

    setHasAcceptedTerms(hasPreviouslyAcceptedTerms);
    setHasPreviouslyAcceptedTerms(hasPreviouslyAcceptedTerms);
  }, []);

  const onAcceptClick = () => {
    acceptTermsOfUse();
    setHasPreviouslyAcceptedTerms(true);
    const options: ConnectOptions | undefined =
      typeof window !== 'undefined' && 'Cypress' in window
        ? {
            autoSelect: { label: 'MetaMask', disableModals: true },
          }
        : undefined;
    login(options);
  };

  const onOtherAgreementChange = (index: number, value: boolean) => {
    setAgreementsBoxes(
      agreementsBoxes.map((item: AgreementBox, i: number) =>
        i === index ? { ...item, checked: value } : item
      )
    );
  };

  const areAllAccepted =
    hasAcceptedTerms &&
    agreementsBoxes.every((item: AgreementBox) => item.checked);

  return (
    <Dialog
      data-cy="disclaimer-modal"
      open={!hasPreviouslyAcceptedTerms && isDisclaimerShown}
    >
      <Paper
        variant="outlined"
        sx={{
          maxWidth: '30rem',
          p: { xs: '1rem', sm: '1.5rem' },
          textAlign: 'center',
          '& .MuiCheckbox-root:hover': {
            background: 'inherit',
          },
        }}
      >
        <ModalHeaderTitle title="Disclaimer" />

        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
          <FormControlLabel
            label={
              <Typography
                variant="small"
                sx={{ textAlign: 'start', fontSize: '0.875rem' }}
              >
                I have read, irrevocably accept the{' '}
                <Link
                  href="https://docs.fuji.finance/links/terms-of-use"
                  target="blank"
                  underline="always"
                  variant="inherit"
                  sx={{ textDecoration: 'underline' }}
                >
                  Terms of use
                </Link>{' '}
                and confirm that I understand the risks described within.
              </Typography>
            }
            control={
              <Checkbox
                data-cy={`disclaimer-check-${agreements.length}`}
                checked={hasAcceptedTerms}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setHasAcceptedTerms(event.target.checked);
                }}
                color="default"
                sx={{ p: '0', mr: '0.5rem' }}
              />
            }
            sx={{ alignItems: 'start', m: 0 }}
          />
        </Box>

        {agreementsBoxes.map((item: AgreementBox, i: number) => (
          <Box
            key={i}
            mt="1.5rem"
            sx={{ display: 'flex', flexDirection: 'row' }}
          >
            <FormControlLabel
              label={
                <Typography
                  variant="small"
                  sx={{ textAlign: 'start', fontSize: '0.875rem' }}
                >
                  {item.text}
                </Typography>
              }
              control={
                <Checkbox
                  data-cy={`disclaimer-check-${i}`}
                  checked={agreementsBoxes[i].checked}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    onOtherAgreementChange(i, event.target.checked);
                  }}
                  color="default"
                  sx={{ p: '0', mr: '0.5rem' }}
                />
              }
              sx={{ alignItems: 'start', m: 0 }}
            />
          </Box>
        ))}

        <Button
          variant="gradient"
          size="large"
          onClick={onAcceptClick}
          disabled={!areAllAccepted}
          fullWidth
          data-cy="disclaimer-button"
          sx={{ mt: '1.5rem' }}
        >
          Agree
        </Button>
      </Paper>
    </Dialog>
  );
}

export default DisclaimerModal;
