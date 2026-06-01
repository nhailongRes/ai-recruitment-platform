import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/authSlice';

const Navbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token, role, fullName } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (!token) return null;

  const dashboardPath =
    role === 'RECRUITER' ? '/recruiter/dashboard' : '/candidate/dashboard';

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          AI Recruitment
        </Typography>

        {fullName && (
          <Typography variant="body2" sx={{ mr: 2, opacity: 0.9 }}>
            Xin chào, {fullName}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button color="inherit" component={RouterLink} to="/jobs">
            Việc làm
          </Button>
          <Button color="inherit" component={RouterLink} to={dashboardPath}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Đăng xuất
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
