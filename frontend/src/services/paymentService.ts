import apiClient from '../lib/axios'

export const unlockChat = async (workerId: number, paymentMethod: string): Promise<{ status: string; message: string }> => {
  const { data } = await apiClient.post('/payment/unlock', {
    worker_id: workerId,
    payment_method: paymentMethod,
    payment_ref: `${paymentMethod.toUpperCase()}_${Date.now()}`,
  })
  return data
}

export const checkUnlocked = async (workerId: number): Promise<{ unlocked: boolean; unlocked_at: string | null }> => {
  const { data } = await apiClient.get(`/payment/check/${workerId}`)
  return data
}
