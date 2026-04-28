export interface SubSkill {
  id: number
  name: string
}

export interface Skill {
  id: number
  category_id: number | null
  name: string
  icon: string
  rate_unit: string
  rate_unit_label: string
  sub_skills: SubSkill[]
}

export interface Category {
  id: number
  name: string
  icon: string
  sort_order: number
  skills: Skill[]
}

export interface SelectedSkill {
  skill_id: number
  skill_name: string
  rate: number | ''
  rate_type: string
  rate_unit: string
  rate_unit_label: string
  experience_level: 'beginner' | 'intermediate' | 'expert'
  sub_skill_ids: number[]
}

export interface ProfileSkill extends Skill {
  profile_skill_id: number
  rate: number
  rate_type: string
  experience_level: string
  category_name: string | null
  category_icon: string | null
  sub_skills: SubSkill[]
}

export interface Profile {
  id: number
  user_id: number
  name: string
  photo_url: string | null
  location: string | null
  is_complete: boolean
  skills: ProfileSkill[]
}

export interface ProfileResponse {
  profile: Profile | null
  is_complete: boolean
}

export interface UpdateProfilePayload {
  name: string
  location?: string
  skills: Array<{
    skill_id: number
    rate: number
    rate_type: string
    experience_level: string
    sub_skill_ids: number[]
  }>
}
