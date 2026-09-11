import axios from 'axios'

// Define apenas o host (sem /api) para poder reutilizar em links
export const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_HOST}/api`,
  timeout: 180000, // 180 second default timeout for deep audits/crawls
  headers: {
    'Content-Type': 'application/json',
  },
})

// Fast endpoint instance (10s timeout for lightweight telemetry, status, health checks)
export const apiQuick = axios.create({
  baseURL: `${API_HOST}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Heavy operations instance (180s for deep Puppeteer crawls and multi-agent pipelines)
export const apiHeavy = api

export const fetchSystemHealth = async () => {
  const { data } = await api.get('/health/full')
  return data
}

export const runSimulation = async (flow) => {
  const { data } = await api.get(`/system/audit/simulate/${flow}`)
  return data
}

export const runSeniorAudit = async (category) => {
  const { data } = await api.get(`/system/audit/senior/${category}`)
  return data
}

export const runUltimateAudit = async (category) => {
  const { data } = await api.get(`/system/audit/ultimate/${category}`)
  return data
}

export const runLifecycleSimulation = async (step) => {
  const { data } = await api.get(`/system/audit/lifecycle/${step}`)
  return data
}
