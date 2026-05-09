import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  get isAdmin() { return get().user?.role === 'admin' },
  get isGuest() { return get().user?.role === 'guest' },
  get isUser() { return get().user?.role === 'user' || get().user?.role === 'admin' },

  login: (user, token) => {
    sessionStorage.setItem('locavio_token', token)
    sessionStorage.setItem('locavio_user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    sessionStorage.removeItem('locavio_token')
    sessionStorage.removeItem('locavio_user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  loadFromStorage: () => {
    const token = sessionStorage.getItem('locavio_token')
    const userStr = sessionStorage.getItem('locavio_user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({ user, token, isAuthenticated: true })
      } catch {
        sessionStorage.removeItem('locavio_token')
        sessionStorage.removeItem('locavio_user')
      }
    }
  },

  setUser: (user) => {
    sessionStorage.setItem('locavio_user', JSON.stringify(user))
    set({ user })
  },
}))
