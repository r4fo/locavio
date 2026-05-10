import { useState } from 'react'
import * as postService from '@/services/postService'

export function usePosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPosts = async (communityId) => {
    setLoading(true)
    setError(null)
    try {
      const data = await postService.getPosts(communityId)
      setPosts(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const addPost = async (communityId, data) => {
    const post = await postService.createPost(communityId, data)
    setPosts((prev) => [post, ...prev])
    return post
  }

  const addComment = async (communityId, postId, data) => {
    const comment = await postService.createComment(communityId, postId, data)
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
      )
    )
    return comment
  }

  return { posts, loading, error, fetchPosts, addPost, addComment }
}
