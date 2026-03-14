import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // loadEnv so VITE_SCRIPT_URL is available in the config (for proxy)
  const env = loadEnv(mode, process.cwd(), '')
  const scriptUrl = env.VITE_SCRIPT_URL || ''
  const scriptMatch = scriptUrl.match(/^(https:\/\/script\.google\.com)(\/macros\/s\/[^/]+\/exec)$/)

  return {
    plugins: [react()],
    server: {
      proxy: scriptMatch
        ? {
            '/api': {
              target: scriptMatch[1],
              changeOrigin: true,
              rewrite: () => scriptMatch[2],
              secure: true,
            },
          }
        : {},
    },
  }
})
