import apiClient from '../lib/axios'
import type { WorkersSearchResponse } from '../types/worker'

export const searchWorkers = async (skill: string, location: string): Promise<WorkersSearchResponse> => {
  const { data } = await apiClient.get<WorkersSearchResponse>('/workers', { params: { skill, location } })
  return data
}
