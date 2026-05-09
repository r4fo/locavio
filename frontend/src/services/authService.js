import api from './api'

export const googleLogin = (token) =>
  api.post('/auth/google', { token }).then((r) => r.data)

export const getLinkedinAuthUrl = (redirectUri) =>
  api.get('/auth/linkedin/url', { params: { redirect_uri: redirectUri } }).then((r) => r.data)

export const linkedinLogin = (code, redirectUri) =>
  api.post('/auth/linkedin', { code, redirect_uri: redirectUri }).then((r) => r.data)

export const getGithubAuthUrl = (redirectUri) =>
  api.get('/auth/github/url', { params: { redirect_uri: redirectUri } }).then((r) => r.data)

export const githubLogin = (code, redirectUri) =>
  api.post('/auth/github', { code, redirect_uri: redirectUri }).then((r) => r.data)

export const emailLogin = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data)

export const emailRegister = (email, password, name) =>
  api.post('/auth/register', { email, password, name }).then((r) => r.data)

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data)

export const updateUser = (id, data) =>
  api.put(`/users/${id}`, data).then((r) => r.data)

export const deleteUser = (id) =>
  api.delete(`/users/${id}`)

// ── 2FA ──────────────────────────────────────────────────────────────────────

export const verify2FA = (pendingToken, code) =>
  api.post('/auth/verify-2fa', { pending_token: pendingToken, code }).then((r) => r.data)

export const enable2FA = () =>
  api.post('/auth/2fa/enable').then((r) => r.data)

export const disable2FA = () =>
  api.post('/auth/2fa/disable').then((r) => r.data)
