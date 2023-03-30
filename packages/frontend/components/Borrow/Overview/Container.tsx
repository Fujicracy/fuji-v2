import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogContent,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import React from 'react';

type ContainerProps = {
  children: React.ReactNode;
  isMobile: boolean;
};

function Container({ children, isMobile }: ContainerProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const isOpen = Boolean(anchorEl);

  const openPreviewTransaction = (event: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(event.currentTarget);

  const closePreviewTransaction = () => setAnchorEl(null);

  return isMobile ? (
    <>
      <Card
        sx={{
          width: '88%',
          padding: '1rem 1rem',
          position: 'fixed',
          bottom: '2rem',
          left: '6%',
          right: '6%',
          pb: 0,
        }}
      >
        <CardContent sx={{ p: 0, width: '100%' }}>
          <CardActionArea onClick={openPreviewTransaction}>
            <Grid container justifyContent="space-between">
              <Typography onClick={openPreviewTransaction} variant="body2">
                Overview
              </Typography>

              {isOpen ? (
                <KeyboardArrowDownIcon
                  sx={{
                    border: '1px solid',
                    borderRadius: '0.5rem',
                  }}
                />
              ) : (
                <KeyboardArrowUpIcon
                  sx={{
                    border: '1px solid',
                    borderRadius: '0.5rem',
                  }}
                />
              )}
            </Grid>
          </CardActionArea>
        </CardContent>
      </Card>

      <Dialog
        fullWidth
        onClose={closePreviewTransaction}
        open={isOpen}
        sx={{ backdropFilter: 'blur(0.313rem)' }}
      >
        <DialogContent
          sx={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            width: '94%',
            maxHeight: '90%',
            transform: 'translateX(-50%)',
            background: 'transparent',
          }}
        >
          <Card
            sx={{
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1rem 1rem',
            }}
          >
            <CardContent sx={{ width: '100%', p: 0, gap: '1rem' }}>
              <CardActionArea onClick={closePreviewTransaction}>
                <Grid container justifyContent="space-between">
                  <Typography variant="body2">Overview</Typography>
                  {isOpen ? (
                    <KeyboardArrowDownIcon
                      sx={{
                        border: '1px solid',
                        borderRadius: '0.5rem',
                      }}
                    />
                  ) : (
                    <KeyboardArrowUpIcon
                      sx={{
                        border: '1px solid',
                        borderRadius: '0.5rem',
                      }}
                    />
                  )}
                </Grid>
              </CardActionArea>
              <Divider sx={{ mt: '1.375rem', mb: '1rem' }} />
              {children}
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  ) : (
    <Grid container alignItems="center" justifyContent="space-between">
      <Card
        sx={{
          flexDirection: 'column',
          alignItems: 'center',
          p: '1.5rem 2rem',
          width: '100%',
        }}
      >
        <CardContent sx={{ padding: 0, gap: '1rem' }}>{children}</CardContent>
      </Card>
    </Grid>
  );
}

export default Container;
