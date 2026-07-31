import AppShell from "@/components/layout/app-shell";
import ExamCenter from "@/components/exam/exam-center";

export default function AnalyticsPage() {
  return (
    <AppShell>
      <ExamCenter mode="analytics" />
    </AppShell>
  );
}
