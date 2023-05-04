import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  Divider,
  Link,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { RoutingStep } from '@x-fuji/sdk';
import { useRouter } from 'next/router';
import { MouseEvent, useEffect, useState } from 'react';

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
import LinkIcon from '../Shared/Icons/LinkIcon';
import WarningInfo from '../Shared/WarningInfo';

type TransactionModalProps = {
  entry: HistoryEntry;
  currentPage: string;
  isHistoricalTransaction?: boolean;
};

function TransactionModal({
  entry,
  currentPage,
  isHistoricalTransaction = false,
}: TransactionModalProps) {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const activeChainId = useAuth((state) => parseInt(state.chain?.id || ''));

  const closeModal = useHistory((state) => state.closeModal);

  const [isDetailsShown, setIsDetailsShown] = useState(isHistoricalTransaction);
  const [gif, setGif] = useState('');

  useEffect(() => {
    if (isHistoricalTransaction) return;

    if (entry.status === HistoryEntryStatus.FAILURE) {
      setGif('/assets/images/transactions/ERROR.gif');
      return;
    }

    if (entry.status === HistoryEntryStatus.SUCCESS) {
      setGif('/assets/images/transactions/END.gif');
      return;
    }

    setGif('/assets/images/transactions/START.gif');
    setTimeout(() => {
      setGif('/assets/images/transactions/RIDE.gif');
    }, 4000);
  }, [entry.status, isHistoricalTransaction]);

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

  const handleChange = (evt: MouseEvent) => {
    evt.preventDefault();
    setIsDetailsShown((prev) => !prev);
  };

  const transactionStatusMap: { label: string; color: string }[] = [
    {
      label: 'Pending',
      color: theme.palette.warning.main,
    },
    {
      label: 'Success',
      color: theme.palette.success.main,
    },
    {
      label: 'Error',
      color: theme.palette.error.main,
    },
  ];

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
            Transaction Status
          </Typography>
        </Box>
        {!isHistoricalTransaction && gif && (
          <img
            src={gif}
            alt="Loading Image"
            style={{ width: '100%', height: 'auto' }}
          />
        )}
        <DialogContent
          sx={{
            mt: gif ? '1.5rem' : '0',
            p: '0.75rem 1rem',
            overflowX: 'hidden',
            backgroundColor: theme.palette.secondary.dark,
            borderRadius: '0.5rem',
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ cursor: 'pointer' }}
            onClick={handleChange}
          >
            <Stack direction="column">
              <Typography variant="small" fontWeight={500}>
                Transaction Details
              </Typography>
              <Typography variant="xsmall" color={theme.palette.info.main}>
                Status:{'  '}
                <Typography
                  variant="xsmall"
                  color={transactionStatusMap[entry.status].color}
                >
                  {transactionStatusMap[entry.status].label}
                </Typography>
              </Typography>
            </Stack>
            {!isDetailsShown ? (
              <KeyboardArrowDownIcon />
            ) : (
              <KeyboardArrowUpIcon />
            )}
          </Stack>
          <Collapse in={isDetailsShown}>
            <Divider sx={{ mt: '0.75rem', mb: '0.75rem' }} />

            {steps?.map((step) => {
              const status = statusForStep(step, entry);
              return (
                <Stack
                  key={step.label}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={2}
                  mt={1}
                >
                  <Stack direction="row" alignItems="center">
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
                    <Typography
                      variant="small"
                      sx={{
                        ml: '0.5rem',
                      }}
                    >
                      {step.label}
                      {step.txHash && step.link && (
                        <Link
                          href={step.link}
                          target="_blank"
                          variant="smallDark"
                          fontSize="0.75rem"
                          color={theme.palette.info.dark}
                          sx={{
                            ml: '0.25rem',
                          }}
                        >
                          <LinkIcon />
                        </Link>
                      )}
                    </Typography>
                  </Stack>
                  <Box>
                    {status === HistoryEntryStatus.SUCCESS ? (
                      <CheckIcon
                        sx={{
                          width: '1.125rem',
                          height: '1.125rem',
                          backgroundColor: theme.palette.success.dark,
                          borderRadius: '100%',
                          padding: '0.2rem',
                        }}
                        fontSize="large"
                      />
                    ) : entry.status === HistoryEntryStatus.ONGOING ? (
                      <CircularProgress size={18} />
                    ) : (
                      <ErrorOutlineIcon
                        sx={{ width: '18px', height: '18px' }}
                      />
                    )}
                  </Box>
                </Stack>
              );
            })}
          </Collapse>
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
