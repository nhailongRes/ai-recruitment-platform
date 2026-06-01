export interface LoginResponse {
  token: string;
  role: string;
  fullName: string;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  requiredSkills: string;
  recruiterName: string;
  createdAt: string;
}

export interface Application {
  id: number;
  jobId: number;
  jobTitle: string;
  candidateName: string;
  status: string;
  matchScore: number | null;
  matchedKeywords: string | null;
}

export interface Profile {
  skills: string;
  experience: string;
  education: string;
}
