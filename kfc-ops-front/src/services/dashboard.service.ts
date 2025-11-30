import apiClient, { DashboardStats, WorkflowStats, ApiResponse } from "./api";
import { ENDPOINTS } from "@/config/api";

interface QueueStats {
  totalInQueue: number;
  avgWaitTime: number;
  ordersByPriority: Record<string, number>;
}

class DashboardService {
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get<DashboardStats>(ENDPOINTS.DASHBOARD);
  }

  async getWorkflowStats(): Promise<ApiResponse<WorkflowStats>> {
    return apiClient.get<WorkflowStats>(ENDPOINTS.WORKFLOW_STATS);
  }

  async getQueueStats(): Promise<ApiResponse<QueueStats>> {
    return apiClient.get<QueueStats>(ENDPOINTS.QUEUE_STATS);
  }

  async getRealtimeMetrics(): Promise<
    ApiResponse<{
      dashboard: DashboardStats;
      workflow: WorkflowStats;
      queue: QueueStats;
    }>
  > {
    const [dashboard, workflow, queue] = await Promise.all([
      this.getDashboardStats(),
      this.getWorkflowStats(),
      this.getQueueStats(),
    ]);

    if (dashboard.success && workflow.success && queue.success) {
      return {
        success: true,
        data: {
          dashboard: dashboard.data!,
          workflow: workflow.data!,
          queue: queue.data!,
        },
      };
    }

    return {
      success: false,
      error: dashboard.error || workflow.error || queue.error,
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
