import axios from "axios"

export const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor — add auth token injection here (e.g., in features/auth)
apiInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)
