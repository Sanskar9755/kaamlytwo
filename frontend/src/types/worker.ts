export interface WorkerSkill {
  id: number
  name: string
  icon: string
  rate: number
  rate_unit_label: string
}

export interface WorkerResult {
  id: number
  user_id: number
  name: string
  photo_url: string | null
  location: string | null
  skills: WorkerSkill[]
  avg_rating: number
  review_count: number
}

export interface WorkersSearchResponse {
  workers: WorkerResult[]
  total: number
  filters: { skill: string | null; location: string | null }
}
