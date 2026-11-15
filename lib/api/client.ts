import type { ApiErrorBody, ApiSuccess } from "./types";
import { emitUnauthorized, getToken } from "./token";

export class ApiClientError extends Error {
  status: number;
  code: string;
  errors: Record<string, string[]>;
  body: ApiErrorBody | null;

  constructor(
    message: string,
    opts: {
      status: number;
      code?: string;
      errors?: Record<string, string[]>;
      body?: ApiErrorBody | null;
    },
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = opts.status;
    this.code = opts.code ?? "UNKNOWN";
    this.errors = opts.errors ?? {};
    this.body = opts.body ?? null;
  }
}

export function getApiBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8000/api/v1";

  // Production should talk to the API over HTTPS (token is sent as Bearer).
  if (
    process.env.NODE_ENV === "production" &&
    typeof window !== "undefined" &&
    base.startsWith("http://") &&
    !/localhost|127\.0\.0\.1/i.test(base)
  ) {
    console.warn(
      "[KHAM] NEXT_PUBLIC_API_BASE_URL uses HTTP in production. Prefer HTTPS so auth tokens are not sent in clear text.",
    );
  }

  return base;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  token?: string | null;
  auth?: boolean;
  signal?: AbortSignal;
};

function buildUrl(
  path: string,
  query?: RequestOptions["query"],
): string {
  const base = getApiBaseUrl();
  const url = new URL(
    path.startsWith("http")
      ? path
      : `${base}${path.startsWith("/") ? path : `/${path}`}`,
  );

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiSuccess<T>> {
  const {
    method = "GET",
    body,
    query,
    auth = true,
    signal,
  } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const token = options.token !== undefined ? options.token : getToken();
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  let json: ApiSuccess<T> | ApiErrorBody | null = null;
  try {
    json = (await response.json()) as ApiSuccess<T> | ApiErrorBody;
  } catch {
    json = null;
  }

  if (!response.ok || !json || json.success === false) {
    if (response.status === 401 && auth) {
      emitUnauthorized();
    }

    const errorBody =
      json && "success" in json && json.success === false
        ? json
        : null;

    throw new ApiClientError(
      errorBody?.message ||
        `Request failed with status ${response.status}`,
      {
        status: response.status,
        code: errorBody?.code,
        errors: errorBody?.errors,
        body: errorBody,
      },
    );
  }

  return json;
}

type FormRequestOptions = {
  method?: string;
  formData: FormData;
  query?: RequestOptions["query"];
  token?: string | null;
  auth?: boolean;
  signal?: AbortSignal;
};

/** Multipart/form-data request — do not set Content-Type (browser sets boundary). */
export async function apiFormRequest<T>(
  path: string,
  options: FormRequestOptions,
): Promise<ApiSuccess<T>> {
  const {
    method = "POST",
    formData,
    query,
    auth = true,
    signal,
  } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const token = options.token !== undefined ? options.token : getToken();
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: formData,
    signal,
  });

  let json: ApiSuccess<T> | ApiErrorBody | null = null;
  try {
    json = (await response.json()) as ApiSuccess<T> | ApiErrorBody;
  } catch {
    json = null;
  }

  if (!response.ok || !json || json.success === false) {
    if (response.status === 401 && auth) {
      emitUnauthorized();
    }

    const errorBody =
      json && "success" in json && json.success === false ? json : null;

    throw new ApiClientError(
      errorBody?.message ||
        `Request failed with status ${response.status}`,
      {
        status: response.status,
        code: errorBody?.code,
        errors: errorBody?.errors,
        body: errorBody,
      },
    );
  }

  return json;
}

/** Append scalar/file fields for Laravel multipart endpoints. */
export function appendFormValue(
  form: FormData,
  key: string,
  value: string | number | boolean | File | Blob | null | undefined,
): void {
  if (value === undefined || value === null) return;
  if (typeof value === "boolean") {
    form.append(key, value ? "1" : "0");
    return;
  }
  form.append(key, value instanceof Blob ? value : String(value));
}

type DownloadOptions = {
  query?: RequestOptions["query"];
  token?: string | null;
  auth?: boolean;
  signal?: AbortSignal;
  filename?: string;
};

/**
 * Authenticated binary/text download for endpoints that do not return ApiSuccess JSON
 * (e.g. finance CSV export).
 */
export async function apiDownload(
  path: string,
  options: DownloadOptions = {},
): Promise<{ blob: Blob; filename: string | null }> {
  const { query, auth = true, signal, filename } = options;
  const headers: Record<string, string> = {
    Accept: "*/*",
  };

  const token = options.token !== undefined ? options.token : getToken();
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, query), {
    method: "GET",
    headers,
    signal,
  });

  if (!response.ok) {
    if (response.status === 401 && auth) {
      emitUnauthorized();
    }

    let message = `Download failed with status ${response.status}`;
    let code = "UNKNOWN";
    let errors: Record<string, string[]> = {};
    let body: ApiErrorBody | null = null;
    try {
      const json = (await response.json()) as ApiErrorBody;
      if (json && json.success === false) {
        body = json;
        message = json.message || message;
        code = json.code || code;
        errors = json.errors || {};
      }
    } catch {
      // non-JSON error body
    }

    throw new ApiClientError(message, {
      status: response.status,
      code,
      errors,
      body,
    });
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  const matched = disposition?.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
  const resolvedName =
    filename ||
    (matched ? decodeURIComponent(matched[1].replace(/"/g, "")) : null);

  return { blob, filename: resolvedName };
}
