import { apiRequest } from "./client";
import type { PriceUpsertRequest } from "./types";

export const pricingApi = {
  upsert(payload: PriceUpsertRequest) {
    return apiRequest<unknown>("/prices/upsert", {
      method: "POST",
      body: payload,
    });
  },
};
