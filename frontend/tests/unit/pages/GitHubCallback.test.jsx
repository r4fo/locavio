import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: vi.fn(),
  }
})

vi.mock('@/services/authService', () => ({
  githubLogin: vi.fn(),
}))

import { useSearchParams } from 'react-router-dom'
import { githubLogin } from '@/services/authService'
import { useAuthStore } from '../../../src/store/authStore'
import GitHubCallback from '../../../src/pages/GitHubCallback'

function makeSearchParams(params) {
  const sp = new URLSearchParams(params)
  return [sp, vi.fn()]
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  useAuthStore.setState({ user: null, isAuthenticated: false })
})

function renderPage() {
  return render(<MemoryRouter><GitHubCallback /></MemoryRouter>)
}

describe('GitHubCallback', () => {
  it('redirects to login with github_denied when error=access_denied', () => {
    useSearchParams.mockReturnValue(makeSearchParams({ error: 'access_denied' }))
    renderPage()
    expect(mockNavigate).toHaveBeenCalledWith('/login?error=github_denied', { replace: true })
  })

  it('redirects to login with github_failed for other OAuth errors', () => {
    useSearchParams.mockReturnValue(makeSearchParams({ error: 'some_error' }))
    renderPage()
    expect(mockNavigate).toHaveBeenCalledWith('/login?error=github_failed', { replace: true })
  })

  it('redirects to login with github_failed when no code', () => {
    useSearchParams.mockReturnValue(makeSearchParams({}))
    renderPage()
    expect(mockNavigate).toHaveBeenCalledWith('/login?error=github_failed', { replace: true })
  })

  it('redirects to login with invalid_state on state mismatch', () => {
    sessionStorage.setItem('github_oauth_state', 'expected-state')
    useSearchParams.mockReturnValue(makeSearchParams({ code: 'abc', state: 'wrong-state' }))
    renderPage()
    expect(mockNavigate).toHaveBeenCalledWith('/login?error=invalid_state', { replace: true })
  })

  it('shows spinner while processing', () => {
    sessionStorage.setItem('github_oauth_state', 'good-state')
    useSearchParams.mockReturnValue(makeSearchParams({ code: 'abc', state: 'good-state' }))
    githubLogin.mockResolvedValueOnce({ user: { id: 1 }, access_token: 'tok' })
    renderPage()
    expect(screen.getByText(/Signing you in with GitHub/i)).toBeTruthy()
  })

  it('logs in and navigates to dashboard on success', async () => {
    sessionStorage.setItem('github_oauth_state', 'good-state')
    useSearchParams.mockReturnValue(makeSearchParams({ code: 'abc', state: 'good-state' }))
    githubLogin.mockResolvedValueOnce({ user: { id: 1 }, access_token: 'tok' })
    renderPage()
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }))
    expect(githubLogin).toHaveBeenCalledWith('abc', `${window.location.origin}/auth/github/callback`)
  })

  it('navigates to login with github_failed on token exchange error with detail', async () => {
    sessionStorage.setItem('github_oauth_state', 'good-state')
    useSearchParams.mockReturnValue(makeSearchParams({ code: 'abc', state: 'good-state' }))
    githubLogin.mockRejectedValueOnce({
      response: { data: { detail: 'Token expired' } },
    })
    renderPage()
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        '/login?error=github_failed&detail=Token%20expired',
        { replace: true }
      )
    )
  })

  it('navigates to login with github_failed on generic error', async () => {
    sessionStorage.setItem('github_oauth_state', 'good-state')
    useSearchParams.mockReturnValue(makeSearchParams({ code: 'abc', state: 'good-state' }))
    githubLogin.mockRejectedValueOnce(new Error('network failure'))
    renderPage()
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        '/login?error=github_failed&detail=network%20failure',
        { replace: true }
      )
    )
  })
})
