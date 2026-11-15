import { apiRequest } from "./client";
import type { ConfirmActionRequest, MarketTaxRuleUpsertRequest } from "./types";

export const taxApi = {
  list() {
    return apiRequest<unknown[]>("/market-tax-rules");
  },

  upsert(marketId: number | string, payload: MarketTaxRuleUpsertRequest) {
    return apiRequest<unknown>(`/markets/${marketId}/tax-rule`, {
      method: "PUT",
      body: payload,
    });
  },

  /** Requires `tax.approve` permission (separate from settings.manage). */
  approve(marketId: number | string, payload: ConfirmActionRequest = { confirm: true }) {
    return apiRequest<unknown>(`/markets/${marketId}/tax-rule/approve`, {
      method: "POST",
      body: payload,
    });
  },
};
