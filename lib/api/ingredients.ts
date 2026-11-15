import { apiRequest } from "./client";
import type { IngredientInput, ListParams } from "./types";

export const ingredientsApi = {
  list(params?: ListParams) {
    return apiRequest<unknown[]>("/ingredients", { query: params });
  },

  get(ingredientId: number | string) {
    return apiRequest<unknown>(`/ingredients/${ingredientId}`);
  },

  create(payload: IngredientInput) {
    return apiRequest<unknown>("/ingredients", {
      method: "POST",
      body: payload,
    });
  },

  update(ingredientId: number | string, payload: Partial<IngredientInput>) {
    return apiRequest<unknown>(`/ingredients/${ingredientId}`, {
      method: "PATCH",
      body: payload,
    });
  },
};
