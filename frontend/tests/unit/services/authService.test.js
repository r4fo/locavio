import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

import api from '../../../src/services/api'
import {
  googleLogin,
  emailLogin,
  emailRegister,
  getMe,
  linkedinLogin,
  getLinkedinAuthUrl,
} from '../../../src/services/authService'

const mockUser = {
  id: 1,
  email: 'test@test.com',
  name: 'Test User',
  auth_provider: 'email',
}

beforeEach(() => vi.clearAllMocks())

describe('authService', () => {
  it('googleLogin() posts to /auth/google and returns data', async () => {
    api.post.mockResolvedValueOnce({ data: { access_token: 'jwt', user: mockUser } })
    const result = await googleLogin('google-token')
    expect(api.post).toHaveBeenCalledWith('/auth/google', { token: 'google-token' })
    expect(result.access_token).toBe('jwt')
  })

  it('emailLogin() posts to /auth/login', async () => {
    api.post.mockResolvedValueOnce({ data: { access_token: 'jwt', user: mockUser } })
    const result = await emailLogin('test@test.com', 'password')
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'test@test.com', password: 'password' })
    expect(result.access_token).toBeDefined()
  })

  it('emailRegister() posts to /auth/register', async () => {
    api.post.mockResolvedValueOnce({ data: { access_token: 'jwt', user: mockUser } })
    const result = await emailRegister('new@test.com', 'password', 'New User')
    expect(api.post).toHaveBeenCalledWith('/auth/register', { email: 'new@test.com', password: 'password', name: 'New User' })
    expect(result.user).toBeDefined()
  })

  it('getMe() calls GET /auth/me', async () => {
    api.get.mockResolvedValueOnce({ data: mockUser })
    const result = await getMe()
    expect(api.get).toHaveBeenCalledWith('/auth/me')
    expect(result.email).toBe('test@test.com')
  })

  it('linkedinLogin() posts to /auth/linkedin', async () => {
    api.post.mockResolvedValueOnce({ data: { access_token: 'jwt', user: mockUser } })
    const result = await linkedinLogin('auth-code', 'https://locavio-beta.vercel.app/auth/linkedin/callback')
    expect(api.post).toHaveBeenCalledWith('/auth/linkedin', {
      code: 'auth-code',
      redirect_uri: 'https://locavio-beta.vercel.app/auth/linkedin/callback',
    })
    expect(result.access_token).toBe('jwt')
  })

  it('getLinkedinAuthUrl() calls GET /auth/linkedin/url', async () => {
    api.get.mockResolvedValueOnce({ data: { url: 'https://linkedin.com/oauth' } })
    const result = await getLinkedinAuthUrl('https://locavio-beta.vercel.app/auth/linkedin/callback')
    expect(api.get).toHaveBeenCalledWith('/auth/linkedin/url', {
      params: { redirect_uri: 'https://locavio-beta.vercel.app/auth/linkedin/callback' },
    })
    expect(result.url).toContain('linkedin.com')
  })
})
