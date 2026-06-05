import axios from 'axios'

const WAITER_TOKEN_KEY = 'waiter_auth_token'

const waiterClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

waiterClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(WAITER_TOKEN_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

waiterClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/waiter/auth/login')) {
      localStorage.removeItem(WAITER_TOKEN_KEY)
    }
    return Promise.reject(error)
  },
)

export { WAITER_TOKEN_KEY }
export default waiterClient
