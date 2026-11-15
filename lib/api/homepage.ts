import { apiRequest } from "./client";
import type { HomepageSectionInput, HomepageSectionType, ListParams } from "./types";

export const homepageApi = {
  list(params?: ListParams & { type?: HomepageSectionType }) {
    return apiRequest<unknown[]>("/homepage/sections", { query: params });
  },

  create(payload: HomepageSectionInput) {
    return apiRequest<unknown>("/homepage/sections", {
      method: "POST",
      body: payload,
    });
  },

  update(sectionId: number | string, payload: Partial<HomepageSectionInput>) {
    return apiRequest<unknown>(`/homepage/sections/${sectionId}`, {
      method: "PATCH",
      body: payload,
    });
  },

  remove(sectionId: number | string) {
    return apiRequest<null>(`/homepage/sections/${sectionId}`, {
      method: "DELETE",
    });
  },
};
