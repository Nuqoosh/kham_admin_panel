import { apiRequest } from "./client";
import type { AuthUser, LoginData, LoginRequest } from "./types";

export const authApi = {
  login(payload: LoginRequest) {
    return apiRequest<LoginData>("/auth/login", {
      method: "POST",
      body: payload,
      auth: false,
    });
  },

  me() {
    return apiRequest<AuthUser>("/auth/me");
  },

  logout() {
    return apiRequest<null>("/auth/logout", { method: "POST" });
  },
};
