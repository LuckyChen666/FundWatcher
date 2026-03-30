import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const githubPagesBase = repoName ? `/${repoName}/` : '/'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? githubPagesBase : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api/fund': {
        target: 'https://fundgz.1234567.com.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fund/, ''),
      },
      '/api/eastmoney': {
        target: 'https://fundf10.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/eastmoney/, ''),
      },
      '/api/qtimg': {
        target: 'https://qt.gtimg.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/qtimg/, ''),
      },
    },
  },
})
