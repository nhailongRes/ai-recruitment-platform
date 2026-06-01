import { Chip } from '@mui/material';

interface Props {
  score: number;
}

const MatchScoreBadge = ({ score }: Props) => {
  const getColor = (): 'success' | 'warning' | 'error' => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
  };

  return (
    <Chip
      label={`Match: ${score.toFixed(1)}%`}
      color={getColor()}
      size="small"
    />
  );
};

export default MatchScoreBadge;
