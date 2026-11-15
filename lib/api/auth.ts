import { apiRequest } from "./client";
import type {
  AuthUser,
  ForgotPasswordRequest,
  LoginData,
  LoginRequest,
  ResetPasswordRequest,
} from "./types";

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

  forgotPassword(payload: ForgotPasswordRequest) {
    return apiRequest<null>("/auth/forgot-password", {
      method: "POST",
      body: payload,
      auth: false,
    });
  },

  resetPassword(payload: ResetPasswordRequest) {
    return apiRequest<null>("/auth/reset-password", {
      method: "POST",
      body: payload,
      auth: false,
    });
  },
};
