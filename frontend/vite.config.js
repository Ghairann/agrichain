import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    fs: { allow: ['..'] },
    // Watch artifact JSON so HMR picks up ABI changes after `npx hardhat compile`
    watch: {
      ignored: ['!**/artifacts/**'],
    },
  },
})
