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
import { useRouter } from 'next/router';

import { CONNEXT_WARNING_DURATION, PATH } from '../../constants';
import {
  connextLinksForEntry,
  HistoryEntry,
  HistoryEntryStatus,
} from '../../helpers/history';
import { myPositionPage, showPosition } from '../../helpers/navigation';
import { vaultFromAddress } from '../../helpers/positions';
import { statusForStep, transactionSteps } from '../../helpers/transactions';
import { useAuth } from '../../store/auth.store';
import { useHistory } from '../../store/history.store';
import AddTokenButton from '../Shared/AddTokenButton';
import { NetworkIcon } from '../Shared/Icons';
import WarningInfo from '../Shared/WarningInfo';

type TransactionModalProps = {
  entry: HistoryEntry;
  currentPage: string;
};
function TransactionModal({ entry, currentPage }: TransactionModalProps) {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const activeChainId = useAuth((state) => parseInt(state.chain?.id || ''));

  const closeModal = useHistory((state) => state.closeModal);

  if (!entry) return <></>;

  const action =
    entry.steps.find((s) => s.step === RoutingStep.BORROW) ||
    entry.steps.find((s) => s.step === RoutingStep.WITHDRAW);

  const connextScanLinks = connextLinksForEntry(entry);
  const steps = transactionSteps(entry);

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
          onClick={closeModal}
        >
          <CloseIcon fontSize="small" />
        </Box>
        <Box textAlign={isMobile ? 'left' : 'center'} mb="2rem">
          <Typography variant="h6" fontWeight={500}>
            Transaction{' '}
            {entry.status === HistoryEntryStatus.ONGOING && 'processing...'}
            {entry.status === HistoryEntryStatus.SUCCESS && 'Success!'}
            {entry.status === HistoryEntryStatus.FAILURE && 'Error'}
          </Typography>
        </Box>
        <DialogContent sx={{ p: 0, overflowX: 'hidden' }}>
          <Stepper orientation="vertical" connector={<CustomConnector />}>
            {steps?.map((step) => {
              const status = statusForStep(step, entry);
              return (
                <Step key={step.label}>
                  <StepLabel
                    icon={
                      <Box
                        sx={{
                          background: theme.palette.secondary.light,
                          mr: '0.5rem',
                          p: '0.5rem 0.5rem 0.3rem 0.5rem',
                          borderRadius: '100%',
                          zIndex: 1,
                        }}
                      >
                        <NetworkIcon
                          network={step.chain}
                          height={32}
                          width={32}
                        />
                      </Box>
                    }
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
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
          <>
            <Card variant="outlined" sx={{ mt: '2rem', maxWidth: '100%' }}>
              <Typography
                variant="small"
                textAlign="center"
                fontSize="0.875rem"
              >
                This step takes a few minutes to process. If you close this
                window, your transaction will still be processed.
              </Typography>
            </Card>
            {entry.connext &&
              Date.now() - entry.connext.timestamp >
                CONNEXT_WARNING_DURATION && (
                <Box sx={{ marginBottom: 2, marginTop: 2 }}>
                  <WarningInfo
                    text={
                      'The operation takes longer than expected. You can visit ConnextScan below to check for potential issues. You might be required to connect with the same address and perform an action.'
                    }
                  />
                </Box>
              )}
          </>
        )}
        {connextScanLinks?.map((link, index) => (
          <Stack key={link} sx={{ mt: '1rem' }} spacing={1}>
            <Link href={link} target="_blank" variant="inherit">
              <Button size="medium" fullWidth variant="secondary">
                {`View ${
                  index === 0 ? 'first ' : index === 1 ? 'second ' : ''
                }transaction on ConnextScan`}
              </Button>
            </Link>
          </Stack>
        ))}
        {entry.status === HistoryEntryStatus.SUCCESS && (
          <Stack sx={{ mt: '1rem' }} spacing={1}>
            <Button
              fullWidth
              variant="gradient"
              size="medium"
              onClick={onClick}
            >
              View Position
            </Button>
            {action?.token?.chainId === activeChainId && (
              <Box textAlign="center">
                <AddTokenButton token={action.token} />
              </Box>
            )}
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
    marginTop: '-2.5rem',
    height: '6rem',
    marginBottom: '-2.5rem',
    width: 'fit-content',
  },
}));
