import apiClient from '../lib/axios'
import type { WorkersSearchResponse } from '../types/worker'

export const searchWorkers = async (params: {
  skill?: string
  category?: string
  location?: string
  sort?: string
}): Promise<WorkersSearchResponse> => {
  const { data } = await apiClient.get<WorkersSearchResponse>('/workers', { params })
  return data
}
