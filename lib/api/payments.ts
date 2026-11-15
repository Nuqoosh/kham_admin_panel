import { apiRequest } from "./client";
import type {
  MyFatoorahProviderEnquiryRequest,
  MyFatoorahSandboxHostedRequest,
} from "./types";

/**
 * Local/testing MyFatoorah sandbox helpers.
 * Backend returns 404 unless APP_ENV is local/testing and sandbox flags are enabled.
 */
export const paymentsApi = {
  startMyFatoorahSandboxHosted(
    orderId: number | string,
    payload: MyFatoorahSandboxHostedRequest,
  ) {
    return apiRequest<unknown>(
      `/orders/${orderId}/payments/myfatoorah/sandbox-hosted`,
      {
        method: "POST",
        body: payload,
      },
    );
  },

  myFatoorahSandboxStatus(orderId: number | string) {
    return apiRequest<unknown>(
      `/orders/${orderId}/payments/myfatoorah/sandbox-hosted/status`,
    );
  },

  myFatoorahProviderEnquiry(
    orderId: number | string,
    payload: MyFatoorahProviderEnquiryRequest,
  ) {
    return apiRequest<unknown>(
      `/orders/${orderId}/payments/myfatoorah/sandbox-hosted/provider-enquiry`,
      {
        method: "POST",
        body: payload,
      },
    );
  },
};
