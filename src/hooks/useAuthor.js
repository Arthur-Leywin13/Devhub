import { useEffect, useState } from 'react'
import { getUserCached } from '../api/usersCache'

export function useAuthor(authorId) {
  const [author, setAuthor] = useState(null)

  useEffect(() => {
    let cancelled = false
    getUserCached(authorId).then((u) => {
      if (!cancelled) setAuthor(u)
    })
    return () => {
      cancelled = true
    }
  }, [authorId])

  return author
}
