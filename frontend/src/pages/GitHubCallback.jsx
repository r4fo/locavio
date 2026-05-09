import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { githubLogin } from '@/services/authService'
import Spinner from '@/components/ui/Spinner'

function GitHubCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    console.log('[GitHub] Callback params — code:', code ? code.slice(0, 8) + '...' : null, 'state:', state, 'error:', error)

    if (error) {
      console.error('[GitHub] OAuth error from GitHub:', error)
      navigate(error === 'access_denied' ? '/login?error=github_denied' : '/login?error=github_failed', { replace: true })
      return
    }

    if (!code) {
      console.error('[GitHub] No code in callback URL')
      navigate('/login?error=github_failed', { replace: true })
      return
    }

    const savedState = sessionStorage.getItem('github_oauth_state')
    sessionStorage.removeItem('github_oauth_state')

    if (state !== savedState) {
      console.error('[GitHub] State mismatch — expected:', savedState, 'got:', state)
      navigate('/login?error=invalid_state', { replace: true })
      return
    }

    const redirectUri = `${window.location.origin}/auth/github/callback`

    githubLogin(code, redirectUri)
      .then((data) => {
        console.log('[GitHub] Login successful')
        login(data.user, data.access_token)
        navigate('/dashboard', { replace: true })
      })
      .catch((err) => {
        const reason = err?.response?.data?.detail || err.message || 'Unknown error'
        console.error('[GitHub] Token exchange failed:', reason)
        navigate(`/login?error=github_failed&detail=${encodeURIComponent(reason)}`, { replace: true })
      })
  }, [])

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-muted text-sm">Signing you in with GitHub...</p>
    </div>
  )
}

export default GitHubCallback
