export interface Skill {
  id: number
  name: string
  icon: string
  rate_unit: string
  rate_unit_label: string
}

export interface SelectedSkill {
  skill_id: number
  skill_name: string
  rate: number | ''
  rate_unit: string
  rate_unit_label: string
}

export interface ProfileSkill extends Skill {
  rate: number
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
  skills: Array<{ skill_id: number; rate: number }>
}
