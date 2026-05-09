import api from './api'

export const getAll = (params = {}) =>
  api.get('/communities', { params }).then((r) => r.data)

export const getOne = (id) =>
  api.get(`/communities/${id}`).then((r) => r.data)

export const create = (data) =>
  api.post('/communities', data).then((r) => r.data)

export const update = (id, data) =>
  api.put(`/communities/${id}`, data).then((r) => r.data)

export const join = (id) =>
  api.post(`/communities/${id}/join`).then((r) => r.data)

export const leave = (id) =>
  api.delete(`/communities/${id}/leave`)

export const remove = (id) =>
  api.delete(`/communities/${id}`)

export const getMembers = (id, params = {}) =>
  api.get(`/communities/${id}/members`, { params }).then((r) => r.data)
