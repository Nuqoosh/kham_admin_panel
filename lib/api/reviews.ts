import { apiRequest } from "./client";
import type {
  ListParams,
  ProductReviewCreateRequest,
  ProductReviewModerateRequest,
  ProductReviewStatus,
} from "./types";

export const reviewsApi = {
  list(
    params?: ListParams & {
      status?: ProductReviewStatus;
      product_id?: number;
    },
  ) {
    return apiRequest<unknown>("/product-reviews", { query: params });
  },

  create(payload: ProductReviewCreateRequest) {
    return apiRequest<unknown>("/product-reviews", {
      method: "POST",
      body: payload,
    });
  },

  moderate(reviewId: number | string, payload: ProductReviewModerateRequest) {
    return apiRequest<unknown>(`/product-reviews/${reviewId}/moderate`, {
      method: "PATCH",
      body: payload,
    });
  },
};
