import apiClient from '../lib/axios'

export interface Review {
  id: number
  worker_user_id: number
  reviewer_user_id: number
  rating: number
  comment: string | null
  created_at: string
}

export interface ReviewStats {
  avg_rating: number
  review_count: number
}

export const createReview = async (
  workerUserId: number,
  rating: number,
  comment: string
): Promise<{ review: Review }> => {
  const { data } = await apiClient.post<{ review: Review }>('/reviews', {
    worker_user_id: workerUserId,
    rating,
    comment: comment || undefined,
  })
  return data
}

export const getWorkerReviews = async (
  workerUserId: number
): Promise<{ reviews: Review[]; stats: ReviewStats }> => {
  const { data } = await apiClient.get<{ reviews: Review[]; stats: ReviewStats }>(
    `/reviews/${workerUserId}`
  )
  return data
}
