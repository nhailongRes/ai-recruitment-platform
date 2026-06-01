import { Button, Container, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const UnauthorizedPage = () => (
  <Container sx={{ py: 8, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>
      Không có quyền truy cập
    </Typography>
    <Typography color="text.secondary" paragraph>
      Bạn không có quyền xem trang này.
    </Typography>
    <Button component={RouterLink} to="/login" variant="contained">
      Về trang đăng nhập
    </Button>
  </Container>
);

export default UnauthorizedPage;
