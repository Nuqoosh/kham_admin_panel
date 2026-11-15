import { apiDownload, apiRequest } from "./client";
import type {
  FinanceExpenseCreateRequest,
  FinanceExpenseUpdateRequest,
  FinanceItemCostRequest,
  FinanceReportParams,
  ListParams,
} from "./types";

export const financeApi = {
  report(params: FinanceReportParams) {
    return apiRequest<unknown>("/finance/report", { query: params });
  },

  /** Returns CSV blob — not an ApiSuccess JSON envelope. */
  async exportReportCsv(params: FinanceReportParams) {
    return apiDownload("/finance/report/export.csv", {
      query: params,
      filename: "kham-finance-report.csv",
    });
  },

  listExpenses(
    params?: ListParams & {
      market_id?: number;
      from?: string;
      to?: string;
      category?: string;
    },
  ) {
    return apiRequest<unknown>("/finance/expenses", { query: params });
  },

  createExpense(payload: FinanceExpenseCreateRequest) {
    return apiRequest<unknown>("/finance/expenses", {
      method: "POST",
      body: payload,
    });
  },

  updateExpense(
    expenseId: number | string,
    payload: FinanceExpenseUpdateRequest,
  ) {
    return apiRequest<unknown>(`/finance/expenses/${expenseId}`, {
      method: "PATCH",
      body: payload,
    });
  },

  removeExpense(expenseId: number | string) {
    return apiRequest<null>(`/finance/expenses/${expenseId}`, {
      method: "DELETE",
    });
  },

  setOrderItemCost(itemId: number | string, payload: FinanceItemCostRequest) {
    return apiRequest<unknown>(`/finance/order-items/${itemId}/cost`, {
      method: "PATCH",
      body: payload,
    });
  },
};
