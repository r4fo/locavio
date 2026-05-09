import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { linkedinLogin } from '@/services/authService'
import Spinner from '@/components/ui/Spinner'

function LinkedInCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [failed, setFailed] = useState(false)
  const [failedReason, setFailedReason] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    console.log('[LinkedIn] Callback params — code:', code ? code.slice(0, 8) + '...' : null, 'state:', state, 'error:', error)

    if (error) {
      console.error('[LinkedIn] OAuth error from LinkedIn:', error)
      navigate(error === 'access_denied' ? '/login?error=linkedin_denied' : '/login?error=linkedin_failed', { replace: true })
      return
    }

    if (!code) {
      console.error('[LinkedIn] No code in callback URL')
      navigate('/login?error=linkedin_failed', { replace: true })
      return
    }

    const savedState = sessionStorage.getItem('linkedin_oauth_state')
    sessionStorage.removeItem('linkedin_oauth_state')

    if (state !== savedState) {
      console.error('[LinkedIn] State mismatch — expected:', savedState, 'got:', state)
      navigate('/login?error=invalid_state', { replace: true })
      return
    }

    const redirectUri = `${window.location.origin}/auth/linkedin/callback`

    linkedinLogin(code, redirectUri)
      .then((data) => {
        console.log('[LinkedIn] Login successful')
        login(data.user, data.access_token)
        navigate('/dashboard', { replace: true })
      })
      .catch((err) => {
        const reason = err?.response?.data?.detail || err.message || 'Unknown error'
        console.error('[LinkedIn] Token exchange failed:', reason)
        navigate(`/login?error=linkedin_failed&detail=${encodeURIComponent(reason)}`, { replace: true })
      })
  }, [])

  if (failed) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <p className="text-espresso font-medium">Sign in failed. Please try again.</p>
        {failedReason && (
          <p className="text-sm text-red-500 max-w-sm text-center">{failedReason}</p>
        )}
        <button
          onClick={() => navigate('/login')}
          className="text-primary text-sm font-medium hover:underline"
        >
          Back to login
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-muted text-sm">Signing you in with LinkedIn...</p>
    </div>
  )
}

export default LinkedInCallback
