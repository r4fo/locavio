import api from './api'

export const getUsers = (searchOrParams = '', skip = 0, limit = 50) => {
  const params = typeof searchOrParams === 'object' && searchOrParams !== null
    ? searchOrParams
    : { search: searchOrParams, skip, limit }

  return api.get('/admin/users', {
    params: {
      search: params.search || undefined,
      role: params.role || undefined,
      skip: params.skip ?? 0,
      limit: params.limit ?? 50,
      page: params.page,
    },
  }).then((r) => r.data)
}

export const updateUser = (userId, data) =>
  api.patch(`/admin/users/${userId}`, data).then((r) => r.data)

export const updateUserRole = (userId, role) =>
  updateUser(userId, { role })

export const getStats = () =>
  api.get('/admin/stats').then((r) => r.data)

export const getItineraries = (skip = 0, limit = 50) =>
  api.get('/admin/itineraries', { params: { skip, limit } }).then((r) => r.data)

export const deleteItinerary = (itineraryId) =>
  api.delete(`/admin/itineraries/${itineraryId}`)

export const deleteUser = (userId) =>
  api.delete(`/admin/users/${userId}`)

const adminService = {
  getUsers,
  updateUser,
  updateUserRole,
  getStats,
  getItineraries,
  deleteItinerary,
  deleteUser,
}

export default adminService
