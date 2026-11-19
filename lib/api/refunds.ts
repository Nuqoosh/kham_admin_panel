import { apiRequest } from "./client";
import type { ConfirmActionRequest, RefundRequestCreate } from "./types";

export const refundsApi = {
  listForOrder(orderId: number | string) {
    return apiRequest<unknown[]>(`/orders/${orderId}/refund-requests`);
  },

  create(orderId: number | string, payload: RefundRequestCreate) {
    return apiRequest<unknown>(`/orders/${orderId}/refund-requests`, {
      method: "POST",
      body: payload,
    });
  },

  audit(refundId: number | string) {
    return apiRequest<unknown[]>(`/refund-requests/${refundId}/audit`);
  },

  /** Requires `refunds.approve`; requester cannot approve their own request. */
  approve(
    refundId: number | string,
    payload: ConfirmActionRequest = { confirm: true },
  ) {
    return apiRequest<unknown>(`/refund-requests/${refundId}/approve`, {
      method: "POST",
      body: payload,
    });
  },

  /** Requires `refunds.approve`; requester cannot reject their own request. */
  reject(refundId: number | string, reason: string) {
    return apiRequest<unknown>(`/refund-requests/${refundId}/reject`, {
      method: "POST",
      body: { reason },
    });
  },

  /** Original requester only; uses `orders.manage`. */
  cancel(refundId: number | string) {
    return apiRequest<unknown>(`/refund-requests/${refundId}/cancel`, {
      method: "POST",
    });
  },
};
