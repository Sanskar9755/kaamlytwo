import apiClient from '../lib/axios'
import type { ProfileResponse, UpdateProfilePayload, Skill } from '../types/profile'

export const getProfile = async (): Promise<ProfileResponse> => {
  const { data } = await apiClient.get<ProfileResponse>('/profile')
  return data
}

export const updateProfile = async (payload: UpdateProfilePayload): Promise<ProfileResponse> => {
  const { data } = await apiClient.put<ProfileResponse>('/profile', payload)
  return data
}

export const uploadPhoto = async (file: File): Promise<{ photo_url: string }> => {
  const formData = new FormData()
  formData.append('photo', file)
  const { data } = await apiClient.post<{ photo_url: string }>('/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export const getSkills = async (): Promise<Skill[]> => {
  const { data } = await apiClient.get<Skill[]>('/skills')
  return data
}
