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
  name_ar?: string | null;
  slug: string;
  short_description?: string | null;
  short_description_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  ingredients?: string | null;
  ingredients_ar?: string | null;
  usage_instructions?: string | null;
  usage_instructions_ar?: string | null;
  status: ProductStatus;
  track_inventory?: boolean;
  seo_title?: string | null;
  seo_title_ar?: string | null;
  seo_description?: string | null;
  seo_description_ar?: string | null;
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
  name_ar?: string | null;
  slug: string;
  parent_id?: number | null;
  description?: string | null;
  description_ar?: string | null;
  image_url?: string | null;
  sort_order?: number | null;
  is_active?: boolean;
};

export type BrandInput = {
  name: string;
  name_ar?: string | null;
  slug: string;
  origin_country?: string | null;
  description?: string | null;
  description_ar?: string | null;
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

/** Password recovery */
export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
};

/** Homepage CMS */
export type HomepageSectionType =
  | "hero"
  | "banner"
  | "featured"
  | "promotion"
  | "editorial"
  | "custom";

export type HomepageSectionInput = {
  key: string;
  type: HomepageSectionType;
  title_en: string;
  title_ar?: string | null;
  subtitle_en?: string | null;
  subtitle_ar?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  content?: Record<string, unknown> | null;
  sort_order?: number;
  is_published?: boolean;
};

/** Partners */
export type PartnerType =
  | "retailer"
  | "distributor"
  | "influencer"
  | "corporate"
  | "other";

export type PartnerApplicationStatus =
  | "pending"
  | "in_review"
  | "approved"
  | "rejected";

export type PartnerApplicationUpdateRequest = {
  status: PartnerApplicationStatus;
  internal_notes?: string | null;
};

/** Newsletter */
export type NewsletterSubscriberStatus = "subscribed" | "unsubscribed";

export type NewsletterSubscriberUpdateRequest = {
  status: NewsletterSubscriberStatus;
};

/** Product reviews (CRM) */
export type ProductReviewStatus = "pending" | "approved" | "rejected";

export type ProductReviewCreateRequest = {
  order_item_id: number;
  rating: number;
  title?: string | null;
  body?: string | null;
};

export type ProductReviewModerateRequest = {
  status: "approved" | "rejected";
};

/** Rituals */
export type RitualStepInput = {
  title: string;
  title_ar?: string | null;
  instructions: string;
  instructions_ar?: string | null;
  sort_order?: number;
};

export type RitualProductInput = {
  product_id: number;
  sort_order?: number;
};

export type RitualInput = {
  slug: string;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  image_url?: string | null;
  is_published?: boolean;
  sort_order?: number;
  steps?: RitualStepInput[];
  products?: RitualProductInput[];
};

/** Ritual quiz */
export type RitualQuizQuestionInput = {
  question: string;
  question_ar?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type RitualQuizOptionInput = {
  label: string;
  label_ar?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type RitualQuizOptionProductSync = {
  products: Array<{ product_id: number; weight: number }>;
};

/** Ingredients */
export type IngredientInput = {
  slug: string;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  is_active?: boolean;
};

/** CRM checkout quote */
export type CheckoutQuoteRequest = {
  market_id: number;
  coupon_code?: string | null;
  items: Array<{ variant_id: number; quantity: number }>;
  shipping_address: {
    country_code: string;
    city: string;
  };
};

/** Shipping rules */
export type ShippingRuleCreateRequest = {
  market_id: number;
  city: string;
  shipping_fee: number;
  free_shipping_threshold?: number | null;
  is_active?: boolean;
};

export type ShippingRuleUpdateRequest = {
  shipping_fee?: number;
  free_shipping_threshold?: number | null;
  is_active?: boolean;
};

/** Market tax */
export type MarketTaxRuleUpsertRequest = {
  rate_percent: number;
  calculation_method: "exclusive" | "inclusive";
  tax_shipping: boolean;
};

export type ConfirmActionRequest = {
  confirm: true | 1 | "1" | "true" | "on" | "yes";
};

/** Finance */
export type FinanceReportParams = {
  market_id: number;
  period?: "daily" | "weekly" | "monthly" | "custom";
  from?: string;
  to?: string;
};

export type FinanceExpenseCreateRequest = {
  market_id: number;
  category: string;
  description: string;
  amount: number;
  incurred_on: string;
  reference?: string | null;
};

export type FinanceExpenseUpdateRequest = {
  category?: string;
  description?: string;
  amount?: number;
  incurred_on?: string;
  reference?: string | null;
};

export type FinanceItemCostRequest = {
  unit_cost_snapshot: number;
  unit_cost_currency_code: string;
};

/** Refunds */
export type RefundRequestCreate = {
  reason: string;
};

/** MyFatoorah sandbox (local/testing only) */
export type MyFatoorahSandboxHostedRequest = {
  idempotency_key: string;
  payment_method?: "CARD" | "APPLE_PAY" | "GOOGLE_PAY" | "KNET";
};

export type MyFatoorahProviderEnquiryRequest = {
  payment_id: string;
};
