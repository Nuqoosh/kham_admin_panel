import { apiRequest } from "./client";
import type { InventoryAdjustRequest, ListParams } from "./types";

export const inventoryApi = {
  list(params?: ListParams & { warehouse_id?: number; low_stock?: boolean }) {
    return apiRequest<unknown[]>("/inventory", { query: params });
  },

  movements(
    params?: ListParams & {
      variant_id?: number;
      warehouse_id?: number;
      type?: string;
    },
  ) {
    return apiRequest<unknown>("/inventory/movements", { query: params });
  },

  adjust(payload: InventoryAdjustRequest) {
    return apiRequest<unknown>("/inventory/adjust", {
      method: "POST",
      body: payload,
    });
  },
};
