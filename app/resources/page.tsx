import AppShell from "@/components/layout/app-shell";
import { SuperLibraryClient } from "@/components/super-library/super-library-client";

import catalogJson from "@/public/super-library/catalog.json";

import type { SuperLibraryResource } from "@/features/super-library/contracts";

const catalog = catalogJson as SuperLibraryResource[];

export default function ResourcesPage() {
  return (
    <AppShell>
      <SuperLibraryClient initialResources={catalog} />
    </AppShell>
  );
}
