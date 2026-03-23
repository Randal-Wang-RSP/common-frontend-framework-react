import axios from "axios"

export const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
})

apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)
