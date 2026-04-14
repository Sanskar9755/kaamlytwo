export interface User {
  id: number
  name: string
  email: string | null
  phone: string | null
  role: 'worker' | 'employer' | 'both'
  status: 'active' | 'inactive' | 'banned'
}

export interface AuthResponse {
  token: string
  user: User
}

export interface OtpPendingResponse {
  status: string
  phone: string
  dev_otp?: string
}

export interface MessageResponse {
  message: string
  dev_otp?: string
}

export interface MessageResponse {
  message: string
}
