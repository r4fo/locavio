import api from './api'

/**
 * Admin API service — all these endpoints require admin authentication.
 */

export const getUsers = (search = '', skip = 0, limit = 50) =>
  api.get('/admin/users', { params: { search: search || undefined, skip, limit } }).then((r) => r.data)

export const updateUser = (userId, data) =>
  api.patch(`/admin/users/${userId}`, data).then((r) => r.data)

export const getStats = () =>
  api.get('/admin/stats').then((r) => r.data)

export const getItineraries = (skip = 0, limit = 50) =>
  api.get('/admin/itineraries', { params: { skip, limit } }).then((r) => r.data)

export const deleteItinerary = (itineraryId) =>
  api.delete(`/admin/itineraries/${itineraryId}`)
