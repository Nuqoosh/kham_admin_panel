import { apiRequest } from "./client";
import type { DashboardData } from "./types";

export const dashboardApi = {
  get() {
    return apiRequest<DashboardData>("/dashboard");
  },
};
