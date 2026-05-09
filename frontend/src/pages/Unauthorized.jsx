import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'

function Unauthorized() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4">
      <div className="card max-w-md w-full text-center space-y-6 py-12">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center">
            <Shield size={40} className="text-danger" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-espresso">Access Denied</h1>
          <p className="text-muted mt-2">You don't have permission to view this page.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary w-full"
        >
          Go back to Dashboard
        </button>
      </div>
    </div>
  )
}

export default Unauthorized