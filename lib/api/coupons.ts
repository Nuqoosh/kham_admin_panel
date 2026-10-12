import { apiRequest } from "./client";
import type { CouponRequest, ListParams } from "./types";

export const couponsApi = {
  list(params?: ListParams) {
    return apiRequest<unknown>("/coupons", { query: params });
  },

  get(couponId: number | string) {
    return apiRequest<unknown>(`/coupons/${couponId}`);
  },

  create(payload: CouponRequest) {
    return apiRequest<unknown>("/coupons", {
      method: "POST",
      body: payload,
    });
  },

  update(couponId: number | string, payload: Partial<CouponRequest>) {
    return apiRequest<unknown>(`/coupons/${couponId}`, {
      method: "PATCH",
      body: payload,
    });
  },

  remove(couponId: number | string) {
    return apiRequest<null>(`/coupons/${couponId}`, {
      method: "DELETE",
    });
  },
};
