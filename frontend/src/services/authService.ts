import apiClient from '../lib/axios'
import type { AuthResponse, MessageResponse, OtpPendingResponse } from '../types/auth'

export const login = async (identifier: string, password: string): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { identifier, password })
  return data
}

export const register = async (payload: { name: string; email?: string; phone?: string; password: string }): Promise<AuthResponse | OtpPendingResponse> => {
  const { data } = await apiClient.post<AuthResponse | OtpPendingResponse>('/auth/register', payload)
  return data
}

export const verifyOtp = async (phone: string, otp: string, purpose: string, name?: string, password?: string): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/verify-otp', { phone, otp, purpose, name, password })
  return data
}

export const forgotPassword = async (identifier: string): Promise<MessageResponse> => {
  const { data } = await apiClient.post<MessageResponse>('/auth/forgot-password', { identifier })
  return data
}

export const resetPassword = async (token: string, password: string): Promise<MessageResponse> => {
  const { data } = await apiClient.post<MessageResponse>('/auth/reset-password', { token, password })
  return data
}

export const resendOtp = async (phone: string, purpose: string): Promise<MessageResponse> => {
  const { data } = await apiClient.post<MessageResponse>('/auth/resend-otp', { phone, purpose })
  return data
}

export const logout = async (): Promise<MessageResponse> => {
  const { data } = await apiClient.post<MessageResponse>('/auth/logout')
  return data
}
