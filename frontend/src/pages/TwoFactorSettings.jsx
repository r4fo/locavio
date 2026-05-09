import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { enable2FA, disable2FA, getMe } from '@/services/authService'
import { ShieldCheck, ShieldOff, ArrowLeft, Mail } from 'lucide-react'

function TwoFactorSettings() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const isEmailUser = user?.auth_provider === 'email'
  const is2FAEnabled = user?.totp_enabled

  const handleToggle2FA = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      if (is2FAEnabled) {
        const result = await disable2FA()
        setMessage(result.message)
      } else {
        const result = await enable2FA()
        setMessage(result.message)
      }
      // Refresh user data
      const updatedUser = await getMe()
      setUser(updatedUser)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-sm text-muted hover:text-espresso transition-colors"
      >
        <ArrowLeft size={16} /> Back to Profile
      </button>

      <div className="bg-card rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-espresso">Two-Factor Authentication</h1>
            <p className="text-sm text-muted">Add an extra layer of security to your account</p>
          </div>
        </div>

        <div className="border-t border-accent/20 pt-4">
          {!isEmailUser ? (
            <div className="bg-surface rounded-lg p-4 text-sm text-muted">
              <p>
                2FA is only available for accounts registered with <strong>email and password</strong>.
                Your account uses <strong>{user?.auth_provider}</strong> sign-in, which already has its own
                security mechanisms.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-muted" />
                  <div>
                    <p className="font-medium text-espresso">Email verification code</p>
                    <p className="text-xs text-muted">
                      Receive a 6-digit code at <strong>{user?.email}</strong> on every login
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium
                    ${is2FAEnabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                    }`}
                >
                  {is2FAEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="mt-4">
                <button
                  onClick={handleToggle2FA}
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50
                    ${is2FAEnabled
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                >
                  {loading ? (
                    'Processing...'
                  ) : is2FAEnabled ? (
                    <>
                      <ShieldOff size={16} /> Disable 2FA
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} /> Enable 2FA
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {message && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default TwoFactorSettings
