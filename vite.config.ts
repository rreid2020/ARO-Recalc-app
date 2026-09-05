/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
  test: {
    // Every suite is pure — the engine, the register, the sheet model and the
    // xlsx reader and writer. None of them touches a DOM, and `build()` returns
    // a real `Blob`, whose `arrayBuffer()` jsdom does not implement. So: node.
    environment: 'node',
    globals: true,
  },
});
