import { apiRequest } from "./client";
import type { CustomerRequest, ListParams } from "./types";

export const customersApi = {
  list(params?: ListParams) {
    return apiRequest<unknown>("/customers", { query: params });
  },

  get(customerId: number | string) {
    return apiRequest<unknown>(`/customers/${customerId}`);
  },

  create(payload: CustomerRequest) {
    return apiRequest<unknown>("/customers", {
      method: "POST",
      body: payload,
    });
  },

  update(customerId: number | string, payload: Partial<CustomerRequest>) {
    return apiRequest<unknown>(`/customers/${customerId}`, {
      method: "PATCH",
      body: payload,
    });
  },

  remove(customerId: number | string) {
    return apiRequest<null>(`/customers/${customerId}`, {
      method: "DELETE",
    });
  },
};
