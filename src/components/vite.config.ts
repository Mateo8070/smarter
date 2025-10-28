
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'; // Import path module
// FIX: Import `fileURLToPath` to correctly resolve `__dirname` in an ES module context.
import { fileURLToPath } from 'url';

// FIX: Define `__dirname` for ES module scope.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // FIX: Correct the path for '@' to point to the 'src' directory.
      '@': path.resolve(__dirname, '..'),
    },
  },
})
