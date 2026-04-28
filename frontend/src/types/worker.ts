export interface WorkerSubSkill {
  id: number
  name: string
}

export interface WorkerSkill {
  id: number
  name: string
  icon: string
  rate: number
  rate_type: string
  rate_unit_label: string
  experience_level: string
  category_name: string | null
  sub_skills: WorkerSubSkill[]
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
  filters: { skill: string | null; category: string | null; location: string | null }
}
