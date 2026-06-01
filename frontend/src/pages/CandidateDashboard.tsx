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
import { profileService } from '../api/profileService';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMyApplications } from '../store/applicationSlice';
import type { Profile } from '../types';

const CandidateDashboard = () => {
  const dispatch = useAppDispatch();
  const { myApplications, loading, error } = useAppSelector((state) => state.applications);

  const [profile, setProfile] = useState<Profile>({
    skills: '',
    experience: '',
    education: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchMyApplications());
  }, [dispatch]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await profileService.get();
        setProfile(data);
      } catch {
        setProfileError('Không thể tải hồ sơ');
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    setProfileError(null);
    try {
      const updated = await profileService.update(profile);
      setProfile(updated);
      setProfileMessage('Cập nhật hồ sơ thành công');
    } catch {
      setProfileError('Không thể cập nhật hồ sơ');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Candidate Dashboard
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Hồ sơ ứng viên
          </Typography>
          {profileMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {profileMessage}
            </Alert>
          )}
          {profileError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {profileError}
            </Alert>
          )}
          {profileLoading ? (
            <CircularProgress />
          ) : (
            <Box component="form" onSubmit={handleSaveProfile}>
              <TextField
                fullWidth
                label="Kỹ năng (java,react,docker)"
                value={profile.skills}
                onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Kinh nghiệm"
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
              <TextField
                fullWidth
                label="Học vấn"
                value={profile.education}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                margin="normal"
                multiline
                rows={2}
              />
              <Button type="submit" variant="contained" disabled={profileSaving} sx={{ mt: 1 }}>
                {profileSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
              </Button>
            </Box>
          )}
        </Paper>

        <Typography variant="h6" gutterBottom>
          Đơn ứng tuyển của tôi
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {loading ? (
          <CircularProgress />
        ) : (
          <Table component={Paper}>
            <TableHead>
              <TableRow>
                <TableCell>Công việc</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Điểm AI</TableCell>
                <TableCell>Từ khóa trùng</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>{app.jobTitle}</TableCell>
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
              {myApplications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Bạn chưa nộp đơn nào. Hãy xem danh sách việc làm.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Container>
    </>
  );
};

export default CandidateDashboard;
