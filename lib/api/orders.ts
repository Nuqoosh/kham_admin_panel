import { apiRequest } from "./client";
import type { ListParams, OrderRequest, OrderStatusRequest } from "./types";

export const ordersApi = {
  list(
    params?: ListParams & {
      payment_status?: string;
      market_id?: number;
      warehouse_id?: number;
    },
  ) {
    return apiRequest<unknown[]>("/orders", { query: params });
  },

  get(orderId: number | string) {
    return apiRequest<unknown>(`/orders/${orderId}`);
  },

  create(payload: OrderRequest) {
    return apiRequest<unknown>("/orders", {
      method: "POST",
      body: payload,
    });
  },

  updateStatus(orderId: number | string, payload: OrderStatusRequest) {
    return apiRequest<unknown>(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: payload,
    });
  },
};
