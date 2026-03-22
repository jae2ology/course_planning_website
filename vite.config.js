import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills} from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(),
      nodePolyfills({
      globals: {
          Buffer: true, // can also be 'build', 'dev', or true
          global: true,
          process: true,
      },
          protocolImports: true,
      }),
  ],
})
