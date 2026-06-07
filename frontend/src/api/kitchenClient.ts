import axios from 'axios'

const KITCHEN_TOKEN_KEY = 'kitchen_auth_token'

const kitchenClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

kitchenClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(KITCHEN_TOKEN_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

kitchenClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/kitchen/auth/login')) {
      localStorage.removeItem(KITCHEN_TOKEN_KEY)
    }
    return Promise.reject(error)
  },
)

export { KITCHEN_TOKEN_KEY }
export default kitchenClient
