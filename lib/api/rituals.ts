import { apiRequest } from "./client";
import type { ListParams, RitualInput } from "./types";

export const ritualsApi = {
  list(params?: ListParams) {
    return apiRequest<unknown[]>("/rituals", { query: params });
  },

  get(ritualId: number | string) {
    return apiRequest<unknown>(`/rituals/${ritualId}`);
  },

  create(payload: RitualInput) {
    return apiRequest<unknown>("/rituals", {
      method: "POST",
      body: payload,
    });
  },

  update(ritualId: number | string, payload: Partial<RitualInput>) {
    return apiRequest<unknown>(`/rituals/${ritualId}`, {
      method: "PATCH",
      body: payload,
    });
  },

  remove(ritualId: number | string) {
    return apiRequest<null>(`/rituals/${ritualId}`, {
      method: "DELETE",
    });
  },
};
