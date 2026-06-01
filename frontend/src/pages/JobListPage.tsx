import { useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { applyToJob, clearApplySuccess, fetchMyApplications } from '../store/applicationSlice';
import { fetchJobs } from '../store/jobSlice';

const JobListContent = () => {
  const dispatch = useAppDispatch();
  const { role } = useAppSelector((state) => state.auth);
  const { items, loading, error } = useAppSelector((state) => state.jobs);
  const { applySuccess, error: applyError, loading: applyLoading } = useAppSelector(
    (state) => state.applications
  );

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  useEffect(() => {
    if (applySuccess) {
      dispatch(fetchMyApplications());
      dispatch(clearApplySuccess());
    }
  }, [applySuccess, dispatch]);

  const handleApply = (jobId: number) => {
    dispatch(applyToJob(jobId));
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Danh sách việc làm
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {applyError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {applyError}
          </Alert>
        )}
        {applySuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Nộp đơn thành công!
          </Alert>
        )}

        {loading && items.length === 0 ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
            }}
          >
            {items.map((job) => (
              <Card key={job.id} variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {job.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {job.description}
                  </Typography>
                  <Chip label={job.requiredSkills} size="small" sx={{ mr: 1 }} />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Recruiter: {job.recruiterName}
                  </Typography>
                </CardContent>
                {role === 'CANDIDATE' && (
                  <CardActions>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={applyLoading}
                      onClick={() => handleApply(job.id)}
                    >
                      Nộp đơn
                    </Button>
                  </CardActions>
                )}
              </Card>
            ))}
          </Box>
        )}

        {!loading && items.length === 0 && (
          <Typography color="text.secondary">Chưa có tin tuyển dụng nào.</Typography>
        )}
      </Container>
    </>
  );
};

const JobListPage = () => (
  <ProtectedRoute>
    <JobListContent />
  </ProtectedRoute>
);

export default JobListPage;
