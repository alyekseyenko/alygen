import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import Router from './Router.jsx'
import './index.css'

// Criar o cliente com configurações de resiliência Sénior
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de cache "fresca"
      cacheTime: 1000 * 60 * 30, // 30 minutos de persistência
      refetchOnWindowFocus: false, // Não irritar o utilizador com refetch ao trocar de aba
      retry: 1, // Apenas um retry para não sobrecarregar falhas de rede reais
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster position="top-right" richColors theme="dark" />
    </QueryClientProvider>
  </React.StrictMode>,
)
