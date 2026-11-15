import { apiRequest } from "./client";
import type { CheckoutQuoteRequest } from "./types";

export const checkoutApi = {
  /** Authenticated CRM provisional quote (tax preview non-binding). */
  quote(payload: CheckoutQuoteRequest) {
    return apiRequest<unknown>("/checkout/quote", {
      method: "POST",
      body: payload,
    });
  },
};
