import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../src/i18n'
import Login from '../../../src/pages/Login'
import { useAuthStore } from '../../../src/store/authStore'

// Mock the auth service to avoid real API calls
vi.mock('../../../src/services/authService', () => ({
  getLinkedinAuthUrl: vi.fn().mockResolvedValue({ url: 'https://linkedin.com/oauth' }),
  getGithubAuthUrl: vi.fn().mockResolvedValue({ url: 'https://github.com/login/oauth/authorize' }),
  googleLogin: vi.fn(),
  emailLogin: vi.fn(),
  emailRegister: vi.fn(),
  getMe: vi.fn(),
  linkedinLogin: vi.fn(),
  githubLogin: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}))

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
  localStorage.clear()
})

function renderLogin(route = '/login') {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[route]}>
        <Login />
      </MemoryRouter>
    </I18nextProvider>
  )
}

describe('Login page', () => {
  it('renders page heading', () => {
    renderLogin()
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument()
  })

  it('renders subtitle', () => {
    renderLogin()
    expect(screen.getByText(/Sign in to plan/i)).toBeInTheDocument()
  })

  it('renders LinkedIn button', () => {
    renderLogin()
    expect(screen.getByText('Continue with LinkedIn')).toBeInTheDocument()
  })

  it('renders GitHub button', () => {
    renderLogin()
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument()
  })

  it('renders email input', () => {
    renderLogin()
    expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument()
  })

  it('renders password input', () => {
    renderLogin()
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument()
  })
})