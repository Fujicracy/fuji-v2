import { Card, CardContent, Typography } from '@mui/material';

function MigrateFrom() {
  return (
    <Card sx={{ maxWidth: '400px' }}>
      <CardContent sx={{ p: 3, width: '100%', mb: 3 }}>
        <Typography variant="small" fontWeight={500}>
          Migrate From
        </Typography>
      </CardContent>
    </Card>
  );
}

export default MigrateFrom;
