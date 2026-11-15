import { apiRequest } from "./client";
import type {
  ListParams,
  ShippingRuleCreateRequest,
  ShippingRuleUpdateRequest,
} from "./types";

export const shippingApi = {
  list(params?: ListParams & { market_id?: number }) {
    return apiRequest<unknown[]>("/shipping-rules", { query: params });
  },

  create(payload: ShippingRuleCreateRequest) {
    return apiRequest<unknown>("/shipping-rules", {
      method: "POST",
      body: payload,
    });
  },

  update(ruleId: number | string, payload: ShippingRuleUpdateRequest) {
    return apiRequest<unknown>(`/shipping-rules/${ruleId}`, {
      method: "PATCH",
      body: payload,
    });
  },
};
