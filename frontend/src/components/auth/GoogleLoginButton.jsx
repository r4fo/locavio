import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'

function GoogleLoginButton() {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [error, setError] = useState(null)

  const handleSuccess = async (credentialResponse) => {
    setError(null)
    try {
      await loginWithGoogle(credentialResponse.credential)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || t('common.error'))
    }
  }

  const handleError = () => {
    setError(t('common.error'))
  }

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap={false}
        theme="outline"
        size="large"
        width="400"
        text="signin_with"
        shape="rectangular"
      />
      {error && <p role="alert" className="text-danger text-sm">{error}</p>}
    </div>
  )
}

export default GoogleLoginButton
