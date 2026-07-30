import type { DashboardReadModel } from "./domain";

export interface DashboardRepository {
  getDashboard(): Promise<DashboardReadModel>;
}
