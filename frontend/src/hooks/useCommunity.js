import { useState } from 'react'
import * as communityService from '@/services/communityService'

export function useCommunity() {
  const [communities, setCommunities] = useState([])
  const [community, setCommunity] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAll = async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const data = await communityService.getAll(params)
      setCommunities(data)
      return data
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load communities')
    } finally {
      setLoading(false)
    }
  }

  const fetchOne = async (id) => {
    setLoading(true)
    setError(null)
    try {
      const data = await communityService.getOne(id)
      setCommunity(data)
      return data
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load community')
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async (id, params = {}) => {
    try {
      const data = await communityService.getMembers(id, params)
      setMembers(data)
      return data
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load members')
    }
  }

  const join = async (id) => {
    try {
      await communityService.join(id)
      await fetchOne(id)
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to join community'
      setError(message)
      throw err
    }
  }

  const leave = async (id) => {
    try {
      await communityService.leave(id)
      await fetchOne(id)
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to leave community'
      setError(message)
      throw err
    }
  }

  const createCommunity = async (data) => {
    setLoading(true)
    setError(null)
    try {
      const result = await communityService.create(data)
      setCommunity(result)
      return result
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to create community'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteCommunity = async (id) => {
    try {
      await communityService.remove(id)
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to delete community'
      setError(message)
      throw err
    }
  }

  return {
    communities,
    community,
    members,
    loading,
    error,
    fetchAll,
    fetchOne,
    fetchMembers,
    join,
    leave,
    createCommunity,
    deleteCommunity,
  }
}
