export type MetricTone = "blue" | "green" | "amber" | "violet";

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  detail?: string;
  tone: MetricTone;
}

export interface StudyTask {
  id: string;
  title: string;
  progress: number;
  status: "not-started" | "in-progress" | "completed" | "needs-focus";
}

export interface TopicProgress {
  id: number;
  title: string;
  progress: number;
  hasPdf: boolean;
  questionCount: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  status: string;
  relativeTime: string;
}

export interface ExamReadiness {
  examTitle: string;
  daysLeft: number;
  percentage: number;
  passProbability: number;
  predictedBand: string;
}

export interface DashboardReadModel {
  metrics: DashboardMetric[];
  tasks: StudyTask[];
  topics: TopicProgress[];
  activities: RecentActivity[];
  readiness: ExamReadiness;
  weeklyProgress: { day: string; value: number }[];
}
