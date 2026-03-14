import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: (() => {
    try {
      const u = localStorage.getItem('ci_user')
      return u ? JSON.parse(u) : null
    } catch { return null }
  })(),
  token: localStorage.getItem('ci_token') || null,
  loading: false,

  login: (user, token) => {
    localStorage.setItem('ci_token', token)
    localStorage.setItem('ci_user', JSON.stringify(user))
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('ci_token')
    localStorage.removeItem('ci_user')
    set({ user: null, token: null })
    window.location.href = '/login'
  },

  setUser: (user) => {
    localStorage.setItem('ci_user', JSON.stringify(user))
    set({ user })
  },

  setLoading: (loading) => set({ loading }),
}))

export default useAuthStore
