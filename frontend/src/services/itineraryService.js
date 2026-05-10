import api from './api'

export const getAll = (params = {}) =>
  api.get('/itineraries/', { params }).then((r) => r.data)

export const getOne = (id) =>
  api.get(`/itineraries/${id}`).then((r) => r.data)

export const create = (data) =>
  api.post('/itineraries/', data).then((r) => r.data)

export const update = (id, data) =>
  api.put(`/itineraries/${id}`, data).then((r) => r.data)

export const remove = (id) =>
  api.delete(`/itineraries/${id}`)

export const generate = (data) =>
  api.post('/itineraries/generate', data).then((r) => r.data)

export const createActivity = (data) =>
  api.post('/activities/', data).then((r) => r.data)

export const updateActivity = (id, data) =>
  api.put(`/activities/${id}`, data).then((r) => r.data)

export const removeActivity = (id) =>
  api.delete(`/activities/${id}`)

export const reorderActivity = (id, orderIndex) =>
  api.patch(`/activities/${id}/reorder`, { order_index: orderIndex }).then((r) => r.data)
