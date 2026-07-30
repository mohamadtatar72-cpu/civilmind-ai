import AppShell from "@/components/layout/app-shell";
import { TopicDetail } from "@/components/library/topic-detail";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <TopicDetail routeId={id} />
    </AppShell>
  );
}
