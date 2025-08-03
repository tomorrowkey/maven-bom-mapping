import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Get git commit hash
const getGitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch (error) {
    return 'unknown'
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: 'src',
  build: {
    outDir: '../docs',
    emptyOutDir: false
  },
  base: './',
  define: {
    __GIT_HASH__: JSON.stringify(getGitHash())
  }
})