import { apiFormRequest, apiRequest, appendFormValue } from "./client";
import type { ListParams, ProductMultipartInput, ProductRequest } from "./types";

function buildProductFormData(payload: ProductMultipartInput): FormData {
  const form = new FormData();

  appendFormValue(form, "name", payload.name);
  appendFormValue(form, "name_ar", payload.name_ar);
  appendFormValue(form, "slug", payload.slug);
  appendFormValue(form, "status", payload.status);
  appendFormValue(form, "brand_id", payload.brand_id);
  appendFormValue(form, "category_id", payload.category_id);
  appendFormValue(form, "short_description", payload.short_description);
  appendFormValue(form, "short_description_ar", payload.short_description_ar);
  appendFormValue(form, "description", payload.description);
  appendFormValue(form, "description_ar", payload.description_ar);
  appendFormValue(form, "ingredients", payload.ingredients);
  appendFormValue(form, "ingredients_ar", payload.ingredients_ar);
  appendFormValue(form, "usage_instructions", payload.usage_instructions);
  appendFormValue(form, "usage_instructions_ar", payload.usage_instructions_ar);
  appendFormValue(form, "track_inventory", payload.track_inventory);
  appendFormValue(form, "seo_title", payload.seo_title);
  appendFormValue(form, "seo_title_ar", payload.seo_title_ar);
  appendFormValue(form, "seo_description", payload.seo_description);
  appendFormValue(form, "seo_description_ar", payload.seo_description_ar);

  if (payload.metadata != null) {
    form.append("metadata", JSON.stringify(payload.metadata));
  }

  if (payload.variants?.length) {
    form.append("variants", JSON.stringify(payload.variants));
  }

  // Always send on create/update so clearing the selection syncs an empty pivot.
  if (payload.ingredient_ids !== undefined) {
    form.append("ingredient_ids", JSON.stringify(payload.ingredient_ids));
  }

  if (payload.images?.length) {
    for (const file of payload.images) {
      form.append("images[]", file);
    }
  }

  if (payload.image_alt_texts?.length) {
    form.append("image_alt_texts", JSON.stringify(payload.image_alt_texts));
  }

  return form;
}

export const productsApi = {
  list(params?: ListParams) {
    return apiRequest<unknown[]>("/products", { query: params });
  },

  get(productId: number | string) {
    return apiRequest<unknown>(`/products/${productId}`);
  },

  create(payload: ProductMultipartInput) {
    return apiFormRequest<unknown>("/products", {
      method: "POST",
      formData: buildProductFormData(payload),
    });
  },

  /** Prefer POST for multipart (PHP does not reliably parse multipart PUT/PATCH). */
  update(productId: number | string, payload: ProductMultipartInput) {
    return apiFormRequest<unknown>(`/products/${productId}`, {
      method: "POST",
      formData: buildProductFormData(payload),
    });
  },

  /** JSON-only partial update when no files are involved. */
  patch(productId: number | string, payload: Partial<ProductRequest>) {
    return apiRequest<unknown>(`/products/${productId}`, {
      method: "PATCH",
      body: payload,
    });
  },

  remove(productId: number | string) {
    return apiRequest<null>(`/products/${productId}`, {
      method: "DELETE",
    });
  },

  uploadImages(
    productId: number | string,
    files: File[],
    opts?: { alt_texts?: Array<string | null | undefined>; is_primary?: boolean },
  ) {
    const form = new FormData();
    for (const file of files) {
      form.append("images[]", file);
    }
    opts?.alt_texts?.forEach((alt, index) => {
      if (alt != null && alt !== "") {
        form.append(`alt_texts[${index}]`, alt);
      }
    });
    if (opts?.is_primary != null) {
      appendFormValue(form, "is_primary", opts.is_primary);
    }
    return apiFormRequest<unknown>(`/products/${productId}/images`, {
      method: "POST",
      formData: form,
    });
  },

  deleteImage(productId: number | string, mediaId: number | string) {
    return apiRequest<null>(`/products/${productId}/images/${mediaId}`, {
      method: "DELETE",
    });
  },
};
