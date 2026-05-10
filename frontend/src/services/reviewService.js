import api from './api'

export const getForActivity = (activityId, params = {}) =>
  api.get(`/reviews/activity/${activityId}`, { params }).then((r) => r.data)

export const create = (data) =>
  api.post('/reviews/', data).then((r) => r.data)

export const update = (id, data) =>
  api.put(`/reviews/${id}`, data).then((r) => r.data)

export const remove = (id) =>
  api.delete(`/reviews/${id}`)
