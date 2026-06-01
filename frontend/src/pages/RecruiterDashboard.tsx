import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import Navbar from '../components/Navbar';
import MatchScoreBadge from '../components/MatchScoreBadge';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  clearCreateSuccess,
  clearSelectedApplications,
  createJob,
  fetchJobApplications,
  fetchJobs,
} from '../store/jobSlice';

const RecruiterDashboard = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error, createSuccess, selectedApplications } = useAppSelector(
    (state) => state.jobs
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchJobs());
    return () => {
      dispatch(clearSelectedApplications());
    };
  }, [dispatch]);

  useEffect(() => {
    if (createSuccess) {
      setTitle('');
      setDescription('');
      setRequiredSkills('');
      dispatch(clearCreateSuccess());
    }
  }, [createSuccess, dispatch]);

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(createJob({ title, description, requiredSkills }));
  };

  const handleViewApplications = (jobId: number) => {
    setSelectedJobId(jobId);
    dispatch(fetchJobApplications(jobId));
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Recruiter Dashboard
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {createSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Tạo công việc thành công!
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Tạo tin tuyển dụng mới
          </Typography>
          <Box component="form" onSubmit={handleCreateJob}>
            <TextField
              fullWidth
              label="Tiêu đề"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Mô tả"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              margin="normal"
              multiline
              rows={3}
              required
            />
            <TextField
              fullWidth
              label="Kỹ năng yêu cầu (java,spring,docker)"
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              margin="normal"
              required
            />
            <Button type="submit" variant="contained" disabled={loading} sx={{ mt: 1 }}>
              Đăng tin
            </Button>
          </Box>
        </Paper>

        <Typography variant="h6" gutterBottom>
          Tin đã đăng
        </Typography>
        {loading && items.length === 0 ? (
          <CircularProgress />
        ) : (
          <Table component={Paper}>
            <TableHead>
              <TableRow>
                <TableCell>Tiêu đề</TableCell>
                <TableCell>Kỹ năng</TableCell>
                <TableCell align="right">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((job) => (
                <TableRow key={job.id} selected={selectedJobId === job.id}>
                  <TableCell>{job.title}</TableCell>
                  <TableCell>{job.requiredSkills}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => handleViewApplications(job.id)}>
                      Xem ứng viên
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {selectedJobId !== null && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Ứng viên đã nộp đơn
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : (
              <Table component={Paper}>
                <TableHead>
                  <TableRow>
                    <TableCell>Ứng viên</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Điểm AI</TableCell>
                    <TableCell>Từ khóa trùng</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>{app.candidateName}</TableCell>
                      <TableCell>{app.status}</TableCell>
                      <TableCell>
                        {app.matchScore != null ? (
                          <MatchScoreBadge score={app.matchScore} />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{app.matchedKeywords || '—'}</TableCell>
                    </TableRow>
                  ))}
                  {selectedApplications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        Chưa có ứng viên nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Box>
        )}
      </Container>
    </>
  );
};

export default RecruiterDashboard;
