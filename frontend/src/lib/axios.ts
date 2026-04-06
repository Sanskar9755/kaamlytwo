import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://kaamlytwo.onrender.com/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('kaamlytwo_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kaamlytwo_token')
      localStorage.removeItem('kaamlytwo_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
