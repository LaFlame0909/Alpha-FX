import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '')
  
  // Robustly find the API Key: Check API_KEY first, then VITE_API_KEY
  const apiKey = env.API_KEY || env.VITE_API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Stringify the API key so it's inserted as a string literal in the client code
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})