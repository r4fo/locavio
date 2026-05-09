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
  linkedinLogin: vi.fn(),
}))

import { useSearchParams } from 'react-router-dom'
import { linkedinLogin } from '@/services/authService'
import { useAuthStore } from '../../../src/store/authStore'
import LinkedInCallback from '../../../src/pages/LinkedInCallback'

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
  return render(<MemoryRouter><LinkedInCallback /></MemoryRouter>)
}

describe('LinkedInCallback', () => {
  it('redirects to login with linkedin_denied when error=access_denied', () => {
    useSearchParams.mockReturnValue(makeSearchParams({ error: 'access_denied' }))
    renderPage()
    expect(mockNavigate).toHaveBeenCalledWith('/login?error=linkedin_denied', { replace: true })
  })

  it('redirects to login with linkedin_failed when no code', () => {
    useSearchParams.mockReturnValue(makeSearchParams({}))
    renderPage()
    expect(mockNavigate).toHaveBeenCalledWith('/login?error=linkedin_failed', { replace: true })
  })

  it('redirects to login with invalid_state on state mismatch', () => {
    sessionStorage.setItem('linkedin_oauth_state', 'expected-state')
    useSearchParams.mockReturnValue(makeSearchParams({ code: 'abc', state: 'wrong-state' }))
    renderPage()
    expect(mockNavigate).toHaveBeenCalledWith('/login?error=invalid_state', { replace: true })
  })

  it('logs in and navigates to dashboard on success', async () => {
    sessionStorage.setItem('linkedin_oauth_state', 'good-state')
    useSearchParams.mockReturnValue(makeSearchParams({ code: 'abc', state: 'good-state' }))
    linkedinLogin.mockResolvedValueOnce({ user: { id: 1 }, access_token: 'tok' })
    renderPage()
    expect(screen.getByText(/Signing you in/i)).toBeTruthy()
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }))
    expect(linkedinLogin).toHaveBeenCalledWith('abc', `${window.location.origin}/auth/linkedin/callback`)
  })

  it('navigates to login with linkedin_failed on token exchange error', async () => {
    sessionStorage.setItem('linkedin_oauth_state', 'good-state')
    useSearchParams.mockReturnValue(makeSearchParams({ code: 'abc', state: 'good-state' }))
    linkedinLogin.mockRejectedValueOnce({
      response: { data: { detail: 'Token expired' } },
    })
    renderPage()
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        '/login?error=linkedin_failed&detail=Token%20expired',
        { replace: true }
      )
    )
  })

  it('navigates to login with linkedin_failed on generic error', async () => {
    sessionStorage.setItem('linkedin_oauth_state', 'good-state')
    useSearchParams.mockReturnValue(makeSearchParams({ code: 'abc', state: 'good-state' }))
    linkedinLogin.mockRejectedValueOnce(new Error('boom'))
    renderPage()
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        '/login?error=linkedin_failed&detail=boom',
        { replace: true }
      )
    )
  })
})
