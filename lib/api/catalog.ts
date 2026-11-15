import { apiFormRequest, apiRequest, appendFormValue } from "./client";
import type { BrandInput, CategoryInput, ListParams } from "./types";

function buildCategoryFormData(
  payload: CategoryInput & { image?: File | null },
): FormData {
  const form = new FormData();
  appendFormValue(form, "name", payload.name);
  appendFormValue(form, "name_ar", payload.name_ar);
  appendFormValue(form, "slug", payload.slug);
  appendFormValue(form, "parent_id", payload.parent_id);
  appendFormValue(form, "description", payload.description);
  appendFormValue(form, "description_ar", payload.description_ar);
  appendFormValue(form, "image_url", payload.image_url);
  appendFormValue(form, "sort_order", payload.sort_order);
  appendFormValue(form, "is_active", payload.is_active);
  if (payload.image) {
    form.append("image", payload.image);
  }
  return form;
}

function buildBrandFormData(
  payload: BrandInput & { image?: File | null },
): FormData {
  const form = new FormData();
  appendFormValue(form, "name", payload.name);
  appendFormValue(form, "name_ar", payload.name_ar);
  appendFormValue(form, "slug", payload.slug);
  appendFormValue(form, "origin_country", payload.origin_country);
  appendFormValue(form, "description", payload.description);
  appendFormValue(form, "description_ar", payload.description_ar);
  appendFormValue(form, "logo_url", payload.logo_url);
  appendFormValue(form, "is_active", payload.is_active);
  if (payload.image) {
    form.append("image", payload.image);
  }
  return form;
}

export const catalogApi = {
  /** Omit page to get the full 3-level tree. Pass page/paginate for flat admin lists. */
  categories(
    params?: ListParams & {
      tree?: boolean;
      paginate?: boolean;
      is_active?: boolean;
    },
  ) {
    return apiRequest<unknown[]>("/categories", { query: params });
  },

  getCategory(categoryId: number | string) {
    return apiRequest<unknown>(`/categories/${categoryId}`);
  },

  createCategory(payload: CategoryInput & { image?: File | null }) {
    return apiFormRequest<unknown>("/categories", {
      method: "POST",
      formData: buildCategoryFormData(payload),
    });
  },

  updateCategory(categoryId: number | string, payload: Partial<CategoryInput>) {
    return apiRequest<unknown>(`/categories/${categoryId}`, {
      method: "PATCH",
      body: payload,
    });
  },

  removeCategory(categoryId: number | string) {
    return apiRequest<null>(`/categories/${categoryId}`, {
      method: "DELETE",
    });
  },

  uploadCategoryImage(categoryId: number | string, image: File) {
    const form = new FormData();
    form.append("image", image);
    return apiFormRequest<unknown>(`/categories/${categoryId}/image`, {
      method: "POST",
      formData: form,
    });
  },

  deleteCategoryImage(categoryId: number | string) {
    return apiRequest<null>(`/categories/${categoryId}/image`, {
      method: "DELETE",
    });
  },

  brands(params?: ListParams & { is_active?: boolean }) {
    return apiRequest<unknown[]>("/brands", { query: params });
  },

  getBrand(brandId: number | string) {
    return apiRequest<unknown>(`/brands/${brandId}`);
  },

  createBrand(payload: BrandInput & { image?: File | null }) {
    return apiFormRequest<unknown>("/brands", {
      method: "POST",
      formData: buildBrandFormData(payload),
    });
  },

  updateBrand(brandId: number | string, payload: Partial<BrandInput>) {
    return apiRequest<unknown>(`/brands/${brandId}`, {
      method: "PATCH",
      body: payload,
    });
  },

  removeBrand(brandId: number | string) {
    return apiRequest<null>(`/brands/${brandId}`, {
      method: "DELETE",
    });
  },

  uploadBrandLogo(brandId: number | string, image: File) {
    const form = new FormData();
    form.append("image", image);
    return apiFormRequest<unknown>(`/brands/${brandId}/image`, {
      method: "POST",
      formData: form,
    });
  },

  deleteBrandLogo(brandId: number | string) {
    return apiRequest<null>(`/brands/${brandId}/image`, {
      method: "DELETE",
    });
  },

  currencies() {
    return apiRequest<unknown[]>("/currencies");
  },

  markets() {
    return apiRequest<unknown[]>("/markets");
  },

  warehouses() {
    return apiRequest<unknown[]>("/warehouses");
  },
};
