import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LaunchIcon from '@mui/icons-material/Launch';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogContent,
  Link,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
} from '@mui/material';
import StepConnector, {
  stepConnectorClasses,
} from '@mui/material/StepConnector';
import { styled, useTheme } from '@mui/material/styles';
import { RoutingStep } from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { PATH } from '../../constants';
import { chainName } from '../../helpers/chains';
import { transactionUrl } from '../../helpers/chains';
import { HistoryEntryStatus, validSteps } from '../../helpers/history';
import { myPositionPage, showPosition } from '../../helpers/navigation';
import { vaultFromAddress } from '../../helpers/positions';
import { statusForStep, TransactionStep } from '../../helpers/transactions';
import { camelize } from '../../helpers/values';
import { useAuth } from '../../store/auth.store';
import { useHistory } from '../../store/history.store';
import AddTokenButton from '../Shared/AddTokenButton';
import { NetworkIcon } from '../Shared/Icons';

type TransactionModalProps = {
  hash?: string;
  currentPage: string;
};
function TransactionModal({ hash, currentPage }: TransactionModalProps) {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const activeChainId = useAuth((state) => parseInt(state.chain?.id || ''));
  const entry = useHistory((state) => state.entries[hash || '']);

  const closeModal = useHistory((state) => state.closeModal);

  const [activeStep] = useState(2);

  const action =
    entry?.steps.find((s) => s.step === RoutingStep.BORROW) ||
    entry?.steps.find((s) => s.step === RoutingStep.WITHDRAW);

  const connextScanLink = entry?.connextTransferId
    ? `https://amarok.connextscan.io/tx/${entry.connextTransferId}`
    : undefined;

  if (!entry) {
    return <></>;
  }
  const validatedSteps = validSteps(entry.steps);

  const steps = validatedSteps.map((s, i): TransactionStep => {
    const { step, chainId, token } = s;

    const realChainId =
      s.step === RoutingStep.X_TRANSFER && i > 0 && s.token
        ? s.token.chainId
        : chainId;

    const chain = chainName(realChainId);
    const amount = token && formatUnits(s.amount ?? 0, token.decimals);

    const txHash =
      realChainId === entry.sourceChain.chainId
        ? entry.hash
        : entry.destinationChain?.hash;

    const link = txHash && transactionUrl(realChainId, txHash);

    const style = {
      background: theme.palette.secondary.light,
      mr: '0.5rem',
      p: '0.5rem 0.5rem 0.3rem 0.5rem',
      borderRadius: '100%',
      zIndex: 1,
    };

    const action = step.toString();
    const preposition =
      step === RoutingStep.DEPOSIT
        ? 'on'
        : [
            RoutingStep.X_TRANSFER,
            RoutingStep.BORROW,
            RoutingStep.PAYBACK,
          ].includes(step)
        ? 'to'
        : 'from';

    const name = s.lendingProvider?.name;

    const label = camelize(
      `${action} ${amount} ${token?.symbol} ${name ? preposition : ''} ${
        name ?? ''
      }`
    );

    const description = `${chain} Network`;

    return {
      label,
      txHash,
      link,
      description,
      chainId: realChainId,
      icon: () => (
        <Box sx={style}>
          <NetworkIcon network={chain} height={32} width={32} />
        </Box>
      ),
    };
  });

  const onClick = async () => {
    // If the user is editing a position, we just need to close the modal
    if (currentPage === myPositionPage.path) {
      closeModal();
      return;
    }

    closeModal();
    const vault = vaultFromAddress(entry.vaultAddress);
    if (!vault) {
      router.push(PATH.MY_POSITIONS);
      return;
    }
    showPosition(router, undefined, vault);
  };

  return (
    <Dialog
      open={true}
      onClose={closeModal}
      sx={{
        '.MuiPaper-root': { width: isMobile ? '100%' : '480px' },
        backdropFilter: { xs: 'blur(0.313rem)', sm: 'none' },
      }}
    >
      <Paper variant="outlined" sx={{ p: { xs: '1rem', sm: '1.5rem' } }}>
        <Box
          width="2rem"
          height="2rem"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.palette.secondary.main,
            borderRadius: '100px',
            cursor: 'pointer',
            float: 'right',
          }}
        >
          <CloseIcon onClick={closeModal} fontSize="small" />
        </Box>
        <Box textAlign={isMobile ? 'left' : 'center'} mb="2rem">
          <Typography variant="h6" fontWeight={500}>
            Transaction{' '}
            {entry.status === HistoryEntryStatus.ONGOING && 'processing...'}
            {entry.status === HistoryEntryStatus.SUCCESS && 'Success!'}
            {entry.status === HistoryEntryStatus.FAILURE && 'Error'}
          </Typography>
        </Box>
        <DialogContent>
          <Stepper
            activeStep={activeStep}
            orientation="vertical"
            connector={<CustomConnector />}
          >
            {steps?.map((step) => {
              const status = statusForStep(step, entry);
              return (
                <Step key={step.label}>
                  <StepLabel StepIconComponent={step.icon}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      gap={2}
                    >
                      <Box>
                        <Typography variant="body" fontSize="0.875rem">
                          {step.label}
                        </Typography>
                        <br />
                        {step.txHash && step.link && (
                          <Link
                            href={step.link}
                            target="_blank"
                            variant="smallDark"
                            fontSize="0.75rem"
                            color={theme.palette.info.dark}
                          >
                            {step.description}
                            <LaunchIcon
                              sx={{
                                ml: '0.3rem',
                                fontSize: '0.6rem',
                                color: theme.palette.info.dark,
                              }}
                            />
                          </Link>
                        )}
                      </Box>
                      <Box>
                        {status === HistoryEntryStatus.SUCCESS ? (
                          <CheckIcon
                            sx={{
                              width: '2rem',
                              height: '2rem',
                              backgroundColor: theme.palette.success.dark,
                              borderRadius: '100%',
                              padding: '0.4rem',
                            }}
                            fontSize="large"
                          />
                        ) : entry.status === HistoryEntryStatus.ONGOING ? (
                          <CircularProgress size={32} />
                        ) : (
                          <ErrorOutlineIcon viewBox="0 0 32 32" />
                        )}
                      </Box>
                    </Stack>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </DialogContent>
        {entry.status === HistoryEntryStatus.ONGOING && (
          <Card variant="outlined" sx={{ mt: '2rem', maxWidth: '100%' }}>
            <Typography variant="small" textAlign="center" fontSize="0.875rem">
              This step takes a few minutes to process. If you close this
              window, your transaction will still be processed.
            </Typography>
          </Card>
        )}
        {entry.status === HistoryEntryStatus.SUCCESS && (
          <Stack sx={{ mt: '1rem' }} spacing={1}>
            {action?.token?.chainId === activeChainId && (
              <Box mb="1rem" textAlign="center">
                <AddTokenButton token={action.token} />
              </Box>
            )}
            <Button fullWidth variant="gradient" size="large" onClick={onClick}>
              View Position
            </Button>
          </Stack>
        )}
        {connextScanLink && (
          <Stack sx={{ mt: '1rem' }} spacing={1}>
            <Link href={connextScanLink} target="_blank" variant="inherit">
              <Button fullWidth variant="ghost">
                View transaction on ConnextScan
              </Button>
            </Link>
          </Stack>
        )}
      </Paper>
    </Dialog>
  );
}

export default TransactionModal;

const CustomConnector = styled(StepConnector)(({ theme }) => ({
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.secondary.light,
    borderLeft: `0.125rem solid ${theme.palette.secondary.light}`,
    left: '12px',
    position: 'relative',
    marginTop: '-2rem',
    height: '6rem',
    marginBottom: '-2rem',
    width: 'fit-content',
  },
}));
