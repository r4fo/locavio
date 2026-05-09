import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { updateUser, deleteUser } from '@/services/authService'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import { useLanguage } from '@/hooks/useLanguage'

const CATEGORIES = ['food', 'culture', 'sport', 'social', 'nature', 'shopping']
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'ar', label: 'العربية' },
  { code: 'tr', label: 'Türkçe' },
]

function Profile() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const logout = useAuthStore((state) => state.logout)
  const { changeLanguage } = useLanguage()

  const [name, setName] = useState(user?.name || '')
  const [location, setLocation] = useState(user?.location || '')
  const [selectedLang, setSelectedLang] = useState(user?.preferences?.language || 'en')
  const [selectedCategories, setSelectedCategories] = useState(user?.preferences?.categories || [])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    document.title = 'Locavio — Profile'
  }, [])

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const updated = await updateUser(user.id, {
        name,
        location,
        preferences: { categories: selectedCategories, language: selectedLang },
      })
      setUser(updated)
      changeLanguage(selectedLang)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setSaveError(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteUser(user.id)
      logout()
      navigate('/')
    } catch {
      setDeleting(false)
      setDeleteModalOpen(false)
    }
  }

  const initial = user?.name?.[0]?.toUpperCase() || '?'

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6 pb-10">
      <h1 className="text-2xl font-semibold text-espresso">{t('profile.title')}</h1>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold shrink-0">
          {initial}
        </div>
        <div>
          <p className="font-semibold text-espresso">{user?.name}</p>
          <p className="text-sm text-muted">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="card flex flex-col gap-4">
        <Input
          name="profile-name"
          label={t('profile.name_label')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          name="profile-location"
          label={t('profile.location_label')}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, Country"
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-espresso">{t('profile.language_label')}</label>
          <select
            id="profile-lang"
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            aria-label={t('profile.language_label')}
            className="rounded-lg border border-accent px-3 py-2 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            {LANGUAGES.map(({ code, label }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-sm font-medium text-espresso mb-2">{t('profile.preferences_label')}</p>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label={t('profile.preferences_label')}>
            {CATEGORIES.map((cat) => {
              const selected = selectedCategories.includes(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleCategory(cat)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors
                    ${selected ? 'bg-primary text-white border-primary' : 'border-accent text-muted hover:text-espresso hover:border-primary'}`}
                >
                  {t(`activity.category.${cat}`)}
                </button>
              )
            })}
          </div>
        </div>

        {saveError && <p role="alert" className="text-danger text-sm">{saveError}</p>}
        {saveSuccess && <p className="text-success text-sm">{t('common.save')} ✓</p>}

        <Button type="submit" loading={saving}>{t('profile.save')}</Button>
      </form>

      {/* Security section */}
      <div className="card flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-espresso">🔒 Security</h2>
        <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
          <div>
            <p className="text-sm font-medium text-espresso">Two-Factor Authentication</p>
            <p className="text-xs text-muted">
              {user?.totp_enabled ? 'Enabled — your account has extra protection' : 'Add an extra layer of security'}
            </p>
          </div>
          <button
            onClick={() => navigate('/settings/2fa')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors
              ${user?.totp_enabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
          >
            {user?.totp_enabled ? 'Manage' : 'Enable'}
          </button>
        </div>
      </div>

      <div className="card border border-danger/30 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-danger">{t('profile.danger_zone')}</h2>
        <p className="text-xs text-muted">{t('profile.delete_confirm')}</p>
        <Button variant="ghost" size="sm" onClick={() => setDeleteModalOpen(true)} className="text-danger w-fit">
          {t('profile.delete_account')}
        </Button>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t('profile.delete_account')}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">{t('profile.delete_confirm')}</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleDelete}
              loading={deleting}
              className="flex-1 bg-danger hover:bg-danger/90"
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Profile
