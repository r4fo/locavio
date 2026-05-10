import api from './api'

export const getPosts = (communityId, params = {}) =>
  api.get(`/communities/${communityId}/posts`, { params }).then((r) => r.data)

export const createPost = (communityId, data) =>
  api.post(`/communities/${communityId}/posts`, data).then((r) => r.data)

export const createComment = (communityId, postId, data) =>
  api.post(`/communities/${communityId}/posts/${postId}/comments`, data).then((r) => r.data)
