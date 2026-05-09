import { useState, useCallback } from 'react'
import adminService from '@/services/adminService'

export function useAdmin() {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchUsers = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminService.getUsers(params)
      setUsers(data)
      return data
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminService.getStats()
      setStats(data)
      return data
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch stats')
    } finally {
      setLoading(false)
    }
  }, [])

  const changeRole = useCallback(async (userId, role) => {
    // Optimistic update
    setUsers((prev) => {
      if (Array.isArray(prev)) {
        return prev.map((u) => (u.id === userId ? { ...u, role } : u))
      }
      if (prev?.users) {
        return { ...prev, users: prev.users.map((u) => (u.id === userId ? { ...u, role } : u)) }
      }
      return prev
    })

    try {
      await adminService.updateUserRole(userId, role)
    } catch (err) {
      // Revert optimistic update on failure
      setError(err.response?.data?.detail || 'Failed to update role')
      fetchUsers()
      throw err
    }
  }, [fetchUsers])

  const removeUser = useCallback(async (userId) => {
    try {
      await adminService.deleteUser(userId)
      setUsers((prev) => {
        if (Array.isArray(prev)) return prev.filter((u) => u.id !== userId)
        if (prev?.users) return { ...prev, users: prev.users.filter((u) => u.id !== userId), total: prev.total - 1 }
        return prev
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user')
      throw err
    }
  }, [])

  return { users, stats, loading, error, fetchUsers, fetchStats, changeRole, removeUser }
}