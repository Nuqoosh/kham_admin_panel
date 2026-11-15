import { apiRequest } from "./client";
import type {
  ListParams,
  NewsletterSubscriberStatus,
  NewsletterSubscriberUpdateRequest,
} from "./types";

export const newsletterApi = {
  list(
    params?: ListParams & {
      status?: NewsletterSubscriberStatus;
      search?: string;
    },
  ) {
    return apiRequest<unknown[]>("/newsletter/subscribers", { query: params });
  },

  update(
    subscriberId: number | string,
    payload: NewsletterSubscriberUpdateRequest,
  ) {
    return apiRequest<unknown>(`/newsletter/subscribers/${subscriberId}`, {
      method: "PATCH",
      body: payload,
    });
  },
};
