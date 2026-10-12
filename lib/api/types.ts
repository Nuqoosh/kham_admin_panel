/** KHAM Commerce API types — aligned with OpenAPI + Laravel ApiResponse */

export type ApiSuccess<T = unknown> = {
  success: true;
  code: string;
  message: string;
  data: T;
  meta: Record<string, unknown>;
  errors: Record<string, unknown>;
};

export type ApiErrorBody = {
  success: false;
  code: string;
  message: string;
  data: unknown | null;
  meta: Record<string, unknown>;
  errors: Record<string, string[]>;
};

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type ProductStatus = "draft" | "active" | "archived";
export type CouponType = "fixed" | "percentage";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type Address = {
  first_name: string;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country_code: string;
};

export type VariantPriceInput = {
  market_id: number;
  currency_id: number;
  price: number;
  compare_at_price?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean;
};

export type VariantStockInput = {
  warehouse_id: number;
  quantity: number;
  reorder_level?: number | null;
};

export type ProductVariantInput = {
  id?: number;
  sku: string;
  barcode?: string | null;
  title?: string | null;
  option_values?: Record<string, unknown> | null;
  weight_grams?: number | null;
  cost_price?: number | null;
  is_active?: boolean;
  prices?: VariantPriceInput[];
  stocks?: VariantStockInput[];
};

export type ProductRequest = {
  brand_id?: number | null;
  category_id?: number | null;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  ingredients?: string | null;
  usage_instructions?: string | null;
  status: ProductStatus;
  track_inventory?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  metadata?: Record<string, unknown> | null;
  variants?: ProductVariantInput[];
};

/** Multipart product create/update payload (OpenAPI multipart/form-data). */
export type ProductMultipartInput = ProductRequest & {
  images?: File[];
  image_alt_texts?: Array<string | null | undefined>;
};

export type CustomerRequest = {
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  tags?: string[] | null;
  notes?: string | null;
  marketing_opt_in?: boolean;
};

export type CouponRequest = {
  code: string;
  name: string;
  type: CouponType;
  value: number;
  min_spend?: number | null;
  max_discount?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  max_uses?: number | null;
  max_uses_per_customer?: number | null;
  rules?: Record<string, unknown> | null;
  is_active?: boolean;
};

export type OrderItemInput = {
  variant_id: number;
  quantity: number;
};

export type OrderRequest = {
  customer_id?: number | null;
  market_id: number;
  warehouse_id: number;
  coupon_code?: string | null;
  shipping_total?: number;
  tax_total?: number;
  notes?: string | null;
  items: OrderItemInput[];
  shipping_address: Address;
};

export type LoginRequest = {
  email: string;
  password: string;
  device_name?: string | null;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  roles?: Array<{
    id: number;
    name: string;
    permissions?: Array<{ id: number; name: string }>;
  }>;
  [key: string]: unknown;
};

export type LoginData = {
  token: string;
  token_type: string;
  user: AuthUser;
};

export type DashboardDayPoint = {
  date: string;
  label: string;
  orders: number;
  revenue: number;
};

export type DashboardData = {
  orders_today: number;
  revenue_today: number;
  orders_week?: number;
  revenue_week?: number;
  customers_total: number;
  active_products: number;
  low_stock_skus: number;
  pending_orders?: number;
  orders_by_status: Record<string, number>;
  products_by_status?: Record<string, number>;
  sales_last_7_days?: DashboardDayPoint[];
};

export type CategoryInput = {
  name: string;
  slug: string;
  parent_id?: number | null;
  description?: string | null;
  image_url?: string | null;
  sort_order?: number | null;
  is_active?: boolean;
};

export type BrandInput = {
  name: string;
  slug: string;
  origin_country?: string | null;
  description?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
};

export type PriceUpsertRequest = {
  variant_id: number;
  market_id: number;
  currency_id: number;
  price: number;
  compare_at_price?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean;
};

export type InventoryAdjustRequest = {
  variant_id: number;
  warehouse_id: number;
  quantity_delta: number;
  reason: string;
};

export type OrderStatusRequest = {
  status: OrderStatus;
};

export type ListParams = {
  search?: string;
  status?: string;
  per_page?: number;
  page?: number;
  [key: string]: string | number | boolean | undefined | null;
};
