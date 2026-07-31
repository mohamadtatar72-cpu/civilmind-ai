import AppShell from "@/components/layout/app-shell";
import ExamCenter from "@/components/exam/exam-center";

export default function ExamPage() {
  return (
    <AppShell>
      <ExamCenter mode="exam" />
    </AppShell>
  );
}
