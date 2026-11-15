import { apiRequest } from "./client";
import type {
  ListParams,
  PartnerApplicationStatus,
  PartnerApplicationUpdateRequest,
  PartnerType,
} from "./types";

export const partnersApi = {
  list(
    params?: ListParams & {
      status?: PartnerApplicationStatus;
      partner_type?: PartnerType;
    },
  ) {
    return apiRequest<unknown[]>("/partner-applications", { query: params });
  },

  get(applicationId: number | string) {
    return apiRequest<unknown>(`/partner-applications/${applicationId}`);
  },

  update(
    applicationId: number | string,
    payload: PartnerApplicationUpdateRequest,
  ) {
    return apiRequest<unknown>(`/partner-applications/${applicationId}`, {
      method: "PATCH",
      body: payload,
    });
  },
};
