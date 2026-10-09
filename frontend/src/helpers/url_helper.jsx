const AUTH_API =
  import.meta.env.VITE_AUTH_API_URL || "/api/auth";

// REGISTER PUBLICO
export const POST_FAKE_REGISTER = "/post-fake-register";
export const POST_JWT_REGISTER = `${AUTH_API}/register`;

// LOGIN
export const POST_FAKE_LOGIN = "/post-fake-login";
export const POST_FAKE_JWT_LOGIN = `${AUTH_API}/login`;
export const POST_JWT_LOGOUT = `${AUTH_API}/logout`;

export const POST_FAKE_PASSWORD_FORGET = "/fake-forget-pwd";
export const POST_FAKE_JWT_PASSWORD_FORGET = "/jwt-forget-pwd";
export const SOCIAL_LOGIN = "/social-login";

// PROFILE
export const POST_EDIT_JWT_PROFILE = "/post-jwt-profile";
export const POST_EDIT_PROFILE = "/post-fake-profile";