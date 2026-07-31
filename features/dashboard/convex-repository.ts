import type { FunctionReference } from "convex/server";
import type { api } from "@/convex/_generated/api";
import type { DashboardReadModel } from "./domain";

interface DashboardApi {
  dashboard: {
    getPublicOverview: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      DashboardReadModel
    >;
  };
}

export function asDashboardApi(generatedApi: typeof api): DashboardApi {
  return generatedApi as DashboardApi;
}
