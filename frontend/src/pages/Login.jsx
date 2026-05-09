import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { verify2FA } from '@/services/authService'
import GoogleLoginButton from '@/components/auth/GoogleLoginButton'
import LinkedInLoginButton from '@/components/auth/LinkedInLoginButton'
import GitHubLoginButton from '@/components/auth/GitHubLoginButton'
import { ShieldCheck } from 'lucide-react'

const OAUTH_ERROR_MESSAGES = {
  linkedin_denied: 'LinkedIn sign-in was cancelled.',
  linkedin_failed: 'LinkedIn sign-in failed. Please try again.',
  github_denied: 'GitHub sign-in was cancelled.',
  github_failed: 'GitHub sign-in failed. Please try again.',
  invalid_state: 'Sign-in failed (security check). Please try again.',
}

function Login() {
  const { t } = useTranslation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const login = useAuthStore((state) => state.login)
  const { loginWithEmail, registerWithEmail } = useAuth()
  const [searchParams] = useSearchParams()

  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(() => {
    const errParam = searchParams.get('error')
    return OAUTH_ERROR_MESSAGES[errParam] || ''
  })
  const [loading, setLoading] = useState(false)

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false)
  const [pendingToken, setPendingToken] = useState('')
  const [otpCode, setOtpCode] = useState('')

  useEffect(() => {
    document.title = 'Locavio — Sign in'
  }, [])

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await registerWithEmail(email, password, name)
      } else {
        const result = await loginWithEmail(email, password)
        // Check if 2FA is required
        if (result && result.requires_2fa) {
          setRequires2FA(true)
          setPendingToken(result.pending_token)
          setLoading(false)
          return
        }
      }
    } catch (err) {
      setError(err?.response?.data?.detail || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const handle2FASubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await verify2FA(pendingToken, otpCode)
      // data contains { access_token, user }
      login(data.user, data.access_token)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Invalid 2FA code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── 2FA Code Entry Screen ──────────────────────────────────────────────────
  if (requires2FA) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card rounded-xl shadow-md p-8 flex flex-col items-center gap-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} className="text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-espresso">Two-Factor Authentication</h1>
            <p className="text-sm text-muted mt-2">
              A 6-digit verification code has been sent to your email. Enter it below to complete sign in.
            </p>
          </div>

          <form onSubmit={handle2FASubmit} className="w-full flex flex-col gap-4">
            <div className="flex justify-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-3 border border-accent/40 rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>

            <button
              type="button"
              onClick={() => {
                setRequires2FA(false)
                setPendingToken('')
                setOtpCode('')
                setError('')
              }}
              className="text-sm text-muted hover:text-espresso transition-colors"
            >
              ← Back to login
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Normal Login / Register Screen ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-xl shadow-md p-8 flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-4xl mb-3">🗺️</p>
          <h1 className="text-2xl font-semibold text-espresso">{t('auth.welcome')}</h1>
          <p className="text-sm text-muted mt-1">{t('auth.subtitle')}</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <GoogleLoginButton />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-accent/40" />
            <span className="text-xs text-muted uppercase tracking-wide">{t('auth.or')}</span>
            <div className="flex-1 h-px bg-accent/40" />
          </div>
          <LinkedInLoginButton />
          <GitHubLoginButton />
        </div>

        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-accent/40" />
          <span className="text-xs text-muted uppercase tracking-wide">{t('auth.or')}</span>
          <div className="flex-1 h-px bg-accent/40" />
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder={t('auth.name_placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-accent/40 rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
          <input
            type="email"
            placeholder={t('auth.email_placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-accent/40 rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            placeholder={t('auth.password_placeholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-accent/40 rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading
              ? t('common.loading')
              : mode === 'signup'
              ? t('auth.sign_up')
              : t('auth.sign_in_email')}
          </button>
        </form>

        <p className="text-xs text-muted text-center">
          {mode === 'signin' ? t('auth.no_account') : t('auth.have_account')}{' '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
            className="text-primary font-medium hover:underline"
          >
            {mode === 'signin' ? t('auth.switch_signup') : t('auth.switch_signin')}
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login
