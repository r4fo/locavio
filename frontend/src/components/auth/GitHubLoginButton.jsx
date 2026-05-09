import { useState } from 'react'
import { Github } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getGithubAuthUrl } from '@/services/authService'
import Spinner from '@/components/ui/Spinner'

function GitHubLoginButton() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleClick = async () => {
    setError(null)
    setLoading(true)
    try {
      const { url } = await getGithubAuthUrl()
      const state = crypto.randomUUID()
      sessionStorage.setItem('github_oauth_state', state)
      window.location.href = `${url}&state=${state}`
    } catch {
      setError(t('common.error'))
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        aria-label="Continue with GitHub"
        className="w-full flex items-center justify-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50 hover:opacity-90"
        style={{ backgroundColor: '#24292F' }}
      >
        {loading ? <Spinner size="sm" /> : <Github size={18} />}
        Continue with GitHub
      </button>
      {error && <p role="alert" className="text-danger text-sm text-center">{error}</p>}
    </div>
  )
}

export default GitHubLoginButton
