import axios from 'axios'

const TOKEN_KEY = 'auth_token'
const AUTH_ROLE_KEY = 'auth_role'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(AUTH_ROLE_KEY)
    }
    return Promise.reject(error)
  },
)

export { TOKEN_KEY, AUTH_ROLE_KEY }
export default apiClient
