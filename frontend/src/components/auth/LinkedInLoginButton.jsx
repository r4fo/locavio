import { useState } from 'react'
import { Linkedin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLinkedinAuthUrl } from '@/services/authService'
import Spinner from '@/components/ui/Spinner'

function LinkedInLoginButton() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleClick = async () => {
    setError(null)
    setLoading(true)
    try {
      const redirectUri = `${window.location.origin}/auth/linkedin/callback`
      const { url } = await getLinkedinAuthUrl(redirectUri)
      const state = crypto.randomUUID()
      sessionStorage.setItem('linkedin_oauth_state', state)
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
        aria-label="Continue with LinkedIn"
        className="w-full flex items-center justify-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50 hover:opacity-90"
        style={{ backgroundColor: '#0A66C2' }}
      >
        {loading ? <Spinner size="sm" /> : <Linkedin size={18} />}
        Continue with LinkedIn
      </button>
      {error && <p role="alert" className="text-danger text-sm text-center">{error}</p>}
    </div>
  )
}

export default LinkedInLoginButton
