import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePosts } from '@/hooks/usePosts'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

function PostCard({ post, communityId, user, onAddComment }) {
  const { t } = useTranslation()
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentError, setCommentError] = useState(null)

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    setCommentError(null)
    try {
      await onAddComment(communityId, post.id, { content: comment.trim() })
      setComment('')
    } catch (err) {
      setCommentError(err.response?.data?.detail || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold shrink-0">
          {post.author?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-sm font-medium text-espresso">{post.author?.name || 'User'}</p>
          <p className="text-xs text-muted">{new Date(post.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <p className="text-sm text-espresso leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {post.image_url && (
        <img
          src={post.image_url}
          alt=""
          className="rounded-lg max-h-72 w-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      )}

      <div className="border-t border-accent/20 pt-2 flex flex-col gap-2">
        {post.comments.length === 0 && (
          <p className="text-xs text-muted">{t('community.no_comments')}</p>
        )}
        {post.comments.map((c) => (
          <div key={c.id} className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-accent/50 text-espresso flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
              {c.author?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 bg-surface rounded-lg px-2.5 py-1.5">
              <p className="text-xs font-medium text-espresso">{c.author?.name || 'User'}</p>
              <p className="text-xs text-muted leading-relaxed">{c.content}</p>
            </div>
          </div>
        ))}

        {user ? (
          <form onSubmit={handleSubmitComment} className="flex gap-2 mt-1">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('community.comment_placeholder')}
              className="flex-1 rounded-lg border border-accent/40 bg-surface px-2.5 py-1.5 text-xs text-espresso placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={!comment.trim()}
            >
              {t('community.comment_btn')}
            </Button>
          </form>
        ) : null}
        {commentError && <p className="text-xs text-danger">{commentError}</p>}
      </div>
    </div>
  )
}

function PostsTab({ communityId, user }) {
  const { t } = useTranslation()
  const { posts, loading, error, fetchPosts, addPost, addComment } = usePosts()
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [postError, setPostError] = useState(null)

  useEffect(() => {
    fetchPosts(communityId)
  }, [communityId])

  const handleSubmitPost = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    setPostError(null)
    try {
      await addPost(communityId, {
        content: content.trim(),
        image_url: imageUrl.trim() || null,
      })
      setContent('')
      setImageUrl('')
    } catch (err) {
      setPostError(err.response?.data?.detail || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {user ? (
        <form onSubmit={handleSubmitPost} className="card flex flex-col gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('community.post_placeholder')}
            rows={3}
            className="w-full resize-none rounded-lg border border-accent/40 bg-surface p-3 text-sm text-espresso placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder={t('community.image_url_placeholder')}
            type="url"
            className="rounded-lg border border-accent/40 bg-surface px-3 py-2 text-sm text-espresso placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {postError && <p className="text-xs text-danger">{postError}</p>}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={!content.trim()}
            >
              {t('community.post_btn')}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted text-center py-4">{t('community.login_to_post')}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size="md" />
        </div>
      ) : error ? (
        <p className="text-sm text-danger text-center">{error}</p>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm text-muted">{t('community.no_posts')}</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            communityId={communityId}
            user={user}
            onAddComment={addComment}
          />
        ))
      )}
    </div>
  )
}

export default PostsTab
