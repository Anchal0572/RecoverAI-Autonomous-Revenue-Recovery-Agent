import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'

const DEFAULT_DEMO_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhOWJkZjIyOGM5NTliYWEyZjViOGYxNiIsImVtYWlsIjoiYWRtaW5AY29tcGFueS5jb20iLCJyb2xlIjoiQWRtaW4iLCJtZXJjaGFudElkIjoiNmE5YmRmMjI4Yzk1OWJhYTJmNWI4ZjEyIiwiaWF0IjoxNzg4NjAwMDk4LCJleHAiOjE3ODg2ODY0OTh9.sPj1y29Wv5m-BNNtRdjSQ7U8oZALKehb0jHbOc8b2PQ';
if (!localStorage.getItem('token')) {
  localStorage.setItem('token', DEFAULT_DEMO_TOKEN);
}

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
