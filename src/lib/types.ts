// Shared types for Curio mini-apps

export interface Dilemma {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  argumentA: string | null;
  argumentB: string | null;
  category: string;
  difficulty: string;
  votesA: number;
  votesB: number;
  totalVotes: number;
}

export interface DeleteChoice {
  id: string;
  optionA: string;
  optionB: string;
  description: string | null;
  category: string;
  votesA: number;
  votesB: number;
  totalVotes: number;
}

export interface Career {
  title: string;
  description: string;
  salary: string;
  skills: string[];
}

export interface DemotivationalPoster {
  quote: string;
  subtext: string;
}
