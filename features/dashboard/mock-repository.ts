import { dashboardData } from "@/lib/data/dashboard";
import type { DashboardRepository } from "./repository";

export const mockDashboardRepository: DashboardRepository = {
  async getDashboard() {
    return dashboardData;
  },
};
